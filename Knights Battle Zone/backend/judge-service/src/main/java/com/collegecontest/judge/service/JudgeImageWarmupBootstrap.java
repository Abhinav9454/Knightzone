package com.collegecontest.judge.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Component
@ConditionalOnProperty(name = "judge.docker.warmup.enabled", havingValue = "true", matchIfMissing = true)
public class JudgeImageWarmupBootstrap {

    private static final Logger log = LoggerFactory.getLogger(JudgeImageWarmupBootstrap.class);

    @Value("${judge.docker.warmup.images:}")
    private String warmupImagesConfig;

    @Value("${judge.docker.warmup.pull-missing:true}")
    private boolean pullMissingImages;

    private final DockerExecutionService dockerExecutionService;

    public JudgeImageWarmupBootstrap(DockerExecutionService dockerExecutionService) {
        this.dockerExecutionService = dockerExecutionService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void warmImages() {
        Set<String> images = parseConfiguredImages();
        if (images.isEmpty()) {
            images = dockerExecutionService.defaultRuntimeImages();
        }

        Set<String> finalImages = images;
        CompletableFuture.runAsync(() -> {
            log.info("Judge image warmup started for {} image(s).", finalImages.size());
            dockerExecutionService.warmupImages(finalImages, pullMissingImages);
            log.info("Judge image warmup completed.");
        });
    }

    private Set<String> parseConfiguredImages() {
        Set<String> images = new LinkedHashSet<>();
        if (warmupImagesConfig == null || warmupImagesConfig.isBlank()) {
            return images;
        }

        Arrays.stream(warmupImagesConfig.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .forEach(images::add);
        return images;
    }
}
