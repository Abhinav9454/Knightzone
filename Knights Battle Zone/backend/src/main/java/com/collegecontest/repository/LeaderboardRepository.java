package com.collegecontest.repository;

import com.collegecontest.dto.LeaderboardFilterParams;
import com.collegecontest.dto.LeaderboardTimeRange;
import org.springframework.stereotype.Repository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Repository
public class LeaderboardRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Object[]> getContestLeaderboard(Long contestId) {
        String query = "SELECT u.id, u.name, u.college, " +
                "       COUNT(*) AS solved, " +
                "       COALESCE(SUM(p.points), 0) AS totalPoints, " +
                "       MIN(fp.first_accepted_at) AS firstAcceptedAt " +
                "FROM users u " +
                "JOIN (" +
                "   SELECT s.user_id, s.problem_id, MIN(s.submitted_at) AS first_accepted_at " +
                "   FROM submissions s " +
                "   JOIN problems p2 ON p2.id = s.problem_id " +
                "   WHERE p2.contest_id = :contestId AND s.status = 'ACCEPTED' " +
                "   GROUP BY s.user_id, s.problem_id " +
                ") fp ON fp.user_id = u.id " +
                "JOIN problems p ON p.id = fp.problem_id " +
                "GROUP BY u.id, u.name, u.college " +
                "ORDER BY totalPoints DESC, solved DESC, firstAcceptedAt ASC";

        Query nativeQuery = entityManager.createNativeQuery(query);
        nativeQuery.setParameter("contestId", contestId);

        @SuppressWarnings("unchecked")
        List<Object[]> results = nativeQuery.getResultList();
        return results;
    }

    public List<Object[]> getGlobalLeaderboard(LeaderboardFilterParams filters, int page, int size) {
        QueryContext queryContext = buildGlobalLeaderboardQuery(filters, false);
        String sql = queryContext.sql
                + " ORDER BY totalPoints DESC, solved DESC, firstAcceptedAt ASC, displayName ASC"
                + " LIMIT :limit OFFSET :offset";

        Query query = entityManager.createNativeQuery(sql);
        queryContext.params.forEach(query::setParameter);
        query.setParameter("limit", size);
        query.setParameter("offset", Math.max(0, page) * Math.max(1, size));

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        return rows;
    }

    public long countGlobalLeaderboard(LeaderboardFilterParams filters) {
        QueryContext queryContext = buildGlobalLeaderboardQuery(filters, true);
        Query query = entityManager.createNativeQuery(queryContext.sql);
        queryContext.params.forEach(query::setParameter);
        Object raw = query.getSingleResult();
        if (raw instanceof Number number) {
            return number.longValue();
        }
        return Long.parseLong(String.valueOf(raw));
    }

    public List<Object[]> getContestProblemFirstSolvers(Long contestId) {
        String query = "SELECT p.id, p.title, " +
                "       fs.user_id AS firstSolverUserId, " +
                "       u.name AS firstSolverName, " +
                "       fs.submitted_at AS firstSolvedAt " +
                "FROM problems p " +
                "LEFT JOIN (" +
                "   SELECT s.problem_id, s.user_id, s.submitted_at, " +
                "          ROW_NUMBER() OVER (PARTITION BY s.problem_id ORDER BY s.submitted_at ASC, s.id ASC) AS rn " +
                "   FROM submissions s " +
                "   WHERE s.status = 'ACCEPTED' " +
                ") fs ON fs.problem_id = p.id AND fs.rn = 1 " +
                "LEFT JOIN users u ON u.id = fs.user_id " +
                "WHERE p.contest_id = :contestId " +
                "ORDER BY p.id ASC";

        Query nativeQuery = entityManager.createNativeQuery(query);
        nativeQuery.setParameter("contestId", contestId);

        @SuppressWarnings("unchecked")
        List<Object[]> results = nativeQuery.getResultList();
        return results;
    }

    private QueryContext buildGlobalLeaderboardQuery(LeaderboardFilterParams filters, boolean countOnly) {
        Map<String, Object> params = new LinkedHashMap<>();
        StringBuilder base = new StringBuilder();

        if (countOnly) {
            base.append("SELECT COUNT(*) FROM (");
            base.append(" SELECT u.id ");
        } else {
            base.append("SELECT u.id, COALESCE(NULLIF(TRIM(u.username), ''), u.name) AS displayName, u.college, ");
            base.append("       COUNT(DISTINCT s.problem_id) AS solved, ");
            base.append("       COALESCE(SUM(p.points), 0) AS totalPoints, ");
            base.append("       MIN(s.submitted_at) AS firstAcceptedAt ");
        }

        base.append(" FROM submissions s ");
        base.append(" JOIN users u ON u.id = s.user_id ");
        base.append(" JOIN problems p ON p.id = s.problem_id ");
        base.append(" JOIN contests c ON c.id = p.contest_id ");
        base.append(" WHERE UPPER(s.status) = 'ACCEPTED' ");

        appendContains(base, params, "u.location", filters.getRegion(), "region");
        appendContains(base, params, "u.location", filters.getCountry(), "country");
        appendContains(base, params, "u.college", filters.getCollege(), "college");
        appendContains(base, params, "u.department", filters.getDepartment(), "department");
        appendEquals(base, params, "c.mode", filters.getMode(), "mode");
        appendEquals(base, params, "p.difficulty", filters.getDifficulty(), "difficulty");
        appendTimeRange(base, params, filters.getTimeRange());

        base.append(" GROUP BY u.id, COALESCE(NULLIF(TRIM(u.username), ''), u.name), u.college ");

        if (countOnly) {
            base.append(") ranked_users");
        }

        return new QueryContext(base.toString(), params);
    }

    private void appendContains(StringBuilder query, Map<String, Object> params, String column, String rawValue, String paramName) {
        if (rawValue == null || rawValue.isBlank()) {
            return;
        }
        query.append(" AND LOWER(").append(column).append(") LIKE :").append(paramName);
        params.put(paramName, "%" + rawValue.trim().toLowerCase() + "%");
    }

    private void appendEquals(StringBuilder query, Map<String, Object> params, String column, String rawValue, String paramName) {
        if (rawValue == null || rawValue.isBlank() || "all".equalsIgnoreCase(rawValue.trim())) {
            return;
        }
        query.append(" AND UPPER(").append(column).append(") = :").append(paramName);
        params.put(paramName, rawValue.trim().toUpperCase());
    }

    private void appendTimeRange(StringBuilder query, Map<String, Object> params, LeaderboardTimeRange timeRange) {
        LeaderboardTimeRange resolvedRange = timeRange == null ? LeaderboardTimeRange.ALL_TIME : timeRange;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = switch (resolvedRange) {
            case TODAY -> now.toLocalDate().atStartOfDay();
            case WEEK -> now.minusDays(7);
            case ALL_TIME -> null;
        };

        if (threshold != null) {
            query.append(" AND s.submitted_at >= :startTime ");
            params.put("startTime", threshold);
        }
    }

    private record QueryContext(String sql, Map<String, Object> params) {}
}
