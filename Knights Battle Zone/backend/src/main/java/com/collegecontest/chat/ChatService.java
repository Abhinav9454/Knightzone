package com.collegecontest.chat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final int MAX_HISTORY_SIZE = 100;

    @Value("${gemini.api.key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${gemini.model:${GEMINI_MODEL:gemini-1.5-flash}}")
    private String geminiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final Map<String, List<ChatMessageDTO>> historyBySession = new ConcurrentHashMap<>();
    private final Map<String, List<Integer>> ratingsBySession = new ConcurrentHashMap<>();

    public ChatResponseDTO reply(ChatRequestDTO request) {
        String sessionId = normalizeSessionId(request.getSessionId());
        String userMessage = request.getMessage() == null ? "" : request.getMessage().trim();

        if (userMessage.isBlank()) {
            return new ChatResponseDTO(sessionId, "Please type a message so I can help you.", Instant.now());
        }

        addMessage(sessionId, new ChatMessageDTO("user", userMessage, Instant.now()));

        String botReply = null;
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            botReply = callGeminiAi(userMessage);
        }

        if (botReply == null || botReply.isBlank()) {
            botReply = generateFallbackReply(userMessage);
        }

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

    private String callGeminiAi(String userMessage) {
        String[] candidateModels = new String[]{
                (geminiModel != null && !geminiModel.isBlank()) ? geminiModel : "gemini-1.5-flash",
                "gemini-2.5-flash",
                "gemini-pro",
                "gemini-2.5-flash-lite"
        };

        for (String model : candidateModels) {
            try {
                String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                        + model + ":generateContent?key=" + geminiApiKey.trim();

                Map<String, Object> systemInstruction = Map.of(
                        "parts", List.of(Map.of("text",
                                "You are Knight AI, an expert technical mentor, competitive programming coach, and DSA guide for the Knightzone platform. " +
                                "Help users with algorithms, live coding contests (fullscreen proctoring with 3-strike rules), 1v1 Arena speed duels, ATS resume strength audit, quizzes, and technical mock interviews. " +
                                "Provide clear, concise, highly professional answers with formatting and clean code snippets where helpful."))
                );

                Map<String, Object> userContent = Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userMessage))
                );

                Map<String, Object> bodyMap = Map.of(
                        "system_instruction", systemInstruction,
                        "contents", List.of(userContent),
                        "generationConfig", Map.of(
                                "temperature", 0.7,
                                "maxOutputTokens", 800
                        )
                );

                String requestJson = objectMapper.writeValueAsString(bodyMap);

                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .timeout(Duration.ofSeconds(6))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .build();

                HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode root = objectMapper.readTree(response.body());
                    JsonNode candidates = root.path("candidates");
                    if (candidates.isArray() && !candidates.isEmpty()) {
                        JsonNode parts = candidates.get(0).path("content").path("parts");
                        if (parts.isArray() && !parts.isEmpty()) {
                            String reply = parts.get(0).path("text").asText("");
                            if (!reply.isBlank()) {
                                return reply.trim();
                            }
                        }
                    }
                } else {
                    log.warn("Gemini model {} returned HTTP {}: {}", model, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.debug("Gemini attempt for model {} failed: {}", model, e.getMessage());
            }
        }
        return null;
    }

    private String generateFallbackReply(String message) {
        String text = message.toLowerCase();

        if (containsAny(text, "hello", "hi", "hey", "namaste")) {
            return "Hello! I am your Knight AI assistant. How can I guide you on Knightzone today?";
        }
        if (containsAny(text, "register", "sign up", "signup", "create account")) {
            return "To create an account, open the Register page, fill your details, and verify email to access contests and arenas.";
        }
        if (containsAny(text, "login", "sign in")) {
            return "Use your registered email and password on the Login page. If you forget your credentials, use the password reset option.";
        }
        if (containsAny(text, "contest", "coding", "proctoring", "fullscreen")) {
            return "Contests feature Full-Screen Proctoring with a strict 3-strike rule. If you switch tabs, minimize, or exit fullscreen more than 3 times, you will be disqualified. Make sure you allow fullscreen when prompted!";
        }
        if (containsAny(text, "quiz", "mcq")) {
            return "Open Quizzes from the menu to take proctored assessments. Submit answers before the timer runs out to register your score.";
        }
        if (containsAny(text, "duel", "1v1", "arena")) {
            return "In 1v1 Speed Coding Arena, you battle live opponents or AI bots in real time. Winner gets ELO rating bumps and battle trophies.";
        }
        if (containsAny(text, "resume", "cv", "ats")) {
            return "Use the Knight ATS Resume Strength Auditor to test your resume against strict HR screening filters, and Resume Builder to export ATS-compliant formats.";
        }
        if (containsAny(text, "mock interview", "interview")) {
            return "Mock Interviews are available from the navigation bar. You can practice with AI technical interviewers and receive detailed scorecards.";
        }
        if (containsAny(text, "profile", "account", "avatar")) {
            return "You can view your stats, badges, solved challenges, and duel rating history in Knight Profile.";
        }
        if (containsAny(text, "placement", "job", "career")) {
            return "Check the Careers & Jobs section for verified software engineer openings and placement readiness analytics.";
        }
        if (containsAny(text, "help", "support", "issue", "bug")) {
            return "You can chat with our live support team using the 'Live Support' tab in this widget, or open a ticket in the Support Desk.";
        }
        if (containsAny(text, "thanks", "thank you")) {
            return "You're very welcome, Knight! Keep coding and sharpening your skills.";
        }

        return "I can assist you with Live Contests, 1v1 Arena Duels, Algorithmic Challenges, ATS Resume Auditing, and Technical Interview prep. What would you like to explore?";
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
