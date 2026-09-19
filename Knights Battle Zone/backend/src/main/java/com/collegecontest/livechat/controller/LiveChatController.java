package com.collegecontest.livechat.controller;

import com.collegecontest.livechat.dto.*;
import com.collegecontest.livechat.service.LiveChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/live-chat")
@RequiredArgsConstructor
public class LiveChatController {

    private final LiveChatService liveChatService;

    @PostMapping("/conversations")
    public ResponseEntity<LiveChatConversationDTO> createConversation(
            @Valid @RequestBody CreateLiveChatConversationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(liveChatService.createConversation(request, currentEmail()));
    }

    @GetMapping("/conversations/my")
    public ResponseEntity<List<LiveChatConversationDTO>> getMyConversations() {
        return ResponseEntity.ok(liveChatService.getMyConversations(currentEmail()));
    }

    @GetMapping("/conversations/queue")
    public ResponseEntity<List<LiveChatConversationDTO>> getQueue() {
        return ResponseEntity.ok(liveChatService.getQueue(currentEmail()));
    }

    @GetMapping("/conversations/{conversationId}")
    public ResponseEntity<LiveChatConversationDTO> getConversation(@PathVariable Long conversationId) {
        return ResponseEntity.ok(liveChatService.getConversation(conversationId, currentEmail()));
    }

    @PostMapping("/conversations/{conversationId}/assign")
    public ResponseEntity<LiveChatConversationDTO> assignConversation(@PathVariable Long conversationId) {
        return ResponseEntity.ok(liveChatService.assignConversation(conversationId, currentEmail()));
    }

    @PostMapping("/conversations/{conversationId}/close")
    public ResponseEntity<LiveChatConversationDTO> closeConversation(@PathVariable Long conversationId) {
        return ResponseEntity.ok(liveChatService.closeConversation(conversationId, currentEmail()));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<List<LiveChatMessageDTO>> getMessages(@PathVariable Long conversationId) {
        return ResponseEntity.ok(liveChatService.getConversationMessages(conversationId, currentEmail()));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<LiveChatMessageDTO> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody SendLiveChatMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(liveChatService.sendMessage(conversationId, request, currentEmail()));
    }

    @PostMapping("/conversations/{conversationId}/feedback")
    public ResponseEntity<Map<String, String>> submitFeedback(
            @PathVariable Long conversationId,
            @Valid @RequestBody LiveChatFeedbackRequest request
    ) {
        liveChatService.submitFeedback(conversationId, request, currentEmail());
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "";
        }
        return auth.getName();
    }
}
