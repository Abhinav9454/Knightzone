package com.collegecontest.service;

import com.collegecontest.dto.ContestDTO;
import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.model.Contest;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.bonus.repository.SubmissionBonusRepository;
import com.collegecontest.hint.repository.HintRepository;
import com.collegecontest.hint.repository.UserProblemAttemptsRepository;
import com.collegecontest.integrity.copy.SubmissionSnippetMatchRepository;
import com.collegecontest.plagiarism.repository.PlagiarismFlagRepository;
import com.collegecontest.ranking.ShadowRankingRepository;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.review.ReviewFlagRepository;
import com.collegecontest.tabswitch.repository.TabSwitchLogRepository;
import com.collegecontest.typing.repository.KeystrokeLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ContestServiceTest {

    @Mock
    private ContestRepository contestRepository;

    @Mock
    private ProblemRepository problemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ContestParticipantRepository contestParticipantRepository;

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private ShadowRankingRepository shadowRankingRepository;

    @Mock
    private TabSwitchLogRepository tabSwitchLogRepository;

    @Mock
    private ReviewFlagRepository reviewFlagRepository;

    @Mock
    private PlagiarismFlagRepository plagiarismFlagRepository;

    @Mock
    private HintRepository hintRepository;

    @Mock
    private UserProblemAttemptsRepository userProblemAttemptsRepository;

    @Mock
    private SubmissionBonusRepository submissionBonusRepository;

    @Mock
    private KeystrokeLogRepository keystrokeLogRepository;

    @Mock
    private SubmissionSnippetMatchRepository submissionSnippetMatchRepository;

    @InjectMocks
    private ContestService contestService;

    @Test
    void getAllContests_returnsPagedDTOs() {
        ContestRepository.ContestCardProjection c = mock(ContestRepository.ContestCardProjection.class);
        when(c.getId()).thenReturn(1L);
        when(c.getTitle()).thenReturn("Test Contest");
        when(c.getStartTime()).thenReturn(LocalDateTime.now());
        when(c.getEndTime()).thenReturn(LocalDateTime.now().plusHours(1));
        when(c.getDurationMinutes()).thenReturn(60);

        Page<ContestRepository.ContestCardProjection> page = new PageImpl<>(List.of(c));
        when(contestRepository.findContestCards(PageRequest.of(0, 20))).thenReturn(page);
        when(contestParticipantRepository.countParticipantsByContestIds(List.of(1L))).thenReturn(List.of());

        Page<ContestDTO> result = contestService.getAllContests(PageRequest.of(0, 20));

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Test Contest", result.getContent().get(0).getTitle());
    }

    @Test
    void createContest_savesContestAndProblems() {
        User user = new User();
        user.setId(2L);
        user.setEmail("user@example.com");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        Contest saved = new Contest();
        saved.setId(3L);
        saved.setTitle("New Contest");
        saved.setStartTime(LocalDateTime.now());
        saved.setEndTime(LocalDateTime.now().plusHours(1));

        when(contestRepository.save(any(Contest.class))).thenReturn(saved);
        when(problemRepository.save(any(Problem.class))).thenAnswer(inv -> {
            Problem p = inv.getArgument(0);
            p.setId(99L);
            return p;
        });
        when(problemRepository.findProjectedByContestId(saved.getId())).thenReturn(List.of());
        when(contestParticipantRepository.countByContestId(anyLong())).thenReturn(0L);

        ContestDTO dto = new ContestDTO();
        dto.setTitle("New Contest");
        dto.setStartTime(LocalDateTime.now());
        dto.setEndTime(LocalDateTime.now().plusHours(1));
        ProblemDTO pd = new ProblemDTO();
        pd.setTitle("P1");
        dto.setProblems(List.of(pd));

        ContestDTO out = contestService.createContest(dto, "user@example.com");

        assertNotNull(out);
        assertEquals(3L, out.getId());
        verify(problemRepository, times(1)).save(any(Problem.class));
    }

    @Test
    void deleteContest_asAdmin_deletesContestAndRelatedData() {
        Contest contest = new Contest();
        contest.setId(50L);

        User admin = new User();
        admin.setId(7L);
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);

        when(contestRepository.findById(50L)).thenReturn(Optional.of(contest));
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(admin));
        when(problemRepository.findIdsByContestId(50L)).thenReturn(List.of(501L));
        when(submissionRepository.findIdsByContestId(50L)).thenReturn(List.of(9001L, 9002L));

        contestService.deleteContest(50L, "admin@example.com");

        verify(reviewFlagRepository).deleteBySubmissionIdIn(List.of(9001L, 9002L));
        verify(submissionBonusRepository).deleteBySubmissionIdIn(List.of(9001L, 9002L));
        verify(keystrokeLogRepository).deleteBySubmissionIdIn(List.of(9001L, 9002L));
        verify(submissionSnippetMatchRepository).deleteBySubmissionIdIn(List.of(9001L, 9002L));
        verify(plagiarismFlagRepository).deleteByContestContext(50L);
        verify(submissionBonusRepository).deleteByContestId(50L);
        verify(tabSwitchLogRepository).deleteByContestId(50L);
        verify(shadowRankingRepository).deleteByContestId(50L);
        verify(contestParticipantRepository).deleteByContestId(50L);
        verify(hintRepository).deleteByProblemIdIn(List.of(501L));
        verify(userProblemAttemptsRepository).deleteByProblemIdIn(List.of(501L));
        verify(submissionRepository).deleteByContestId(50L);
        verify(contestRepository).delete(contest);
    }
}
