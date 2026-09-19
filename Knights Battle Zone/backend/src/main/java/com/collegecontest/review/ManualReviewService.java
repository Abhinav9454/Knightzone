package com.collegecontest.review;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ManualReviewService {
    private final ReviewFlagRepository reviewFlagRepository;

    public ManualReviewService(ReviewFlagRepository reviewFlagRepository) {
        this.reviewFlagRepository = reviewFlagRepository;
    }

    @Transactional
    public ReviewFlag createFlag(Long submissionId, String reason) {
        ReviewFlag f = ReviewFlag.builder()
                .submissionId(submissionId)
                .reason(reason)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();
        return reviewFlagRepository.save(f);
    }

    public List<ReviewFlag> listByStatus(String status) {
        if (status == null)
            return reviewFlagRepository.findAll();
        return reviewFlagRepository.findByStatus(status);
    }

    public ReviewFlag get(Long id) {
        return reviewFlagRepository.findById(id).orElse(null);
    }

    @Transactional
    public ReviewFlag update(Long id, String status, Long reviewerId, String notes) {
        ReviewFlag f = reviewFlagRepository.findById(id).orElse(null);
        if (f == null)
            return null;
        f.setStatus(status != null ? status : f.getStatus());
        f.setReviewerId(reviewerId != null ? reviewerId : f.getReviewerId());
        f.setNotes(notes != null ? notes : f.getNotes());
        f.setUpdatedAt(LocalDateTime.now());
        return reviewFlagRepository.save(f);
    }

    @Transactional
    public void delete(Long id) {
        reviewFlagRepository.deleteById(id);
    }
}
