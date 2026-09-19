package com.collegecontest.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.config.StompBrokerRelayRegistration;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@EnableConfigurationProperties(WebSocketBrokerProperties.class)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private CorsOriginProperties corsOriginProperties;

    @Autowired
    private WebSocketBrokerProperties brokerProperties;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        String[] destinationPrefixes = sanitizeDestinationPrefixes();

        if (brokerProperties.isRelayEnabled()) {
            StompBrokerRelayRegistration relay = registry.enableStompBrokerRelay(destinationPrefixes)
                    .setRelayHost(brokerProperties.getRelayHost())
                    .setRelayPort(brokerProperties.getRelayPort())
                    .setClientLogin(brokerProperties.getClientLogin())
                    .setClientPasscode(brokerProperties.getClientPasscode())
                    .setSystemLogin(brokerProperties.getSystemLogin())
                    .setSystemPasscode(brokerProperties.getSystemPasscode())
                    .setVirtualHost(brokerProperties.getVirtualHost());

            relay.setSystemHeartbeatSendInterval(brokerProperties.getRelaySystemHeartbeatSendMs());
            relay.setSystemHeartbeatReceiveInterval(brokerProperties.getRelaySystemHeartbeatReceiveMs());
        } else {
            registry.enableSimpleBroker(destinationPrefixes)
                    .setTaskScheduler(messageBrokerTaskScheduler())
                    .setHeartbeatValue(new long[] {
                            brokerProperties.getSimpleHeartbeatSendMs(),
                            brokerProperties.getSimpleHeartbeatReceiveMs() });
        }

        // Set prefix for messages that are bound for methods annotated with @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Bean
    public TaskScheduler messageBrokerTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("ws-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    private String[] sanitizeDestinationPrefixes() {
        if (brokerProperties.getDestinationPrefixes() == null || brokerProperties.getDestinationPrefixes().isEmpty()) {
            return new String[] { "/topic", "/queue" };
        }

        String[] prefixes = brokerProperties.getDestinationPrefixes().stream()
                .map(String::trim)
                .filter(prefix -> !prefix.isEmpty())
                .distinct()
                .toArray(String[]::new);
        if (prefixes.length == 0) {
            return new String[] { "/topic", "/queue" };
        }
        return prefixes;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] allowedOrigins = corsOriginProperties.asArray();

        // Register "/ws" as the WebSocket endpoint
        registry.addEndpoint("/ws")
                // Allow connections from frontend origins
                .setAllowedOrigins(allowedOrigins)
                // Enable SockJS fallback options
                .withSockJS();
        
        // Alternative endpoint without SockJS for clients that support native WebSocket
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins);
    }
}
