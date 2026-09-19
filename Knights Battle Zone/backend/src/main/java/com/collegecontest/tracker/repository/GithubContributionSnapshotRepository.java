package com.collegecontest.tracker.repository;

import com.collegecontest.tracker.model.GithubContributionSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GithubContributionSnapshotRepository extends JpaRepository<GithubContributionSnapshot, Long> {
    List<GithubContributionSnapshot> findByUserId(Long userId);

    Optional<GithubContributionSnapshot> findByUserIdAndRepoName(Long userId, String repoName);
}

