package com.collegecontest.badge;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "badges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Badge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    @Column(name = "image_url")
    private String imageUrl;
    @Column(name = "trigger_type")
    private String triggerType;
    @Column(name = "trigger_value")
    private Integer triggerValue;
}
