package com.collegecontest.decay;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class RankDecayService {

    private final SubmissionActivityRepository activityRepository;
    private final UserSkillRepository userSkillRepository;

    public RankDecayService(SubmissionActivityRepository activityRepository, UserSkillRepository userSkillRepository) {
        this.activityRepository = activityRepository;
        this.userSkillRepository = userSkillRepository;
    }

    @Scheduled(cron = "0 0 1 * * MON")
    @Transactional
    public void applyDecay() {
        double decayRatePerWeek = 0.05; // 5% per week
        LocalDateTime cutoff = LocalDateTime.now().minus(7, ChronoUnit.DAYS);
        List<Long> inactiveUsers = activityRepository.findUserIdsLastActiveBefore(cutoff);
        if (inactiveUsers == null || inactiveUsers.isEmpty())
            return;

        // load current skills
        List<Object[]> skills = userSkillRepository.findAllUserSkills();
        for (Object[] row : skills) {
            Long userId = ((Number) row[1]).longValue();
            Double skill = row[2] == null ? 0.0 : ((Number) row[2]).doubleValue();
            if (inactiveUsers.contains(userId)) {
                Double newSkill = skill * (1.0 - decayRatePerWeek);
                userSkillRepository.updateSkillScore(userId, newSkill);
            }
        }
    }
}
