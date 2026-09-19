package com.collegecontest.chat;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private static final int MAX_HISTORY_SIZE = 100;

    private final Map<String, List<ChatMessageDTO>> historyBySession = new ConcurrentHashMap<>();
    private final Map<String, List<Integer>> ratingsBySession = new ConcurrentHashMap<>();

    public ChatResponseDTO reply(ChatRequestDTO request) {
        String sessionId = normalizeSessionId(request.getSessionId());
        String userMessage = request.getMessage() == null ? "" : request.getMessage().trim();

        if (userMessage.isBlank()) {
            return new ChatResponseDTO(sessionId, "Please type a message so I can help you.", Instant.now());
        }

        addMessage(sessionId, new ChatMessageDTO("user", userMessage, Instant.now()));

        String botReply = generateReply(userMessage);
        Instant repliedAt = Instant.now();
        addMessage(sessionId, new ChatMessageDTO("bot", botReply, repliedAt));

        return new ChatResponseDTO(sessionId, botReply, repliedAt);
    }

    public List<ChatMessageDTO> getHistory(String sessionId) {
        String safeSessionId = normalizeSessionId(sessionId);
        List<ChatMessageDTO> history = historyBySession.get(safeSessionId);
        if (history == null) {
            return List.of();
        }
        synchronized (history) {
            return new ArrayList<>(history);
        }
    }

    public void saveFeedback(ChatFeedbackDTO feedbackDTO) {
        if (feedbackDTO == null || feedbackDTO.getSessionId() == null || feedbackDTO.getRating() == null) {
            return;
        }
        int rating = feedbackDTO.getRating();
        if (rating < -1 || rating > 1) {
            return;
        }
        String sessionId = normalizeSessionId(feedbackDTO.getSessionId());
        List<Integer> ratings = ratingsBySession.computeIfAbsent(
                sessionId, ignored -> Collections.synchronizedList(new ArrayList<>()));
        ratings.add(rating);
    }

    private void addMessage(String sessionId, ChatMessageDTO message) {
        List<ChatMessageDTO> history = historyBySession.computeIfAbsent(
                sessionId, ignored -> Collections.synchronizedList(new ArrayList<>()));
        synchronized (history) {
            history.add(message);
            if (history.size() > MAX_HISTORY_SIZE) {
                history.subList(0, history.size() - MAX_HISTORY_SIZE).clear();
            }
        }
    }

    private String normalizeSessionId(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return "session_" + UUID.randomUUID();
        }
        return sessionId.trim();
    }

    private String generateReply(String message) {
        String text = message.toLowerCase();

        if (containsAny(text, "hello", "hi", "hey", "namaste")) {
            return "Hello! Welcome. How can I help you today?";
        }
        if (containsAny(text, "register", "sign up", "signup", "create account")) {
            return "To create an account, open Register page, fill your details, and verify email if asked.";
        }
        if (containsAny(text, "login", "sign in")) {
            return "Use your registered email and password on Login page. If login fails, try resetting password.";
        }
        if (containsAny(text, "contest", "coding")) {
            return "Open Contests from the menu, pick an upcoming/ongoing event, then register and solve problems.";
        }
        if (containsAny(text, "quiz", "mcq")) {
            return "Open Quizzes, start an active quiz, submit answers before timer ends, and check results in history.";
        }
        if (containsAny(text, "duel", "1v1")) {
            return "Go to Duels to challenge users or join matchmaking. You can track live status and rating updates there.";
        }
        if (containsAny(text, "resume", "cv")) {
            return "Use Resume Builder for template editing and Resume Strength for score insights with actionable suggestions.";
        }
        if (containsAny(text, "mock interview", "interview")) {
            return "Mock Interviews are available from the top menu. You can create AI sessions and track interview analytics.";
        }
        if (containsAny(text, "learning", "path", "learning roots")) {
            return "Learning is open to every tech enthusiast. Use Typing Speed, Placement Readiness, and Mock Interviews.";
        }
        if (containsAny(text, "profile", "account", "avatar")) {
            return "You can manage profile details, avatar, and privacy settings from My Profile.";
        }
        if (containsAny(text, "placement", "job", "career")) {
            return "Placement Readiness shows topic mastery and company fit. Improve weak areas and keep solving regularly.";
        }
        if (containsAny(text, "team", "invite", "member")) {
            return "Open Teams to create a team, invite members by user id, and track team-based participation.";
        }
        if (containsAny(text, "help", "support", "issue", "bug")) {
            return "Please share the exact page and error text/screenshot, and I will guide you step by step.";
        }
        if (containsAny(text, "thanks", "thank you")) {
            return "You're welcome. If you need anything else, just ask.";
        }

        return "I can help with contests, quizzes, profile, resume, teams, placement, and mock interviews. Tell me your exact issue.";
    }

    private boolean containsAny(String message, String... tokens) {
        for (String token : tokens) {
            if (message.contains(token)) {
                return true;
            }
        }
        return false;
    }
}
