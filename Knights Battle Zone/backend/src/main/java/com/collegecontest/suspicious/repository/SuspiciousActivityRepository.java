package com.collegecontest.suspicious.repository;

import com.collegecontest.suspicious.model.SuspiciousActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuspiciousActivityRepository extends JpaRepository<SuspiciousActivity, Long> {
    List<SuspiciousActivity> findByResolvedFalse();
}
