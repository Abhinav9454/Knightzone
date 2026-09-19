package com.collegecontest.ai.service;

import com.collegecontest.ai.dto.AiUseRequest;
import com.collegecontest.ai.dto.AiUsageResponse;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class AiUsageService {

    private final UserRepository userRepository;
    private final AiPromptTemplateService promptTemplateService;
    private final OpenAiGateway openAiGateway;

    @Value("${ai.usage.cooldown-hours:24}")
    private long cooldownHours;

    public AiUsageService(
            UserRepository userRepository,
            AiPromptTemplateService promptTemplateService,
            OpenAiGateway openAiGateway) {
        this.userRepository = userRepository;
        this.promptTemplateService = promptTemplateService;
        this.openAiGateway = openAiGateway;
    }

    @Transactional
    public AiUsageResponse useAi(String userEmail, AiUseRequest request) {
        User user = getUser(userEmail);
        LocalDateTime now = LocalDateTime.now();
        Duration cooldown = Duration.ofHours(Math.max(1, cooldownHours));

        AiUsageResponse quota = buildQuotaResponse(user.getAiLastUsedAt(), now, cooldown, request);
        if (!quota.isAllowed()) {
            return quota;
        }

        String finalPrompt = promptTemplateService.buildPrompt(request);
        String aiResponse = openAiGateway.generate(finalPrompt);

        user.setAiLastUsedAt(now);
        userRepository.save(user);

        return AiUsageResponse.builder()
                .allowed(true)
                .message("AI usage successful.")
                .data(aiResponse)
                .promptType(request.getType().name())
                .nextAvailableAt(now.plus(cooldown))
                .remainingHours(0L)
                .remainingMinutes(0L)
                .build();
    }

    @Transactional(readOnly = true)
    public AiUsageResponse getQuota(String userEmail) {
        User user = getUser(userEmail);
        LocalDateTime now = LocalDateTime.now();
        Duration cooldown = Duration.ofHours(Math.max(1, cooldownHours));
        return buildQuotaResponse(user.getAiLastUsedAt(), now, cooldown, null);
    }

    private User getUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AiUsageResponse buildQuotaResponse(
            LocalDateTime aiLastUsedAt,
            LocalDateTime now,
            Duration cooldown,
            AiUseRequest request
    ) {
        if (aiLastUsedAt == null) {
            return AiUsageResponse.builder()
                    .allowed(true)
                    .message("AI is available now.")
                    .remainingHours(0L)
                    .remainingMinutes(0L)
                    .promptType(request != null && request.getType() != null ? request.getType().name() : null)
                    .build();
        }

        LocalDateTime nextAvailableAt = aiLastUsedAt.plus(cooldown);
        if (!now.isBefore(nextAvailableAt)) {
            return AiUsageResponse.builder()
                    .allowed(true)
                    .message("AI is available now.")
                    .remainingHours(0L)
                    .remainingMinutes(0L)
                    .nextAvailableAt(nextAvailableAt)
                    .promptType(request != null && request.getType() != null ? request.getType().name() : null)
                    .build();
        }

        Duration remaining = Duration.between(now, nextAvailableAt);
        long hoursLeft = remaining.toHours();
        long minutesLeft = remaining.minusHours(hoursLeft).toMinutes();

        return AiUsageResponse.builder()
                .allowed(false)
                .message(String.format(
                        "You can use AI only once every %d hours. Try again in %dh %dm.",
                        cooldown.toHours(),
                        hoursLeft,
                        minutesLeft))
                .remainingHours(hoursLeft)
                .remainingMinutes(minutesLeft)
                .nextAvailableAt(nextAvailableAt)
                .promptType(request != null && request.getType() != null ? request.getType().name() : null)
                .build();
    }
}
