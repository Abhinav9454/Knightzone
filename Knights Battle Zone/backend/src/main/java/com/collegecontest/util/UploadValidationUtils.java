package com.collegecontest.util;

import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.Set;

public final class UploadValidationUtils {

    private UploadValidationUtils() {
    }

    public static void requireNonEmpty(MultipartFile file, String requiredMessage) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, requiredMessage);
        }
    }

    public static void requireMaxSize(MultipartFile file, long maxBytes, String tooLargeMessage) {
        if (file != null && file.getSize() > maxBytes) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, tooLargeMessage);
        }
    }

    public static void requireAllowedContentType(MultipartFile file, Set<String> allowedContentTypes, String message) {
        if (file == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        String contentType = normalizedContentType(file.getContentType());
        if (!allowedContentTypes.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    public static void requireAllowedFileExtension(MultipartFile file, Set<String> allowedExtensions, String message) {
        if (file == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
        String fileName = sanitizedFileName(file.getOriginalFilename(), "");
        String extension = extensionOf(fileName);
        if (!allowedExtensions.contains(extension)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    public static String normalizedContentType(String contentType) {
        return contentType == null ? "" : contentType.trim().toLowerCase(Locale.ROOT);
    }

    public static String sanitizedFileName(String fileName, String fallback) {
        if (fileName == null || fileName.isBlank()) {
            return fallback;
        }
        // Prevent path traversal and control characters in logged/persisted names.
        String sanitized = fileName
                .replace('\\', '/')
                .replaceAll(".*/", "")
                .replaceAll("[\\r\\n\\t]", "")
                .trim();
        return sanitized.isEmpty() ? fallback : sanitized;
    }

    public static String extensionOf(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "";
        }
        int idx = fileName.lastIndexOf('.');
        if (idx < 0 || idx == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(idx).toLowerCase(Locale.ROOT);
    }
}
