package com.collegecontest.service;

import com.collegecontest.model.Contest;
import com.collegecontest.model.ContestParticipant;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class SuddenDeathService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;

    public SuddenDeathService(ContestRepository contestRepository,
            ContestParticipantRepository participantRepository) {
        this.contestRepository = contestRepository;
        this.participantRepository = participantRepository;
    }

    @Transactional
    public void processSubmission(Long contestId, Long userId, boolean isCorrect) {
        Optional<Contest> contestOpt = contestRepository.findById(contestId);
        if (contestOpt.isEmpty())
            return;

        Contest contest = contestOpt.get();
        if (contest.getMode() == null)
            return;
        if (!"SUDDEN_DEATH".equalsIgnoreCase(contest.getMode()))
            return;

        if (isCorrect) {
            // correct submission does not eliminate
            return;
        }

        // incorrect submission -> eliminate participant
        ContestParticipant participant = participantRepository.findByContestIdAndUserId(contestId, userId)
                .orElseGet(() -> {
                    ContestParticipant p = new ContestParticipant();
                    p.setContestId(contestId);
                    p.setUserId(userId);
                    return p;
                });

        if (Boolean.TRUE.equals(participant.getEliminated()))
            return;

        participant.setEliminated(true);
        participantRepository.save(participant);
    }

    @Transactional(readOnly = true)
    public boolean isEliminated(Long contestId, Long userId) {
        return participantRepository.findByContestIdAndUserId(contestId, userId)
                .map(ContestParticipant::getEliminated)
                .orElse(false);
    }
}
