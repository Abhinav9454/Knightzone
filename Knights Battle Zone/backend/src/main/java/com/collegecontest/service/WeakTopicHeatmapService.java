package com.collegecontest.service;

import com.collegecontest.learning.dto.CategoryWeaknessDTO;
import com.collegecontest.learning.dto.HeatmapResponse;
import com.collegecontest.learning.dto.TopicWeaknessDTO;
import com.collegecontest.learning.model.Topic;
import com.collegecontest.learning.model.UserTopicMastery;
import com.collegecontest.learning.repository.TopicRepository;
import com.collegecontest.learning.repository.UserTopicMasteryRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class WeakTopicHeatmapService {

    private final TopicRepository topicRepository;
    private final UserTopicMasteryRepository userTopicMasteryRepository;

    public WeakTopicHeatmapService(TopicRepository topicRepository,
            UserTopicMasteryRepository userTopicMasteryRepository) {
        this.topicRepository = topicRepository;
        this.userTopicMasteryRepository = userTopicMasteryRepository;
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "weakTopicHeatmap", key = "#userId")
    public HeatmapResponse getWeakTopicHeatmap(Long userId) {
        List<Topic> topics = topicRepository.findAll();

        List<UserTopicMastery> masteryList = userTopicMasteryRepository.findByIdUserId(userId);

        Map<Long, Double> masteryMap = new HashMap<>();
        if (masteryList != null) {
            for (UserTopicMastery m : masteryList) {
                masteryMap.put(m.getId().getTopicId(), m.getMasteryScore());
            }
        }

        // Compute weakness per topic (1.0 - mastery). If missing, masteryScore=0.0 =>
        // weakness=1.0
        Map<String, List<TopicWeaknessDTO>> grouped = new HashMap<>();
        for (Topic t : topics) {
            double mastery = masteryMap.getOrDefault(t.getId(), 0.0);
            double weakness = 1.0 - mastery;
            TopicWeaknessDTO tw = new TopicWeaknessDTO(t.getName(), weakness);
            grouped.computeIfAbsent(t.getCategory() == null ? "Uncategorized" : t.getCategory(), k -> new ArrayList<>())
                    .add(tw);
        }

        List<CategoryWeaknessDTO> categories = grouped.entrySet().stream()
                .map(e -> new CategoryWeaknessDTO(e.getKey(), e.getValue()))
                .collect(Collectors.toList());

        return new HeatmapResponse(categories);
    }
}
