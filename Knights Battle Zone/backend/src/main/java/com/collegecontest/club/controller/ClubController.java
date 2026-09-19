package com.collegecontest.club.controller;

import com.collegecontest.club.dto.*;
import com.collegecontest.club.service.ClubService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clubs")
@RequiredArgsConstructor
public class ClubController {

    private final ClubService clubService;

    @PostMapping
    public ResponseEntity<ClubDetailDTO> createClub(@Valid @RequestBody CreateClubRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clubService.createClub(request, currentEmail()));
    }

    @GetMapping
    public ResponseEntity<List<ClubSummaryDTO>> listClubs() {
        return ResponseEntity.ok(clubService.listClubs(currentEmail()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClubDetailDTO> getClub(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getClub(id, currentEmail()));
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<ClubDetailDTO> joinClub(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.joinClub(id, currentEmail()));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Void> leaveClub(@PathVariable Long id) {
        clubService.leaveClub(id, currentEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/challenges")
    public ResponseEntity<List<ClubChallengeDTO>> getChallenges(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getChallenges(id, currentEmail()));
    }

    @PostMapping("/{id}/challenges")
    public ResponseEntity<ClubChallengeDTO> createChallenge(
            @PathVariable Long id,
            @Valid @RequestBody CreateClubChallengeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clubService.createChallenge(id, request, currentEmail()));
    }

    @PostMapping("/{id}/challenges/{challengeId}/attempts")
    public ResponseEntity<ClubRankingEntryDTO> submitChallengeAttempt(
            @PathVariable Long id,
            @PathVariable Long challengeId,
            @Valid @RequestBody ChallengeAttemptRequest request
    ) {
        return ResponseEntity.ok(clubService.submitAttempt(id, challengeId, request, currentEmail()));
    }

    @GetMapping("/{id}/rankings")
    public ResponseEntity<List<ClubRankingEntryDTO>> getRankings(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getRankings(id, currentEmail()));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<ClubPostDTO>> getPosts(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getPosts(id, currentEmail()));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<ClubPostDTO> createPost(
            @PathVariable Long id,
            @Valid @RequestBody CreateClubPostRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clubService.createPost(id, request, currentEmail()));
    }

    @DeleteMapping("/{id}/posts/{postId}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id, @PathVariable Long postId) {
        clubService.deletePost(id, postId, currentEmail());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ClubMessageDTO>> getMessages(@PathVariable Long id) {
        return ResponseEntity.ok(clubService.getMessages(id, currentEmail()));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ClubMessageDTO> createMessage(
            @PathVariable Long id,
            @Valid @RequestBody CreateClubMessageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clubService.createMessage(id, request, currentEmail()));
    }

    @DeleteMapping("/{id}/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id, @PathVariable Long messageId) {
        clubService.deleteMessage(id, messageId, currentEmail());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{memberUserId}/mute")
    public ResponseEntity<Void> muteMember(
            @PathVariable Long id,
            @PathVariable Long memberUserId,
            @Valid @RequestBody MuteMemberRequest request
    ) {
        clubService.muteMember(id, memberUserId, request, currentEmail());
        return ResponseEntity.noContent().build();
    }

    private String currentEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return "";
        }
        return auth.getName();
    }
}

