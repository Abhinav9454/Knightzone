package com.collegecontest.learning.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class TopicPrerequisiteId implements Serializable {

    private Long topicId;
    private Long prerequisiteId;

    public TopicPrerequisiteId() {}

    public TopicPrerequisiteId(Long topicId, Long prerequisiteId) {
        this.topicId = topicId;
        this.prerequisiteId = prerequisiteId;
    }

    public Long getTopicId() { return topicId; }
    public void setTopicId(Long topicId) { this.topicId = topicId; }

    public Long getPrerequisiteId() { return prerequisiteId; }
    public void setPrerequisiteId(Long prerequisiteId) { this.prerequisiteId = prerequisiteId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TopicPrerequisiteId that = (TopicPrerequisiteId) o;
        return Objects.equals(topicId, that.topicId) && 
               Objects.equals(prerequisiteId, that.prerequisiteId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(topicId, prerequisiteId);
    }

    @Override
    public String toString() {
        return "TopicPrerequisiteId{" +
               "topicId=" + topicId +
               ", prerequisiteId=" + prerequisiteId +
               '}';
    }
}
