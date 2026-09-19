package com.collegecontest.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Component
public class CorsOriginProperties {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173}")
    private String corsAllowedOrigins;

    public List<String> asList() {
        List<String> origins = Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        if (origins.isEmpty()) {
            return List.of("http://localhost:3000");
        }
        return Collections.unmodifiableList(origins);
    }

    public String[] asArray() {
        return asList().toArray(String[]::new);
    }
}
