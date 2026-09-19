package com.collegecontest.services.placement;

import com.collegecontest.models.placement.Test;
import com.collegecontest.repositories.placement.TestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TestService {
    private final TestRepository testRepository;

    public Test scheduleTest(Test test) {
        return testRepository.save(test);
    }

    public List<Test> getTestsForJob(Long jobId) {
        return testRepository.findByJobId(jobId);
    }
}
