package com.collegecontest.learning.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "user_topic_mastery")
@Data
@NoArgsConstructor
public class UserTopicMastery {
    
    @EmbeddedId
    private UserTopicMasteryId id;

    @Column(name = "mastery_score", nullable = false)
    private Double masteryScore;

    @Column(name = "last_practiced")
    private java.time.LocalDateTime lastPracticed;

    @Column(name = "times_practiced")
    private Integer timesPracticed = 0;

    public UserTopicMastery(Long userId, Long topicId, Double masteryScore) {
        this.id = new UserTopicMasteryId();
        this.id.setUserId(userId);
        this.id.setTopicId(topicId);
        this.masteryScore = masteryScore;
        this.lastPracticed = java.time.LocalDateTime.now();
        this.timesPracticed = 1;
    }

    public void updateMastery(Double newScore) {
        this.masteryScore = newScore;
        this.lastPracticed = java.time.LocalDateTime.now();
        this.timesPracticed++;
    }
}
