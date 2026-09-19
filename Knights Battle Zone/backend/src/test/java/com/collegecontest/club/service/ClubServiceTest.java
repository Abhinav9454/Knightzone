package com.collegecontest.club.service;

import com.collegecontest.club.dto.ClubRankingEntryDTO;
import com.collegecontest.club.dto.CreateClubChallengeRequest;
import com.collegecontest.club.model.*;
import com.collegecontest.club.repository.*;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClubServiceTest {

    @Mock private ClubRepository clubRepository;
    @Mock private ClubMemberRepository clubMemberRepository;
    @Mock private ClubChallengeRepository clubChallengeRepository;
    @Mock private ClubChallengeAttemptRepository clubChallengeAttemptRepository;
    @Mock private ClubPostRepository clubPostRepository;
    @Mock private ClubMessageRepository clubMessageRepository;
    @Mock private UserRepository userRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ClubService clubService;

    @Test
    void getRankings_shouldAggregateAndSortByPointsThenWpm() {
        Long clubId = 10L;

        User current = user(1L, "viewer@example.com", "Viewer");
        when(userRepository.findByEmailIgnoreCase("viewer@example.com")).thenReturn(Optional.of(current));

        Club club = club(clubId, current, ClubVisibility.PUBLIC);
        when(clubRepository.findById(clubId)).thenReturn(Optional.of(club));

        User alice = user(2L, "alice@example.com", "Alice");
        User bob = user(3L, "bob@example.com", "Bob");

        when(clubMemberRepository.findByClubId(clubId)).thenReturn(List.of(
                member(club, alice, ClubMemberRole.MEMBER),
                member(club, bob, ClubMemberRole.MEMBER)
        ));

        ClubChallenge challenge = challenge(100L, club);
        when(clubChallengeAttemptRepository.findByChallengeClubId(clubId)).thenReturn(List.of(
                attempt(challenge, alice, 90, 98, 88.2),
                attempt(challenge, bob, 95, 90, 85.5),
                attempt(challenge, bob, 80, 95, 76.0)
        ));

        List<ClubRankingEntryDTO> rankings = clubService.getRankings(clubId, "viewer@example.com");

        assertThat(rankings).hasSize(2);
        assertThat(rankings.get(0).userName()).isEqualTo("Bob");
        assertThat(rankings.get(0).totalPoints()).isEqualTo(161.5);
        assertThat(rankings.get(1).userName()).isEqualTo("Alice");
        assertThat(rankings.get(1).totalPoints()).isEqualTo(88.2);
    }

    @Test
    void createChallenge_shouldRejectMemberRole() {
        Long clubId = 50L;
        User memberUser = user(7L, "member@example.com", "Member");
        when(userRepository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(memberUser));

        Club club = club(clubId, user(9L, "owner@example.com", "Owner"), ClubVisibility.PUBLIC);
        ClubMember membership = member(club, memberUser, ClubMemberRole.MEMBER);

        when(clubMemberRepository.findByClubIdAndUserId(clubId, memberUser.getId())).thenReturn(Optional.of(membership));

        CreateClubChallengeRequest request = new CreateClubChallengeRequest(
                "Weekly Accuracy",
                "Hit 98%+",
                ClubChallengeFrequency.WEEKLY,
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(7)
        );

        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class,
                () -> clubService.createChallenge(clubId, request, "member@example.com")
        );

        assertThat(ex.getStatusCode().value()).isEqualTo(403);
        verify(clubChallengeRepository, never()).save(any());
    }

    @Test
    void createChallenge_shouldAllowModeratorAndBroadcastUpdate() {
        Long clubId = 60L;
        User modUser = user(8L, "mod@example.com", "Mod");
        when(userRepository.findByEmailIgnoreCase("mod@example.com")).thenReturn(Optional.of(modUser));

        Club club = club(clubId, user(9L, "owner@example.com", "Owner"), ClubVisibility.PUBLIC);
        ClubMember membership = member(club, modUser, ClubMemberRole.MODERATOR);

        when(clubMemberRepository.findByClubIdAndUserId(clubId, modUser.getId())).thenReturn(Optional.of(membership));
        when(clubRepository.findById(clubId)).thenReturn(Optional.of(club));
        when(clubChallengeRepository.save(any(ClubChallenge.class))).thenAnswer(invocation -> {
            ClubChallenge c = invocation.getArgument(0);
            c.setId(101L);
            return c;
        });

        CreateClubChallengeRequest request = new CreateClubChallengeRequest(
                "Monthly Sprint",
                "Speed + consistency",
                ClubChallengeFrequency.MONTHLY,
                LocalDateTime.now(),
                LocalDateTime.now().plusDays(30)
        );

        clubService.createChallenge(clubId, request, "mod@example.com");

        verify(clubChallengeRepository, times(1)).save(any(ClubChallenge.class));
        verify(messagingTemplate, atLeastOnce()).convertAndSend(
                eq("/topic/clubs/" + clubId + "/updates"),
                any(com.collegecontest.club.dto.ClubUpdateEventDTO.class)
        );
    }

    private static User user(Long id, String email, String name) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setName(name);
        return user;
    }

    private static Club club(Long id, User owner, ClubVisibility visibility) {
        Club club = new Club();
        club.setId(id);
        club.setOwner(owner);
        club.setName("Club " + id);
        club.setVisibility(visibility);
        return club;
    }

    private static ClubMember member(Club club, User user, ClubMemberRole role) {
        ClubMember member = new ClubMember();
        member.setClub(club);
        member.setUser(user);
        member.setRole(role);
        return member;
    }

    private static ClubChallenge challenge(Long id, Club club) {
        ClubChallenge challenge = new ClubChallenge();
        challenge.setId(id);
        challenge.setClub(club);
        challenge.setTitle("Challenge " + id);
        return challenge;
    }

    private static ClubChallengeAttempt attempt(ClubChallenge challenge, User user, double wpm, double accuracy, double points) {
        ClubChallengeAttempt attempt = new ClubChallengeAttempt();
        attempt.setChallenge(challenge);
        attempt.setUser(user);
        attempt.setWpm(wpm);
        attempt.setAccuracy(accuracy);
        attempt.setPoints(points);
        return attempt;
    }
}
