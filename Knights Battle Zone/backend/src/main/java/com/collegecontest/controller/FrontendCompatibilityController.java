package com.collegecontest.controller;

import com.collegecontest.model.User;
import com.collegecontest.model.Submission;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("")
public class FrontendCompatibilityController {

    private static final String DEFAULT_USER_ROLE = "USER";
    private static final String TEAM_CAPTAIN_ROLE = "Captain";
    private static final String TEAM_MEMBER_ROLE = "Member";
    private static final String ACTION_DISMISS = "DISMISS";
    private static final String STATUS_REVIEWED = "REVIEWED";
    private static final String STATUS_DISMISSED = "DISMISSED";
    private static final String STATUS_RESOLVED = "RESOLVED";
    private static final String STATUS_INVESTIGATING = "INVESTIGATING";
    private static final int CALENDAR_LOOKBACK_DAYS = 90;
    private static final int MAX_DAILY_ACTIVITY = 8;
    private static final double ACTIVE_DAY_THRESHOLD = 0.35;

    private final UserRepository userRepository;
    private final ContestRepository contestRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final SubmissionRepository submissionRepository;

    private final AtomicLong teamIdSeq = new AtomicLong(2);
    private final Map<Long, TeamPayload> teams = new ConcurrentHashMap<>();
    private final Map<Long, ReviewFlagPayload> reviewFlags = new ConcurrentHashMap<>();
    private final Map<Long, SuspiciousPayload> suspiciousUsers = new ConcurrentHashMap<>();
    private final List<FlaggedPayload> flaggedSubmissions = new CopyOnWriteArrayList<>();

    public FrontendCompatibilityController(
            UserRepository userRepository,
            ContestRepository contestRepository,
            ContestParticipantRepository contestParticipantRepository,
            SubmissionRepository submissionRepository) {
        this.userRepository = userRepository;
        this.contestRepository = contestRepository;
        this.contestParticipantRepository = contestParticipantRepository;
        this.submissionRepository = submissionRepository;
        seedData();
    }

    @GetMapping("/activity/calendar")
    public List<Map<String, Object>> getActivityCalendar() {
        List<Map<String, Object>> out = new ArrayList<>(CALENDAR_LOOKBACK_DAYS);
        Random random = new Random(42);
        for (int dayOffset = CALENDAR_LOOKBACK_DAYS - 1; dayOffset >= 0; dayOffset--) {
            LocalDate date = LocalDate.now().minusDays(dayOffset);
            int count = random.nextDouble() > ACTIVE_DAY_THRESHOLD ? random.nextInt(MAX_DAILY_ACTIVITY) : 0;
            out.add(Map.of("date", date.toString(), "count", count));
        }
        return out;
    }

    @GetMapping("/integrity/flagged")
    public List<FlaggedPayload> getFlagged() {
        return List.copyOf(flaggedSubmissions);
    }

    @PostMapping("/integrity/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public void reviewIntegrity(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String action = body == null
                ? STATUS_REVIEWED
                : body.getOrDefault("action", STATUS_REVIEWED).toUpperCase();
        String nextStatus = ACTION_DISMISS.equals(action) ? STATUS_DISMISSED : STATUS_REVIEWED;
        flaggedSubmissions.stream()
                .filter(f -> Objects.equals(f.id, id))
                .findFirst()
                .ifPresent(f -> f.status = nextStatus);
    }

    @GetMapping("/dashboard/summary")
    public Map<String, Object> getDashboardSummary() {
        User me = currentUser();
        Long userId = me.getId();
        int rating = safeRating(me.getRating());

        List<Submission> allSubmissions = submissionRepository.findByUserIdWithProblemAndContestOrderBySubmittedAtDesc(userId);
        long contestsParticipated = contestParticipantRepository.countByUserId(userId);
        if (contestsParticipated == 0) {
            contestsParticipated = allSubmissions.stream()
                    .map(Submission::getProblem)
                    .filter(Objects::nonNull)
                    .map(problem -> problem.getContest() == null ? null : problem.getContest().getId())
                    .filter(Objects::nonNull)
                    .distinct()
                    .count();
        }

        long solvedProblems = submissionRepository.countDistinctAcceptedProblemsByUserId(userId);
        long upcomingContests = contestRepository.countByStartTimeAfter(LocalDateTime.now());
        int globalRank = (int) userRepository.countByRatingGreaterThan(rating) + 1;

        List<Map<String, Object>> recentSubmissions = allSubmissions.stream()
                .limit(5)
                .map(submission -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("id", submission.getId());
                    row.put("problemId", submission.getProblem() != null ? submission.getProblem().getId() : null);
                    row.put("problemTitle", submission.getProblem() != null ? submission.getProblem().getTitle() : "Problem");
                    row.put("userId", userId);
                    row.put("language", submission.getLanguage());
                    row.put("code", "");
                    row.put("status", submission.getStatus());
                    row.put("submittedAt", submission.getSubmittedAt() == null ? LocalDateTime.now().toString() : submission.getSubmittedAt().toString());
                    return row;
                })
                .toList();

