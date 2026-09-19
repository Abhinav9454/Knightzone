package com.collegecontest.legacy;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_legacy_scores")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserLegacyScore {
    
    @Id
    private Long userId;
    
    @Column(nullable = false)
    private Double legacyScore;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
