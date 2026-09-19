package com.collegecontest.hint.model;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "user_problem_attempts")
public class UserProblemAttempts {

    @EmbeddedId
    private UserProblemAttemptsId id;

    @Column(name = "time_spent", nullable = false)
    private Integer timeSpent = 0;

    @Column(name = "attempt_count", nullable = false)
    private Integer attemptCount = 0;

    public UserProblemAttempts() {}

    public UserProblemAttempts(Long userId, Long problemId, Integer timeSpent, Integer attemptCount) {
        this.id = new UserProblemAttemptsId(userId, problemId);
        this.timeSpent = timeSpent;
        this.attemptCount = attemptCount;
    }

    public UserProblemAttemptsId getId() { return id; }
    public void setId(UserProblemAttemptsId id) { this.id = id; }

    public Integer getTimeSpent() { return timeSpent; }
    public void setTimeSpent(Integer timeSpent) { this.timeSpent = timeSpent; }

    public Integer getAttemptCount() { return attemptCount; }
    public void setAttemptCount(Integer attemptCount) { this.attemptCount = attemptCount; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserProblemAttempts that = (UserProblemAttempts) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "UserProblemAttempts{" +
               "id=" + id +
               ", timeSpent=" + timeSpent +
               ", attemptCount=" + attemptCount +
               '}';
    }
}
