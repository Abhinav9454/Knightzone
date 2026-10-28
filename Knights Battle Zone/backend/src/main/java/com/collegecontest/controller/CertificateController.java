package com.collegecontest.controller;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/certificates")
public class CertificateController {

    private final UserRepository userRepository;
    private static final Map<String, Map<String, Object>> CERTIFICATES = new ConcurrentHashMap<>();

    static {
        // Pre-seed a verified demo certificate
        String demoUuid = "kz-cert-7f9a-4c21-9988";
        Map<String, Object> demoCert = new LinkedHashMap<>();
        demoCert.put("uuid", demoUuid);
        demoCert.put("recipientName", "Abhinav Kumar");
        demoCert.put("recipientEmail", "abhinav@example.com");
        demoCert.put("contestId", 101L);
        demoCert.put("contestTitle", "All-India Knight Championship - Grand Finals");
        demoCert.put("rank", 1);
        demoCert.put("score", 985);
        demoCert.put("issueDate", LocalDate.now().minusDays(5).toString());
        demoCert.put("signatureHash", "9b4f6e12a83c7d50123fe587c653bc1a2089f81647e30d12ab74526981cfefaa");
        demoCert.put("issuer", "Knightzone Technical Advisory Council");
        demoCert.put("verified", true);
        CERTIFICATES.put(demoUuid, demoCert);
    }

    public CertificateController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return null;
        }
        return userRepository.findByEmail(auth.getName()).orElse(null);
    }

    @PostMapping("/generate/{contestId}")
    public ResponseEntity<Map<String, Object>> generateCertificate(@PathVariable Long contestId) {
        User user = currentUser();
        String recipientName = user != null ? user.getName() : "Knight Champion";
        String recipientEmail = user != null ? user.getEmail() : "champion@knightzone.dev";

        String uuid = "kz-cert-" + UUID.randomUUID().toString().substring(0, 13);
        String rawToSign = uuid + ":" + recipientEmail + ":" + contestId + ":" + System.currentTimeMillis();
        String signatureHash;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToSign.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            signatureHash = hexString.toString();
        } catch (Exception e) {
            signatureHash = "kz-sha256-" + System.currentTimeMillis();
        }

        Map<String, Object> cert = new LinkedHashMap<>();
        cert.put("uuid", uuid);
        cert.put("recipientName", recipientName);
        cert.put("recipientEmail", recipientEmail);
        cert.put("contestId", contestId);
        cert.put("contestTitle", "Knightzone Inter-College Competitive Contest #" + contestId);
        cert.put("rank", 1);
        cert.put("score", 950);
        cert.put("issueDate", LocalDate.now().toString());
        cert.put("signatureHash", signatureHash);
        cert.put("issuer", "Knightzone Competitive Programming Accreditation Board");
        cert.put("verified", true);

        CERTIFICATES.put(uuid, cert);
        return ResponseEntity.ok(cert);
    }

    @GetMapping("/verify/{uuid}")
    public ResponseEntity<Map<String, Object>> verifyCertificate(@PathVariable String uuid) {
        Map<String, Object> cert = CERTIFICATES.get(uuid);
        if (cert == null) {
            return ResponseEntity.status(404).body(Map.of(
                "verified", false,
                "status", "INVALID",
                "message", "Certificate with UUID " + uuid + " not found or may be counterfeit."
            ));
        }

        Map<String, Object> resp = new LinkedHashMap<>(cert);
        resp.put("verified", true);
        resp.put("status", "AUTHENTIC");
        resp.put("verifiedAt", Instant.now().toString());
        return ResponseEntity.ok(resp);
    }
}
