package com.collegecontest.service;

import com.collegecontest.adaptive.model.UserSkill;
import com.collegecontest.adaptive.repository.UserSkillRepository;
import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UpsetMultiplierService {

    private final UserSkillRepository userSkillRepository;
    private final SubmissionRepository submissionRepository;

    public UpsetMultiplierService(UserSkillRepository userSkillRepository, SubmissionRepository submissionRepository) {
        this.userSkillRepository = userSkillRepository;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public double applyUpsetMultiplier(Long winnerId, Long loserId, double basePoints, Long winningSubmissionId) {
        double winnerSkill = userSkillRepository.findById(winnerId).map(UserSkill::getSkillScore).orElse(1200.0);
        double loserSkill = userSkillRepository.findById(loserId).map(UserSkill::getSkillScore).orElse(1200.0);

        if (winnerSkill >= loserSkill)
            return basePoints;

        double rawMultiplier = loserSkill / Math.max(1.0, winnerSkill);
        double multiplier = Math.min(rawMultiplier, 3.0);
        double adjusted = basePoints * multiplier;

        Submission s = submissionRepository.findById(winningSubmissionId).orElse(null);
        if (s != null) {
            s.setUpsetMultiplier(multiplier);
            submissionRepository.save(s);
        }

        return adjusted;
    }
}