        return Map.of(
                "contestsParticipated", contestsParticipated,
                "problemsSolved", solvedProblems,
                "currentRating", rating,
                "globalRank", globalRank,
                "upcomingContests", upcomingContests,
                "recentSubmissions", recentSubmissions);
    }

    @GetMapping("/placement/readiness")
    public Map<String, Object> placementReadiness() {
        User me = currentUser();
        Long userId = me.getId();

        long totalSubmissions = submissionRepository.countByUserId(userId);
        long acceptedSubmissions = submissionRepository.countAcceptedByUserId(userId);
        long uniqueSolved = submissionRepository.countDistinctAcceptedProblemsByUserId(userId);

        Map<String, Long> difficultyCounts = new HashMap<>();
        for (Object[] row : submissionRepository.countAcceptedByDifficulty(userId)) {
            String difficulty = row[0] == null ? "MEDIUM" : row[0].toString().toUpperCase();
            long count = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
            difficultyCounts.put(difficulty, count);
        }

        long easySolved = difficultyCounts.getOrDefault("EASY", 0L);
        long mediumSolved = difficultyCounts.getOrDefault("MEDIUM", 0L);
        long hardSolved = difficultyCounts.getOrDefault("HARD", 0L);

        int rating = safeRating(me.getRating());
        int dataStructures = clampPercent(20 + (uniqueSolved * 4) + (easySolved * 2) + (mediumSolved * 2));
        int algorithms = clampPercent(15 + (mediumSolved * 4) + (hardSolved * 6));
        int systemDesign = clampPercent(10 + (hardSolved * 8) + Math.max(0, (rating - 1200) / 10.0));
        int database = clampPercent(22 + (acceptedSubmissions * 2) + (mediumSolved * 1.5));
        int oopConcepts = clampPercent(24 + (acceptedSubmissions * 1.6) + Math.max(0, (rating - 1000) / 12.0));

        List<Map<String, Object>> topics = List.of(
                Map.of("name", "Data Structures", "mastery", dataStructures, "importance", "HIGH"),
                Map.of("name", "Algorithms", "mastery", algorithms, "importance", "HIGH"),
                Map.of("name", "System Design", "mastery", systemDesign, "importance", "HIGH"),
                Map.of("name", "Database", "mastery", database, "importance", "MEDIUM"),
                Map.of("name", "OOP Concepts", "mastery", oopConcepts, "importance", "MEDIUM"));

        double acceptancePercent = totalSubmissions == 0 ? 0 : (acceptedSubmissions * 100.0 / totalSubmissions);
        int googleMatch = companyMatch((algorithms * 0.45) + (systemDesign * 0.35) + (dataStructures * 0.2), rating, acceptancePercent);
        int microsoftMatch = companyMatch((dataStructures * 0.35) + (algorithms * 0.35) + (oopConcepts * 0.3), rating, acceptancePercent);
        int amazonMatch = companyMatch((systemDesign * 0.4) + (algorithms * 0.35) + (database * 0.25), rating, acceptancePercent);

        List<Map<String, Object>> companies = List.of(
                Map.of("name", "Google", "match", googleMatch, "requiredTopics", List.of("Algorithms", "System Design", "Data Structures")),
                Map.of("name", "Microsoft", "match", microsoftMatch, "requiredTopics", List.of("Data Structures", "Algorithms", "OOP Concepts")),
                Map.of("name", "Amazon", "match", amazonMatch, "requiredTopics", List.of("System Design", "Algorithms", "Database")));

        return Map.of(
                "topics", topics,
                "companies", companies,
                "generatedAt", LocalDateTime.now().toString());
    }

    @GetMapping("/review-flags")
    public Collection<ReviewFlagPayload> getReviewFlags() {
        return List.copyOf(reviewFlags.values());
    }

    @PostMapping("/review-flags/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public void resolveFlag(@PathVariable Long id) {
        updateReviewFlagStatus(id, STATUS_RESOLVED);
    }

    @PostMapping("/review-flags/{id}/dismiss")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public void dismissFlag(@PathVariable Long id) {
        updateReviewFlagStatus(id, STATUS_DISMISSED);
    }

    @GetMapping("/suspicious")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public Collection<SuspiciousPayload> getSuspicious() {
        return List.copyOf(suspiciousUsers.values());
    }

    @PostMapping("/suspicious/{userId}/investigate")
    @PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
    public void investigate(@PathVariable Long userId) {
        SuspiciousPayload payload = suspiciousUsers.get(userId);
        if (payload != null) {
            payload.status = STATUS_INVESTIGATING;
        }
    }

    @GetMapping("/teams")
    public Collection<TeamPayload> getTeams() {
        return List.copyOf(teams.values());
    }

    @PostMapping("/teams")
    public TeamPayload createTeam(@RequestBody Map<String, String> body) {
        String name = body == null ? "New Team" : body.getOrDefault("name", "New Team").trim();
        if (name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Team name is required");
        }

        User me = currentUser();
        TeamPayload team = new TeamPayload();
        team.id = teamIdSeq.incrementAndGet();
        team.name = name;
        team.score = 0;
        team.contestsPlayed = 0;
        team.members = new ArrayList<>(List.of(new TeamMemberPayload(me.getId(), me.getName(), TEAM_CAPTAIN_ROLE)));
        teams.put(team.id, team);
        return team;
    }

    @PostMapping("/teams/{id}/invite")
    public void inviteTeamMember(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        TeamPayload team = teams.get(id);
        if (team == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found");
        }
        Long userId = body == null ? null : body.get("userId");
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "userId required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean exists = team.members.stream().anyMatch(member -> Objects.equals(member.userId, userId));
        if (!exists) {
            team.members.add(new TeamMemberPayload(user.getId(), user.getName(), TEAM_MEMBER_ROLE));
        }
    }

    private User currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null
                || !auth.isAuthenticated()
                || auth instanceof AnonymousAuthenticationToken
                || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private int safeRating(Integer rating) {
        return rating == null ? 0 : rating;
    }

    private int clampPercent(double value) {
        return (int) Math.max(0, Math.min(100, Math.round(value)));
    }

    private int companyMatch(double weightedTopicScore, int rating, double acceptancePercent) {
        double ratingBoost = Math.max(0, rating - 1000) / 28.0;
        double acceptanceBoost = acceptancePercent * 0.16;
        return clampPercent(weightedTopicScore + ratingBoost + acceptanceBoost);
    }

    private void updateReviewFlagStatus(Long id, String status) {
        ReviewFlagPayload flag = reviewFlags.get(id);
        if (flag != null) {
            flag.status = status;
        }
    }

    private void seedData() {
        TeamPayload t1 = new TeamPayload();
        t1.id = 1L;
        t1.name = "Code Crushers";
        t1.score = 4200;
        t1.contestsPlayed = 8;
        t1.members = new ArrayList<>();
        t1.members.add(new TeamMemberPayload(1L, "Alex Chen", TEAM_CAPTAIN_ROLE));
        teams.put(t1.id, t1);

        reviewFlags.put(1L, new ReviewFlagPayload(1L, "PROBLEM", 3L, "Unclear problem statement", 15L, "GraphGuru", "OPEN", LocalDateTime.now().minusDays(1).toString()));
        reviewFlags.put(2L, new ReviewFlagPayload(2L, "SUBMISSION", 101L, "Possible spam content", 12L, "AlgoQueen", STATUS_RESOLVED, LocalDateTime.now().minusDays(3).toString()));

        suspiciousUsers.put(30L, new SuspiciousPayload(30L, "MultiAcct1", "Multiple accounts detected from same IP", "HIGH", LocalDateTime.now().minusHours(8).toString(), STATUS_INVESTIGATING));
        suspiciousUsers.put(31L, new SuspiciousPayload(31L, "SpeedHacker", "Impossibly fast submissions", "CRITICAL", LocalDateTime.now().minusDays(1).toString(), STATUS_INVESTIGATING));

        flaggedSubmissions.add(new FlaggedPayload(1L, 101L, 25L, "ShadyUser1", "Code similarity > 95%", "HIGH", "PENDING", LocalDateTime.now().minusHours(6).toString()));
        flaggedSubmissions.add(new FlaggedPayload(2L, 102L, 26L, "QuickPaste", "Submission within 10 seconds", "MEDIUM", "PENDING", LocalDateTime.now().minusDays(1).toString()));
    }

    private static class FlaggedPayload {
        public Long id;
        public Long submissionId;
        public Long userId;
        public String username;
        public String reason;
        public String severity;
        public String status;
        public String detectedAt;

        public FlaggedPayload(Long id, Long submissionId, Long userId, String username, String reason, String severity, String status, String detectedAt) {
            this.id = id;
            this.submissionId = submissionId;
            this.userId = userId;
            this.username = username;
            this.reason = reason;
            this.severity = severity;
            this.status = status;
            this.detectedAt = detectedAt;
        }
    }

    private static class TeamPayload {
        public Long id;
        public String name;
        public List<TeamMemberPayload> members;
        public int score;
        public int contestsPlayed;
    }

    private static class TeamMemberPayload {
        public Long userId;
        public String name;
        public String role;

        public TeamMemberPayload(Long userId, String name, String role) {
            this.userId = userId;
            this.name = name;
            this.role = role;
        }
    }

    private static class ReviewFlagPayload {
        public Long id;
        public String type;
        public Long targetId;
        public String reason;
        public Long reportedBy;
        public String reporterName;
        public String status;
        public String createdAt;

        public ReviewFlagPayload(Long id, String type, Long targetId, String reason, Long reportedBy, String reporterName, String status, String createdAt) {
            this.id = id;
            this.type = type;
            this.targetId = targetId;
            this.reason = reason;
            this.reportedBy = reportedBy;
            this.reporterName = reporterName;
            this.status = status;
            this.createdAt = createdAt;
        }
    }

    private static class SuspiciousPayload {
        public Long userId;
        public String username;
        public String reason;
        public String severity;
        public String detectedAt;
        public String status;

        public SuspiciousPayload(Long userId, String username, String reason, String severity, String detectedAt, String status) {
            this.userId = userId;
            this.username = username;
            this.reason = reason;
            this.severity = severity;
            this.detectedAt = detectedAt;
            this.status = status;
        }
    }
}
