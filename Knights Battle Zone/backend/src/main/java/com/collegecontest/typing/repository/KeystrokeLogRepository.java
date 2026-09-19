package com.collegecontest.typing.repository;

import com.collegecontest.typing.model.KeystrokeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;

@Repository
public interface KeystrokeLogRepository extends JpaRepository<KeystrokeLog, Long> {
    List<KeystrokeLog> findBySubmissionId(Long submissionId);

    void deleteBySubmissionIdIn(Collection<Long> submissionIds);
}
