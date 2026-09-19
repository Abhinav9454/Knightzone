package com.collegecontest.badge;

import com.collegecontest.badge.dto.BadgeDTO;
import com.collegecontest.badge.dto.UserBadgeDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BadgeService {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final com.collegecontest.resume.ResumeMetricsRepository metricsRepository;

    public BadgeService(BadgeRepository badgeRepository, UserBadgeRepository userBadgeRepository,
            com.collegecontest.resume.ResumeMetricsRepository metricsRepository) {
        this.badgeRepository = badgeRepository;
        this.userBadgeRepository = userBadgeRepository;
        this.metricsRepository = metricsRepository;
    }

    @Transactional
    public void checkAndAward(Long userId, String triggerType, int currentValue) {
        List<Badge> badges = badgeRepository.findByTriggerType(triggerType);
        for (Badge b : badges) {
            if (b.getTriggerValue() == null)
                continue;
            if (currentValue >= b.getTriggerValue()) {
                // check if already awarded
                if (userBadgeRepository.findByUserIdAndBadgeId(userId, b.getId()).isPresent())
                    continue;
                UserBadge ub = UserBadge.builder().userId(userId).badgeId(b.getId()).build();
                userBadgeRepository.save(ub);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<UserBadgeDTO> getUserBadges(Long userId) {
        List<UserBadge> list = userBadgeRepository.findByUserId(userId);
        List<UserBadgeDTO> out = new ArrayList<>();
        for (UserBadge ub : list) {
            Badge b = badgeRepository.findById(ub.getBadgeId()).orElse(null);
            if (b == null)
                continue;
            out.add(UserBadgeDTO.builder()
                    .id(b.getId())
                    .name(b.getName())
                    .description(b.getDescription())
                    .imageUrl(b.getImageUrl())
                    .awardedAt(ub.getAwardedAt())
                    .build());
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<BadgeDTO> listAllBadges() {
        List<Badge> list = badgeRepository.findAll();
        List<BadgeDTO> out = new ArrayList<>();
        for (Badge b : list) {
            out.add(BadgeDTO.builder().id(b.getId()).name(b.getName()).description(b.getDescription())
                    .imageUrl(b.getImageUrl()).build());
        }
        return out;
    }
}
