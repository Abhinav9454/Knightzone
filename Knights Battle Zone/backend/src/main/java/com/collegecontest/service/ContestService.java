package com.collegecontest.service;

import com.collegecontest.dto.ContestAccessDTO;
import com.collegecontest.dto.ContestDTO;
import com.collegecontest.dto.ProblemDTO;
import com.collegecontest.dto.UserDTO;
import com.collegecontest.bonus.repository.SubmissionBonusRepository;
import com.collegecontest.hint.repository.HintRepository;
import com.collegecontest.hint.repository.UserProblemAttemptsRepository;
import com.collegecontest.integrity.copy.SubmissionSnippetMatchRepository;
import com.collegecontest.model.Contest;
import com.collegecontest.model.ContestParticipant;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Role;
import com.collegecontest.model.User;
import com.collegecontest.plagiarism.repository.PlagiarismFlagRepository;
import com.collegecontest.ranking.ShadowRankingRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.ContestParticipantRepository;
import com.collegecontest.repository.ContestRepository;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.review.ReviewFlagRepository;
import com.collegecontest.tabswitch.repository.TabSwitchLogRepository;
import com.collegecontest.typing.repository.KeystrokeLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContestService {
    private static final Logger logger = LoggerFactory.getLogger(ContestService.class);
    private static final String CACHE_CONTEST_DETAIL = "contestDetail";
    private static final String CACHE_CONTEST_PARTICIPANT_COUNT = "contestParticipantCount";

    @Autowired
    private ContestRepository contestRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ContestParticipantRepository contestParticipantRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private ShadowRankingRepository shadowRankingRepository;

    @Autowired
    private TabSwitchLogRepository tabSwitchLogRepository;

    @Autowired
    private ReviewFlagRepository reviewFlagRepository;

    @Autowired
    private PlagiarismFlagRepository plagiarismFlagRepository;

    @Autowired
    private HintRepository hintRepository;

    @Autowired
    private UserProblemAttemptsRepository userProblemAttemptsRepository;

    @Autowired
    private SubmissionBonusRepository submissionBonusRepository;

    @Autowired
    private KeystrokeLogRepository keystrokeLogRepository;

    @Autowired
    private SubmissionSnippetMatchRepository submissionSnippetMatchRepository;

    @Autowired(required = false)
    private CacheManager cacheManager;

    @Transactional(readOnly = true)
    public Page<ContestDTO> getAllContests(Pageable pageable) {
        Page<ContestRepository.ContestCardProjection> contests = contestRepository.findContestCards(pageable);
        List<Long> contestIds = contests.stream()
                .map(ContestRepository.ContestCardProjection::getId)
                .toList();

        Map<Long, Long> participantCounts = contestIds.isEmpty()
                ? Collections.emptyMap()
                : contestParticipantRepository.countParticipantsByContestIds(contestIds).stream()
                        .collect(Collectors.toMap(
                                ContestParticipantRepository.ContestParticipantCountProjection::getContestId,
                                ContestParticipantRepository.ContestParticipantCountProjection::getParticipantCount));

        return contests.map(contest -> mapContestProjectionToDTO(
                contest,
                false,
                participantCounts.getOrDefault(contest.getId(), 0L)));
    }

    @Transactional(readOnly = true)
    public ContestDTO getContestById(Long id) {
        ContestDTO cached = getCachedContestDetail(id);
        if (cached != null) {
            return cached;
        }

        ContestRepository.ContestCardProjection contest = contestRepository.findContestCardById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contest not found with id: " + id));

        ContestDTO dto = mapContestProjectionToDTO(contest, true, null);
        putCachedContestDetail(id, dto);
        return dto;
    }

    @Transactional
    public ContestDTO createContest(ContestDTO dto, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Contest contest = new Contest();
        contest.setTitle(dto.getTitle());
        contest.setDescription(dto.getDescription());
        contest.setStartTime(dto.getStartTime());
        contest.setEndTime(dto.getEndTime());
        if (dto.getDurationMinutes() != null && dto.getDurationMinutes() > 0) {
            contest.setDurationMinutes(dto.getDurationMinutes());
        } else {
            contest.setDurationMinutes(calculateContestDurationMinutes(contest));
        }
        contest.setCreatedBy(user);

        Contest savedContest = contestRepository.save(contest);

        if (dto.getProblems() != null && !dto.getProblems().isEmpty()) {
            for (ProblemDTO problemDTO : dto.getProblems()) {
                Problem problem = new Problem();
                problem.setTitle(problemDTO.getTitle());
                problem.setDescription(problemDTO.getDescription());
                problem.setDifficulty(problemDTO.getDifficulty());
                problem.setInputFormat(problemDTO.getInputFormat());
                problem.setOutputFormat(problemDTO.getOutputFormat());
                problem.setSampleInput(problemDTO.getSampleInput());
                problem.setSampleOutput(problemDTO.getSampleOutput());
                problem.setTestCases(problemDTO.getTestCases());
                problem.setPoints(problemDTO.getPoints());
                problem.setContest(savedContest);
                problemRepository.save(problem);
            }
        }

        evictContestCaches(savedContest.getId());
        return convertToDTO(savedContest);
    }

    @Transactional
    public ProblemDTO addProblemToContest(Long contestId, ProblemDTO dto) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with id: " + contestId));

        Problem problem = new Problem();
        problem.setTitle(dto.getTitle());
        problem.setDescription(dto.getDescription());
        problem.setDifficulty(dto.getDifficulty());
        problem.setInputFormat(dto.getInputFormat());
        problem.setOutputFormat(dto.getOutputFormat());
        problem.setSampleInput(dto.getSampleInput());
        problem.setSampleOutput(dto.getSampleOutput());
        problem.setTestCases(dto.getTestCases());
        problem.setPoints(dto.getPoints());
        problem.setContest(contest);
        Problem saved = problemRepository.save(problem);
        ProblemDTO pd = new ProblemDTO();
        pd.setId(saved.getId());
        pd.setContestId(contestId);
        pd.setTitle(saved.getTitle());
        pd.setDescription(saved.getDescription());
        pd.setDifficulty(saved.getDifficulty());
        pd.setInputFormat(saved.getInputFormat());
        pd.setOutputFormat(saved.getOutputFormat());
        pd.setSampleInput(saved.getSampleInput());
        pd.setSampleOutput(saved.getSampleOutput());
        pd.setTestCases(saved.getTestCases());
        pd.setPoints(saved.getPoints());
        return pd;
    }

    @Transactional
    public ContestDTO updateContest(Long contestId, ContestDTO dto, String userEmail) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with id: " + contestId));
        User actingUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isAdmin = actingUser.getRole() == Role.ADMIN;
        boolean isCreator = contest.getCreatedBy() != null && contest.getCreatedBy().getId().equals(actingUser.getId());
        if (!isAdmin && !isCreator) {
            throw new RuntimeException("Only contest creator or admin can update this contest");
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            contest.setTitle(dto.getTitle().trim());
        }
        if (dto.getDescription() != null) {
            contest.setDescription(dto.getDescription().trim());
        }
        if (dto.getStartTime() != null) {
            contest.setStartTime(dto.getStartTime());
        }
        if (dto.getEndTime() != null) {
            contest.setEndTime(dto.getEndTime());
        }
        if (dto.getDurationMinutes() != null) {
            if (dto.getDurationMinutes() <= 0) {
                throw new RuntimeException("Contest duration must be greater than 0 minutes");
            }
            contest.setDurationMinutes(dto.getDurationMinutes());
        }

        LocalDateTime start = contest.getStartTime();
        LocalDateTime end = contest.getEndTime();
        if (start != null && end != null && !end.isAfter(start)) {
            throw new RuntimeException("Contest end time must be after start time");
        }

        Contest saved = contestRepository.save(contest);
        evictContestCaches(saved.getId());
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteContest(Long contestId, String userEmail) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with id: " + contestId));
        User actingUser = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        boolean isAdmin = actingUser.getRole() == Role.ADMIN;
        if (!isAdmin) {
            throw new RuntimeException("Only admin can delete this contest");
        }

        List<Long> problemIds = problemRepository.findIdsByContestId(contestId);
        List<Long> submissionIds = submissionRepository.findIdsByContestId(contestId);

        if (!submissionIds.isEmpty()) {
            reviewFlagRepository.deleteBySubmissionIdIn(submissionIds);
            submissionBonusRepository.deleteBySubmissionIdIn(submissionIds);
            keystrokeLogRepository.deleteBySubmissionIdIn(submissionIds);
            submissionSnippetMatchRepository.deleteBySubmissionIdIn(submissionIds);
        }

        plagiarismFlagRepository.deleteByContestContext(contestId);
        submissionBonusRepository.deleteByContestId(contestId);
        tabSwitchLogRepository.deleteByContestId(contestId);
        shadowRankingRepository.deleteByContestId(contestId);
        contestParticipantRepository.deleteByContestId(contestId);

        if (!problemIds.isEmpty()) {
            hintRepository.deleteByProblemIdIn(problemIds);
            userProblemAttemptsRepository.deleteByProblemIdIn(problemIds);
        }

        submissionRepository.deleteByContestId(contestId);
        contestRepository.delete(contest);
        evictContestCaches(contestId);
    }

    public ContestAccessDTO registerForContest(Long contestId, String userEmail) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with id: " + contestId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        LocalDateTime now = LocalDateTime.now();
        if (contest.getEndTime() != null && now.isAfter(contest.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest has already ended.");
        }
        if (contest.getStartTime() != null && now.isBefore(contest.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Contest has not opened yet.");
        }

        int durationMinutes = calculateContestDurationMinutes(contest);

        ContestParticipant participant = contestParticipantRepository
                .findByContestIdAndUserId(contestId, user.getId())
                .orElseGet(() -> {
                    ContestParticipant p = new ContestParticipant();
                    p.setContestId(contestId);
                    p.setUserId(user.getId());
                    p.setTotalScore(0.0);
                    p.setEliminated(false);
                    return p;
                });

        if (participant.getAttemptStartTime() == null) {
            participant.setRegisteredAt(now);
            participant.setAttemptStartTime(now);
            participant.setAttemptEndTime(now.plusMinutes(durationMinutes));
            participant = contestParticipantRepository.save(participant);
            evictContestCaches(contestId);
        }

        return toContestAccessDTO(contestId, durationMinutes, participant);
    }

    public ContestAccessDTO getContestAccess(Long contestId, String userEmail) {
        Contest contest = contestRepository.findById(contestId)
                .orElseThrow(() -> new RuntimeException("Contest not found with id: " + contestId));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        int durationMinutes = calculateContestDurationMinutes(contest);
        return contestParticipantRepository.findByContestIdAndUserId(contestId, user.getId())
                .map(participant -> toContestAccessDTO(contestId, durationMinutes, participant))
                .orElse(new ContestAccessDTO(contestId, false, durationMinutes, null, null, null));
    }

    private ContestAccessDTO toContestAccessDTO(Long contestId, int durationMinutes, ContestParticipant participant) {
        Long remainingSeconds = null;
        if (participant.getAttemptEndTime() != null) {
            long secs = Duration.between(LocalDateTime.now(), participant.getAttemptEndTime()).getSeconds();
            remainingSeconds = Math.max(0, secs);
        }
        return new ContestAccessDTO(
                contestId,
                true,
                durationMinutes,
                participant.getAttemptStartTime(),
                participant.getAttemptEndTime(),
                remainingSeconds
        );
    }

    private int calculateContestDurationMinutes(Contest contest) {
        if (contest.getDurationMinutes() != null && contest.getDurationMinutes() > 0) {
            return contest.getDurationMinutes();
        }
        if (contest.getStartTime() == null || contest.getEndTime() == null) {
            return 60;
        }
        long minutes = Duration.between(contest.getStartTime(), contest.getEndTime()).toMinutes();
        if (minutes <= 0) return 60;
        return (int) minutes;
    }

    private ContestDTO convertToDTO(Contest contest) {
        return convertToDTO(contest, true, null);
    }

    private ContestDTO convertToDTO(Contest contest, boolean includeProblems, Long participantCountOverride) {
        ContestDTO dto = new ContestDTO();
        dto.setId(contest.getId());
        dto.setTitle(contest.getTitle());
        dto.setDescription(contest.getDescription());
        dto.setStartTime(contest.getStartTime());
        dto.setEndTime(contest.getEndTime());
        dto.setDurationMinutes(calculateContestDurationMinutes(contest));
        if (contest.getCreatedBy() != null) {
            try {
                UserDTO u = new UserDTO();
                u.setId(contest.getCreatedBy().getId());
                u.setName(contest.getCreatedBy().getName());
                u.setPublicUserId(contest.getCreatedBy().getPublicUserId());
                u.setEmail(contest.getCreatedBy().getEmail());
                u.setCollege(contest.getCreatedBy().getCollege());
                u.setDepartment(contest.getCreatedBy().getDepartment());
                u.setAdminExpiresAt(contest.getCreatedBy().getAdminExpiresAt());
                u.setRole(contest.getCreatedBy().getRole() != null ? contest.getCreatedBy().getRole().toString() : null);
                dto.setCreatedBy(u);
            } catch (Exception ignored) {
                // Detached lazy proxy fallback
            }
        }
        dto.setCreatedAt(contest.getCreatedAt());
        dto.setUpdatedAt(contest.getUpdatedAt());
        if (includeProblems) {
            List<ProblemRepository.ProblemDetailProjection> contestProblems = problemRepository
                    .findProjectedByContestId(contest.getId());
            if (!contestProblems.isEmpty()) {
                dto.setProblems(contestProblems.stream().map(this::toProblemDTO).toList());
            }
        }
        long participantCount = participantCountOverride != null
                ? participantCountOverride
                : resolveParticipantCount(contest.getId());
        dto.setParticipantCount(participantCount);
        return dto;
    }

    private ContestDTO mapContestProjectionToDTO(
            ContestRepository.ContestCardProjection contest,
            boolean includeProblems,
            Long participantCountOverride) {
        ContestDTO dto = new ContestDTO();
        dto.setId(contest.getId());
        dto.setTitle(contest.getTitle());
        dto.setDescription(contest.getDescription());
        dto.setStartTime(contest.getStartTime());
        dto.setEndTime(contest.getEndTime());
        dto.setDurationMinutes(calculateContestDurationMinutes(contest.getStartTime(), contest.getEndTime(),
                contest.getDurationMinutes()));
        dto.setCreatedBy(toUserDTO(contest));
        dto.setCreatedAt(contest.getCreatedAt());
        dto.setUpdatedAt(contest.getUpdatedAt());

        if (includeProblems) {
            List<ProblemRepository.ProblemDetailProjection> contestProblems = problemRepository
                    .findProjectedByContestId(contest.getId());
            if (!contestProblems.isEmpty()) {
                dto.setProblems(contestProblems.stream().map(this::toProblemDTO).toList());
            }
        }

        long participantCount = participantCountOverride != null
                ? participantCountOverride
                : resolveParticipantCount(contest.getId());
        dto.setParticipantCount(participantCount);
        return dto;
    }

    private UserDTO toUserDTO(ContestRepository.ContestCardProjection contest) {
        UserDTO user = new UserDTO();
        user.setId(contest.getCreatedById());
        user.setName(contest.getCreatedByName());
        user.setPublicUserId(contest.getCreatedByPublicUserId());
        user.setEmail(contest.getCreatedByEmail());
        user.setCollege(contest.getCreatedByCollege());
        user.setDepartment(contest.getCreatedByDepartment());
        user.setAdminExpiresAt(contest.getCreatedByAdminExpiresAt());
        user.setRole(contest.getCreatedByRole() != null ? contest.getCreatedByRole().toString() : null);
        return user;
    }

    private ProblemDTO toProblemDTO(ProblemRepository.ProblemDetailProjection problem) {
        ProblemDTO dto = new ProblemDTO();
        dto.setId(problem.getId());
        dto.setContestId(problem.getContestId());
        dto.setTitle(problem.getTitle());
        dto.setDescription(problem.getDescription());
        dto.setDifficulty(problem.getDifficulty());
        dto.setInputFormat(problem.getInputFormat());
        dto.setOutputFormat(problem.getOutputFormat());
        dto.setSampleInput(problem.getSampleInput());
        dto.setSampleOutput(problem.getSampleOutput());
        dto.setTestCases(problem.getTestCases());
        dto.setPoints(problem.getPoints());
        return dto;
    }

    private int calculateContestDurationMinutes(LocalDateTime start, LocalDateTime end, Integer explicitDurationMinutes) {
        if (explicitDurationMinutes != null && explicitDurationMinutes > 0) {
            return explicitDurationMinutes;
        }
        if (start == null || end == null) {
            return 60;
        }
        long minutes = Duration.between(start, end).toMinutes();
        if (minutes <= 0) {
            return 60;
        }
        return (int) minutes;
    }

    private ContestDTO getCachedContestDetail(Long contestId) {
        if (cacheManager == null || contestId == null) {
            return null;
        }
        Cache cache = cacheManager.getCache(CACHE_CONTEST_DETAIL);
        if (cache == null) {
            return null;
        }
        try {
            return cache.get(contestId, ContestDTO.class);
        } catch (RuntimeException ex) {
            logger.warn("Failed to read contest detail cache for contestId={}. Falling back to DB.", contestId, ex);
            try {
                cache.evict(contestId);
            } catch (RuntimeException evictEx) {
                logger.warn("Failed to evict broken contest detail cache entry for contestId={}", contestId, evictEx);
            }
            return null;
        }
    }

    private void putCachedContestDetail(Long contestId, ContestDTO dto) {
        if (cacheManager == null || contestId == null || dto == null) {
            return;
        }
        Cache cache = cacheManager.getCache(CACHE_CONTEST_DETAIL);
        if (cache != null) {
            try {
                cache.put(contestId, dto);
            } catch (RuntimeException ex) {
                logger.warn("Failed to write contest detail cache for contestId={}. Continuing without cache.", contestId, ex);
            }
        }
    }

    private long resolveParticipantCount(Long contestId) {
        if (contestId == null) {
            return 0L;
        }
        if (cacheManager == null) {
            return contestParticipantRepository.countByContestId(contestId);
        }
        Cache cache = cacheManager.getCache(CACHE_CONTEST_PARTICIPANT_COUNT);
        if (cache == null) {
            return contestParticipantRepository.countByContestId(contestId);
        }
        try {
            Long cached = cache.get(contestId, Long.class);
            if (cached != null) {
                return cached;
            }
        } catch (RuntimeException ex) {
            logger.warn("Failed to read contest participant count cache for contestId={}. Falling back to DB.", contestId, ex);
        }
        long count = contestParticipantRepository.countByContestId(contestId);
        try {
            cache.put(contestId, count);
        } catch (RuntimeException ex) {
            logger.warn("Failed to write contest participant count cache for contestId={}.", contestId, ex);
        }
        return count;
    }

    private void evictContestCaches(Long contestId) {
        if (cacheManager == null || contestId == null) {
            return;
        }
        Cache contestDetailCache = cacheManager.getCache(CACHE_CONTEST_DETAIL);
        if (contestDetailCache != null) {
            contestDetailCache.evict(contestId);
        }
        Cache participantCountCache = cacheManager.getCache(CACHE_CONTEST_PARTICIPANT_COUNT);
        if (participantCountCache != null) {
            participantCountCache.evict(contestId);
        }
    }
}
