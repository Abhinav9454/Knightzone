package com.collegecontest.controllers.placement;

import com.collegecontest.services.placement.ResumeParserService;
import com.collegecontest.util.UploadValidationUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/placement/resume")
@RequiredArgsConstructor
public class ResumeParserController {
    private static final long MAX_RESUME_SIZE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_RESUME_EXTENSIONS = Set.of(".pdf", ".doc", ".docx", ".txt");
    private static final Set<String> ALLOWED_RESUME_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain");

    private final ResumeParserService resumeParserService;

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws IOException {
        UploadValidationUtils.requireNonEmpty(file, "Resume file is required");
        UploadValidationUtils.requireMaxSize(file, MAX_RESUME_SIZE_BYTES, "Resume file must be <= 5MB");
        UploadValidationUtils.requireAllowedFileExtension(
                file,
                ALLOWED_RESUME_EXTENSIONS,
                "Only PDF, DOC, DOCX or TXT files are allowed");

        String contentType = UploadValidationUtils.normalizedContentType(file.getContentType());
        if (!contentType.isBlank()) {
            UploadValidationUtils.requireAllowedContentType(
                    file,
                    ALLOWED_RESUME_CONTENT_TYPES,
                    "Unsupported resume content type");
        }

        String safeFileName = UploadValidationUtils.sanitizedFileName(file.getOriginalFilename(), "resume");
        return resumeParserService.parse(file.getBytes(), safeFileName);
    }
}
