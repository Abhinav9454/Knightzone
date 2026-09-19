package com.collegecontest.hint.model;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "hints")
public class Hint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "hint_text", nullable = false, columnDefinition = "TEXT")
    private String hintText;

    @Column(name = "unlock_order", nullable = false)
    private Integer unlockOrder;

    @Column(name = "unlock_condition")
    private String unlockCondition;

    public Hint() {}

    public Hint(Long id, Long problemId, String hintText, Integer unlockOrder, String unlockCondition) {
        this.id = id;
        this.problemId = problemId;
        this.hintText = hintText;
        this.unlockOrder = unlockOrder;
        this.unlockCondition = unlockCondition;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public String getHintText() { return hintText; }
    public void setHintText(String hintText) { this.hintText = hintText; }

    public Integer getUnlockOrder() { return unlockOrder; }
    public void setUnlockOrder(Integer unlockOrder) { this.unlockOrder = unlockOrder; }

    public String getUnlockCondition() { return unlockCondition; }
    public void setUnlockCondition(String unlockCondition) { this.unlockCondition = unlockCondition; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Hint hint = (Hint) o;
        return Objects.equals(id, hint.id) &&
               Objects.equals(problemId, hint.problemId) &&
               Objects.equals(hintText, hint.hintText) &&
               Objects.equals(unlockOrder, hint.unlockOrder) &&
               Objects.equals(unlockCondition, hint.unlockCondition);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, problemId, hintText, unlockOrder, unlockCondition);
    }

    @Override
    public String toString() {
        return "Hint{" +
               "id=" + id +
               ", problemId=" + problemId +
               ", hintText='" + hintText + '\'' +
               ", unlockOrder=" + unlockOrder +
               ", unlockCondition='" + unlockCondition + '\'' +
               '}';
    }
}
