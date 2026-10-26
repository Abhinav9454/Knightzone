package com.collegecontest.livechat.service;

import com.collegecontest.livechat.dto.*;
import com.collegecontest.livechat.model.*;
import com.collegecontest.livechat.repository.LiveChatConversationRepository;
import com.collegecontest.livechat.repository.LiveChatFeedbackRepository;
import com.collegecontest.livechat.repository.LiveChatMessageRepository;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
@Transactional
public class LiveChatService {

    private final LiveChatConversationRepository conversationRepository;
    private final LiveChatMessageRepository messageRepository;
    private final LiveChatFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public LiveChatConversationDTO createConversation(CreateLiveChatConversationRequest request, String email) {
        User requester = getCurrentUser(email);

        LiveChatConversation conversation = new LiveChatConversation();
        conversation.setRequester(requester);
        conversation.setStatus(LiveChatConversationStatus.WAITING);
        conversation.setPriority(normalizePriority(request.priority()));
        conversation.setCategory(normalizeNullable(request.category(), 64));
        conversation.setSummary(normalizeNullable(request.summary(), 1200));
        conversation.setSourcePage(normalizeNullable(request.sourcePage(), 255));
        LiveChatConversation saved = conversationRepository.save(conversation);

        if (saved.getSummary() != null && !saved.getSummary().isBlank()) {
            saveMessage(saved, requester, LiveChatSenderType.USER, saved.getSummary(), "SUMMARY");
        }

        emitQueueUpdate("CONVERSATION_CREATED");
        return toConversationDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<LiveChatConversationDTO> getMyConversations(String email) {
        User current = getCurrentUser(email);
        return conversationRepository.findByRequesterIdOrderByCreatedAtDesc(current.getId()).stream()
                .map(this::toConversationDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public LiveChatConversationDTO getConversation(Long conversationId, String email) {
        User current = getCurrentUser(email);
        LiveChatConversation conversation = getConversationOrThrow(conversationId);
        ensureReadable(conversation, current);
        return toConversationDTO(conversation);
    }

    @Transactional(readOnly = true)
    public List<LiveChatMessageDTO> getConversationMessages(Long conversationId, String email) {
        User current = getCurrentUser(email);
        LiveChatConversation conversation = getConversationOrThrow(conversationId);
        ensureReadable(conversation, current);

        List<LiveChatMessage> latest = messageRepository.findTop200ByConversationIdOrderByCreatedAtDesc(conversationId);
        List<LiveChatMessage> ordered = new ArrayList<>(latest);
        ordered.sort(Comparator.comparing(LiveChatMessage::getCreatedAt));
        return ordered.stream().map(this::toMessageDTO).toList();
    }

    public LiveChatMessageDTO sendMessage(Long conversationId, SendLiveChatMessageRequest request, String email) {
        User current = getCurrentUser(email);
        LiveChatConversation conversation = getConversationOrThrow(conversationId);
        ensureWritable(conversation, current);

        if (conversation.getStatus() == LiveChatConversationStatus.CLOSED) {
            throw new ResponseStatusException(BAD_REQUEST, "Conversation is already closed");
        }

        LiveChatSenderType senderType;
        if (conversation.getRequester().getId().equals(current.getId())) {
            senderType = LiveChatSenderType.USER;
        } else if (isAdmin(current)) {
            senderType = LiveChatSenderType.AGENT;
            if (conversation.getAssignedAgent() == null || !conversation.getAssignedAgent().getId().equals(current.getId())) {
                conversation.setAssignedAgent(current);
            }
            if (conversation.getStatus() == LiveChatConversationStatus.WAITING) {
                conversation.setStatus(LiveChatConversationStatus.ACTIVE);
                conversation.setJoinedAt(LocalDateTime.now());
            }
        } else {
            throw new ResponseStatusException(FORBIDDEN, "You cannot post message in this conversation");
        }

        LiveChatMessage saved = saveMessage(
                conversation,
                current,
                senderType,
                request.message(),
                normalizeMessageType(request.messageType()));

        LiveChatMessageDTO dto = toMessageDTO(saved);
        messagingTemplate.convertAndSend("/topic/live-chat/" + conversationId, dto);
        emitQueueUpdate("MESSAGE_SENT");
        return dto;
    }

    public LiveChatConversationDTO assignConversation(Long conversationId, String email) {
        User current = getCurrentUser(email);
        ensureAdmin(current);

        LiveChatConversation conversation = getConversationOrThrow(conversationId);
        if (conversation.getStatus() == LiveChatConversationStatus.CLOSED) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot assign a closed conversation");
        }

        conversation.setAssignedAgent(current);
        if (conversation.getStatus() == LiveChatConversationStatus.WAITING) {
            conversation.setStatus(LiveChatConversationStatus.ACTIVE);
            conversation.setJoinedAt(LocalDateTime.now());
        }

        LiveChatConversation saved = conversationRepository.save(conversation);
        saveSystemMessage(saved, current.getName() + " joined as support agent");
        emitQueueUpdate("CONVERSATION_ASSIGNED");
        return toConversationDTO(saved);
    }

    public LiveChatConversationDTO closeConversation(Long conversationId, String email) {
        User current = getCurrentUser(email);
        LiveChatConversation conversation = getConversationOrThrow(conversationId);
        ensureCloseAllowed(conversation, current);

        if (conversation.getStatus() != LiveChatConversationStatus.CLOSED) {
            conversation.setStatus(LiveChatConversationStatus.CLOSED);
            conversation.setClosedAt(LocalDateTime.now());
            conversationRepository.save(conversation);
            saveSystemMessage(conversation, "Conversation closed by " + current.getName());
            emitQueueUpdate("CONVERSATION_CLOSED");
        }

        return toConversationDTO(conversation);
    }

    public void submitFeedback(Long conversationId, LiveChatFeedbackRequest request, String email) {
        User current = getCurrentUser(email);
        LiveChatConversation conversation = getConversationOrThrow(conversationId);

        if (!conversation.getRequester().getId().equals(current.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Only the requester can submit feedback");
        }
        if (conversation.getStatus() != LiveChatConversationStatus.CLOSED) {
            throw new ResponseStatusException(BAD_REQUEST, "Close the conversation before submitting feedback");
        }

        LiveChatFeedback feedback = feedbackRepository
                .findByConversationIdAndSubmittedById(conversationId, current.getId())
                .orElseGet(LiveChatFeedback::new);

        feedback.setConversation(conversation);
        feedback.setSubmittedBy(current);
        feedback.setRating(request.rating());
        feedback.setComment(normalizeNullable(request.comment(), 1000));
        feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<LiveChatConversationDTO> getQueue(String email) {
        User current = getCurrentUser(email);
        ensureAdmin(current);

        List<LiveChatConversationStatus> statuses = List.of(
                LiveChatConversationStatus.WAITING,
                LiveChatConversationStatus.ACTIVE
        );

        return conversationRepository.findByStatusInOrderByCreatedAtAsc(statuses).stream()
                .map(this::toConversationDTO)
                .toList();
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    private LiveChatConversation getConversationOrThrow(Long conversationId) {
        return conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Conversation not found"));
    }

    private void ensureAdmin(User user) {
        if (!isAdmin(user)) {
            throw new ResponseStatusException(FORBIDDEN, "Admin access required");
        }
    }

    private boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    private void ensureReadable(LiveChatConversation conversation, User current) {
        if (conversation.getRequester().getId().equals(current.getId()) || isAdmin(current)) {
            return;
        }
        throw new ResponseStatusException(FORBIDDEN, "Conversation access denied");
    }

    private void ensureWritable(LiveChatConversation conversation, User current) {
        if (conversation.getRequester().getId().equals(current.getId())) {
            return;
        }
        if (isAdmin(current)) {
            return;
        }
        throw new ResponseStatusException(FORBIDDEN, "Conversation write access denied");
    }

    private void ensureCloseAllowed(LiveChatConversation conversation, User current) {
        if (conversation.getRequester().getId().equals(current.getId()) || isAdmin(current)) {
            return;
        }
        throw new ResponseStatusException(FORBIDDEN, "Conversation close access denied");
    }

    private LiveChatMessage saveMessage(
            LiveChatConversation conversation,
            User sender,
            LiveChatSenderType senderType,
            String rawMessage,
            String messageType
    ) {
        String messageText = rawMessage == null ? "" : rawMessage.trim();
        if (messageText.isBlank()) {
            throw new ResponseStatusException(BAD_REQUEST, "Message is required");
        }

        LiveChatMessage message = new LiveChatMessage();
        message.setConversation(conversation);
        message.setSenderType(senderType);
        message.setSenderUser(sender);
        message.setMessageText(messageText);
        message.setMessageType(normalizeMessageType(messageType));
        LiveChatMessage saved = messageRepository.save(message);

        conversation.setLastMessageAt(saved.getCreatedAt());
        conversationRepository.save(conversation);
        return saved;
    }

    private void saveSystemMessage(LiveChatConversation conversation, String text) {
        LiveChatMessage systemMessage = new LiveChatMessage();
        systemMessage.setConversation(conversation);
        systemMessage.setSenderType(LiveChatSenderType.SYSTEM);
        systemMessage.setSenderUser(null);
        systemMessage.setMessageText(text);
        systemMessage.setMessageType("SYSTEM");
        LiveChatMessage saved = messageRepository.save(systemMessage);

        conversation.setLastMessageAt(saved.getCreatedAt());
        conversationRepository.save(conversation);

        messagingTemplate.convertAndSend("/topic/live-chat/" + conversation.getId(), toMessageDTO(saved));
    }

    private void emitQueueUpdate(String type) {
        List<LiveChatConversationDTO> queue = conversationRepository
                .findByStatusInOrderByCreatedAtAsc(List.of(
                        LiveChatConversationStatus.WAITING,
                        LiveChatConversationStatus.ACTIVE))
                .stream()
                .map(this::toConversationDTO)
                .toList();

        messagingTemplate.convertAndSend(
                "/topic/live-chat/queue",
                new LiveChatQueueEventDTO(type, LocalDateTime.now(), queue));
    }

    private LiveChatConversationDTO toConversationDTO(LiveChatConversation conversation) {
        Long messageCount = messageRepository.countByConversationId(conversation.getId());
        User assignedAgent = conversation.getAssignedAgent();
        return new LiveChatConversationDTO(
                conversation.getId(),
                conversation.getStatus(),
                conversation.getPriority(),
                conversation.getCategory(),
                conversation.getSummary(),
                conversation.getSourcePage(),
                conversation.getRequester().getId(),
                conversation.getRequester().getName(),
                assignedAgent != null ? assignedAgent.getId() : null,
                assignedAgent != null ? assignedAgent.getName() : null,
                messageCount,
                conversation.getCreatedAt(),
                conversation.getJoinedAt(),
                conversation.getClosedAt(),
                conversation.getLastMessageAt()
        );
    }

    private LiveChatMessageDTO toMessageDTO(LiveChatMessage message) {
        User sender = message.getSenderUser();
        return new LiveChatMessageDTO(
                message.getId(),
                message.getConversation().getId(),
                message.getSenderType(),
                sender != null ? sender.getId() : null,
                sender != null ? sender.getName() : null,
                message.getMessageText(),
                message.getMessageType(),
                message.getCreatedAt(),
                message.getReadAt()
        );
    }

    private String normalizePriority(String value) {
        String normalized = normalizeNullable(value, 16);
        if (normalized == null) {
            return "NORMAL";
        }

        String upper = normalized.toUpperCase(Locale.ROOT);
        return switch (upper) {
            case "LOW", "NORMAL", "HIGH", "URGENT" -> upper;
            default -> "NORMAL";
        };
    }

    private String normalizeMessageType(String value) {
        String normalized = normalizeNullable(value, 32);
        if (normalized == null) {
            return "TEXT";
        }
        return normalized.toUpperCase(Locale.ROOT);
    }

    private String normalizeNullable(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return null;
        }
        if (trimmed.length() > maxLength) {
            return trimmed.substring(0, maxLength);
        }
        return trimmed;
    }
}
