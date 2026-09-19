package com.collegecontest.repository;

import com.collegecontest.dto.ContestFirstSolverDTO;
import com.collegecontest.dto.LeaderboardEntry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class LeaderboardSnapshotRepository {

    private final JdbcTemplate jdbcTemplate;

    public LeaderboardSnapshotRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean hasFreshContestSnapshot(Long contestId, int freshnessSeconds) {
        if (contestId == null) {
            return false;
        }
        LocalDateTime latest = jdbcTemplate.queryForObject(
                "SELECT MAX(snapshot_at) FROM contest_leaderboard_snapshot WHERE contest_id = ?",
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp(1);
                    return ts == null ? null : ts.toLocalDateTime();
                },
                contestId);
        if (latest == null) {
            return false;
        }
        return latest.isAfter(LocalDateTime.now().minusSeconds(Math.max(10, freshnessSeconds)));
    }

    public boolean hasFreshFirstSolverSnapshot(Long contestId, int freshnessSeconds) {
        if (contestId == null) {
            return false;
        }
        LocalDateTime latest = jdbcTemplate.queryForObject(
                "SELECT MAX(snapshot_at) FROM contest_first_solver_snapshot WHERE contest_id = ?",
                (rs, rowNum) -> {
                    Timestamp ts = rs.getTimestamp(1);
                    return ts == null ? null : ts.toLocalDateTime();
                },
                contestId);
        if (latest == null) {
            return false;
        }
        return latest.isAfter(LocalDateTime.now().minusSeconds(Math.max(10, freshnessSeconds)));
    }

    public List<LeaderboardEntry> getContestSnapshot(Long contestId) {
        return jdbcTemplate.query(
                """
                        SELECT rank_position, user_id, display_name, college, solved, total_points, first_accepted_at
                        FROM contest_leaderboard_snapshot
                        WHERE contest_id = ?
                        ORDER BY rank_position ASC
                        """,
                (rs, rowNum) -> new LeaderboardEntry(
                        rs.getInt("rank_position"),
                        rs.getLong("user_id"),
                        rs.getString("display_name"),
                        rs.getString("college"),
                        rs.getInt("solved"),
                        rs.getInt("total_points"),
                        rs.getTimestamp("first_accepted_at") == null
                                ? null
                                : rs.getTimestamp("first_accepted_at").toLocalDateTime()),
                contestId);
    }

    public List<ContestFirstSolverDTO> getFirstSolverSnapshot(Long contestId) {
        return jdbcTemplate.query(
                """
                        SELECT problem_id, problem_title, first_solver_user_id, first_solver_name, first_solved_at
                        FROM contest_first_solver_snapshot
                        WHERE contest_id = ?
                        ORDER BY problem_id ASC
                        """,
                (rs, rowNum) -> new ContestFirstSolverDTO(
                        rs.getLong("problem_id"),
                        rs.getString("problem_title"),
                        rs.getObject("first_solver_user_id") == null ? null : rs.getLong("first_solver_user_id"),
                        rs.getString("first_solver_name"),
                        rs.getTimestamp("first_solved_at") == null
                                ? null
                                : rs.getTimestamp("first_solved_at").toLocalDateTime()),
                contestId);
    }

    @Transactional
    public void refreshContestSnapshot(Long contestId) {
        if (contestId == null) {
            return;
        }
        jdbcTemplate.update("DELETE FROM contest_leaderboard_snapshot WHERE contest_id = ?", contestId);
        jdbcTemplate.update(
                """
                        INSERT INTO contest_leaderboard_snapshot (
                            contest_id,
                            user_id,
                            display_name,
                            college,
                            solved,
                            total_points,
                            first_accepted_at,
                            rank_position,
                            snapshot_at
                        )
                        SELECT
                            grouped.contest_id,
                            grouped.user_id,
                            grouped.display_name,
                            grouped.college,
                            grouped.solved,
                            grouped.total_points,
                            grouped.first_accepted_at,
                            ROW_NUMBER() OVER (
                                ORDER BY grouped.total_points DESC,
                                         grouped.solved DESC,
                                         grouped.first_accepted_at ASC,
                                         grouped.display_name ASC
                            ) AS rank_position,
                            UTC_TIMESTAMP()
                        FROM (
                            SELECT
                                p.contest_id AS contest_id,
                                s.user_id AS user_id,
                                COALESCE(NULLIF(TRIM(u.username), ''), u.name) AS display_name,
                                u.college AS college,
                                COUNT(DISTINCT s.problem_id) AS solved,
                                COALESCE(SUM(p.points), 0) AS total_points,
                                MIN(s.submitted_at) AS first_accepted_at
                            FROM submissions s
                            JOIN problems p ON p.id = s.problem_id
                            JOIN users u ON u.id = s.user_id
                            WHERE UPPER(s.status) = 'ACCEPTED'
                              AND p.contest_id = ?
                            GROUP BY
                                p.contest_id,
                                s.user_id,
                                COALESCE(NULLIF(TRIM(u.username), ''), u.name),
                                u.college
                        ) grouped
                        """,
                contestId);
    }

    @Transactional
    public void refreshFirstSolverSnapshot(Long contestId) {
        if (contestId == null) {
            return;
        }
        jdbcTemplate.update("DELETE FROM contest_first_solver_snapshot WHERE contest_id = ?", contestId);
        jdbcTemplate.update(
                """
                        INSERT INTO contest_first_solver_snapshot (
                            contest_id,
                            problem_id,
                            problem_title,
                            first_solver_user_id,
                            first_solver_name,
                            first_solved_at,
                            snapshot_at
                        )
                        SELECT
                            p.contest_id,
                            p.id AS problem_id,
                            p.title AS problem_title,
                            fs.user_id AS first_solver_user_id,
                            u.name AS first_solver_name,
                            fs.submitted_at AS first_solved_at,
                            UTC_TIMESTAMP()
                        FROM problems p
                        LEFT JOIN (
                            SELECT
                                s.problem_id,
                                s.user_id,
                                s.submitted_at,
                                ROW_NUMBER() OVER (PARTITION BY s.problem_id ORDER BY s.submitted_at ASC, s.id ASC) AS rn
                            FROM submissions s
                            WHERE UPPER(s.status) = 'ACCEPTED'
                        ) fs ON fs.problem_id = p.id AND fs.rn = 1
                        LEFT JOIN users u ON u.id = fs.user_id
                        WHERE p.contest_id = ?
                        """,
                contestId);
    }

    public List<Long> findHotContestIds(int lookbackDays, int limit) {
        LocalDateTime threshold = LocalDateTime.now().minusDays(Math.max(1, lookbackDays));
        return jdbcTemplate.query(
                """
                        SELECT c.id
                        FROM contests c
                        WHERE (c.mode IS NULL OR UPPER(c.mode) <> 'PROBLEM_SET')
                          AND c.end_time >= ?
                        ORDER BY c.end_time DESC
                        LIMIT ?
                        """,
                (rs, rowNum) -> rs.getLong("id"),
                threshold,
                Math.max(1, limit));
    }
}

