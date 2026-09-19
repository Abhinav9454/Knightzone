package com.collegecontest.adaptive.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_skill")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSkill {
    
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "skill_score", nullable = false)
    private Double skillScore;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @Column(name = "games_played")
    private Integer gamesPlayed = 0;

    @Column(name = "highest_score")
    private Double highestScore;

    @Column(name = "lowest_score")
    private Double lowestScore;

    @Column(name = "average_score")
    private Double averageScore;

    @Version
    private Integer version;

    // Helper method to update skill
    public void updateSkill(Double newScore) {
        this.skillScore = newScore;
        this.lastUpdated = LocalDateTime.now();
        
        if (this.highestScore == null || newScore > this.highestScore) {
            this.highestScore = newScore;
        }
        if (this.lowestScore == null || newScore < this.lowestScore) {
            this.lowestScore = newScore;
        }
        
        this.gamesPlayed = (this.gamesPlayed == null ? 1 : this.gamesPlayed + 1);
        
        // Update average
        if (this.averageScore == null) {
            this.averageScore = newScore;
        } else {
            this.averageScore = (this.averageScore * (this.gamesPlayed - 1) + newScore) / this.gamesPlayed;
        }
    }
}
