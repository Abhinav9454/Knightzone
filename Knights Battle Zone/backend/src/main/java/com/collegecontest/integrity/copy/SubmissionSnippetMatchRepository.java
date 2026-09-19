package com.collegecontest.integrity.copy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface SubmissionSnippetMatchRepository extends JpaRepository<SubmissionSnippetMatch, Long> {
    void deleteBySubmissionIdIn(Collection<Long> submissionIds);
}
