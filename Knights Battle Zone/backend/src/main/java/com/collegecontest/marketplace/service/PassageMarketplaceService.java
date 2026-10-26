package com.collegecontest.marketplace.service;

import com.collegecontest.marketplace.dto.*;
import com.collegecontest.marketplace.model.*;
import com.collegecontest.marketplace.repository.*;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

import static org.springframework.http.HttpStatus.*;

@Service
@Transactional
public class PassageMarketplaceService {

    private final PassageRepository passageRepository;
    private final PassageTagRepository passageTagRepository;
    private final PassageRatingRepository passageRatingRepository;
    private final PassageBookmarkRepository passageBookmarkRepository;
    private final PassageModerationRepository passageModerationRepository;
    private final PassageModerationAuditRepository passageModerationAuditRepository;
    private final UserRepository userRepository;

    public PassageMarketplaceService(
            PassageRepository passageRepository,
            PassageTagRepository passageTagRepository,
            PassageRatingRepository passageRatingRepository,
            PassageBookmarkRepository passageBookmarkRepository,
            PassageModerationRepository passageModerationRepository,
            PassageModerationAuditRepository passageModerationAuditRepository,
            UserRepository userRepository
    ) {
        this.passageRepository = passageRepository;
        this.passageTagRepository = passageTagRepository;
        this.passageRatingRepository = passageRatingRepository;
        this.passageBookmarkRepository = passageBookmarkRepository;
        this.passageModerationRepository = passageModerationRepository;
        this.passageModerationAuditRepository = passageModerationAuditRepository;
        this.userRepository = userRepository;
    }

    public PassageDTO createPassage(CreatePassageRequest request, String email) {
        User current = getCurrentUser(email);
        boolean admin = isAdmin(current);

        Passage passage = new Passage();
        passage.setTitle(request.title().trim());
        passage.setContent(request.content().trim());
        passage.setPreview(buildPreview(request.content()));
        passage.setSyntaxMode(normalizeSyntaxMode(request.syntaxMode()));
        passage.setAuthor(current);
        passage.setFeatured(admin && Boolean.TRUE.equals(request.featured()));
        passage.setApproved(admin);
        passage.setStatus(admin ? PassageStatus.APPROVED : PassageStatus.PENDING);

        Passage saved = passageRepository.save(passage);
        syncTags(saved, request.tags());
        return toDTO(saved, current, true);
    }

    @Transactional(readOnly = true)
    public Page<PassageDTO> listPassages(
            String search,
            String tag,
            String sort,
            Boolean mine,
            int page,
            int size,
            String email
    ) {
        User current = getCurrentUser(email);
        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        Page<Passage> rows;
        if (Boolean.TRUE.equals(mine)) {
            rows = passageRepository.findMine(current.getId(), pageable);
        } else {
            String normalizedSort = normalizeSort(sort);
            String normalizedSearch = normalizeNullable(search);
            String normalizedTag = normalizeNullable(tag);

            rows = switch (normalizedSort) {
                case "featured" -> passageRepository.findFeatured(normalizedSearch, normalizedTag, pageable);
                case "trending" -> passageRepository.findTrending(normalizedSearch, normalizedTag, pageable);
                default -> passageRepository.findApproved(normalizedSearch, normalizedTag, pageable);
            };
        }

        return rows.map(row -> toDTO(row, current, false));
    }

    public Page<PassageDTO> getFeatured(String search, String tag, int page, int size, String email) {
        return listPassages(search, tag, "featured", false, page, size, email);
    }

    public Page<PassageDTO> getTrending(String search, String tag, int page, int size, String email) {
        return listPassages(search, tag, "trending", false, page, size, email);
    }

    public PassageDTO getPassage(Long passageId, String email) {
        User current = getCurrentUser(email);
        Passage passage = getPassageOrThrow(passageId);
        ensureCanView(passage, current);

        passage.setPlayCount(Math.max(0, passage.getPlayCount()) + 1);
        passage.setLastPlayedAt(LocalDateTime.now());
        Passage saved = passageRepository.save(passage);
        return toDTO(saved, current, true);
    }

    public RatePassageResponse ratePassage(Long passageId, RatePassageRequest request, String email) {
        User current = getCurrentUser(email);
        Passage passage = getPassageOrThrow(passageId);
        ensureCanView(passage, current);

        int value = request.rating();
        if (value < 1 || value > 5) {
            throw new ResponseStatusException(BAD_REQUEST, "Rating must be between 1 and 5");
        }

        PassageRating rating = passageRatingRepository.findByPassageIdAndUserId(passageId, current.getId())
                .orElseGet(() -> {
                    PassageRating created = new PassageRating();
                    created.setPassage(passage);
                    created.setUser(current);
                    return created;
                });
        rating.setRating(value);
        rating.setCompleted(request.completed() == null || request.completed());
        passageRatingRepository.save(rating);

        Object[] stats = passageRatingRepository.findRatingStats(passageId);
        double avg = ((Number) stats[0]).doubleValue();
        long count = ((Number) stats[1]).longValue();
        long completedCount = ((Number) stats[2]).longValue();

        passage.setAverageRating(Math.round(avg * 100.0) / 100.0);
        passage.setRatingCount(count);
        passage.setCompletionCount(completedCount);
        passage.setLastRatedAt(LocalDateTime.now());
        passageRepository.save(passage);

        return new RatePassageResponse(passageId, value, passage.getAverageRating(), count);
    }

