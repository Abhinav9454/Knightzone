package com.collegecontest.service;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
public class UserPublicIdService {

    private static final String PREFIX = "CA";
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int BODY_LENGTH = 8;
    private static final int MAX_ATTEMPTS = 100;

    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    public UserPublicIdService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateUniquePublicUserId() {
        for (int i = 0; i < MAX_ATTEMPTS; i++) {
            String candidate = PREFIX + randomBody();
            if (!userRepository.existsByPublicUserId(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate unique public user ID");
    }

    public void ensurePublicUserId(User user) {
        if (user == null) return;
        if (user.getPublicUserId() == null || user.getPublicUserId().isBlank()) {
            user.setPublicUserId(generateUniquePublicUserId());
        }
    }

    private String randomBody() {
        StringBuilder sb = new StringBuilder(BODY_LENGTH);
        for (int i = 0; i < BODY_LENGTH; i++) {
            int index = random.nextInt(ALPHABET.length());
            sb.append(ALPHABET.charAt(index));
        }
        return sb.toString();
    }
}
