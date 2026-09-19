package com.collegecontest.mockinterview;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InterviewProblemId implements Serializable {
    private Long interviewId;
    private Long problemId;
}
