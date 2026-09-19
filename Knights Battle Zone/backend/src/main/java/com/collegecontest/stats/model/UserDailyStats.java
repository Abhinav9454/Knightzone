package com.collegecontest.stats.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
        name = "user_daily_stats",
        indexes = {
                @Index(name = "idx_uds_user_date", columnList = "user_id,date"),
                @Index(name = "idx_uds_user_submissions", columnList = "user_id,submissions")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDailyStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private Integer submissions = 0;
    
    @Column(name = "problems_solved")
    private Integer problemsSolved = 0;
    
    @Column(name = "time_spent")
    private Integer timeSpent = 0; // in minutes
    
    @Column(name = "points_earned")
    private Double pointsEarned = 0.0;

    private int submissionCount;

    public int getSubmissionCount() { return submissionCount; }
    public void setSubmissionCount(int submissionCount) { this.submissionCount = submissionCount; }
}