    public BookmarkResponse toggleBookmark(Long passageId, String email) {
        User current = getCurrentUser(email);
        Passage passage = getPassageOrThrow(passageId);
        ensureCanView(passage, current);

        return passageBookmarkRepository.findByPassageIdAndUserId(passageId, current.getId())
                .map(existing -> {
                    passageBookmarkRepository.delete(existing);
                    return new BookmarkResponse(passageId, false);
                })
                .orElseGet(() -> {
                    PassageBookmark bookmark = new PassageBookmark();
                    bookmark.setPassage(passage);
                    bookmark.setUser(current);
                    passageBookmarkRepository.save(bookmark);
                    return new BookmarkResponse(passageId, true);
                });
    }

    public void reportPassage(Long passageId, ReportPassageRequest request, String email) {
        User current = getCurrentUser(email);
        Passage passage = getPassageOrThrow(passageId);
        ensureCanView(passage, current);

        PassageModeration moderation = new PassageModeration();
        moderation.setPassage(passage);
        moderation.setReporter(current);
        moderation.setReason(request.reason().trim());
        moderation.setStatus(PassageModerationStatus.PENDING);
        passageModerationRepository.save(moderation);
    }

    @Transactional(readOnly = true)
    public Page<PassageModerationDTO> getModerationReports(String status, int page, int size, String email) {
        User current = getCurrentUser(email);
        ensureAdmin(current);

        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        Page<PassageModeration> result;
        PassageModerationStatus normalized = normalizeModerationStatus(status);
        if (normalized == null) {
            result = passageModerationRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            result = passageModerationRepository.findByStatusOrderByCreatedAtDesc(normalized, pageable);
        }

        return result.map(this::toModerationDTO);
    }

    @Transactional(readOnly = true)
    public Page<PassageModerationAuditDTO> getModerationAudit(int page, int size, String reviewerEmail, String email) {
        User current = getCurrentUser(email);
        ensureAdmin(current);

        int safeSize = Math.min(Math.max(size, 1), 50);
        int safePage = Math.max(page, 0);
        PageRequest pageable = PageRequest.of(safePage, safeSize);

        Page<PassageModerationAudit> rows;
        String normalizedReviewerEmail = normalizeNullable(reviewerEmail);
        if (normalizedReviewerEmail == null) {
            rows = passageModerationAuditRepository.findAllByOrderByCreatedAtDesc(pageable);
        } else {
            User reviewer = userRepository.findByEmailIgnoreCase(normalizedReviewerEmail)
                    .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Reviewer not found"));
            rows = passageModerationAuditRepository.findByReviewerIdOrderByCreatedAtDesc(reviewer.getId(), pageable);
        }

        return rows.map(this::toModerationAuditDTO);
    }

    public PassageModerationDTO reviewModeration(Long moderationId, ReviewModerationRequest request, String email) {
        User current = getCurrentUser(email);
        ensureAdmin(current);

        PassageModeration moderation = passageModerationRepository.findById(moderationId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Moderation report not found"));

        String decision = request.decision().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVE", "REJECT").contains(decision)) {
            throw new ResponseStatusException(BAD_REQUEST, "Decision must be APPROVE or REJECT");
        }

        Passage passage = moderation.getPassage();
        PassageModerationStatus previousStatus = moderation.getStatus();
        if ("APPROVE".equals(decision)) {
            moderation.setStatus(PassageModerationStatus.APPROVED);
            passage.setApproved(true);
            passage.setStatus(PassageStatus.APPROVED);
            if (request.featured() != null) {
                passage.setFeatured(request.featured());
            }
        } else {
            moderation.setStatus(PassageModerationStatus.REJECTED);
            passage.setApproved(false);
            passage.setStatus(PassageStatus.REJECTED);
            passage.setFeatured(false);
        }

        moderation.setReviewer(current);
        moderation.setReviewNotes(normalizeNullable(request.notes()));
        moderation.setReviewedAt(LocalDateTime.now());

        passageRepository.save(passage);
        passageModerationRepository.save(moderation);
        saveModerationAudit(moderation, current, decision, previousStatus);
        return toModerationDTO(moderation);
    }

