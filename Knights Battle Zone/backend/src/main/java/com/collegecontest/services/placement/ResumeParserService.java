package com.collegecontest.services.placement;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ResumeParserService {
    public Map<String, Object> parse(byte[] bytes, String filename) {
        return Map.of(
                "fileName", filename,
                "sizeBytes", bytes == null ? 0 : bytes.length,
                "summary", "Resume parser service scaffold"
        );
    }
}
