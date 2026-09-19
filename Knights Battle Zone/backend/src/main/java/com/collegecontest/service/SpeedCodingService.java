package com.collegecontest.service;

import com.collegecontest.model.Contest;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.ContestParticipant;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.speed.dto.ParticipantScoreDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SpeedCodingService {

    private final ContestRepository contestRepository;
    private final ProblemRepository problemRepository;
    private final SubmissionRepository submissionRepository;
    private final ContestParticipantRepository participantRepository;

    public SpeedCodingService(ContestRepository contestRepository,
            ProblemRepository problemRepository,
            SubmissionRepository submissionRepository,
            ContestParticipantRepository participantRepository) {
        this.contestRepository = contestRepository;
        this.problemRepository = problemRepository;
        this.submissionRepository = submissionRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public double calculateSpeedScore(Long contestId, Long userId, Long problemId, Long submissionId) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found: " + contestId));

        // check speed mode: use contest.mode == "SPEED" for compatibility
        if (contest.getMode() == null || !"SPEED".equalsIgnoreCase(contest.getMode())) {
            return 0.0;
        }

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new RuntimeException("Problem not found: " + problemId));

        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found: " + submissionId));

        // compute userTime in seconds
        Integer userTime = submission.getTimeTakenSeconds();
        if (userTime == null) {
            LocalDateTime start = contest.getStartTime();
            if (start == null || submission.getSubmittedAt() == null) {
                userTime = 0;
            } else {
                userTime = (int) Duration.between(start, submission.getSubmittedAt()).getSeconds();
            }
            submission.setTimeTakenSeconds(userTime);
            submissionRepository.save(submission);
        }

        int maxTime = problem.getTimeLimitSeconds() != null ? problem.getTimeLimitSeconds() : 3600;
        double weight = problem.getDifficultyWeight() != null ? problem.getDifficultyWeight()
                : (problem.getPoints() != null ? problem.getPoints() : 1.0);

        double raw = (double) (maxTime - userTime) * weight;
        double score = Math.max(0.0, raw);

        // update participant total score
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseGet(() -> {
                    ContestParticipant p = new ContestParticipant();
                    p.setContestId(contestId);
                    p.setUserId(userId);
                    p.setTotalScore(0.0);
                    return p;
                });

        double newTotal = (participant.getTotalScore() != null ? participant.getTotalScore() : 0.0) + score;
        participant.setTotalScore(newTotal);
        participantRepository.save(participant);

        return score;
    }

    @Transactional(readOnly = true)
    public List<ParticipantScoreDTO> getSpeedLeaderboard(Long contestId) {
        List<ContestParticipant> list = participantRepository.findByContestIdOrderByTotalScoreDesc(contestId);
        return list.stream().map(p -> new ParticipantScoreDTO(p.getUserId(), p.getTotalScore()))
                .collect(Collectors.toList());
    }
}
