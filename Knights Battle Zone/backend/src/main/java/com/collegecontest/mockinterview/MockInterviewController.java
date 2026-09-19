package com.collegecontest.mockinterview;

import com.collegecontest.mockinterview.dto.AIInterviewStartRequest;
import com.collegecontest.mockinterview.dto.AIInterviewSubmitRequest;
import com.collegecontest.mockinterview.dto.InterviewFeedbackRequest;
import com.collegecontest.mockinterview.dto.InterviewQuestionRequest;
import com.collegecontest.mockinterview.dto.InterviewQuestionResponse;
import com.collegecontest.mockinterview.dto.InterviewRequest;
import com.collegecontest.mockinterview.dto.InterviewResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressRequest;
import com.collegecontest.mockinterview.dto.MasteryTrackProgressResponse;
import com.collegecontest.mockinterview.dto.MasteryTrackSessionRequest;
import com.collegecontest.mockinterview.dto.OverallInterviewAnalyticsDTO;
import com.collegecontest.mockinterview.dto.UserInterviewAnalyticsDTO;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
public class MockInterviewController {

    private final MockInterviewService service;
    private final UserRepository userRepository;

    public MockInterviewController(MockInterviewService service, UserRepository userRepository) {
        this.service = service;
        this.userRepository = userRepository;
    }

    @GetMapping("/interviews")
    public ResponseEntity<List<InterviewResponse>> listMyInterviews(
            @RequestParam(required = false) String mode,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        Long userId = currentUserId();
        return ResponseEntity.ok(service.getUserInterviews(userId, mode, type, status));
    }

    @PostMapping("/interviews")
    public ResponseEntity<InterviewResponse> schedule(@RequestBody InterviewRequest req) {
        Long userId = currentUserId();
        String userName = currentUserName();
        InterviewResponse resp = service.createSessionFromRequest(userId, userName, req);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/interviews/{id}")
    public ResponseEntity<InterviewResponse> get(@PathVariable Long id) {
        InterviewResponse resp = service.getInterview(id);
        if (resp == null) {
            return ResponseEntity.notFound().build();
        }
        Long currentUserId = currentUserId();
        if (!resp.getUserId().equals(currentUserId) && (resp.getInterviewerId() == null || !resp.getInterviewerId().equals(currentUserId))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/interviews/session/{sessionId}")
    public ResponseEntity<InterviewResponse> getBySessionId(@PathVariable String sessionId) {
        InterviewResponse resp = service.getInterviewBySessionId(sessionId);
        if (resp == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/users/{userId}/interviews")
    public ResponseEntity<List<InterviewResponse>> listForUser(@PathVariable Long userId) {
        Long currentUserId = currentUserId();
        if (!currentUserId.equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        List<InterviewResponse> list = service.getUserInterviews(userId, null, null, null);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/interviews/ai")
    public ResponseEntity<InterviewResponse> startAiInterview(@RequestBody AIInterviewStartRequest req) {
        return ResponseEntity.ok(service.startAiInterview(currentUserId(), currentUserName(), req));
    }

    @PostMapping("/interviews/ai/submit")
    public ResponseEntity<InterviewResponse> submitAiAnswer(@RequestBody AIInterviewSubmitRequest req) {
        return ResponseEntity.ok(service.submitAiAnswer(currentUserId(), req));
    }

    @PostMapping("/interviews/peer")
    public ResponseEntity<InterviewResponse> requestPeerInterview(@RequestBody InterviewRequest req) {
        return ResponseEntity.ok(service.requestPeerInterview(currentUserId(), currentUserName(), req));
    }

    @PostMapping("/interviews/schedule")
    public ResponseEntity<InterviewResponse> scheduleExpertInterview(@RequestBody InterviewRequest req) {
        return ResponseEntity.ok(service.scheduleExpertInterview(currentUserId(), currentUserName(), req));
    }

    @PutMapping("/interviews/{id}/feedback")
    public ResponseEntity<InterviewResponse> addFeedback(
            @PathVariable Long id,
            @RequestBody InterviewFeedbackRequest req) {
        Interview updated = service.addFeedbackAndRecording(id, req);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        InterviewResponse response = service.getInterview(updated.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/interviews/{id}")
    public ResponseEntity<Void> cancelInterview(@PathVariable Long id) {
        service.cancelInterview(id, currentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/questions")
    public ResponseEntity<List<InterviewQuestionResponse>> questions(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String difficulty) {
        return ResponseEntity.ok(service.getQuestions(type, difficulty));
    }

    @PostMapping("/questions")
    public ResponseEntity<InterviewQuestionResponse> createQuestion(@RequestBody InterviewQuestionRequest req) {
        InterviewQuestionResponse created = service.createQuestion(currentUserId(), req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/questions/{id}")
    public ResponseEntity<InterviewQuestionResponse> updateQuestion(
            @PathVariable Long id,
            @RequestBody InterviewQuestionRequest req) {
        return ResponseEntity.ok(service.updateQuestion(id, req));
    }

    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        service.deleteQuestion(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/interviews/mastery/progress")
    public ResponseEntity<List<MasteryTrackProgressResponse>> masteryProgress() {
        return ResponseEntity.ok(service.getMasteryTrackProgress(currentUserId()));
    }

    @PostMapping("/interviews/mastery/progress")
    public ResponseEntity<MasteryTrackProgressResponse> upsertMasteryProgress(@RequestBody MasteryTrackProgressRequest req) {
        return ResponseEntity.ok(service.upsertMasteryTrackProgress(currentUserId(), req));
    }

    @PostMapping("/interviews/mastery/progress/session")
    public ResponseEntity<MasteryTrackProgressResponse> recordMasterySession(@RequestBody MasteryTrackSessionRequest req) {
        return ResponseEntity.ok(service.recordMasteryTrackSession(currentUserId(), req));
    }

    @GetMapping("/analytics/user/{id}")
    public ResponseEntity<UserInterviewAnalyticsDTO> userAnalytics(@PathVariable Long id) {
        Long currentUserId = currentUserId();
        if (!currentUserId.equals(id) && !isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return ResponseEntity.ok(service.getUserAnalytics(id));
    }

    @GetMapping("/analytics/overall")
    public ResponseEntity<OverallInterviewAnalyticsDTO> overallAnalytics() {
        if (!isAdmin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin only");
        }
        return ResponseEntity.ok(service.getOverallAnalytics());
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return user.getId();
    }

    private String currentUserName() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return user.getName();
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        String email = authentication.getName();
        User user = userRepository.findByEmail(email).orElse(null);
        return user != null && user.getRole() != null
                && ("ADMIN".equalsIgnoreCase(user.getRole().name()) || "SUPER_ADMIN".equalsIgnoreCase(user.getRole().name()));
    }
}
