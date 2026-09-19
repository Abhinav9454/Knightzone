package com.collegecontest.club.service;

import com.collegecontest.club.dto.*;
import com.collegecontest.club.model.*;
import com.collegecontest.model.Role;
import com.collegecontest.club.repository.*;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubChallengeRepository clubChallengeRepository;
    private final ClubChallengeAttemptRepository clubChallengeAttemptRepository;
    private final ClubPostRepository clubPostRepository;
    private final ClubMessageRepository clubMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ClubDetailDTO createClub(CreateClubRequest request, String email) {
        User current = getCurrentUser(email);
        if (current.getRole() != Role.ADMIN && current.getRole() != Role.SUPER_ADMIN) {
            throw new ResponseStatusException(FORBIDDEN, "Only admin users can create clubs");
        }

        Club club = new Club();
        club.setName(request.name().trim());
        club.setDescription(request.description());
        club.setVisibility(request.visibility() == null ? ClubVisibility.PUBLIC : request.visibility());
        club.setOwner(current);

        Club saved = clubRepository.save(club);

        ClubMember ownerMembership = new ClubMember();
        ownerMembership.setClub(saved);
        ownerMembership.setUser(current);
        ownerMembership.setRole(ClubMemberRole.OWNER);
        ClubMember membership = clubMemberRepository.save(ownerMembership);

        emitUpdate(saved.getId(), "CLUB_CREATED", current.getName() + " created the club");
        return toDetail(saved, membership);
    }

    @Transactional(readOnly = true)
    public List<ClubSummaryDTO> listClubs(String email) {
        User current = getCurrentUser(email);
        Set<Long> memberClubIds = clubMemberRepository.findByUserId(current.getId()).stream()
                .map(cm -> cm.getClub().getId())
                .collect(Collectors.toSet());

        return clubRepository.findAll().stream()
                .filter(club -> club.getVisibility() == ClubVisibility.PUBLIC || memberClubIds.contains(club.getId()))
                .map(club -> {
                    ClubMember membership = clubMemberRepository.findByClubIdAndUserId(club.getId(), current.getId())
                            .orElse(null);
                    return toSummary(club, membership);
                })
                .sorted(Comparator.comparing(ClubSummaryDTO::memberCount).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public ClubDetailDTO getClub(Long clubId, String email) {
        User current = getCurrentUser(email);
        Club club = getClubOrThrow(clubId);
        ClubMember membership = clubMemberRepository.findByClubIdAndUserId(clubId, current.getId()).orElse(null);

        if (club.getVisibility() == ClubVisibility.PRIVATE
                && membership == null
                && !club.getOwner().getId().equals(current.getId())) {
            throw new ResponseStatusException(FORBIDDEN, "Private club access denied");
        }

        return toDetail(club, membership);
    }

    public ClubDetailDTO joinClub(Long clubId, String email) {
        User current = getCurrentUser(email);
        Club club = getClubOrThrow(clubId);

        ClubMember existing = clubMemberRepository.findByClubIdAndUserId(clubId, current.getId()).orElse(null);
        if (existing != null) {
            return toDetail(club, existing);
        }

        if (club.getVisibility() == ClubVisibility.PRIVATE) {
            throw new ResponseStatusException(FORBIDDEN, "Private clubs require invitation");
        }

        ClubMember member = new ClubMember();
        member.setClub(club);
        member.setUser(current);
        member.setRole(ClubMemberRole.MEMBER);
        ClubMember saved = clubMemberRepository.save(member);

        emitUpdate(clubId, "MEMBER_JOINED", current.getName() + " joined the club");
        return toDetail(club, saved);
    }

    public void leaveClub(Long clubId, String email) {
        User current = getCurrentUser(email);
        ClubMember membership = getMembershipOrThrow(clubId, current.getId());

        if (membership.getRole() == ClubMemberRole.OWNER) {
            throw new ResponseStatusException(BAD_REQUEST, "Owner cannot leave the club without role transfer");
        }

        clubMemberRepository.delete(membership);
        emitUpdate(clubId, "MEMBER_LEFT", current.getName() + " left the club");
    }

    public ClubChallengeDTO createChallenge(Long clubId, CreateClubChallengeRequest request, String email) {
        User current = getCurrentUser(email);
        ensureModerator(clubId, current.getId());

        if (request.endsAt().isBefore(request.startsAt())) {
            throw new ResponseStatusException(BAD_REQUEST, "Challenge end time must be after start time");
        }

        ClubChallenge challenge = new ClubChallenge();
        challenge.setClub(getClubOrThrow(clubId));
        challenge.setTitle(request.title());
        challenge.setDescription(request.description());
        challenge.setFrequency(request.frequency());
        challenge.setStartsAt(request.startsAt());
        challenge.setEndsAt(request.endsAt());
        challenge.setStatus(ClubChallengeStatus.ACTIVE);
        challenge.setCreatedBy(current);

        ClubChallenge saved = clubChallengeRepository.save(challenge);
        emitUpdate(clubId, "CHALLENGE_CREATED", "New challenge: " + saved.getTitle());
        return toChallenge(saved);
    }

    @Transactional(readOnly = true)
    public List<ClubChallengeDTO> getChallenges(Long clubId, String email) {
        User current = getCurrentUser(email);
        ensureReadable(clubId, current.getId());
        return clubChallengeRepository.findByClubIdOrderByStartsAtDesc(clubId).stream()
                .map(this::toChallenge)
                .toList();
    }

    public ClubRankingEntryDTO submitAttempt(Long clubId, Long challengeId, ChallengeAttemptRequest request, String email) {
        User current = getCurrentUser(email);
        ClubMember membership = getMembershipOrThrow(clubId, current.getId());
        ensureNotMuted(membership);

        ClubChallenge challenge = clubChallengeRepository.findById(challengeId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Challenge not found"));
        if (!challenge.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Challenge does not belong to this club");
        }

        double points = score(request.wpm(), request.accuracy());
        ClubChallengeAttempt attempt = new ClubChallengeAttempt();
        attempt.setChallenge(challenge);
        attempt.setUser(current);
        attempt.setWpm(request.wpm());
        attempt.setAccuracy(request.accuracy());
        attempt.setPoints(points);
        clubChallengeAttemptRepository.save(attempt);

        emitUpdate(clubId, "CHALLENGE_ATTEMPT", current.getName() + " submitted a challenge attempt");

        return getRankings(clubId, email).stream()
                .filter(entry -> Objects.equals(entry.userId(), current.getId()))
                .findFirst()
                .orElse(new ClubRankingEntryDTO(current.getId(), current.getName(), points, request.wpm(), request.accuracy()));
    }

    @Transactional(readOnly = true)
    public List<ClubRankingEntryDTO> getRankings(Long clubId, String email) {
        User current = getCurrentUser(email);
        ensureReadable(clubId, current.getId());

        List<ClubMember> members = clubMemberRepository.findByClubId(clubId);
        List<ClubChallengeAttempt> attempts = clubChallengeAttemptRepository.findByChallengeClubId(clubId);

        Map<Long, String> names = members.stream()
                .collect(Collectors.toMap(m -> m.getUser().getId(), m -> m.getUser().getName(), (a, b) -> a));

        Map<Long, Double> totals = new HashMap<>();
        Map<Long, Double> bestWpm = new HashMap<>();
        Map<Long, Double> bestAccuracy = new HashMap<>();

        for (ClubChallengeAttempt attempt : attempts) {
            Long userId = attempt.getUser().getId();
            totals.merge(userId, attempt.getPoints(), Double::sum);
            bestWpm.merge(userId, attempt.getWpm(), Math::max);
            bestAccuracy.merge(userId, attempt.getAccuracy(), Math::max);
        }

        return members.stream()
                .map(member -> {
                    Long userId = member.getUser().getId();
                    return new ClubRankingEntryDTO(
                            userId,
                            names.getOrDefault(userId, "Unknown"),
                            totals.getOrDefault(userId, 0.0),
                            bestWpm.getOrDefault(userId, 0.0),
                            bestAccuracy.getOrDefault(userId, 0.0));
                })
                .sorted(Comparator
                        .comparingDouble(ClubRankingEntryDTO::totalPoints).reversed()
                        .thenComparing(Comparator.comparingDouble(ClubRankingEntryDTO::bestWpm).reversed())
                        .thenComparing(ClubRankingEntryDTO::userName))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClubPostDTO> getPosts(Long clubId, String email) {
        User current = getCurrentUser(email);
        ensureReadable(clubId, current.getId());
        return clubPostRepository.findByClubIdAndDeletedFalseOrderByCreatedAtDesc(clubId).stream()
                .map(this::toPost)
                .toList();
    }

    public ClubPostDTO createPost(Long clubId, CreateClubPostRequest request, String email) {
        User current = getCurrentUser(email);
        ClubMember membership = getMembershipOrThrow(clubId, current.getId());
        ensureNotMuted(membership);

        ClubPost post = new ClubPost();
        post.setClub(getClubOrThrow(clubId));
        post.setAuthor(current);
        post.setTitle(request.title());
        post.setContent(request.content());

        ClubPost saved = clubPostRepository.save(post);
        emitUpdate(clubId, "POST_CREATED", current.getName() + " posted in forum");
        return toPost(saved);
    }

    public void deletePost(Long clubId, Long postId, String email) {
        User current = getCurrentUser(email);
        ClubPost post = clubPostRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));
        if (!post.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Post does not belong to this club");
        }

        ClubMember membership = getMembershipOrThrow(clubId, current.getId());
        boolean canModerate = membership.getRole() == ClubMemberRole.OWNER || membership.getRole() == ClubMemberRole.MODERATOR;
        boolean ownPost = post.getAuthor().getId().equals(current.getId());
        if (!canModerate && !ownPost) {
            throw new ResponseStatusException(FORBIDDEN, "Not allowed to delete this post");
        }

        post.setDeleted(true);
        clubPostRepository.save(post);
        emitUpdate(clubId, "POST_DELETED", "A forum post was removed");
    }

    @Transactional(readOnly = true)
    public List<ClubMessageDTO> getMessages(Long clubId, String email) {
        User current = getCurrentUser(email);
        ensureReadable(clubId, current.getId());
        return clubMessageRepository.findTop200ByClubIdAndDeletedFalseOrderByCreatedAtDesc(clubId).stream()
                .sorted(Comparator.comparing(ClubMessage::getCreatedAt))
                .map(this::toMessage)
                .toList();
    }

    public ClubMessageDTO createMessage(Long clubId, CreateClubMessageRequest request, String email) {
        User current = getCurrentUser(email);
        ClubMember membership = getMembershipOrThrow(clubId, current.getId());
        ensureNotMuted(membership);

        ClubMessage message = new ClubMessage();
        message.setClub(getClubOrThrow(clubId));
        message.setSender(current);
        message.setMessage(request.message().trim());

        ClubMessage saved = clubMessageRepository.save(message);
        ClubMessageDTO dto = toMessage(saved);

        messagingTemplate.convertAndSend("/topic/clubs/" + clubId + "/chat", dto);
        return dto;
    }

    public ClubMessageDTO createMessageFromSocket(Long clubId, String text, String email) {
        return createMessage(clubId, new CreateClubMessageRequest(text), email);
    }

    public void deleteMessage(Long clubId, Long messageId, String email) {
        User current = getCurrentUser(email);
        ClubMessage message = clubMessageRepository.findById(messageId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Message not found"));
        if (!message.getClub().getId().equals(clubId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Message does not belong to this club");
        }

        ClubMember membership = getMembershipOrThrow(clubId, current.getId());
        boolean canModerate = membership.getRole() == ClubMemberRole.OWNER || membership.getRole() == ClubMemberRole.MODERATOR;
        boolean ownMessage = message.getSender().getId().equals(current.getId());
        if (!canModerate && !ownMessage) {
            throw new ResponseStatusException(FORBIDDEN, "Not allowed to delete this message");
        }

        message.setDeleted(true);
        clubMessageRepository.save(message);
        emitUpdate(clubId, "MESSAGE_DELETED", "A chat message was removed");
    }

    public void muteMember(Long clubId, Long targetUserId, MuteMemberRequest request, String email) {
        User current = getCurrentUser(email);
        ensureModerator(clubId, current.getId());

        ClubMember target = getMembershipOrThrow(clubId, targetUserId);
        if (target.getRole() == ClubMemberRole.OWNER) {
            throw new ResponseStatusException(FORBIDDEN, "Owner cannot be muted");
        }

        target.setMutedUntil(LocalDateTime.now().plusMinutes(request.minutes()));
        clubMemberRepository.save(target);
        emitUpdate(clubId, "MEMBER_MUTED", target.getUser().getName() + " was muted");
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    private Club getClubOrThrow(Long clubId) {
        return clubRepository.findById(clubId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Club not found"));
    }

    private ClubMember getMembershipOrThrow(Long clubId, Long userId) {
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Club membership required"));
    }

    private void ensureReadable(Long clubId, Long userId) {
        Club club = getClubOrThrow(clubId);
        if (club.getVisibility() == ClubVisibility.PUBLIC || club.getOwner().getId().equals(userId)) {
            return;
        }
        clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Private club access denied"));
    }

    private void ensureModerator(Long clubId, Long userId) {
        ClubMember membership = getMembershipOrThrow(clubId, userId);
        if (membership.getRole() != ClubMemberRole.OWNER && membership.getRole() != ClubMemberRole.MODERATOR) {
            throw new ResponseStatusException(FORBIDDEN, "Moderator permission required");
        }
    }

    private void ensureNotMuted(ClubMember membership) {
        if (membership.getMutedUntil() != null && membership.getMutedUntil().isAfter(LocalDateTime.now())) {
            throw new ResponseStatusException(FORBIDDEN, "You are temporarily muted in this club");
        }
    }

    private double score(double wpm, double accuracy) {
        double points = wpm * (accuracy / 100.0);
        return Math.round(points * 100.0) / 100.0;
    }

    private ClubSummaryDTO toSummary(Club club, ClubMember membership) {
        return new ClubSummaryDTO(
                club.getId(),
                club.getName(),
                club.getDescription(),
                club.getVisibility(),
                clubMemberRepository.countByClubId(club.getId()),
                membership != null,
                membership != null ? membership.getRole() : null
        );
    }

    private ClubDetailDTO toDetail(Club club, ClubMember membership) {
        return new ClubDetailDTO(
                club.getId(),
                club.getName(),
                club.getDescription(),
                club.getVisibility(),
                club.getOwner().getId(),
                club.getOwner().getName(),
                clubMemberRepository.countByClubId(club.getId()),
                membership != null,
                membership != null ? membership.getRole() : null,
                club.getCreatedAt()
        );
    }

    private ClubChallengeDTO toChallenge(ClubChallenge challenge) {
        return new ClubChallengeDTO(
                challenge.getId(),
                challenge.getClub().getId(),
                challenge.getTitle(),
                challenge.getDescription(),
                challenge.getFrequency(),
                challenge.getStatus(),
                challenge.getStartsAt(),
                challenge.getEndsAt(),
                challenge.getCreatedAt()
        );
    }

    private ClubPostDTO toPost(ClubPost post) {
        return new ClubPostDTO(
                post.getId(),
                post.getClub().getId(),
                post.getAuthor().getId(),
                post.getAuthor().getName(),
                post.getTitle(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private ClubMessageDTO toMessage(ClubMessage message) {
        return new ClubMessageDTO(
                message.getId(),
                message.getClub().getId(),
                message.getSender().getId(),
                message.getSender().getName(),
                message.getMessage(),
                message.getCreatedAt()
        );
    }

    private void emitUpdate(Long clubId, String type, String message) {
        messagingTemplate.convertAndSend(
                "/topic/clubs/" + clubId + "/updates",
                new ClubUpdateEventDTO(type, message, clubId, LocalDateTime.now())
        );
    }
}
