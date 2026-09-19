package com.collegecontest.marketplace.repository;

import com.collegecontest.marketplace.model.PassageModeration;
import com.collegecontest.marketplace.model.PassageModerationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PassageModerationRepository extends JpaRepository<PassageModeration, Long> {
    Page<PassageModeration> findByStatusOrderByCreatedAtDesc(PassageModerationStatus status, Pageable pageable);
    Page<PassageModeration> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

