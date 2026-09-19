package com.collegecontest.repository;

import com.collegecontest.model.Contest;
import com.collegecontest.model.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ContestRepository extends JpaRepository<Contest, Long> {
    boolean existsByTitle(String title);
    Optional<Contest> findFirstByTitleIgnoreCase(String title);

    @EntityGraph(attributePaths = { "createdBy" })
    Page<Contest> findAllByOrderByStartTimeDesc(Pageable pageable);

    @Query("""
            select c.id as id,
                   c.title as title,
                   c.description as description,
                   c.startTime as startTime,
                   c.endTime as endTime,
                   c.durationMinutes as durationMinutes,
                   c.createdAt as createdAt,
                   c.updatedAt as updatedAt,
                   u.id as createdById,
                   u.name as createdByName,
                   u.publicUserId as createdByPublicUserId,
                   u.email as createdByEmail,
                   u.college as createdByCollege,
                   u.department as createdByDepartment,
                   u.adminExpiresAt as createdByAdminExpiresAt,
                   u.role as createdByRole
            from Contest c
            join c.createdBy u
            where c.mode is null or upper(c.mode) <> 'PROBLEM_SET'
            """)
    Page<ContestCardProjection> findContestCards(Pageable pageable);

    @Query("""
            select c.id as id,
                   c.title as title,
                   c.description as description,
                   c.startTime as startTime,
                   c.endTime as endTime,
                   c.durationMinutes as durationMinutes,
                   c.createdAt as createdAt,
                   c.updatedAt as updatedAt,
                   u.id as createdById,
                   u.name as createdByName,
                   u.publicUserId as createdByPublicUserId,
                   u.email as createdByEmail,
                   u.college as createdByCollege,
                   u.department as createdByDepartment,
                   u.adminExpiresAt as createdByAdminExpiresAt,
                   u.role as createdByRole
            from Contest c
            join c.createdBy u
            where c.id = :contestId
              and (c.mode is null or upper(c.mode) <> 'PROBLEM_SET')
            """)
    Optional<ContestCardProjection> findContestCardById(@Param("contestId") Long contestId);

    long countByStartTimeAfter(LocalDateTime timestamp);

    interface ContestCardProjection {
        Long getId();

        String getTitle();

        String getDescription();

        LocalDateTime getStartTime();

        LocalDateTime getEndTime();

        Integer getDurationMinutes();

        LocalDateTime getCreatedAt();

        LocalDateTime getUpdatedAt();

        Long getCreatedById();

        String getCreatedByName();

        String getCreatedByPublicUserId();

        String getCreatedByEmail();

        String getCreatedByCollege();

        String getCreatedByDepartment();

        LocalDateTime getCreatedByAdminExpiresAt();

        Role getCreatedByRole();
    }
}
