package com.collegecontest.repositories.placement;

import com.collegecontest.models.placement.TPO;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TPORepository extends JpaRepository<TPO, Long> {
    Optional<TPO> findByUserId(Long userId);
}
