package com.collegecontest.ipmonitor.repository;

import com.collegecontest.ipmonitor.model.UserIp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserIpRepository extends JpaRepository<UserIp, Long> {
    List<UserIp> findByIpAddress(String ipAddress);

    List<UserIp> findByUserId(Long userId);
}
