package com.collegecontest.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class SubmissionHistoryArchiverService {
    private static final Logger logger = LoggerFactory.getLogger(SubmissionHistoryArchiverService.class);

    private final JdbcTemplate jdbcTemplate;

    @Value("${submission.history.archive.enabled:false}")
    private boolean archiveEnabled;
    @Value("${submission.history.archive.retention-days:90}")
    private int retentionDays;
    @Value("${submission.history.archive.batch-size:2500}")
    private int batchSize;
    @Value("${submission.history.archive.max-batches-per-run:4}")
    private int maxBatchesPerRun;

    public SubmissionHistoryArchiverService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Scheduled(cron = "${submission.history.archive.cron:0 20 3 * * ?}")
    @Transactional
    public void archiveOldSubmissions() {
        if (!archiveEnabled) {
            return;
        }
        int safeRetentionDays = Math.max(30, retentionDays);
        int safeBatchSize = Math.max(200, Math.min(batchSize, 20000));
        int safeMaxBatches = Math.max(1, Math.min(maxBatchesPerRun, 20));
        LocalDateTime cutoff = LocalDateTime.now().minusDays(safeRetentionDays);

        int totalMoved = 0;
        for (int batch = 0; batch < safeMaxBatches; batch++) {
            int moved = archiveBatch(cutoff, safeBatchSize);
            totalMoved += moved;
            if (moved < safeBatchSize) {
                break;
            }
        }

        if (totalMoved > 0) {
            logger.info("Archived {} submission rows to submission_history (retentionDays={}, batchSize={}).",
                    totalMoved, safeRetentionDays, safeBatchSize);
        }
    }

    private int archiveBatch(LocalDateTime cutoff, int limit) {
        List<Long> ids = jdbcTemplate.queryForList(
                """
                        SELECT s.id
                        FROM submissions s
                        WHERE s.submitted_at < ?
                        ORDER BY s.submitted_at ASC
                        LIMIT ?
                        """,
                Long.class,
                cutoff,
                limit);

        if (ids == null || ids.isEmpty()) {
            return 0;
        }

        String placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        List<Object> args = new ArrayList<>(ids);

        jdbcTemplate.update(
                """
                        INSERT IGNORE INTO submission_history (
                            id,
                            user_id,
                            problem_id,
                            code,
                            language,
                            status,
                            output,
                            judge_submission_id,
                            execution_time,
                            time_taken_seconds,
                            upset_multiplier,
                            submitted_at,
                            readability_score,
                            time_complexity,
                            space_complexity,
                            archived_at
                        )
                        SELECT
                            s.id,
                            s.user_id,
                            s.problem_id,
                            s.code,
                            s.language,
                            s.status,
                            s.output,
                            s.judge_submission_id,
                            s.execution_time,
                            s.time_taken_seconds,
                            s.upset_multiplier,
                            s.submitted_at,
                            s.readability_score,
                            s.time_complexity,
                            s.space_complexity,
                            CURRENT_TIMESTAMP
                        FROM submissions s
                        WHERE s.id IN (%s)
                        """.formatted(placeholders),
                args.toArray());

        int deleted = jdbcTemplate.update(
                "DELETE FROM submissions WHERE id IN (%s)".formatted(placeholders),
                args.toArray());

        if (deleted < ids.size()) {
            logger.warn("Submission archiver deleted {} of {} selected rows. Next cycle will reconcile.", deleted, ids.size());
        }
        return Math.max(0, deleted);
    }
}

