package com.collegecontest.service;

import com.collegecontest.dto.ContestFirstSolverDTO;
import com.collegecontest.dto.LeaderboardFilterParams;
import com.collegecontest.dto.LeaderboardEntry;
import com.collegecontest.dto.LeaderboardPageResponse;
import com.collegecontest.dto.LeaderboardTimeRange;
import com.collegecontest.repository.LeaderboardRepository;
import com.collegecontest.repository.LeaderboardSnapshotRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class LeaderboardService {
    private static final Logger logger = LoggerFactory.getLogger(LeaderboardService.class);

    @Autowired
    private LeaderboardRepository leaderboardRepository;
    @Autowired(required = false)
    private LeaderboardSnapshotRepository snapshotRepository;

    @Value("${leaderboard.snapshot.enabled:true}")
    private boolean snapshotEnabled;
    @Value("${leaderboard.snapshot.contest-freshness-seconds:90}")
    private int contestSnapshotFreshnessSeconds;
    @Value("${leaderboard.snapshot.first-solver-freshness-seconds:180}")
    private int firstSolverSnapshotFreshnessSeconds;
    @Value("${leaderboard.snapshot.refresh-hot-contests-enabled:true}")
    private boolean refreshHotContestsEnabled;
    @Value("${leaderboard.snapshot.refresh-hot-contests-lookback-days:30}")
    private int refreshLookbackDays;
    @Value("${leaderboard.snapshot.refresh-hot-contests-limit:80}")
    private int refreshHotContestLimit;

    @Cacheable(
            value = "leaderboardGlobalFiltered",
            key = "#page + ':' + #size + ':' + (#filters.region ?: '') + ':' + (#filters.country ?: '') + ':' + (#filters.college ?: '') + ':' + (#filters.department ?: '') + ':' + (#filters.mode ?: '') + ':' + (#filters.difficulty ?: '') + ':' + (#filters.timeRange != null ? #filters.timeRange.name() : 'ALL_TIME')",
            sync = true)
    public LeaderboardPageResponse getGlobalLeaderboard(LeaderboardFilterParams filters, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));

        List<Object[]> rows = leaderboardRepository.getGlobalLeaderboard(filters, safePage, safeSize);
        long total = leaderboardRepository.countGlobalLeaderboard(filters);

        List<LeaderboardEntry> entries = new ArrayList<>();
        int rank = safePage * safeSize + 1;

        for (Object[] row : rows) {
            Long userId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String name = row[1] != null ? row[1].toString() : null;
            String college = row[2] != null ? row[2].toString() : null;
            int solved = toInt(row[3]);
            int totalPoints = toInt(row[4]);
            LocalDateTime firstAcceptedAt = toLocalDateTime(row[5]);
            entries.add(new LeaderboardEntry(rank++, userId, name, college, solved, totalPoints, firstAcceptedAt));
        }

        return LeaderboardPageResponse.builder()
                .content(entries)
                .total(total)
                .page(safePage)
                .size(safeSize)
                .appliedFilters(toAppliedFilters(filters))
                .build();
    }

    public List<LeaderboardEntry> getContestLeaderboard(Long contestId) {
        if (contestId == null) {
            return List.of();
        }
        if (snapshotEnabled && snapshotRepository != null) {
            try {
                if (!snapshotRepository.hasFreshContestSnapshot(contestId, contestSnapshotFreshnessSeconds)) {
                    snapshotRepository.refreshContestSnapshot(contestId);
                }
                List<LeaderboardEntry> snapshot = snapshotRepository.getContestSnapshot(contestId);
                if (!snapshot.isEmpty()) {
                    return snapshot;
                }
            } catch (Exception ex) {
                logger.warn("Contest snapshot fallback to live query for contestId={}: {}", contestId, ex.getMessage());
            }
        }

        List<Object[]> rows = leaderboardRepository.getContestLeaderboard(contestId);
        List<LeaderboardEntry> entries = new ArrayList<>();
        int rank = 1;
        for (Object[] row : rows) {
            Long userId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String name = row[1] != null ? row[1].toString() : null;
            String college = row[2] != null ? row[2].toString() : null;

            int solved = 0;
            int totalPoints = 0;
            LocalDateTime firstAcceptedAt = null;

            if (row[3] instanceof BigInteger) {
                solved = ((BigInteger) row[3]).intValue();
            } else if (row[3] instanceof Number) {
                solved = ((Number) row[3]).intValue();
            }

            if (row[4] instanceof BigDecimal) {
                totalPoints = ((BigDecimal) row[4]).intValue();
            } else if (row[4] instanceof Number) {
                totalPoints = ((Number) row[4]).intValue();
            }

            if (row.length > 5 && row[5] instanceof Timestamp) {
                firstAcceptedAt = ((Timestamp) row[5]).toLocalDateTime();
            } else if (row.length > 5 && row[5] instanceof LocalDateTime) {
                firstAcceptedAt = (LocalDateTime) row[5];
            }

            entries.add(new LeaderboardEntry(rank++, userId, name, college, solved, totalPoints, firstAcceptedAt));
        }

        // Ensure sorting by totalPoints desc, solved desc
        entries.sort(Comparator.comparingInt(LeaderboardEntry::getTotalPoints).reversed()
                .thenComparing(Comparator.comparingInt(LeaderboardEntry::getSolved).reversed())
                .thenComparing(LeaderboardEntry::getFirstAcceptedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())));

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        if (snapshotEnabled && snapshotRepository != null) {
            try {
                snapshotRepository.refreshContestSnapshot(contestId);
            } catch (Exception ex) {
                logger.warn("Failed to refresh contest snapshot after live query for contestId={}: {}", contestId, ex.getMessage());
            }
        }

        return entries;
    }

    public List<ContestFirstSolverDTO> getContestProblemFirstSolvers(Long contestId) {
        if (contestId == null) {
            return List.of();
        }
        if (snapshotEnabled && snapshotRepository != null) {
            try {
                if (!snapshotRepository.hasFreshFirstSolverSnapshot(contestId, firstSolverSnapshotFreshnessSeconds)) {
                    snapshotRepository.refreshFirstSolverSnapshot(contestId);
                }
                List<ContestFirstSolverDTO> snapshot = snapshotRepository.getFirstSolverSnapshot(contestId);
                if (!snapshot.isEmpty()) {
                    return snapshot;
                }
            } catch (Exception ex) {
                logger.warn("First-solver snapshot fallback to live query for contestId={}: {}", contestId, ex.getMessage());
            }
        }

        List<Object[]> rows = leaderboardRepository.getContestProblemFirstSolvers(contestId);
        List<ContestFirstSolverDTO> firstSolvers = new ArrayList<>();

        for (Object[] row : rows) {
            Long problemId = row[0] != null ? ((Number) row[0]).longValue() : null;
            String problemTitle = row[1] != null ? row[1].toString() : null;
            Long firstSolverUserId = row[2] != null ? ((Number) row[2]).longValue() : null;
            String firstSolverName = row[3] != null ? row[3].toString() : null;
            LocalDateTime firstSolvedAt = null;

            if (row[4] instanceof Timestamp) {
                firstSolvedAt = ((Timestamp) row[4]).toLocalDateTime();
            } else if (row[4] instanceof LocalDateTime) {
                firstSolvedAt = (LocalDateTime) row[4];
            }

            firstSolvers.add(new ContestFirstSolverDTO(problemId, problemTitle, firstSolverUserId, firstSolverName, firstSolvedAt));
        }

        if (snapshotEnabled && snapshotRepository != null) {
            try {
                snapshotRepository.refreshFirstSolverSnapshot(contestId);
            } catch (Exception ex) {
                logger.warn("Failed to refresh first-solver snapshot after live query for contestId={}: {}", contestId, ex.getMessage());
            }
        }

        return firstSolvers;
    }

    @Scheduled(fixedDelayString = "${leaderboard.snapshot.refresh-hot-contests-fixed-delay-ms:180000}")
    public void refreshHotContestSnapshots() {
        if (!snapshotEnabled || !refreshHotContestsEnabled || snapshotRepository == null) {
            return;
        }
        List<Long> contestIds;
        try {
            contestIds = snapshotRepository.findHotContestIds(refreshLookbackDays, refreshHotContestLimit);
        } catch (Exception ex) {
            logger.warn("Unable to fetch hot contests for leaderboard snapshot refresh: {}", ex.getMessage());
            return;
        }
        for (Long contestId : contestIds) {
            try {
                snapshotRepository.refreshContestSnapshot(contestId);
                snapshotRepository.refreshFirstSolverSnapshot(contestId);
            } catch (Exception ex) {
                logger.warn("Failed snapshot refresh for contestId={}: {}", contestId, ex.getMessage());
            }
        }
    }

    private int toInt(Object value) {
        if (value instanceof BigInteger) {
            return ((BigInteger) value).intValue();
        }
        if (value instanceof BigDecimal) {
            return ((BigDecimal) value).intValue();
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp) {
            return ((Timestamp) value).toLocalDateTime();
        }
        if (value instanceof LocalDateTime) {
            return (LocalDateTime) value;
        }
        return null;
    }

    private Map<String, String> toAppliedFilters(LeaderboardFilterParams filters) {
        Map<String, String> applied = new LinkedHashMap<>();
        addIfPresent(applied, "region", filters.getRegion());
        addIfPresent(applied, "country", filters.getCountry());
        addIfPresent(applied, "college", filters.getCollege());
        addIfPresent(applied, "department", filters.getDepartment());
        addIfPresent(applied, "mode", filters.getMode());
        addIfPresent(applied, "difficulty", filters.getDifficulty());
        LeaderboardTimeRange range = filters.getTimeRange() == null ? LeaderboardTimeRange.ALL_TIME : filters.getTimeRange();
        applied.put("timeRange", switch (range) {
            case TODAY -> "today";
            case WEEK -> "week";
            case ALL_TIME -> "all-time";
        });
        return applied;
    }

    private void addIfPresent(Map<String, String> map, String key, String value) {
        if (value == null) {
            return;
        }
        String normalized = value.trim();
        if (!normalized.isEmpty()) {
            map.put(key, normalized);
        }
    }
}
