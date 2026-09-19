package com.collegecontest.resume;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "resume_strength")
    private Integer resumeStrength;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
}
