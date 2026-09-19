package com.collegecontest.service;

import com.collegecontest.accuracy.dto.ParticipantScoreDTO;
import com.collegecontest.model.Contest;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.ContestParticipant;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AccuracyModeService {

    private final ContestRepository contestRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final ContestParticipantRepository participantRepository;
    private final double penalty;

    public AccuracyModeService(ContestRepository contestRepository,
            SubmissionRepository submissionRepository,
            ProblemRepository problemRepository,
            ContestParticipantRepository participantRepository,
            @Value("${accuracy.penalty:5}") double penalty) {
        this.contestRepository = contestRepository;
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.participantRepository = participantRepository;
        this.penalty = penalty;
    }

    @Transactional
    public void updateAccuracyScore(Long contestId, Long userId, Long problemId, boolean isCorrect, Long submissionId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found: " + contestId));

        // check contest mode: accept 'ACCURACY' or mode indicating accuracy
        if (contest.getMode() == null || !"ACCURACY".equalsIgnoreCase(contest.getMode())) {
            return;
        }

        // load participant
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseGet(() -> {
                    ContestParticipant p = new ContestParticipant();
                    p.setContestId(contestId);
                    p.setUserId(userId);
                    p.setTotalScore(0.0);
                    return p;
                });

        // determine if this problem was already solved by this user in this contest
        boolean solvedBefore = submissionRepository.findByUserIdAndProblemId(userId, problemId).stream()
                .filter(s -> s.getProblem() != null && s.getProblem().getId().equals(problemId))
                .filter(s -> s.getProblem() != null && s.getProblem().getContest() != null
                        && s.getProblem().getContest().getId().equals(contestId))
                .anyMatch(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()) && !s.getId().equals(submissionId));

        double currentScore = participant.getTotalScore() != null ? participant.getTotalScore() : 0.0;

        if (isCorrect) {
            if (!solvedBefore) {
                // award problem points
                Problem problem = problemRepository.findById(problemId)
                        .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));
                double pts = problem.getPoints() != null ? problem.getPoints() : 0.0;
                currentScore += pts;
                participant.setTotalScore(currentScore);
                participantRepository.save(participant);
            }
        } else {
            // incorrect submission -> penalty
            currentScore -= penalty;
            if (currentScore < 0)
                currentScore = 0.0;
            participant.setTotalScore(currentScore);
            participantRepository.save(participant);
        }
    }

    @Transactional(readOnly = true)
    public List<ParticipantScoreDTO> getAccuracyLeaderboard(Long contestId) {
        List<ContestParticipant> list = participantRepository.findByContestIdOrderByTotalScoreDesc(contestId);
        return list.stream().map(p -> new ParticipantScoreDTO(p.getUserId(), p.getTotalScore()))
                .collect(Collectors.toList());
    }
}
