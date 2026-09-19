package com.collegecontest.hint.dto;

import java.util.Objects;

public class HintDTO {
    private Long id;
    private Long problemId;
    private String hintText;
    private Integer unlockOrder;

    public HintDTO() {}

    public HintDTO(Long id, Long problemId, String hintText, Integer unlockOrder) {
        this.id = id;
        this.problemId = problemId;
        this.hintText = hintText;
        this.unlockOrder = unlockOrder;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProblemId() { return problemId; }
    public void setProblemId(Long problemId) { this.problemId = problemId; }

    public String getHintText() { return hintText; }
    public void setHintText(String hintText) { this.hintText = hintText; }

    public Integer getUnlockOrder() { return unlockOrder; }
    public void setUnlockOrder(Integer unlockOrder) { this.unlockOrder = unlockOrder; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        HintDTO hintDTO = (HintDTO) o;
        return Objects.equals(id, hintDTO.id) &&
               Objects.equals(problemId, hintDTO.problemId) &&
               Objects.equals(hintText, hintDTO.hintText) &&
               Objects.equals(unlockOrder, hintDTO.unlockOrder);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, problemId, hintText, unlockOrder);
    }

    @Override
    public String toString() {
        return "HintDTO{" +
               "id=" + id +
               ", problemId=" + problemId +
               ", hintText='" + hintText + '\'' +
               ", unlockOrder=" + unlockOrder +
               '}';
    }
}
