package com.collegecontest.resume;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ResumeHardCheckService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern PHONE_PATTERN = Pattern.compile("(?:\\+?\\d[\\d\\-\\s]{8,}\\d)");
    private static final Pattern YEAR_PATTERN = Pattern.compile("\\b(19|20)\\d{2}\\b");
    private static final Pattern IMPACT_PATTERN = Pattern.compile("\\b\\d+(?:\\.\\d+)?\\s*(?:%|x|k|m|million|billion)?\\b",
            Pattern.CASE_INSENSITIVE);

    private static final List<String> CORE_SECTION_KEYWORDS = List.of(
            "summary",
            "objective",
            "experience",
            "work experience",
            "internship",
            "projects",
            "skills",
            "technical skills",
            "education",
            "certification",
            "achievements");

    private static final List<String> ACTION_VERBS = List.of(
            "built", "designed", "implemented", "optimized", "improved", "delivered", "created",
            "developed", "deployed", "scaled", "automated", "engineered", "led", "owned", "reduced");

    private static final List<String> ROLE_KEYWORDS = List.of(
            "software engineer", "developer", "intern", "analyst", "consultant", "manager",
            "sde", "backend", "frontend", "full stack", "data engineer");

    private static final List<String> SKILL_KEYWORDS = List.of(
            "java", "python", "cpp", "c++", "javascript", "typescript", "react", "spring", "node",
            "sql", "mysql", "postgresql", "redis", "docker", "kubernetes", "aws", "azure",
            "git", "rest", "microservice", "system design", "linux", "testing");

    public ResumeHardCheckResult evaluateDetailed(String resumeText, String fileName, long sizeBytes) {
        String text = normalizeText(resumeText);
        List<CheckEvaluation> checks = new ArrayList<>();

        checks.add(fileHygieneCheck(fileName, sizeBytes));
        checks.add(contactPresenceCheck(text));
        checks.add(coreSectionsCheck(text));
        checks.add(impactMetricsCheck(text));
        checks.add(actionVerbCheck(text));
        checks.add(atsReadabilityCheck(text));
        checks.add(skillDepthCheck(text));
        checks.add(experienceEvidenceCheck(text));

        return toResult(checks, true);
    }

    public ResumeHardCheckResult evaluateFileOnly(String fileName, long sizeBytes, String parserNote) {
        List<CheckEvaluation> checks = new ArrayList<>();
        checks.add(fileHygieneCheck(fileName, sizeBytes));

        String note = parserNote == null || parserNote.isBlank()
                ? "Deep content checks are unavailable for this file."
                : parserNote.trim();
        checks.add(new CheckEvaluation(
                "parser-depth",
                "Deep Content Validation",
                "WARN",
                "MAJOR",
                note,
                "Upload a TXT resume or retry when parser service is available."));

        return toResult(checks, false);
    }

    private ResumeHardCheckResult toResult(List<CheckEvaluation> checks, boolean deepAnalysis) {
        int penalty = checks.stream()
                .mapToInt(check -> switch (check.status()) {
                    case "FAIL" -> switch (check.severity()) {
                        case "CRITICAL" -> 18;
                        case "MAJOR" -> 12;
                        default -> 6;
                    };
                    case "WARN" -> switch (check.severity()) {
                        case "CRITICAL" -> 8;
                        case "MAJOR" -> 5;
                        default -> 2;
                    };
                    default -> 0;
                })
                .sum();

        long failedChecks = checks.stream().filter(check -> "FAIL".equals(check.status())).count();
        long passedChecks = checks.stream().filter(check -> "PASS".equals(check.status())).count();
        int bonus = failedChecks == 0 && passedChecks >= 7 ? 6 : (failedChecks == 0 && passedChecks >= 5 ? 3 : 0);
        int scoreDelta = bonus - penalty;

        List<String> priorityActions = checks.stream()
                .filter(check -> !"PASS".equals(check.status()))
                .sorted(Comparator
                        .comparingInt((CheckEvaluation check) -> statusWeight(check.status()))
                        .thenComparingInt(check -> severityWeight(check.severity())))
                .map(CheckEvaluation::action)
                .distinct()
                .limit(5)
                .toList();

        List<HardCheckItem> items = checks.stream()
                .map(check -> new HardCheckItem(
                        check.id(),
                        check.title(),
                        check.status(),
                        check.severity(),
                        check.detail(),
                        check.action()))
                .toList();

        return new ResumeHardCheckResult(items, priorityActions, scoreDelta, penalty, deepAnalysis);
    }

    private CheckEvaluation fileHygieneCheck(String fileName, long sizeBytes) {
        String safeName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT).trim();
        boolean suspiciousName = safeName.matches(".*\\b(copy|final|latest|new|updated)\\b.*");
        if (sizeBytes < 3_000L) {
            return new CheckEvaluation(
                    "file-hygiene",
                    "File Hygiene",
                    "FAIL",
                    "CRITICAL",
                    "Resume file is too small and likely incomplete.",
                    "Use a complete one-page or two-page professional resume before uploading.");
        }
        if (sizeBytes < 12_000L || suspiciousName) {
            return new CheckEvaluation(
                    "file-hygiene",
                    "File Hygiene",
                    "WARN",
                    "MINOR",
                    suspiciousName
                            ? "Filename looks unprofessional for recruiter pipelines."
                            : "File is very short for a competitive resume.",
                    suspiciousName
                            ? "Rename file using format FullName_Role_Resume.pdf."
                            : "Add stronger project and impact bullets to increase substance.");
        }
        return new CheckEvaluation(
                "file-hygiene",
                "File Hygiene",
                "PASS",
                "MINOR",
                "File naming and size look production-ready.",
                "Keep naming and file quality consistent.");
    }

    private CheckEvaluation contactPresenceCheck(String text) {
        boolean hasEmail = EMAIL_PATTERN.matcher(text).find();
        boolean hasPhone = PHONE_PATTERN.matcher(text).find();
        boolean hasProfileLink = text.contains("linkedin.com") || text.contains("github.com") || text.contains("portfolio");

        if (hasEmail && hasPhone && hasProfileLink) {
            return new CheckEvaluation(
                    "contact-presence",
                    "Contact Presence",
                    "PASS",
                    "CRITICAL",
                    "Email, phone, and profile links are present.",
                    "Keep links updated and publicly accessible.");
        }
        if (hasEmail || hasPhone) {
            return new CheckEvaluation(
                    "contact-presence",
                    "Contact Presence",
                    "WARN",
                    "CRITICAL",
                    "Some contact elements are missing for recruiter reach-out.",
                    "Add email, phone, LinkedIn, and one portfolio/GitHub link in header.");
        }
        return new CheckEvaluation(
                "contact-presence",
                "Contact Presence",
                "FAIL",
                "CRITICAL",
                "Contact details were not reliably detected.",
                "Add a clear header with full name, email, phone, and profile links.");
    }

    private CheckEvaluation coreSectionsCheck(String text) {
        long sectionHits = CORE_SECTION_KEYWORDS.stream().filter(text::contains).count();
        if (sectionHits >= 5) {
            return new CheckEvaluation(
                    "core-sections",
                    "Core Sections Coverage",
                    "PASS",
                    "CRITICAL",
                    "Resume covers essential recruiter sections.",
                    "Keep sections concise and role-focused.");
        }
        if (sectionHits >= 3) {
            return new CheckEvaluation(
                    "core-sections",
                    "Core Sections Coverage",
                    "WARN",
                    "CRITICAL",
                    "Some essential sections appear to be missing.",
                    "Ensure resume has summary, experience, projects, skills, and education.");
        }
        return new CheckEvaluation(
                "core-sections",
                "Core Sections Coverage",
                "FAIL",
                "CRITICAL",
                "Resume structure is incomplete for ATS and recruiter review.",
                "Rebuild layout with mandatory sections before applying to major companies.");
    }

    private CheckEvaluation impactMetricsCheck(String text) {
        int metricMentions = countMatches(IMPACT_PATTERN, text);
        if (metricMentions >= 8) {
            return new CheckEvaluation(
                    "impact-metrics",
                    "Impact Metrics",
                    "PASS",
                    "MAJOR",
                    "Strong use of measurable outcomes in bullets.",
                    "Continue using metrics tied to scale, revenue, latency, or adoption.");
        }
        if (metricMentions >= 4) {
            return new CheckEvaluation(
                    "impact-metrics",
                    "Impact Metrics",
                    "WARN",
                    "MAJOR",
                    "Partial quantification detected, but impact storytelling is thin.",
                    "Increase quantified bullets with percentages, scale, and business outcomes.");
        }
        return new CheckEvaluation(
                "impact-metrics",
                "Impact Metrics",
                "FAIL",
                "MAJOR",
                "Low measurable impact detected in the content.",
                "Add metrics such as % improvement, user scale, and execution time reduction.");
    }

    private CheckEvaluation actionVerbCheck(String text) {
        int verbHits = ACTION_VERBS.stream().mapToInt(verb -> countToken(text, verb)).sum();
        if (verbHits >= 10) {
            return new CheckEvaluation(
                    "action-verbs",
                    "Action Verb Strength",
                    "PASS",
                    "MAJOR",
                    "Bullet language is assertive and achievement-oriented.",
                    "Keep starting bullets with strong ownership verbs.");
        }
        if (verbHits >= 5) {
            return new CheckEvaluation(
                    "action-verbs",
                    "Action Verb Strength",
                    "WARN",
                    "MAJOR",
                    "Action language exists but can be more compelling.",
                    "Rewrite weak bullets using action verbs plus measurable outcomes.");
        }
        return new CheckEvaluation(
                "action-verbs",
                "Action Verb Strength",
                "FAIL",
                "MAJOR",
                "Resume sounds passive and lacks ownership-driven phrasing.",
                "Start experience/project bullets with verbs like built, optimized, led, deployed.");
    }

    private CheckEvaluation atsReadabilityCheck(String text) {
        int specialChars = 0;
        int lettersDigits = 0;
        for (char c : text.toCharArray()) {
            if (Character.isLetterOrDigit(c)) {
                lettersDigits++;
                continue;
            }
            if (!Character.isWhitespace(c) && ",.;:()/-+&%".indexOf(c) < 0) {
                specialChars++;
            }
        }
        double specialRatio = lettersDigits == 0 ? 1.0 : specialChars / (double) lettersDigits;

        int maxLineLength = Arrays.stream(text.split("\\R"))
                .map(String::trim)
                .mapToInt(String::length)
                .max()
                .orElse(0);

        if (specialRatio <= 0.03 && maxLineLength <= 140) {
            return new CheckEvaluation(
                    "ats-readability",
                    "ATS Readability",
                    "PASS",
                    "MAJOR",
                    "Formatting appears ATS-friendly and scannable.",
                    "Maintain simple headings and clean bullet structure.");
        }
        if (specialRatio <= 0.08 && maxLineLength <= 220) {
            return new CheckEvaluation(
                    "ats-readability",
                    "ATS Readability",
                    "WARN",
                    "MAJOR",
                    "Formatting may reduce parser reliability in some ATS tools.",
                    "Reduce special symbols and avoid overly long lines or dense paragraphs.");
        }
        return new CheckEvaluation(
                "ats-readability",
                "ATS Readability",
                "FAIL",
                "MAJOR",
                "Format appears noisy for ATS extraction and recruiter scanning.",
                "Use plain text headings, concise bullets, and standard punctuation only.");
    }

    private CheckEvaluation skillDepthCheck(String text) {
        long distinctSkills = SKILL_KEYWORDS.stream().filter(text::contains).distinct().count();
        if (distinctSkills >= 10) {
            return new CheckEvaluation(
                    "skill-depth",
                    "Technical Skill Depth",
                    "PASS",
                    "MAJOR",
                    "Skill graph looks broad enough for MNC shortlisting.",
                    "Keep skills aligned with target role and project evidence.");
        }
        if (distinctSkills >= 6) {
            return new CheckEvaluation(
                    "skill-depth",
                    "Technical Skill Depth",
                    "WARN",
                    "MAJOR",
                    "Skill coverage is moderate but can be stronger.",
                    "Add role-specific stack depth (backend/frontend/cloud/data) with evidence.");
        }
        return new CheckEvaluation(
                "skill-depth",
                "Technical Skill Depth",
                "FAIL",
                "MAJOR",
                "Technical skill depth looks shallow for competitive screening.",
                "Expand skill section and connect each core skill to real project impact.");
    }

    private CheckEvaluation experienceEvidenceCheck(String text) {
        int yearHits = countMatches(YEAR_PATTERN, text);
        int roleHits = ROLE_KEYWORDS.stream().mapToInt(role -> countToken(text, role)).sum();

        if (yearHits >= 2 && roleHits >= 2) {
            return new CheckEvaluation(
                    "experience-evidence",
                    "Experience Evidence",
                    "PASS",
                    "MAJOR",
                    "Role history and timeline evidence are visible.",
                    "Keep chronology clear with recent work first.");
        }
        if (yearHits >= 1 || roleHits >= 1) {
            return new CheckEvaluation(
                    "experience-evidence",
                    "Experience Evidence",
                    "WARN",
                    "MAJOR",
                    "Experience timeline or role context is partially defined.",
                    "Add explicit role names and month/year ranges for each experience entry.");
        }
        return new CheckEvaluation(
                "experience-evidence",
                "Experience Evidence",
                "FAIL",
                "MAJOR",
                "No strong timeline-based experience evidence detected.",
                "Add internships/projects with role, duration, and impact bullets.");
    }

    private String normalizeText(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.toLowerCase(Locale.ROOT).replace('\u0000', ' ').replaceAll("\\s+", " ").trim();
    }

    private int countMatches(Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        int count = 0;
        while (matcher.find()) {
            count++;
        }
        return count;
    }

    private int countToken(String text, String token) {
        if (text.isBlank() || token == null || token.isBlank()) {
            return 0;
        }
        Pattern pattern = Pattern.compile("\\b" + Pattern.quote(token.toLowerCase(Locale.ROOT)) + "\\b");
        return countMatches(pattern, text);
    }

    private int severityWeight(String severity) {
        return switch (severity) {
            case "CRITICAL" -> 0;
            case "MAJOR" -> 1;
            default -> 2;
        };
    }

    private int statusWeight(String status) {
        return "FAIL".equals(status) ? 0 : 1;
    }

    private record CheckEvaluation(
            String id,
            String title,
            String status,
            String severity,
            String detail,
            String action) {
    }

    public record HardCheckItem(
            String id,
            String title,
            String status,
            String severity,
            String detail,
            String action) {
    }

    public record ResumeHardCheckResult(
            List<HardCheckItem> checks,
            List<String> priorityActions,
            int scoreDelta,
            int penalty,
            boolean deepAnalysis) {
    }
}
