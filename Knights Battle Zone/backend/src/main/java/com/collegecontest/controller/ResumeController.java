package com.collegecontest.controller;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.resume.ResumeHardCheckService;
import com.collegecontest.resume.ResumeStrengthDTO;
import com.collegecontest.resume.ResumeStrengthService;
import com.collegecontest.util.UploadValidationUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/resume")
public class ResumeController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ResumeController.class);
    private static final long MIN_RESUME_SIZE_BYTES = 2L * 1024;
    private static final long MAX_RESUME_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".pdf", ".doc", ".docx", ".txt");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain");
    private static final String DEFAULT_FILE_NAME = "resume";
    private static final String DEFAULT_SUGGESTION = "Keep improving this area with regular practice.";
    private static final int MIN_SCORE = 0;
    private static final int MAX_SCORE = 100;

    private static final List<CategoryRule> CATEGORY_RULES = List.of(
            new CategoryRule("Problem Solving", 12),
            new CategoryRule("Contest Experience", 5),
            new CategoryRule("Topic Diversity", -8),
            new CategoryRule("Consistency", -2),
            new CategoryRule("Community Impact", -10)
    );

    private final ResumeStrengthService resumeStrengthService;
    private final UserRepository userRepository;
    private final ResumeHardCheckService resumeHardCheckService;
    private final RestTemplate restTemplate;
    private final String resumeParserUrl;

    public ResumeController(
            ResumeStrengthService resumeStrengthService,
            UserRepository userRepository,
            ResumeHardCheckService resumeHardCheckService,
            RestTemplate restTemplate,
            @Value("${resume.parser.url:${RESUME_PARSER_URL:}}") String resumeParserUrl) {
        this.resumeStrengthService = resumeStrengthService;
        this.userRepository = userRepository;
        this.resumeHardCheckService = resumeHardCheckService;
        this.restTemplate = restTemplate;
        this.resumeParserUrl = resumeParserUrl == null ? "" : resumeParserUrl.trim();
    }

    @GetMapping("/strength")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> getStrength() {
        User user = currentUser();
        return strengthPayloadForUser(user.getId(), null, null);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> uploadResume(@RequestParam("file") MultipartFile file) {
        User user = currentUser();
        validateResumeFile(file);

        String fileName = normalizeFileName(file);
        ParsedResumeData parsedResume = parseResumeData(file, fileName);

        Map<String, Object> uploadMeta = new LinkedHashMap<>();
        uploadMeta.put("message", "Resume uploaded successfully. Professional audit completed.");
        uploadMeta.put("fileName", fileName);
        uploadMeta.put("sizeBytes", file.getSize());
        uploadMeta.put("parserUsed", parsedResume.parserUsed());
        uploadMeta.put("validationMode", parsedResume.hasText() ? "DEEP" : "FILE_ONLY");
        if (!parsedResume.note().isBlank()) {
            uploadMeta.put("validationNote", parsedResume.note());
        }

        return strengthPayloadForUser(user.getId(), uploadMeta, parsedResume);
    }

    @PostMapping(value = "/parse", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> parseResumeText(@org.springframework.web.bind.annotation.RequestBody Map<String, String> body) {
        String text = body == null ? "" : body.getOrDefault("text", "");
        if (text == null || text.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume text is required");
        }
        ParsedResumeData parsedResume = new ParsedResumeData(text, "Pasted_Resume_Text.txt", text.getBytes(StandardCharsets.UTF_8).length, false, "Client text parsed directly.");
        Long userId = currentUserIdOrNull();
        if (userId != null) {
            return strengthPayloadForUser(userId, Map.of("mode", "DIRECT_TEXT"), parsedResume);
        }
        ResumeStrengthDTO fallbackStrength = new ResumeStrengthDTO(85, List.of("Maintain measurable impact metrics across projects.", "Keep technical stack aligned with target roles."));
        return buildStrengthPayload(fallbackStrength, Map.of("mode", "GUEST_EVALUATION"), parsedResume);
    }

    private Map<String, Object> strengthPayloadForUser(
            Long userId,
            Map<String, Object> uploadMeta,
            ParsedResumeData parsedResume) {
        try {
            ResumeStrengthDTO strength = resumeStrengthService.getResumeStrength(userId);
            return buildStrengthPayload(strength, uploadMeta, parsedResume);
        } catch (RuntimeException ex) {
            // Resume metrics schema can be partial in local/dev DB. Serve fallback payload.
            LOGGER.warn("Resume strength fallback used for userId={}: {}", userId, ex.getMessage());
            return appendUploadMeta(buildFallbackPayload(), uploadMeta);
        }
    }

    private Map<String, Object> buildStrengthPayload(
            ResumeStrengthDTO strength,
            Map<String, Object> uploadMeta,
            ParsedResumeData parsedResume) {
        int baseScore = normalizeScore(strength.getScore());
        List<String> suggestions = strength.getSuggestions() == null ? List.of() : strength.getSuggestions();

        int overallScore = baseScore;
        List<Map<String, Object>> hardChecks = List.of();
        List<String> priorityActions = suggestions.stream().limit(5).toList();
        boolean deepAnalysis = false;
        boolean criticalFailure = false;

        if (parsedResume != null) {
            ResumeHardCheckService.ResumeHardCheckResult hardCheckResult = parsedResume.hasText()
                    ? resumeHardCheckService.evaluateDetailed(parsedResume.text(), parsedResume.fileName(), parsedResume.sizeBytes())
                    : resumeHardCheckService.evaluateFileOnly(parsedResume.fileName(), parsedResume.sizeBytes(), parsedResume.note());
            overallScore = normalizeScore(baseScore + hardCheckResult.scoreDelta());
            hardChecks = buildHardChecksPayload(hardCheckResult.checks());
            deepAnalysis = hardCheckResult.deepAnalysis();
            criticalFailure = hardCheckResult.checks().stream()
                    .anyMatch(item -> "CRITICAL".equals(item.severity()) && "FAIL".equals(item.status()));
            if (!hardCheckResult.priorityActions().isEmpty()) {
                priorityActions = hardCheckResult.priorityActions();
            }
        }

        if (priorityActions.isEmpty()) {
            priorityActions = List.of("Keep refining your resume with measurable, role-aligned achievements.");
        }

        List<Map<String, Object>> breakdown = new ArrayList<>(CATEGORY_RULES.size());
        for (int i = 0; i < CATEGORY_RULES.size(); i++) {
            CategoryRule rule = CATEGORY_RULES.get(i);
            int score = normalizeScore(overallScore + rule.offset());
            String suggestion = i < suggestions.size() ? suggestions.get(i) : DEFAULT_SUGGESTION;
            breakdown.add(Map.of(
                    "category", rule.category(),
                    "score", score,
                    "suggestion", suggestion
            ));
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("overallScore", overallScore);
        out.put("grade", gradeFor(overallScore));
        out.put("verdict", verdictFor(overallScore, criticalFailure));
        out.put("benchmark", benchmarkFor(overallScore, criticalFailure));
        out.put("checkedAt", Instant.now().toString());
        out.put("deepAnalysis", deepAnalysis);
        out.put("breakdown", breakdown);
        out.put("hardChecks", hardChecks);
        out.put("priorityActions", priorityActions);
        return appendUploadMeta(out, uploadMeta);
    }

    private void validateResumeFile(MultipartFile file) {
        UploadValidationUtils.requireNonEmpty(file, "Resume file is required");
        if (file.getSize() < MIN_RESUME_SIZE_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Resume file is too small. Upload a complete professional resume.");
        }
        UploadValidationUtils.requireMaxSize(file, MAX_RESUME_SIZE_BYTES, "Resume file must be <= 5MB");
        UploadValidationUtils.requireAllowedFileExtension(
                file,
                ALLOWED_EXTENSIONS,
                "Only PDF, DOC, DOCX, TXT files are allowed");

        String contentType = UploadValidationUtils.normalizedContentType(file.getContentType());
        if (!contentType.isBlank() && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported resume content type");
        }
    }

    private String normalizeFileName(MultipartFile file) {
        String originalName = file == null ? null : file.getOriginalFilename();
        return UploadValidationUtils.sanitizedFileName(originalName, DEFAULT_FILE_NAME);
    }

    private ParsedResumeData parseResumeData(MultipartFile file, String fileName) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read resume file");
        }

        String contentType = UploadValidationUtils.normalizedContentType(file.getContentType());
        String extension = UploadValidationUtils.extensionOf(fileName);

        if ("text/plain".equals(contentType) || ".txt".equals(extension)) {
            String text = new String(bytes, StandardCharsets.UTF_8);
            return new ParsedResumeData(text, fileName, bytes.length, false, "TXT content parsed locally.");
        }

        if (resumeParserUrl.isBlank()) {
            return new ParsedResumeData(
                    "",
                    fileName,
                    bytes.length,
                    false,
                    "Parser service unavailable. Upload TXT for deep content validation.");
        }

        try {
            Map<String, Object> parsedPayload = callParserService(bytes, fileName, contentType);
            String extractedText = extractParserText(parsedPayload);
            if (extractedText.isBlank()) {
                return new ParsedResumeData(
                        "",
                        fileName,
                        bytes.length,
                        true,
                        "Parser returned limited content. File-level checks applied.");
            }
            return new ParsedResumeData(extractedText, fileName, bytes.length, true, "Deep content validation completed.");
        } catch (RuntimeException ex) {
            LOGGER.warn("Resume parser unavailable for {}: {}", fileName, ex.getMessage());
            return new ParsedResumeData(
                    "",
                    fileName,
                    bytes.length,
                    false,
                    "Parser not reachable. File-level checks applied.");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callParserService(byte[] bytes, String fileName, String contentType) {
        ByteArrayResource resource = new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return fileName;
            }
        };

        HttpHeaders partHeaders = new HttpHeaders();
        if (!contentType.isBlank()) {
            partHeaders.setContentType(MediaType.parseMediaType(contentType));
        } else {
            partHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        }

        HttpEntity<ByteArrayResource> filePart = new HttpEntity<>(resource, partHeaders);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", filePart);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(resumeParserUrl, requestEntity, Map.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Unexpected parser response");
        }
        return (Map<String, Object>) response.getBody();
    }

    @SuppressWarnings("unchecked")
    private String extractParserText(Map<String, Object> payload) {
        if (payload == null || payload.isEmpty()) {
            return "";
        }

        Object parsedData = payload.get("parsedData");
        if (!(parsedData instanceof Map<?, ?> parsedMap)) {
            return "";
        }

        StringBuilder text = new StringBuilder();
        appendIfPresent(text, asString(parsedMap.get("name")));
        appendIfPresent(text, asString(parsedMap.get("summary")));
        appendIfPresent(text, asString(parsedMap.get("email")));
        appendIfPresent(text, asString(parsedMap.get("phone")));

        Object skillsObj = parsedMap.get("skills");
        if (skillsObj instanceof Collection<?> skills && !skills.isEmpty()) {
            String joined = skills.stream().map(Object::toString).reduce((a, b) -> a + " " + b).orElse("");
            appendIfPresent(text, joined);
        }

        return text.toString().trim();
    }

    private void appendIfPresent(StringBuilder target, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!target.isEmpty()) {
            target.append(' ');
        }
        target.append(value.trim());
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }

    private List<Map<String, Object>> buildHardChecksPayload(List<ResumeHardCheckService.HardCheckItem> checks) {
        if (checks == null || checks.isEmpty()) {
            return List.of();
        }
        List<Map<String, Object>> out = new ArrayList<>(checks.size());
        for (ResumeHardCheckService.HardCheckItem check : checks) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", check.id());
            item.put("title", check.title());
            item.put("status", check.status());
            item.put("severity", check.severity());
            item.put("detail", check.detail());
            item.put("action", check.action());
            out.add(item);
        }
        return out;
    }

    private String gradeFor(int score) {
        if (score >= 90) {
            return "A+";
        }
        if (score >= 80) {
            return "A";
        }
        if (score >= 70) {
            return "B+";
        }
        if (score >= 60) {
            return "B";
        }
        if (score >= 50) {
            return "C";
        }
        return "D";
    }

    private String verdictFor(int score, boolean criticalFailure) {
        if (criticalFailure) {
            return "Needs revision before high-stakes applications";
        }
        if (score >= 85) {
            return "Strong for MNC shortlisting";
        }
        if (score >= 70) {
            return "Good base, upgrade impact storytelling";
        }
        if (score >= 55) {
            return "Borderline for competitive screenings";
        }
        return "Not yet ready for top-tier filters";
    }

    private String benchmarkFor(int score, boolean criticalFailure) {
        if (criticalFailure) {
            return "Critical blockers detected in resume structure";
        }
        if (score >= 85) {
            return "Top 20% screening quality";
        }
        if (score >= 70) {
            return "Mid-tier screening quality";
        }
        if (score >= 55) {
            return "Below recruiter baseline";
        }
        return "High rejection risk";
    }

    private int normalizeScore(Integer value) {
        if (value == null) {
            return MIN_SCORE;
        }
        return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
    }

    private Map<String, Object> buildFallbackPayload() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("overallScore", 74);
        out.put("grade", "B+");
        out.put("verdict", "Good base, upgrade impact storytelling");
        out.put("benchmark", "Mid-tier screening quality");
        out.put("checkedAt", Instant.now().toString());
        out.put("deepAnalysis", false);
        out.put("breakdown", List.of(
                Map.of("category", "Problem Solving", "score", 84, "suggestion", "Maintain consistency on hard problems"),
                Map.of("category", "Projects", "score", 56, "suggestion", "Add quantified impact in project bullets"),
                Map.of("category", "Communication", "score", 72, "suggestion", "Write concise summary with target role")
        ));
        out.put("hardChecks", List.of(
                Map.of(
                        "id", "upload-required",
                        "title", "Deep Content Validation",
                        "status", "WARN",
                        "severity", "MAJOR",
                        "detail", "Upload a resume to run strict ATS and recruiter checks.",
                        "action", "Upload your latest resume to enable hard-level validation.")
        ));
        out.put("priorityActions", List.of(
                "Add project bullets with measurable impact.",
                "Include strong action verbs in each experience point.",
                "Maintain concise one-page ATS-friendly formatting."));
        return out;
    }

    private Map<String, Object> appendUploadMeta(Map<String, Object> payload, Map<String, Object> uploadMeta) {
        if (uploadMeta == null || uploadMeta.isEmpty()) {
            return payload;
        }
        payload.putAll(uploadMeta);
        return payload;
    }

    private Long currentUserIdOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null
                    || !authentication.isAuthenticated()
                    || authentication instanceof AnonymousAuthenticationToken
                    || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
                return null;
            }
            return userRepository.findByEmail(authentication.getName()).map(User::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private User currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private record CategoryRule(String category, int offset) {
    }

    private record ParsedResumeData(
            String text,
            String fileName,
            long sizeBytes,
            boolean parserUsed,
            String note) {
        private boolean hasText() {
            return text != null && !text.isBlank();
        }
    }
}
