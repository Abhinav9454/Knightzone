package com.collegecontest.chat;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO request) {
        return ResponseEntity.ok(chatService.reply(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ChatMessageDTO>> history(@RequestParam String sessionId) {
        return ResponseEntity.ok(chatService.getHistory(sessionId));
    }

    @PostMapping("/feedback")
    public ResponseEntity<Map<String, String>> feedback(@Valid @RequestBody ChatFeedbackDTO feedbackDTO) {
        chatService.saveFeedback(feedbackDTO);
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
