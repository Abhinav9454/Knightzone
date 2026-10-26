package com.collegecontest.problemset.service;

import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.exception.BadRequestException;
import com.collegecontest.exception.ResourceNotFoundException;
import com.collegecontest.model.Contest;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.problemset.dto.ProblemSetPageResponse;
import com.collegecontest.problemset.dto.ProblemSetUpsertRequest;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class ProblemSetService {

    public static final String CORE_PROBLEM_SET_TITLE = "Coding Core Problem Set (100)";
    private static final int CORE_PROBLEM_SET_DURATION_MINUTES = 5_256_000;
    private static final String CORE_PROBLEM_SET_DESCRIPTION = "Structured large problem set for coding practice and interview preparation.";

    private final ProblemRepository problemRepository;
    private final ContestRepository contestRepository;
    private final UserRepository userRepository;

    public ProblemSetService(
            ProblemRepository problemRepository,
            ContestRepository contestRepository,
            UserRepository userRepository) {
        this.problemRepository = problemRepository;
        this.contestRepository = contestRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProblemSetPageResponse getProblemSetPage(String query, String difficulty, int page, int size) {
        Contest contest = resolveProblemSetContest();
        String normalizedQuery = normalizeQuery(query);
        String normalizedDifficulty = normalizeDifficulty(difficulty);

        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Page<Problem> result = problemRepository.findProblemSetPage(
                contest.getId(),
                normalizedDifficulty,
                normalizedQuery,
                PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "id")));

        List<ProblemDTO> content = result.getContent().stream().map(this::toDto).toList();
        return new ProblemSetPageResponse(
                content,
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize(),
                normalizedDifficulty,
                normalizedQuery);
    }

    @Transactional(readOnly = true)
    public ProblemDTO getProblemInSet(Long problemId) {
        Contest contest = resolveProblemSetContest();
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + problemId));
        if (problem.getContest() == null || !contest.getId().equals(problem.getContest().getId())) {
            throw new ResourceNotFoundException("Problem does not belong to coding problem set: " + problemId);
        }
        return toDto(problem);
    }

    @Transactional
    public ProblemDTO createProblem(ProblemSetUpsertRequest request) {
        Contest contest = resolveProblemSetContest();
        Problem problem = new Problem();
        applyRequest(problem, request, contest);
        problem.setDifficultyWeight(resolveDifficultyWeight(problem.getDifficulty()));
        return toDto(problemRepository.save(problem));
    }

    @Transactional
    public ProblemDTO updateProblem(Long problemId, ProblemSetUpsertRequest request) {
        Contest contest = resolveProblemSetContest();
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + problemId));

        if (problem.getContest() == null || !contest.getId().equals(problem.getContest().getId())) {
            throw new ResourceNotFoundException("Problem does not belong to coding problem set: " + problemId);
        }

        applyRequest(problem, request, contest);
        problem.setDifficultyWeight(resolveDifficultyWeight(problem.getDifficulty()));
        return toDto(problemRepository.save(problem));
    }

    @Transactional
    public void deleteProblem(Long problemId) {
        Contest contest = resolveProblemSetContest();
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ResourceNotFoundException("Problem not found with id: " + problemId));
        if (problem.getContest() == null || !contest.getId().equals(problem.getContest().getId())) {
            throw new ResourceNotFoundException("Problem does not belong to coding problem set: " + problemId);
        }
        problemRepository.delete(problem);
    }

    @Transactional(readOnly = true)
    public Long getProblemSetContestId() {
        return resolveProblemSetContest().getId();
    }

    private void applyRequest(Problem problem, ProblemSetUpsertRequest request, Contest contest) {
        problem.setContest(contest);
        problem.setTitle(request.getTitle().trim());
        problem.setDescription(request.getDescription().trim());
        problem.setDifficulty(normalizeDifficulty(request.getDifficulty()));
        problem.setInputFormat(request.getInputFormat().trim());
        problem.setOutputFormat(request.getOutputFormat().trim());
        problem.setSampleInput(request.getSampleInput().trim());
        problem.setSampleOutput(request.getSampleOutput().trim());
        problem.setTestCases(request.getTestCases().trim());
        problem.setPoints(request.getPoints());
        problem.setTimeLimitSeconds(request.getTimeLimitSeconds());
    }

    private ProblemDTO toDto(Problem problem) {
        ProblemDTO dto = new ProblemDTO();
        dto.setId(problem.getId());
        dto.setContestId(problem.getContest() != null ? problem.getContest().getId() : null);
        dto.setContestMode(problem.getContest() != null ? problem.getContest().getMode() : null);
        dto.setTitle(problem.getTitle());
        dto.setDescription(problem.getDescription());
        dto.setDifficulty(problem.getDifficulty());
        dto.setInputFormat(problem.getInputFormat());
        dto.setOutputFormat(problem.getOutputFormat());
        dto.setSampleInput(problem.getSampleInput());
        dto.setSampleOutput(problem.getSampleOutput());
        dto.setTestCases(problem.getTestCases());
        dto.setPoints(problem.getPoints());
        dto.setTimeLimitSeconds(problem.getTimeLimitSeconds());
        return dto;
    }

    private Contest resolveProblemSetContest() {
        return contestRepository.findFirstByTitleIgnoreCase(CORE_PROBLEM_SET_TITLE)
                .orElseGet(this::createProblemSetContest);
    }

    private Contest createProblemSetContest() {
        User owner = resolveContestOwner();
        Contest contest = new Contest();
        contest.setTitle(CORE_PROBLEM_SET_TITLE);
        contest.setDescription(CORE_PROBLEM_SET_DESCRIPTION);
        contest.setStartTime(LocalDateTime.now().minusDays(1));
        contest.setEndTime(LocalDateTime.now().plusYears(50));
        contest.setDurationMinutes(CORE_PROBLEM_SET_DURATION_MINUTES);
        contest.setMode("PROBLEM_SET");
        contest.setCreatedBy(owner);
        return contestRepository.save(contest);
    }

    private User resolveContestOwner() {
        List<User> admins = userRepository.findByRoleIn(List.of(Role.ADMIN));
        if (!admins.isEmpty()) {
            return admins.get(0);
        }
        return userRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new ResourceNotFoundException("No user found to assign problem set owner."));
    }

    private String normalizeDifficulty(String difficulty) {
        if (difficulty == null || difficulty.isBlank()) {
            return null;
        }
        String normalized = difficulty.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "EASY", "MEDIUM", "HARD" -> normalized;
            default -> throw new BadRequestException("Difficulty must be EASY, MEDIUM, or HARD.");
        };
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }
        String normalized = query.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private double resolveDifficultyWeight(String difficulty) {
        if (difficulty == null) {
            return 1.0;
        }
        return switch (difficulty.toUpperCase(Locale.ROOT)) {
            case "EASY" -> 1.0;
            case "MEDIUM" -> 1.5;
            case "HARD" -> 2.0;
            default -> 1.0;
        };
    }
}
