package com.collegecontest.service;

import com.collegecontest.adaptive.dto.ProblemDTO;
import com.collegecontest.adaptive.dto.SkillHistoryDTO;
import com.collegecontest.adaptive.exception.ProblemNotFoundException;
import com.collegecontest.adaptive.exception.UserNotFoundException;
import com.collegecontest.adaptive.model.Problem;
import com.collegecontest.adaptive.model.UserSkill;
import com.collegecontest.adaptive.repository.ProblemRepository;
import com.collegecontest.adaptive.repository.UserSkillRepository;
import com.collegecontest.adaptive.util.EloUtil;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class AdaptiveDifficultyService {

    private static final Logger log = LoggerFactory.getLogger(AdaptiveDifficultyService.class);
    private static final double DEFAULT_INITIAL_SKILL = 1000.0;

    private final UserSkillRepository userSkillRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    public AdaptiveDifficultyService(
            UserSkillRepository userSkillRepository,
            ProblemRepository problemRepository,
            UserRepository userRepository) {
        this.userSkillRepository = userSkillRepository;
        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    @CacheEvict(value = "recommendedProblem", key = "#userId")
    public void updateSkill(Long userId, Long problemId, boolean solved) {
        log.debug("Updating skill for userId={}, problemId={}, solved={}", userId, problemId, solved);

        UserSkill userSkill = getOrCreateUserSkill(userId);

        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new ProblemNotFoundException("Problem not found with id: " + problemId));

        double oldSkill = userSkill.getSkillScore();
        double newSkill = EloUtil.calculateNewRating(oldSkill, problem.getDifficulty(), solved);

        userSkill.updateSkill(newSkill);
        userSkillRepository.save(userSkill);

        log.info("User {} skill updated from {} to {}", userId, oldSkill, newSkill);
    }

    @Cacheable(value = "recommendedProblem", key = "#userId")
    public ProblemDTO recommendProblem(Long userId) {
        log.debug("Getting problem recommendation for userId={}", userId);

        UserSkill userSkill = getOrCreateUserSkill(userId);

        double skillScore = userSkill.getSkillScore();

        // Find problem with closest difficulty
        Optional<Problem> bestProblem = problemRepository.findAll().stream()
                .min(Comparator.comparingDouble(p -> Math.abs(p.getDifficulty() - skillScore)));

        if (bestProblem.isEmpty()) {
            return null;
        }
        Problem chosen = bestProblem.get();

        log.debug("Recommended problem {} for userId={}", chosen.getId(), userId);
        ProblemDTO dto = new ProblemDTO();
        dto.setId(chosen.getId());
        dto.setTitle(chosen.getTitle());
        dto.setDifficulty(chosen.getDifficulty());
        dto.setCategory(chosen.getCategory());
        dto.setTimeLimit(chosen.getTimeLimit());
        dto.setMemoryLimit(chosen.getMemoryLimit());
        return dto;
    }

    public Double getUserSkill(Long userId) {
        return getOrCreateUserSkill(userId).getSkillScore();
    }

    public List<SkillHistoryDTO> getSkillHistory(Long userId, int limit) {
        // This would need a SkillHistory entity/repository
        // For now, return empty list
        return new ArrayList<>();
    }

    private UserSkill getOrCreateUserSkill(Long userId) {
        Optional<UserSkill> existing = userSkillRepository.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        UserSkill fresh = new UserSkill();
        fresh.setUserId(user.getId());
        fresh.setSkillScore(DEFAULT_INITIAL_SKILL);
        fresh.setLastUpdated(java.time.LocalDateTime.now());
        fresh.setGamesPlayed(0);
        fresh.setHighestScore(DEFAULT_INITIAL_SKILL);
        fresh.setLowestScore(DEFAULT_INITIAL_SKILL);
        fresh.setAverageScore(DEFAULT_INITIAL_SKILL);
        return userSkillRepository.save(fresh);
    }
}
