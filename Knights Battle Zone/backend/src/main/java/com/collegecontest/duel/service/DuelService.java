package com.collegecontest.duel.service;

import com.collegecontest.duel.dto.DuelAchievementDTO;
import com.collegecontest.duel.dto.DuelCreateRequest;
import com.collegecontest.duel.dto.DuelDTO;
import com.collegecontest.duel.dto.DuelGameDTO;
import com.collegecontest.duel.dto.DuelLeaderboardEntryDTO;
import com.collegecontest.duel.dto.DuelMatchmakingRequest;
import com.collegecontest.duel.dto.DuelSubmitRequest;
import com.collegecontest.duel.exception.DuelNotFoundException;
import com.collegecontest.duel.model.Duel;
import com.collegecontest.duel.repository.DuelRepository;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.User;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class DuelService {

    private static final int DEFAULT_RATING = 1000;
    private static final int ELO_K = 32;

    private final DuelRepository duelRepository;
    private final UserRepository userRepository;
    private final ProblemRepository problemRepository;
    private final DuelInsightsService duelInsightsService;
    private final Random random = new Random();

    public DuelService(
            DuelRepository duelRepository,
            UserRepository userRepository,
            ProblemRepository problemRepository,
            DuelInsightsService duelInsightsService
    ) {
        this.duelRepository = duelRepository;
        this.userRepository = userRepository;
        this.problemRepository = problemRepository;
        this.duelInsightsService = duelInsightsService;
    }

    @Transactional(readOnly = true)
    public List<DuelDTO> getDuelsForUser(Long userId) {
        List<Duel> duels = duelRepository.findByUser1IdOrUser2IdOrderByCreatedAtDesc(userId, userId);
        return toDTOs(duels);
    }

    @Transactional(readOnly = true)
    public DuelDTO getDuelForUser(Long duelId, Long currentUserId) {
        Duel duel = requireDuel(duelId);
        if (!Objects.equals(duel.getUser1Id(), currentUserId) && !Objects.equals(duel.getUser2Id(), currentUserId)) {
            throw new IllegalArgumentException("You are not a participant in this duel");
        }
        return toDTOs(List.of(duel)).get(0);
    }

    @Transactional
    public DuelDTO challenge(Long challengerId, DuelCreateRequest request) {
        User challenger = requireUser(challengerId, "Challenger not found");

        String mode = normalizeMode(request.getMode());
        String difficulty = normalizeDifficulty(request.getDifficulty());
        int durationSeconds = normalizeDuration(request.getDurationSeconds());

        Duel duel = new Duel();
        duel.setDuelDate(LocalDate.now());
        duel.setUser1Id(challenger.getId());
        duel.setMode(mode);
        duel.setDifficulty(difficulty);
        duel.setDurationSeconds(durationSeconds);
        duel.setStatus("PENDING");
        duel.setCreatedAt(LocalDateTime.now());
        duel.setProblemId(0L);
        duel.setPlayer1Completed(false);
        duel.setPlayer2Completed(false);

        if (request.getOpponentId() == null) {
            duel.setUser2Id(0L);
            duel.setInviteCode(generateInviteCode());
            Duel saved = duelRepository.save(duel);
            return toDTOs(List.of(saved)).get(0);
        }

        if (challengerId.equals(request.getOpponentId())) {
            throw new IllegalArgumentException("You cannot challenge yourself");
        }

        User opponent = requireUser(request.getOpponentId(), "Opponent not found");

        List<Duel> between = duelRepository.findBetweenUsers(challengerId, opponent.getId());
        boolean hasOpen = between.stream().anyMatch(d -> "PENDING".equalsIgnoreCase(d.getStatus())
                || "ACTIVE".equalsIgnoreCase(d.getStatus()));
        if (hasOpen) {
            throw new IllegalStateException("An open duel already exists between these users");
        }

        duel.setUser2Id(opponent.getId());
        Duel saved = duelRepository.save(duel);
        return toDTO(saved, Map.of(challenger.getId(), challenger, opponent.getId(), opponent), null);
    }

    @Transactional
    public DuelDTO createCustomRoom(Long hostUserId, DuelCreateRequest request) {
        User host = requireUser(hostUserId, "Host user not found");

        String mode = normalizeMode(request.getMode());
        String difficulty = normalizeDifficulty(request.getDifficulty());
        int durationSeconds = normalizeDuration(request.getDurationSeconds());

        String roomCode;
        do {
            roomCode = String.format("%06d", random.nextInt(1000000));
        } while (duelRepository.findByInviteCode(roomCode).isPresent());

        Duel duel = new Duel();
        duel.setDuelDate(LocalDate.now());
        duel.setUser1Id(host.getId());
        duel.setUser2Id(0L);
        duel.setMode(mode);
        duel.setDifficulty(difficulty);
        duel.setDurationSeconds(durationSeconds);
        duel.setStatus("PENDING");
        duel.setCreatedAt(LocalDateTime.now());
        duel.setPlayer1Completed(false);
        duel.setPlayer2Completed(false);
        duel.setInviteCode(roomCode);

        if ("CODING".equalsIgnoreCase(mode)) {
            List<Problem> matching = problemRepository.findAll().stream()
                    .filter(p -> "ANY".equalsIgnoreCase(difficulty) || difficulty.equalsIgnoreCase(p.getDifficulty()))
                    .toList();
            if (!matching.isEmpty()) {
                duel.setProblemId(matching.get(random.nextInt(matching.size())).getId());
            } else {
                List<Problem> any = problemRepository.findAll();
                duel.setProblemId(!any.isEmpty() ? any.get(0).getId() : 0L);
            }
        } else {
            duel.setProblemId(0L);
        }

        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional
    public DuelDTO joinByInviteCode(Long currentUserId, String inviteCode) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Room code cannot be empty");
        }
        String cleanCode = inviteCode.trim().toUpperCase(Locale.ROOT);

        Duel duel = duelRepository.findByInviteCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Private duel room #" + cleanCode + " not found or expired"));

        if (Objects.equals(duel.getUser1Id(), currentUserId)) {
            return toDTOs(List.of(duel)).get(0);
        }

        if ("COMPLETED".equalsIgnoreCase(duel.getStatus()) || "ABANDONED".equalsIgnoreCase(duel.getStatus())) {
            throw new IllegalStateException("This duel room has already concluded");
        }

        if (Objects.equals(duel.getUser2Id(), currentUserId)) {
            return toDTOs(List.of(duel)).get(0);
        }

        if (!"PENDING".equalsIgnoreCase(duel.getStatus())) {
            throw new IllegalStateException("Duel room is already full or in progress");
        }

        duel.setUser2Id(currentUserId);
        duel.setStatus("ACTIVE");
        duel.setStartedAt(LocalDateTime.now());

        if (duel.getProblemId() == null || duel.getProblemId() == 0L) {
            List<Problem> problems = problemRepository.findAll();
            if (!problems.isEmpty()) {
                duel.setProblemId(problems.get(random.nextInt(problems.size())).getId());
            }
        }

        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional(readOnly = true)
    public DuelDTO getRoomByCode(String inviteCode, Long currentUserId) {
        if (inviteCode == null || inviteCode.trim().isEmpty()) {
            throw new IllegalArgumentException("Room code cannot be empty");
        }
        String cleanCode = inviteCode.trim().toUpperCase(Locale.ROOT);
        Duel duel = duelRepository.findByInviteCode(cleanCode)
                .orElseThrow(() -> new IllegalArgumentException("Private duel room #" + cleanCode + " not found"));
        return toDTOs(List.of(duel)).get(0);
    }

    @Transactional
    public DuelDTO joinMatchmaking(Long currentUserId, DuelMatchmakingRequest request) {
        User currentUser = requireUser(currentUserId, "User not found");

        String mode = normalizeMode(request.getMode());
        String difficulty = normalizeDifficulty(request.getDifficulty());
        int durationSeconds = normalizeDuration(request.getDurationSeconds());
        int maxGap = request.getMaxRatingGap() == null || request.getMaxRatingGap() <= 0 ? 300 : request.getMaxRatingGap();

        List<Duel> candidates = duelRepository.findAll().stream()
                .filter(d -> "PENDING".equalsIgnoreCase(d.getStatus()))
                .filter(d -> d.getUser2Id() != null && d.getUser2Id() == 0L)
                .filter(d -> d.getInviteCode() == null || d.getInviteCode().isBlank())
                .filter(d -> mode.equalsIgnoreCase(d.getMode()))
                .filter(d -> difficulty.equalsIgnoreCase(d.getDifficulty()))
                .filter(d -> !Objects.equals(d.getUser1Id(), currentUserId))
                .sorted(Comparator.comparing(Duel::getCreatedAt))
                .toList();

        for (Duel duel : candidates) {
            User challenger = userRepository.findById(duel.getUser1Id()).orElse(null);
            if (challenger == null) {
                continue;
            }
            int gap = Math.abs(getRating(challenger) - getRating(currentUser));
            if (gap > maxGap) {
                continue;
            }
            duel.setUser2Id(currentUserId);
            activateDuel(duel);
            Duel saved = duelRepository.save(duel);
            return toDTOs(List.of(saved)).get(0);
        }

        Duel queueEntry = new Duel();
        queueEntry.setDuelDate(LocalDate.now());
        queueEntry.setUser1Id(currentUserId);
        queueEntry.setUser2Id(0L);
        queueEntry.setMode(mode);
        queueEntry.setDifficulty(difficulty);
        queueEntry.setDurationSeconds(durationSeconds);
        queueEntry.setStatus("PENDING");
        queueEntry.setCreatedAt(LocalDateTime.now());
        queueEntry.setProblemId(0L);
        queueEntry.setPlayer1Completed(false);
        queueEntry.setPlayer2Completed(false);
        Duel saved = duelRepository.save(queueEntry);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional
    public DuelDTO accept(Long duelId, Long currentUserId) {
        Duel duel = requireDuel(duelId);

        if (!"PENDING".equalsIgnoreCase(duel.getStatus())) {
            throw new IllegalStateException("Only pending duels can be accepted");
        }

        if (duel.getUser2Id() != null && duel.getUser2Id() > 0L && !duel.getUser2Id().equals(currentUserId)) {
            throw new IllegalArgumentException("Only invited opponent can accept this duel");
        }

        if (duel.getUser1Id().equals(currentUserId)) {
            throw new IllegalArgumentException("Challenger cannot accept own duel");
        }

        duel.setUser2Id(currentUserId);
        activateDuel(duel);
        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional
    public DuelDTO decline(Long duelId, Long currentUserId) {
        Duel duel = requireDuel(duelId);

        if (!"PENDING".equalsIgnoreCase(duel.getStatus())) {
            throw new IllegalStateException("Only pending duels can be declined");
        }
        if (!duel.getUser2Id().equals(currentUserId)) {
            throw new IllegalArgumentException("Only invited opponent can decline this duel");
        }

        duel.setStatus("DECLINED");
        duel.setCompletedAt(LocalDateTime.now());
        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional
    public DuelDTO submit(Long duelId, Long currentUserId, DuelSubmitRequest request) {
        Duel duel = requireDuel(duelId);

        if (!"ACTIVE".equalsIgnoreCase(duel.getStatus())) {
            throw new IllegalStateException("Only active duels accept submissions");
        }

        if (!Objects.equals(duel.getUser1Id(), currentUserId) && !Objects.equals(duel.getUser2Id(), currentUserId)) {
            throw new IllegalArgumentException("You are not a participant in this duel");
        }

        double score = request.getScore() == null ? 0d : Math.max(0d, Math.min(100d, request.getScore()));
        boolean completed = request.getCompleted() != null && request.getCompleted();

        if (Objects.equals(duel.getUser1Id(), currentUserId)) {
            duel.setPlayer1Score(score);
            duel.setPlayer1Completed(completed);
        } else {
            duel.setPlayer2Score(score);
            duel.setPlayer2Completed(completed);
        }

        if (request.getGameData() != null && !request.getGameData().isBlank()) {
            duel.setGameData(request.getGameData().trim());
        }
        duelInsightsService.analyzeSubmissionForFairPlay(duel, currentUserId, score, completed, request.getGameData());

        boolean bothCompleted = Boolean.TRUE.equals(duel.getPlayer1Completed()) && Boolean.TRUE.equals(duel.getPlayer2Completed());
        if (bothCompleted) {
            finalizeDuelWithScores(duel);
        }

        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional
    public DuelDTO abandon(Long duelId, Long currentUserId) {
        Duel duel = requireDuel(duelId);

        if (!Objects.equals(duel.getUser1Id(), currentUserId) && !Objects.equals(duel.getUser2Id(), currentUserId)) {
            throw new IllegalArgumentException("You are not a participant in this duel");
        }

        if (!("ACTIVE".equalsIgnoreCase(duel.getStatus()) || "PENDING".equalsIgnoreCase(duel.getStatus()))) {
            throw new IllegalStateException("Only active or pending duels can be abandoned");
        }

        Long winnerId = null;
        if (duel.getUser2Id() != null && duel.getUser2Id() > 0L) {
            winnerId = Objects.equals(duel.getUser1Id(), currentUserId) ? duel.getUser2Id() : duel.getUser1Id();
        }

        duel.setWinnerId(winnerId);
        duel.setStatus("ABANDONED");
        duel.setCompletedAt(LocalDateTime.now());

        if (winnerId != null) {
            User u1 = userRepository.findById(duel.getUser1Id()).orElse(null);
            User u2 = userRepository.findById(duel.getUser2Id()).orElse(null);
            if (u1 != null && u2 != null) {
                if (Objects.equals(winnerId, u1.getId())) {
                    applyElo(u1, u2, duel, 1.0);
                } else {
                    applyElo(u1, u2, duel, 0.0);
                }
            }
        }

        Duel saved = duelRepository.save(duel);
        return toDTOs(List.of(saved)).get(0);
    }

    @Transactional(readOnly = true)
    public List<DuelGameDTO> getGames() {
        return List.of(
                new DuelGameDTO("coding", "Coding Duel", "Solve the same coding problem faster and better.", List.of("beginner", "intermediate", "advanced"), true),
                new DuelGameDTO("typing", "Typing Test", "Type the same passage with maximum speed and accuracy.", List.of("easy", "medium", "hard"), true),
                new DuelGameDTO("quiz", "Quiz Battle", "Answer the same MCQs in less time.", List.of("easy", "medium", "hard"), true)
        );
    }

    @Transactional(readOnly = true)
    public DuelGameDTO getGameBySlug(String slug) {
        return getGames().stream()
                .filter(game -> game.getSlug().equalsIgnoreCase(slug))
                .findFirst()
                .orElseThrow(() -> new DuelNotFoundException("Game mode not found"));
    }

    @Transactional(readOnly = true)
    public List<DuelLeaderboardEntryDTO> getLeaderboard(String game, int limit) {
        String normalizedGame = game == null ? "all" : game.trim().toLowerCase(Locale.ROOT);
        List<User> users = userRepository.findAll();

        return users.stream()
                .map(user -> {
                    UserDuelStats stats = computeStatsForUser(user.getId(), normalizedGame);
                    return new DuelLeaderboardEntryDTO(
                            user.getId(),
                            user.getName(),
                            getRating(user),
                            stats.wins,
                            stats.losses,
                            stats.total
                    );
                })
                .sorted(Comparator.comparing(DuelLeaderboardEntryDTO::getRating).reversed()
                        .thenComparing(DuelLeaderboardEntryDTO::getWins, Comparator.reverseOrder()))
                .limit(limit)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DuelAchievementDTO> getAllAchievements() {
        return List.of(
                new DuelAchievementDTO("first_blood", "First Blood", "Win your first duel", false),
                new DuelAchievementDTO("ten_wins", "10 Wins", "Win 10 duels", false),
                new DuelAchievementDTO("coding_ninja", "Coding Ninja", "Win 5 coding duels", false),
                new DuelAchievementDTO("unstoppable", "Unstoppable", "Maintain a 5-win streak", false),
                new DuelAchievementDTO("elite_1500", "Elite 1500", "Reach rating 1500", false)
        );
    }

    @Transactional(readOnly = true)
    public List<DuelAchievementDTO> getUserAchievements(Long userId) {
        User user = requireUser(userId, "User not found");
        UserDuelStats allStats = computeStatsForUser(userId, "all");
        UserDuelStats codingStats = computeStatsForUser(userId, "coding");

        return List.of(
                new DuelAchievementDTO("first_blood", "First Blood", "Win your first duel", allStats.wins >= 1),
                new DuelAchievementDTO("ten_wins", "10 Wins", "Win 10 duels", allStats.wins >= 10),
                new DuelAchievementDTO("coding_ninja", "Coding Ninja", "Win 5 coding duels", codingStats.wins >= 5),
                new DuelAchievementDTO("unstoppable", "Unstoppable", "Maintain a 5-win streak", allStats.bestStreak >= 5),
                new DuelAchievementDTO("elite_1500", "Elite 1500", "Reach rating 1500", getRating(user) >= 1500)
        );
    }

    @Transactional
    public void handleAcceptedSubmission(Submission submission) {
        if (!"ACCEPTED".equalsIgnoreCase(submission.getStatus())) {
            return;
        }
        Long userId = submission.getUser().getId();
        Long problemId = submission.getProblem().getId();
        LocalDateTime submittedAt = submission.getSubmittedAt();

        List<Duel> active = duelRepository.findActiveByUserAndProblem(userId, problemId);
        for (Duel duel : active) {
            if (duel.getStartedAt() != null && submittedAt.isBefore(duel.getStartedAt())) {
                continue;
            }
            if (!"ACTIVE".equalsIgnoreCase(duel.getStatus())) {
                continue;
            }
            if (Objects.equals(duel.getUser1Id(), userId)) {
                duel.setPlayer1Score(100.0);
                duel.setPlayer1Completed(true);
            } else {
                duel.setPlayer2Score(100.0);
                duel.setPlayer2Completed(true);
            }

            if (Boolean.TRUE.equals(duel.getPlayer1Completed()) && Boolean.TRUE.equals(duel.getPlayer2Completed())) {
                finalizeDuelWithScores(duel);
            }
            duelRepository.save(duel);
        }
    }

    private void activateDuel(Duel duel) {
        duel.setStatus("ACTIVE");
        duel.setStartedAt(LocalDateTime.now());
        duel.setInviteCode(null);
        duel.setPlayer1Completed(false);
        duel.setPlayer2Completed(false);

        if ("CODING".equalsIgnoreCase(duel.getMode())) {
            List<Problem> problems = problemRepository.findAll();
            if (problems.isEmpty()) {
                throw new IllegalStateException("No problems available for coding duel");
            }
            Problem problem = problems.get(random.nextInt(problems.size()));
            duel.setProblemId(problem.getId());
        } else {
            duel.setProblemId(0L);
        }
    }

    private void finalizeDuelWithScores(Duel duel) {
        double p1 = duel.getPlayer1Score() == null ? 0d : duel.getPlayer1Score();
        double p2 = duel.getPlayer2Score() == null ? 0d : duel.getPlayer2Score();

        User user1 = userRepository.findById(duel.getUser1Id()).orElse(null);
        User user2 = userRepository.findById(duel.getUser2Id()).orElse(null);

        duel.setStatus("COMPLETED");
        duel.setCompletedAt(LocalDateTime.now());

        if (p1 > p2) {
            duel.setWinnerId(duel.getUser1Id());
            if (user1 != null && user2 != null) {
                applyElo(user1, user2, duel, 1.0);
            }
            return;
        }
        if (p2 > p1) {
            duel.setWinnerId(duel.getUser2Id());
            if (user1 != null && user2 != null) {
                applyElo(user1, user2, duel, 0.0);
            }
            return;
        }

        duel.setWinnerId(null);
        if (user1 != null && user2 != null) {
            applyElo(user1, user2, duel, 0.5);
        }
    }

    private void applyElo(User user1, User user2, Duel duel, double scoreUser1) {
        int rating1Before = getRating(user1);
        int rating2Before = getRating(user2);

        double expected1 = 1.0 / (1.0 + Math.pow(10, (rating2Before - rating1Before) / 400.0));
        double expected2 = 1.0 - expected1;
        double scoreUser2 = 1.0 - scoreUser1;

        int rating1After = (int) Math.round(rating1Before + ELO_K * (scoreUser1 - expected1));
        int rating2After = (int) Math.round(rating2Before + ELO_K * (scoreUser2 - expected2));

        user1.setRating(rating1After);
        user2.setRating(rating2After);
        userRepository.save(user1);
        userRepository.save(user2);

        duel.setPlayer1RatingBefore(rating1Before);
        duel.setPlayer2RatingBefore(rating2Before);
        duel.setPlayer1RatingAfter(rating1After);
        duel.setPlayer2RatingAfter(rating2After);
    }

    private int getRating(User user) {
        if (user.getRating() == null) {
            user.setRating(DEFAULT_RATING);
        }
        return user.getRating();
    }

    private String normalizeMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return "CODING";
        }
        String normalized = mode.trim().toUpperCase(Locale.ROOT);
        if ("CODE".equals(normalized)) {
            return "CODING";
        }
        if (!List.of("CODING", "TYPING", "QUIZ").contains(normalized)) {
            return "CODING";
        }
        return normalized;
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return "ANY";
        }
        return difficulty.trim().toUpperCase(Locale.ROOT);
    }

    private int normalizeDuration(Integer durationSeconds) {
        if (durationSeconds == null || durationSeconds <= 0) {
            return 300;
        }
        return Math.max(60, Math.min(durationSeconds, 1800));
    }

    private String generateInviteCode() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
    }

    private Duel requireDuel(Long duelId) {
        return duelRepository.findById(duelId)
                .orElseThrow(() -> new DuelNotFoundException("Duel not found"));
    }

    private User requireUser(Long userId, String message) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new DuelNotFoundException(message));
    }

    private UserDuelStats computeStatsForUser(Long userId, String game) {
        List<Duel> duels = duelRepository.findByUser1IdOrUser2IdOrderByCreatedAtDesc(userId, userId).stream()
                .filter(d -> "COMPLETED".equalsIgnoreCase(d.getStatus()) || "ABANDONED".equalsIgnoreCase(d.getStatus()))
                .filter(d -> "all".equalsIgnoreCase(game) || game.equalsIgnoreCase(d.getMode()) ||
                        ("coding".equalsIgnoreCase(game) && "CODE".equalsIgnoreCase(d.getMode())))
                .sorted(Comparator.comparing(d -> Optional.ofNullable(d.getCompletedAt()).orElse(d.getCreatedAt())))
                .toList();

        long wins = 0;
        long losses = 0;
        long draws = 0;
        int streak = 0;
        int bestStreak = 0;

        for (Duel duel : duels) {
            if (duel.getWinnerId() == null) {
                draws++;
                streak = 0;
            } else if (Objects.equals(duel.getWinnerId(), userId)) {
                wins++;
                streak++;
                bestStreak = Math.max(bestStreak, streak);
            } else {
                losses++;
                streak = 0;
            }
        }

        return new UserDuelStats(duels.size(), wins, losses, draws, bestStreak);
    }

    private List<DuelDTO> toDTOs(List<Duel> duels) {
        List<Long> userIds = duels.stream()
                .flatMap(d -> Stream.of(d.getUser1Id(), d.getUser2Id(), d.getWinnerId()))
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();
        List<Long> problemIds = duels.stream()
                .map(Duel::getProblemId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .toList();

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, Problem> problemMap = problemRepository.findAllById(problemIds).stream()
                .collect(Collectors.toMap(Problem::getId, p -> p));

        return duels.stream()
                .map(d -> toDTO(d, userMap, problemMap.get(d.getProblemId())))
                .toList();
    }

    private DuelDTO toDTO(Duel duel, Map<Long, User> userMap, Problem problem) {
        User challenger = userMap.get(duel.getUser1Id());
        User opponent = duel.getUser2Id() != null && duel.getUser2Id() > 0 ? userMap.get(duel.getUser2Id()) : null;
        User winner = duel.getWinnerId() == null ? null : userMap.get(duel.getWinnerId());

        Long remainingSeconds = null;
        if ("ACTIVE".equalsIgnoreCase(duel.getStatus()) && duel.getStartedAt() != null && duel.getDurationSeconds() != null) {
            long elapsed = ChronoUnit.SECONDS.between(duel.getStartedAt(), LocalDateTime.now());
            remainingSeconds = Math.max(0, duel.getDurationSeconds() - elapsed);
        }

        return DuelDTO.builder()
                .id(duel.getId())
                .challengerId(duel.getUser1Id())
                .challengerName(challenger != null ? challenger.getName() : "Unknown")
                .opponentId(duel.getUser2Id() != null && duel.getUser2Id() > 0 ? duel.getUser2Id() : null)
                .opponentName(opponent != null ? opponent.getName() : "Waiting for opponent")
                .status(duel.getStatus())
                .problemId(duel.getProblemId() != null && duel.getProblemId() > 0 ? duel.getProblemId() : null)
                .problemTitle(problem != null ? problem.getTitle() : null)
                .mode(duel.getMode())
                .difficulty(duel.getDifficulty())
                .durationSeconds(duel.getDurationSeconds())
                .inviteCode(duel.getInviteCode())
                .player1Score(duel.getPlayer1Score())
                .player2Score(duel.getPlayer2Score())
                .player1Completed(duel.getPlayer1Completed())
                .player2Completed(duel.getPlayer2Completed())
                .player1RatingBefore(duel.getPlayer1RatingBefore())
                .player2RatingBefore(duel.getPlayer2RatingBefore())
                .player1RatingAfter(duel.getPlayer1RatingAfter())
                .player2RatingAfter(duel.getPlayer2RatingAfter())
                .remainingSeconds(remainingSeconds)
                .winnerId(duel.getWinnerId())
                .winner(winner != null ? winner.getName() : null)
                .createdAt(duel.getCreatedAt())
                .startedAt(duel.getStartedAt())
                .completedAt(duel.getCompletedAt())
                .build();
    }

    private static class UserDuelStats {
        final long total;
        final long wins;
        final long losses;
        final long draws;
        final int bestStreak;

        UserDuelStats(long total, long wins, long losses, long draws, int bestStreak) {
            this.total = total;
            this.wins = wins;
            this.losses = losses;
            this.draws = draws;
            this.bestStreak = bestStreak;
        }
    }
}
