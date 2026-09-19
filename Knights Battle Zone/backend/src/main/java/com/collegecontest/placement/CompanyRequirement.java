package com.collegecontest.placement;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "company_requirements")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyRequirement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "topic_id", nullable = false)
    private Long topicId;

    @Column(name = "required_mastery", nullable = false)
    private Double requiredMastery; // 0.0 - 1.0
}
