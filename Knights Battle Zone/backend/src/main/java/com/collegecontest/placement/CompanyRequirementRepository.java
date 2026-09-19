package com.collegecontest.placement;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompanyRequirementRepository extends JpaRepository<CompanyRequirement, Long> {
    List<CompanyRequirement> findByCompanyId(Long companyId);
}
