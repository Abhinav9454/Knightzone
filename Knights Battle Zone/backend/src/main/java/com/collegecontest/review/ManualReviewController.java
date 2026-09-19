package com.collegecontest.review;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/review-flags")
public class ManualReviewController {

    private final ManualReviewService manualReviewService;

    public ManualReviewController(ManualReviewService manualReviewService) {
        this.manualReviewService = manualReviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewFlag> create(@RequestBody CreateFlagRequest req) {
        return ResponseEntity.ok(manualReviewService.createFlag(req.getSubmissionId(), req.getReason()));
    }

    @GetMapping
    public ResponseEntity<List<ReviewFlag>> list(@RequestParam(required = false) String status) {
        return ResponseEntity.ok(manualReviewService.listByStatus(status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReviewFlag> get(@PathVariable Long id) {
        ReviewFlag f = manualReviewService.get(id);
        if (f == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(f);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewFlag> update(@PathVariable Long id, @RequestBody UpdateFlagRequest req) {
        ReviewFlag f = manualReviewService.update(id, req.getStatus(), req.getReviewerId(), req.getNotes());
        if (f == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(f);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        manualReviewService.delete(id);
        return ResponseEntity.noContent().build();
    }

    public static class CreateFlagRequest {
        private Long submissionId;
        private String reason;

        public Long getSubmissionId() {
            return submissionId;
        }

        public void setSubmissionId(Long submissionId) {
            this.submissionId = submissionId;
        }

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }

    public static class UpdateFlagRequest {
        private String status;
        private Long reviewerId;
        private String notes;

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public Long getReviewerId() {
            return reviewerId;
        }

        public void setReviewerId(Long reviewerId) {
            this.reviewerId = reviewerId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }
}
