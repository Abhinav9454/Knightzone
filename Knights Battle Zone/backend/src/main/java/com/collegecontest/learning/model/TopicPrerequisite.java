package com.collegecontest.learning.model;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "topic_prerequisites")
public class TopicPrerequisite {

    @EmbeddedId
    private TopicPrerequisiteId id;

    public TopicPrerequisite() {}

    public TopicPrerequisite(Long topicId, Long prerequisiteId) {
        this.id = new TopicPrerequisiteId(topicId, prerequisiteId);
    }

    public TopicPrerequisiteId getId() { return id; }
    public void setId(TopicPrerequisiteId id) { this.id = id; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TopicPrerequisite that = (TopicPrerequisite) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "TopicPrerequisite{" +
               "id=" + id +
               '}';
    }
}
