package com.collegecontest.marketplace.service;

import com.collegecontest.marketplace.dto.*;
import com.collegecontest.marketplace.model.*;
import com.collegecontest.marketplace.repository.*;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@ExtendWith(MockitoExtension.class)
class PassageMarketplaceServiceTest {

    @Mock
    private PassageRepository passageRepository;
    @Mock
    private PassageTagRepository passageTagRepository;
    @Mock
    private PassageRatingRepository passageRatingRepository;
    @Mock
    private PassageBookmarkRepository passageBookmarkRepository;
    @Mock
    private PassageModerationRepository passageModerationRepository;
    @Mock
    private PassageModerationAuditRepository passageModerationAuditRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PassageMarketplaceService service;

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    private User user;
    private User admin;
    private Passage passage;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setName("Student");
        user.setEmail(USER_EMAIL);
        user.setRole(Role.STUDENT);

        admin = new User();
        admin.setId(1L);
        admin.setName("Admin");
        admin.setEmail(ADMIN_EMAIL);
        admin.setRole(Role.ADMIN);

        passage = new Passage();
        passage.setId(100L);
        passage.setTitle("Passage");
        passage.setContent("Content");
        passage.setPreview("Content");
        passage.setAuthor(user);
        passage.setApproved(true);
        passage.setStatus(PassageStatus.APPROVED);
        passage.setCreatedAt(LocalDateTime.now());
        passage.setUpdatedAt(LocalDateTime.now());
        passage.setPlayCount(20);
        passage.setCompletionCount(10);

