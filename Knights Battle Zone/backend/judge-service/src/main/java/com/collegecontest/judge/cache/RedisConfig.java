package com.collegecontest.judge.cache;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        String host = System.getenv().getOrDefault("REDIS_HOST", "localhost");
        int port = Integer.parseInt(System.getenv().getOrDefault("REDIS_PORT", "6379"));
        return new LettuceConnectionFactory(host, port);
    }

    @Bean
    @Primary
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> tmpl = new RedisTemplate<>();
        tmpl.setConnectionFactory(connectionFactory);
        tmpl.setKeySerializer(new StringRedisSerializer());
        tmpl.setValueSerializer(new StringRedisSerializer());
        tmpl.setHashKeySerializer(new StringRedisSerializer());
        tmpl.setHashValueSerializer(new StringRedisSerializer());
        tmpl.afterPropertiesSet();
        return tmpl;
    }
}
