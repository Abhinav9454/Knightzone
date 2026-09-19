package com.collegecontest.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class RedisConfig {

    @Value("${spring.redis.host:localhost}")
    private String redisHost;

    @Value("${spring.redis.port:6379}")
    private int redisPort;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        return new LettuceConnectionFactory(redisHost, redisPort);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory, ObjectMapper objectMapper) {
        ObjectMapper redisObjectMapper = objectMapper.copy();
        redisObjectMapper.registerModule(new JavaTimeModule());
        redisObjectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer));

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("recommendedProblem", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("learningPath", defaultConfig.entryTtl(Duration.ofDays(1)));
        cacheConfigs.put("weakTopicHeatmap", defaultConfig.entryTtl(Duration.ofHours(1)));
        cacheConfigs.put("readability", defaultConfig.entryTtl(Duration.ofDays(1)));
        cacheConfigs.put("complexity", defaultConfig.entryTtl(Duration.ofDays(1)));
        cacheConfigs.put("behaviorProfile", defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigs.put("spaceAnalysis", defaultConfig.entryTtl(Duration.ofDays(1)));
        cacheConfigs.put("leaderboardGlobalFiltered", defaultConfig.entryTtl(Duration.ofMinutes(3)));
        cacheConfigs.put("leaderboardContest", defaultConfig.entryTtl(Duration.ofSeconds(30)));
        cacheConfigs.put("leaderboardContestFirstSolvers", defaultConfig.entryTtl(Duration.ofSeconds(45)));
        cacheConfigs.put("contestDetail", defaultConfig.entryTtl(Duration.ofSeconds(90)));
        cacheConfigs.put("contestParticipantCount", defaultConfig.entryTtl(Duration.ofSeconds(45)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