        lenient().when(passageTagRepository.findByPassageIdOrderByTagAsc(anyLong())).thenReturn(List.of());
        lenient().when(passageBookmarkRepository.existsByPassageIdAndUserId(anyLong(), anyLong())).thenReturn(false);
        lenient().when(passageRatingRepository.findByPassageIdAndUserId(anyLong(), anyLong())).thenReturn(Optional.empty());
    }

    @Test
    void createPassage_forNonAdmin_setsPendingAndNormalizesTags() {
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.save(any(Passage.class))).thenAnswer(invocation -> {
            Passage row = invocation.getArgument(0);
            row.setId(200L);
            row.setCreatedAt(LocalDateTime.now());
            row.setUpdatedAt(LocalDateTime.now());
            return row;
        });
        when(passageTagRepository.findByPassageIdOrderByTagAsc(200L))
                .thenReturn(List.of(tag(200L, "algorithms"), tag(200L, "java")));

        CreatePassageRequest request = new CreatePassageRequest(
                "  Daily Practice  ",
                "  Solve arrays and strings every day.  ",
                "typescript",
                List.of(" Algorithms ", "JAVA", "algorithms"),
                true
        );

        PassageDTO result = service.createPassage(request, USER_EMAIL);

        assertEquals("Daily Practice", result.title());
        assertEquals(PassageStatus.PENDING, result.status());
        assertFalse(result.approved());
        assertFalse(result.featured());
        assertEquals("TYPESCRIPT", result.syntaxMode());
        assertEquals(List.of("algorithms", "java"), result.tags());
        verify(passageTagRepository).deleteByPassageId(200L);
        verify(passageTagRepository, times(2)).save(any(PassageTag.class));
    }

    @Test
    void createPassage_forAdmin_allowsFeaturedAndApproved() {
        when(userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        when(passageRepository.save(any(Passage.class))).thenAnswer(invocation -> {
            Passage row = invocation.getArgument(0);
            row.setId(300L);
            row.setCreatedAt(LocalDateTime.now());
            row.setUpdatedAt(LocalDateTime.now());
            return row;
        });

        PassageDTO result = service.createPassage(
                new CreatePassageRequest("Admin Passage", "Some text", "plain", List.of(), true),
                ADMIN_EMAIL
        );

        assertTrue(result.approved());
        assertTrue(result.featured());
        assertEquals(PassageStatus.APPROVED, result.status());
    }

    @Test
    void listPassages_withTrending_sortAndPagingAreNormalized() {
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.findTrending(any(), any(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(passage)));

        Page<PassageDTO> result = service.listPassages("  algo  ", "   ", "TRENDING", false, -3, 999, USER_EMAIL);

        assertEquals(1, result.getTotalElements());
        ArgumentCaptor<PageRequest> pageCaptor = ArgumentCaptor.forClass(PageRequest.class);
        verify(passageRepository).findTrending(eq("algo"), isNull(), pageCaptor.capture());
        assertEquals(0, pageCaptor.getValue().getPageNumber());
        assertEquals(50, pageCaptor.getValue().getPageSize());
    }

    @Test
    void ratePassage_updatesExistingRatingAndAggregates() {
        PassageRating existing = new PassageRating();
        existing.setId(999L);
        existing.setPassage(passage);
        existing.setUser(user);
        existing.setRating(4);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.findById(100L)).thenReturn(Optional.of(passage));
        when(passageRatingRepository.findByPassageIdAndUserId(100L, 10L)).thenReturn(Optional.of(existing));
        when(passageRatingRepository.findRatingStats(100L)).thenReturn(new Object[]{4.236, 2L, 1L});

        RatePassageResponse response = service.ratePassage(100L, new RatePassageRequest(5, true), USER_EMAIL);

        assertEquals(100L, response.passageId());
        assertEquals(5, response.rating());
        assertEquals(4.24, response.averageRating());
        assertEquals(2L, response.ratingCount());
        assertEquals(2L, passage.getRatingCount());
        assertEquals(1L, passage.getCompletionCount());
        verify(passageRatingRepository).save(existing);
        verify(passageRepository).save(passage);
    }

    @Test
    void toggleBookmark_existingBookmark_removesIt() {
        PassageBookmark existing = new PassageBookmark();
        existing.setId(700L);
        existing.setPassage(passage);
        existing.setUser(user);

        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.findById(100L)).thenReturn(Optional.of(passage));
        when(passageBookmarkRepository.findByPassageIdAndUserId(100L, 10L)).thenReturn(Optional.of(existing));

        BookmarkResponse response = service.toggleBookmark(100L, USER_EMAIL);

        assertFalse(response.bookmarked());
        verify(passageBookmarkRepository).delete(existing);
        verify(passageBookmarkRepository, never()).save(any(PassageBookmark.class));
    }

    @Test
    void toggleBookmark_whenMissing_createsBookmark() {
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.findById(100L)).thenReturn(Optional.of(passage));
        when(passageBookmarkRepository.findByPassageIdAndUserId(100L, 10L)).thenReturn(Optional.empty());

        BookmarkResponse response = service.toggleBookmark(100L, USER_EMAIL);

        assertTrue(response.bookmarked());
        verify(passageBookmarkRepository).save(any(PassageBookmark.class));
    }

    @Test
    void reportPassage_createsPendingModerationWithTrimmedReason() {
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));
        when(passageRepository.findById(100L)).thenReturn(Optional.of(passage));

        service.reportPassage(100L, new ReportPassageRequest("  spam content  "), USER_EMAIL);

        ArgumentCaptor<PassageModeration> captor = ArgumentCaptor.forClass(PassageModeration.class);
        verify(passageModerationRepository).save(captor.capture());
        PassageModeration saved = captor.getValue();
        assertEquals("spam content", saved.getReason());
        assertEquals(PassageModerationStatus.PENDING, saved.getStatus());
        assertEquals(user.getId(), saved.getReporter().getId());
    }

    @Test
    void reviewModeration_approve_updatesModerationAndPassage() {
        Passage moderatedPassage = new Passage();
        moderatedPassage.setId(501L);
        moderatedPassage.setTitle("Pending");
        moderatedPassage.setAuthor(user);
        moderatedPassage.setStatus(PassageStatus.PENDING);
        moderatedPassage.setApproved(false);

        PassageModeration moderation = new PassageModeration();
        moderation.setId(41L);
        moderation.setPassage(moderatedPassage);
        moderation.setReporter(user);
        moderation.setReason("reported");
        moderation.setStatus(PassageModerationStatus.PENDING);
        moderation.setCreatedAt(LocalDateTime.now());

        when(userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)).thenReturn(Optional.of(admin));
        when(passageModerationRepository.findById(41L)).thenReturn(Optional.of(moderation));

        PassageModerationDTO result = service.reviewModeration(
                41L,
                new ReviewModerationRequest("APPROVE", "Looks good", true),
                ADMIN_EMAIL
        );

        assertEquals(PassageModerationStatus.APPROVED, result.status());
        assertEquals("Looks good", result.reviewNotes());
        assertEquals(admin.getId(), result.reviewerId());
        assertTrue(moderatedPassage.isApproved());
        assertTrue(moderatedPassage.isFeatured());
        assertEquals(PassageStatus.APPROVED, moderatedPassage.getStatus());
        verify(passageRepository).save(moderatedPassage);
        verify(passageModerationRepository).save(moderation);
        verify(passageModerationAuditRepository).save(any(PassageModerationAudit.class));
    }

    @Test
    void reviewModeration_nonAdmin_shouldFailWithForbidden() {
        when(userRepository.findByEmailIgnoreCase(USER_EMAIL)).thenReturn(Optional.of(user));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.reviewModeration(1L, new ReviewModerationRequest("APPROVE", null, false), USER_EMAIL)
        );

        assertEquals(FORBIDDEN, exception.getStatusCode());
    }

    private PassageTag tag(Long passageId, String value) {
        Passage p = new Passage();
        p.setId(passageId);
        PassageTag tag = new PassageTag();
        tag.setPassage(p);
        tag.setTag(value);
        return tag;
    }
}
