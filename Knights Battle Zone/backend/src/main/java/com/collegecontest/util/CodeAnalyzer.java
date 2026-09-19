package com.collegecontest.util;

import org.springframework.stereotype.Component;
import java.util.regex.Pattern;
import java.util.HashMap;
import java.util.Map;

@Component
public class CodeAnalyzer {
    
    private static final Pattern COMMENT_PATTERN = Pattern.compile(
        "(//.*?\\n)|(/\\*.*?\\*/)", Pattern.DOTALL
    );
    
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");
    
    public String normalizeCode(String code) {
        if (code == null || code.isEmpty()) {
            return "";
        }
        
        // Remove comments
        String withoutComments = COMMENT_PATTERN.matcher(code).replaceAll(" ");
        
        // Normalize whitespace
        return WHITESPACE_PATTERN.matcher(withoutComments).replaceAll(" ").trim();
    }
    
    public static class Metrics {
        private final int lineCount;
        private final int characterCount;
        private final int complexity;
        
        public Metrics(int lineCount, int characterCount, int complexity) {
            this.lineCount = lineCount;
            this.characterCount = characterCount;
            this.complexity = complexity;
        }
        
        public int getLineCount() { return lineCount; }
        public int getCharacterCount() { return characterCount; }
        public int getComplexity() { return complexity; }
    }

    public Map<String, Object> analyzeJava(String code) {
        Map<String, Object> result = new HashMap<>();
        result.put("avgLineLength", 0.0);
        // Add actual analysis logic
        return result;
    }

    public Map<String, Object> analyzePython(String code) {
        Map<String, Object> result = new HashMap<>();
        result.put("avgLineLength", 0.0);
        return result;
    }
}



