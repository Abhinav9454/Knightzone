package com.collegecontest.service;

import com.collegecontest.bonus.model.SubmissionBonus;
import com.collegecontest.bonus.repository.SubmissionBonusRepository;
import com.collegecontest.hint.model.UserProblemAttempts;
import com.collegecontest.hint.repository.UserProblemAttemptsRepository;
import com.collegecontest.model.Problem;
import com.collegecontest.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ComebackBonusService {

    private final UserProblemAttemptsRepository attemptsRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionBonusRepository submissionBonusRepository;
    private final double multiplier;

    public ComebackBonusService(
            UserProblemAttemptsRepository attemptsRepository,
            ProblemRepository problemRepository,
            SubmissionBonusRepository submissionBonusRepository,
            @Value("${comeback.multiplier:0.5}") double multiplier) {
        this.attemptsRepository = attemptsRepository;
        this.problemRepository = problemRepository;
        this.submissionBonusRepository = submissionBonusRepository;
        this.multiplier = multiplier;
    }

    @Transactional
    public double calculateAndAwardBonus(Long userId, Long problemId, Long contestId, Long submissionId) {
        // Fetch attempts record
        Optional<UserProblemAttempts> attemptsOpt = attemptsRepository.findByUserIdAndProblemId(userId, problemId);
        int previousAttempts = attemptsOpt.map(UserProblemAttempts::getAttemptCount).orElse(0);

        if (previousAttempts <= 0) {
            return 0.0;
        }

        // Get problem details
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));
        
        double basePoints = problem.getPoints() != null ? problem.getPoints() : 0.0;

        // Calculate bonus: basePoints * previousAttempts * multiplier
        double bonusAmount = basePoints * previousAttempts * multiplier;

        // Create bonus record
        SubmissionBonus bonus = new SubmissionBonus();
        bonus.setSubmissionId(submissionId);
        bonus.setUserId(userId);
        bonus.setContestId(contestId);
        bonus.setBonusAmount(bonusAmount);
        bonus.setReason("COMEBACK_BONUS");

        submissionBonusRepository.save(bonus);

        return bonusAmount;
    }
}
