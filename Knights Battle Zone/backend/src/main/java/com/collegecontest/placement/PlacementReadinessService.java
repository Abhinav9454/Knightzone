package com.collegecontest.placement;

import com.collegecontest.placement.dto.PlacementReadinessDTO;
import com.collegecontest.placement.dto.TopicGapDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PlacementReadinessService {

    private final CompanyRequirementRepository reqRepo;
    private final PlacementUserTopicMasteryRepository masteryRepo;
    private final PlacementTopicRepository topicRepo;

    public PlacementReadinessService(CompanyRequirementRepository reqRepo, PlacementUserTopicMasteryRepository masteryRepo,
            PlacementTopicRepository topicRepo) {
        this.reqRepo = reqRepo;
        this.masteryRepo = masteryRepo;
        this.topicRepo = topicRepo;
    }

    @Transactional(readOnly = true)
    public PlacementReadinessDTO getReadiness(Long userId, Long companyId) {
        List<CompanyRequirement> reqs = reqRepo.findByCompanyId(companyId);
        if (reqs == null || reqs.isEmpty()) {
            return PlacementReadinessDTO.builder().overallScore(100.0).gaps(new ArrayList<>()).build();
        }

        List<TopicGapDTO> gaps = new ArrayList<>();
        double sumPercent = 0.0;
        int count = 0;

        for (CompanyRequirement r : reqs) {
            Double required = r.getRequiredMastery() == null ? 0.0 : r.getRequiredMastery();
            Double userMastery = masteryRepo.findMasteryForUserAndTopic(userId, r.getTopicId());
            if (userMastery == null)
                userMastery = 0.0;

            double topicReadiness;
            if (required <= 0.0) {
                topicReadiness = 100.0;
            } else {
                topicReadiness = Math.min(100.0, (userMastery / required) * 100.0);
            }
            sumPercent += topicReadiness;
            count++;

            if (userMastery < required) {
                String topicName = topicRepo.findNameById(r.getTopicId());
                TopicGapDTO gap = TopicGapDTO.builder()
                        .topicName(topicName == null ? ("topic:" + r.getTopicId()) : topicName)
                        .requiredMastery(required)
                        .userMastery(userMastery)
                        .deficit(required - userMastery)
                        .build();
                gaps.add(gap);
            }
        }

        double overall = count == 0 ? 100.0 : (sumPercent / count);
        return PlacementReadinessDTO.builder().overallScore(overall).gaps(gaps).build();
    }
}

