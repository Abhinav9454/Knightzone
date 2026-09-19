package com.collegecontest.ai.service;

import com.collegecontest.ai.dto.AiUseRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiPromptTemplateService {

    public String buildPrompt(AiUseRequest request) {
        return switch (request.getType()) {
            case CODE_REVIEWER -> buildCodeReviewerPrompt(request);
            case PROBLEM_GENERATOR -> buildProblemGeneratorPrompt(request);
            case INTERVIEWER -> buildInterviewerPrompt(request);
        };
    }

    private String buildCodeReviewerPrompt(AiUseRequest request) {
        String code = requireText(request.getUserCode(), "Code is required for code review");
        String language = fallback(request.getLanguage(), "Unknown");
        String problem = fallback(request.getProblemDescription(), "Not provided");

        StringBuilder builder = new StringBuilder()
                .append("You are a senior competitive programming mentor and code reviewer.\n\n")
                .append("Analyze the following code and provide feedback.\n\n")
                .append("Return response in the following format:\n\n")
                .append("Code Quality Score: (1-10)\n\n")
                .append("Time Complexity:\n")
                .append("Explain the time complexity.\n\n")
                .append("Issues Found:\n")
                .append("List mistakes, bugs, or inefficiencies.\n\n")
                .append("Optimization Suggestion:\n")
                .append("Suggest a better approach if possible.\n\n")
                .append("Improved Code (optional):\n")
                .append("Provide a cleaner or optimized version.\n\n")
                .append("Explanation:\n")
                .append("Explain the logic in simple terms for a beginner.\n\n")
                .append("Code:\n")
                .append(code)
                .append("\n\nLanguage:\n")
                .append(language)
                .append("\n\nProblem Description:\n")
                .append(problem);

        appendExtraInstructions(builder, request);
        return builder.toString();
    }

    private String buildProblemGeneratorPrompt(AiUseRequest request) {
        String topic = requireText(request.getTopic(), "Topic is required for problem generation");
        String difficulty = requireText(request.getDifficulty(), "Difficulty is required for problem generation");

        StringBuilder builder = new StringBuilder()
                .append("You are an expert competitive programming problem setter.\n\n")
                .append("Generate a unique DSA problem.\n\n")
                .append("Requirements:\n")
                .append("Topic: ").append(topic).append("\n")
                .append("Difficulty: ").append(difficulty).append("\n\n")
                .append("Return the response in the following format:\n\n")
                .append("Title:\n\n")
                .append("Problem Statement:\n\n")
                .append("Input Format:\n\n")
                .append("Output Format:\n\n")
                .append("Constraints:\n\n")
                .append("Example Input:\n\n")
                .append("Example Output:\n\n")
                .append("Explanation:\n\n")
                .append("Edge Cases:\n\n")
                .append("Test Cases:\n")
                .append("Provide at least 3 hidden test cases.\n\n")
                .append("Do NOT generate already famous problems.\n")
                .append("Make it original and interview-style.");

        appendExtraInstructions(builder, request);
        return builder.toString();
    }

    private String buildInterviewerPrompt(AiUseRequest request) {
        String topic = requireText(request.getTopic(), "Topic is required for interviewer mode");
        String difficulty = requireText(request.getDifficulty(), "Difficulty is required for interviewer mode");

        StringBuilder builder = new StringBuilder()
                .append("You are a technical interviewer conducting a coding interview.\n\n")
                .append("Ask a coding problem related to:\n")
                .append("Topic: ").append(topic).append("\n")
                .append("Difficulty: ").append(difficulty).append("\n\n")
                .append("Rules:\n\n")
                .append("Ask only ONE problem first.\n\n")
                .append("Wait for candidate response.\n\n")
                .append("If the candidate submits code, analyze it.\n\n")
                .append("Ask follow-up questions about optimization.\n\n")
                .append("Give final feedback.\n\n")
                .append("Response format:\n\n")
                .append("Interview Question:\n\n")
                .append("Hints (optional):\n\n")
                .append("What you will evaluate:\n\n")
                .append("Problem solving\n")
                .append("Time complexity\n")
                .append("Code quality");

        appendExtraInstructions(builder, request);
        return builder.toString();
    }

    private String requireText(String value, String message) {
        if (value == null || value.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String fallback(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        return value.trim();
    }

    private void appendExtraInstructions(StringBuilder builder, AiUseRequest request) {
        if (request.getExtraInstructions() == null || request.getExtraInstructions().trim().isEmpty()) {
            return;
        }
        builder.append("\n\nAdditional Instructions:\n")
                .append(request.getExtraInstructions().trim());
    }
}
