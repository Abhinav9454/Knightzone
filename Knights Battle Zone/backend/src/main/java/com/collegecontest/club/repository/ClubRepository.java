package com.collegecontest.club.repository;

import com.collegecontest.club.model.Club;
import com.collegecontest.club.model.ClubVisibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {
    List<Club> findByVisibility(ClubVisibility visibility);
    Optional<Club> findByNameIgnoreCase(String name);
}
