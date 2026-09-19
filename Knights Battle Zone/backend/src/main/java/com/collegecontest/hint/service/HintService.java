package com.collegecontest.hint.service;

import com.collegecontest.hint.dto.HintDTO;
import com.collegecontest.hint.exception.InvalidConditionException;
import com.collegecontest.hint.model.Hint;
import com.collegecontest.hint.model.UserProblemAttempts;
import com.collegecontest.hint.model.UserProblemAttemptsId;
import com.collegecontest.hint.repository.HintRepository;
import com.collegecontest.hint.repository.UserProblemAttemptsRepository;
import com.collegecontest.hint.util.ConditionEvaluator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HintService {

    private static final Logger log = LoggerFactory.getLogger(HintService.class);

    private final HintRepository hintRepository;
    private final UserProblemAttemptsRepository attemptsRepository;

    public HintService(HintRepository hintRepository, UserProblemAttemptsRepository attemptsRepository) {
        this.hintRepository = hintRepository;
        this.attemptsRepository = attemptsRepository;
    }

    @Transactional(readOnly = true)
    public List<HintDTO> getAvailableHints(Long userId, Long problemId) {
        log.debug("Getting available hints for userId={}, problemId={}", userId, problemId);

        // Find attempts using userId and problemId
        Optional<UserProblemAttempts> attemptsOpt = attemptsRepository.findByUserIdAndProblemId(userId, problemId);
        
        int timeSpent = attemptsOpt.map(UserProblemAttempts::getTimeSpent).orElse(0);
        int attemptCount = attemptsOpt.map(UserProblemAttempts::getAttemptCount).orElse(0);

        // Get all hints for this problem ordered by unlock order
        List<Hint> hints = hintRepository.findByProblemIdOrderByUnlockOrderAsc(problemId);

        // Filter hints based on unlock conditions
        List<HintDTO> availableHints = hints.stream()
                .filter(hint -> {
                    try {
                        return ConditionEvaluator.evaluate(hint.getUnlockCondition(), timeSpent, attemptCount);
                    } catch (InvalidConditionException ex) {
                        log.warn("Invalid condition for hint {}: {}", hint.getId(), hint.getUnlockCondition());
                        return false;
                    }
                })
                .map(hint -> new HintDTO(
                        hint.getId(),
                        hint.getProblemId(),
                        hint.getHintText(),
                        hint.getUnlockOrder()
                ))
                .collect(Collectors.toList());

        log.debug("Found {} available hints for userId={}, problemId={}", 
                availableHints.size(), userId, problemId);
        
        return availableHints;
    }

    @Transactional(readOnly = true)
    public List<HintDTO> getAllHintsForUser(Long userId) {
        log.debug("Getting all hints for userId={}", userId);
        
        // This would require a more complex query - for now return empty list
        // You can implement this based on your requirements
        return List.of();
    }

    @Transactional(readOnly = true)
    public Optional<HintDTO> getHintById(Long hintId) {
        return hintRepository.findById(hintId)
                .map(hint -> new HintDTO(
                        hint.getId(),
                        hint.getProblemId(),
                        hint.getHintText(),
                        hint.getUnlockOrder()
                ));
    }

    @Transactional
    public void recordAttempt(Long userId, Long problemId, int timeSpent, int attemptCount) {
        UserProblemAttemptsId id = new UserProblemAttemptsId(userId, problemId);
        
        UserProblemAttempts attempts = attemptsRepository.findById(id)
                .orElse(new UserProblemAttempts(userId, problemId, 0, 0));
        
        attempts.setTimeSpent(attempts.getTimeSpent() + timeSpent);
        attempts.setAttemptCount(attempts.getAttemptCount() + attemptCount);
        
        attemptsRepository.save(attempts);
        
        log.debug("Recorded attempt for userId={}, problemId={}, total time={}, total attempts={}", 
                userId, problemId, attempts.getTimeSpent(), attempts.getAttemptCount());
    }
}


