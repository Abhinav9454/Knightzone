package com.collegecontest.intercollege;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CollegeRankingRepository extends JpaRepository<CollegeRanking, Long> {
    List<CollegeRanking> findByMonthOrderByRank(LocalDate month);

    void deleteByMonth(LocalDate month);
}
