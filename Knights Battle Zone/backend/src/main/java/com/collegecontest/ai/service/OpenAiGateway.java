package com.collegecontest.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiGateway {

    private final RestClient restClient;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String openAiUrl;

    @Value("${openai.api.key:}")
    private String openAiApiKey;

    @Value("${openai.api.model:gpt-4o-mini}")
    private String model;

    @Value("${openai.api.temperature:0.7}")
    private double temperature;

    public OpenAiGateway(RestClient.Builder builder) {
        this.restClient = builder.build();
    }

    public String generate(String prompt) {
        if (openAiApiKey == null || openAiApiKey.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "OPENAI_API_KEY is not configured on backend.");
        }

        Map<String, Object> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", prompt);

        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(message);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", messages);
        requestBody.put("temperature", temperature);

        try {
            JsonNode response = restClient.post()
                    .uri(openAiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + openAiApiKey)
                    .body(requestBody)
                    .retrieve()
                    .body(JsonNode.class);

            return extractContent(response);
        } catch (HttpStatusCodeException ex) {
            String errorBody = ex.getResponseBodyAsString();
            String errorMessage = (errorBody == null || errorBody.isBlank())
                    ? "AI provider request failed."
                    : errorBody;
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, errorMessage);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to fetch response from AI provider.");
        }
    }

    private String extractContent(JsonNode response) {
        if (response == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider returned empty response.");
        }

        JsonNode choices = response.path("choices");
        if (!choices.isArray() || choices.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider response missing choices.");
        }

        JsonNode messageNode = choices.get(0).path("message");
        if (messageNode.isMissingNode()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider response missing message.");
        }

        String content = messageNode.path("content").asText("").trim();
        if (content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI provider returned blank content.");
        }
        return content;
    }
}
