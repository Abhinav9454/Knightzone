package com.collegecontest.hint.model;

import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class UserProblemAttemptsId implements Serializable {

    private Long userId;
    private Long problemId;

    public UserProblemAttemptsId() {}

    public UserProblemAttemptsId(Long userId, Long problemId) {
        this.userId = userId;
        this.problemId = problemId;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserProblemAttemptsId that = (UserProblemAttemptsId) o;
        return Objects.equals(userId, that.userId) && 
               Objects.equals(problemId, that.problemId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, problemId);
    }

    @Override
    public String toString() {
        return "UserProblemAttemptsId{" +
               "userId=" + userId +
               ", problemId=" + problemId +
               '}';
    }
}
