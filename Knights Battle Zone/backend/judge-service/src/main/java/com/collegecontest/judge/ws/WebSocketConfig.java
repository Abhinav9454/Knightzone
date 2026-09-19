package com.collegecontest.judge.ws;

import com.collegecontest.judge.config.CorsOriginProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final CorsOriginProperties corsOriginProperties;

    public WebSocketConfig(CorsOriginProperties corsOriginProperties) {
        this.corsOriginProperties = corsOriginProperties;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] allowedOrigins = corsOriginProperties.asArray();
        registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigins).withSockJS();
        registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigins);
    }
}
