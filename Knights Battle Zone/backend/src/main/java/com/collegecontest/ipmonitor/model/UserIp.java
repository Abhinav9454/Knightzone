package com.collegecontest.ipmonitor.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_ips", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "ip_address" }))
@Data
public class UserIp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "ip_address", nullable = false)
    private String ipAddress;

    @Column(name = "last_seen", nullable = false)
    private LocalDateTime lastSeen;
}