    private void syncTags(Passage passage, List<String> tags) {
        passageTagRepository.deleteByPassageId(passage.getId());
        if (tags == null || tags.isEmpty()) {
            return;
        }

        tags.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase(Locale.ROOT))
                .distinct()
                .limit(20)
                .forEach(tag -> {
                    PassageTag entity = new PassageTag();
                    entity.setPassage(passage);
                    entity.setTag(tag);
                    passageTagRepository.save(entity);
                });
    }

    private PassageDTO toDTO(Passage passage, User current, boolean includeContent) {
        List<String> tags = passageTagRepository.findByPassageIdOrderByTagAsc(passage.getId()).stream()
                .map(PassageTag::getTag)
                .toList();

        boolean bookmarked = passageBookmarkRepository.existsByPassageIdAndUserId(passage.getId(), current.getId());
        Integer myRating = passageRatingRepository.findByPassageIdAndUserId(passage.getId(), current.getId())
                .map(PassageRating::getRating)
                .orElse(null);

        double completionRate = passage.getPlayCount() <= 0
                ? 0.0
                : Math.min(1.0, (double) passage.getCompletionCount() / passage.getPlayCount());

        return new PassageDTO(
                passage.getId(),
                passage.getTitle(),
                passage.getPreview(),
                includeContent ? passage.getContent() : null,
                passage.getSyntaxMode(),
                tags,
                passage.getAuthor().getId(),
                passage.getAuthor().getName(),
                passage.isFeatured(),
                passage.isApproved(),
                passage.getStatus(),
                passage.getAverageRating(),
                passage.getRatingCount(),
                passage.getPlayCount(),
                Math.round(completionRate * 1000.0) / 1000.0,
                bookmarked,
                myRating,
                passage.getCreatedAt(),
                passage.getUpdatedAt()
        );
    }

    private PassageModerationDTO toModerationDTO(PassageModeration row) {
        return new PassageModerationDTO(
                row.getId(),
                row.getPassage().getId(),
                row.getPassage().getTitle(),
                row.getReporter().getId(),
                row.getReporter().getName(),
                row.getReason(),
                row.getStatus(),
                row.getReviewNotes(),
                row.getReviewer() != null ? row.getReviewer().getId() : null,
                row.getReviewer() != null ? row.getReviewer().getName() : null,
                row.getCreatedAt(),
                row.getReviewedAt()
        );
    }

    private PassageModerationAuditDTO toModerationAuditDTO(PassageModerationAudit row) {
        return new PassageModerationAuditDTO(
                row.getId(),
                row.getModeration().getId(),
                row.getPassage().getId(),
                row.getPassage().getTitle(),
                row.getReviewer().getId(),
                row.getReviewer().getName(),
                row.getDecision(),
                row.getPreviousStatus(),
                row.getNextStatus(),
                row.getReviewNotes(),
                row.isFeaturedAfterDecision(),
                row.getCreatedAt()
        );
    }

    private void saveModerationAudit(
            PassageModeration moderation,
            User reviewer,
            String decision,
            PassageModerationStatus previousStatus
    ) {
        PassageModerationAudit audit = new PassageModerationAudit();
        audit.setModeration(moderation);
        audit.setPassage(moderation.getPassage());
        audit.setReviewer(reviewer);
        audit.setDecision(decision);
        audit.setPreviousStatus(previousStatus);
        audit.setNextStatus(moderation.getStatus());
        audit.setReviewNotes(moderation.getReviewNotes());
        audit.setFeaturedAfterDecision(moderation.getPassage().isFeatured());
        passageModerationAuditRepository.save(audit);
    }

    private Passage getPassageOrThrow(Long id) {
        return passageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Passage not found"));
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }

    private void ensureCanView(Passage passage, User current) {
        if (passage.isApproved()) return;
        if (isAdmin(current)) return;
        if (Objects.equals(passage.getAuthor().getId(), current.getId())) return;
        throw new ResponseStatusException(FORBIDDEN, "Passage is under moderation");
    }

    private boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    private void ensureAdmin(User user) {
        if (!isAdmin(user)) {
            throw new ResponseStatusException(FORBIDDEN, "Admin access required");
        }
    }

    private String normalizeSort(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) return "new";
        String lowered = normalized.toLowerCase(Locale.ROOT);
        if (Set.of("featured", "trending", "new").contains(lowered)) {
            return lowered;
        }
        return "new";
    }

    private String normalizeSyntaxMode(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) return "PLAIN";
        String mode = normalized.toUpperCase(Locale.ROOT);
        if (Set.of("PLAIN", "CODE", "MARKDOWN", "TYPESCRIPT", "JAVA", "PYTHON", "CPP").contains(mode)) {
            return mode;
        }
        return "PLAIN";
    }

    private PassageModerationStatus normalizeModerationStatus(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) return null;
        try {
            return PassageModerationStatus.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            throw new ResponseStatusException(BAD_REQUEST, "Invalid moderation status");
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildPreview(String content) {
        String normalized = content.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= 240) return normalized;
        return normalized.substring(0, 240) + "...";
    }
}
