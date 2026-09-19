package com.collegecontest.mockinterview;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "interview_problems")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewProblem {

    @EmbeddedId
    private InterviewProblemId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("interviewId")
    @JoinColumn(name = "interview_id")
    private Interview interview;

    @Column(name = "order_index")
    private Integer orderIndex;
}
