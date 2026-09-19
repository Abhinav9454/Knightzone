package com.collegecontest.tabswitch.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tab_switch_logs")
@Data
public class TabSwitchLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "contest_id", nullable = false)
    private Long contestId;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
