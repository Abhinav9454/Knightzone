package com.collegecontest.services.placement;

import com.collegecontest.models.placement.Job;
import com.collegecontest.models.placement.Student;
import org.springframework.stereotype.Component;

@Component
public class EligibilityChecker {
    public boolean isEligible(Job job, Student student) {
        if (job == null || student == null) {
            return false;
        }
        if (job.getStatus() != Job.Status.OPEN) {
            return false;
        }
        if (student.getCgpa() == null) {
            return true;
        }
        return student.getCgpa().doubleValue() >= 0;
    }
}
