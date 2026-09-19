package com.collegecontest.repositories.placement;

import com.collegecontest.models.placement.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface JobRepository extends JpaRepository<Job, Long> {
    List<Job> findByCompanyId(Long companyId);
    @Query("select j from Job j where j.status = :status and (j.deadline is null or j.deadline >= :now) order by j.postedDate desc")
    List<Job> findActiveByStatus(@Param("status") Job.Status status, @Param("now") LocalDateTime now);

    @Query("select count(j) from Job j where j.status = :status and (j.deadline is null or j.deadline >= :now)")
    long countActiveByStatus(@Param("status") Job.Status status, @Param("now") LocalDateTime now);

    @Query("select count(distinct j.companyId) from Job j where j.status = :status and (j.deadline is null or j.deadline >= :now)")
    long countDistinctCompanyIdByStatus(@Param("status") Job.Status status, @Param("now") LocalDateTime now);
}
