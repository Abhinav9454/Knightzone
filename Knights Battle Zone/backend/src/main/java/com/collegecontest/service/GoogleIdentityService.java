package com.collegecontest.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleIdentityService {

    private final RestClient restClient;

    @Value("${GOOGLE_CLIENT_ID:}")
    private String googleClientId;

    public GoogleIdentityService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder
                .baseUrl("https://oauth2.googleapis.com")
                .build();
    }

    public GoogleProfile verifyIdToken(String idToken) {
        if (!StringUtils.hasText(googleClientId)) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Google login is not configured on the server"
            );
        }

        GoogleTokenInfoResponse tokenInfo;
        try {
            tokenInfo = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/tokeninfo")
                            .queryParam("id_token", idToken)
                            .build())
                    .retrieve()
                    .body(GoogleTokenInfoResponse.class);
        } catch (RestClientException ex) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid Google credential"
            );
        }

        if (tokenInfo == null || !StringUtils.hasText(tokenInfo.getEmail())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Google profile");
        }
        if (!googleClientId.equals(tokenInfo.getAud())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google client mismatch");
        }
        if (!Boolean.TRUE.equals(tokenInfo.getEmailVerified())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google email is not verified");
        }

        return new GoogleProfile(
                tokenInfo.getEmail(),
                tokenInfo.getName(),
                tokenInfo.getPicture()
        );
    }

    public record GoogleProfile(String email, String name, String pictureUrl) {
    }

    public static class GoogleTokenInfoResponse {
        private String aud;
        private String email;
        private Boolean email_verified;
        private String name;
        private String picture;

        public String getAud() {
            return aud;
        }

        public void setAud(String aud) {
            this.aud = aud;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public Boolean getEmailVerified() {
            return email_verified;
        }

        public void setEmail_verified(Boolean email_verified) {
            this.email_verified = email_verified;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getPicture() {
            return picture;
        }

        public void setPicture(String picture) {
            this.picture = picture;
        }
    }
}
