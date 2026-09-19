package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.PassageModerationAudit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PassageModerationAuditRepository extends JpaRepository<PassageModerationAudit, Long> {
    Page<PassageModerationAudit> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<PassageModerationAudit> findByReviewerIdOrderByCreatedAtDesc(Long reviewerId, Pageable pageable);
}
