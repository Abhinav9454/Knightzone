package com.collegecontest.service;

import com.collegecontest.adaptive.model.UserSkill;
import com.collegecontest.adaptive.repository.UserSkillRepository;
import com.collegecontest.adaptive.service.EloRatingService;
import com.collegecontest.duel.model.Duel;
import com.collegecontest.duel.repository.DuelRepository;
import com.collegecontest.model.Problem;
import com.collegecontest.model.Submission;
import com.collegecontest.model.User;
import com.collegecontest.repository.ProblemRepository;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.repository.UserRepository;
import com.collegecontest.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DailyDuelService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private ProblemRepository problemRepository;

    @Autowired
    private DuelRepository duelRepository;

    @Autowired
    private SubmissionRepository submissionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EloRatingService eloRatingService;

    private final Random random = new Random();

    // runs at midnight to create duels for the day
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void createDailyDuels() {
        LocalDate today = LocalDate.now();

        List<User> users = userRepository.findAll();
        if (users.size() < 2)
            return;

        // map userId -> skill
        Map<Long, Double> skillMap = new HashMap<>();
        for (User u : users) {
            Optional<UserSkill> us = userSkillRepository.findById(u.getId());
            skillMap.put(u.getId(), us.map(UserSkill::getSkillScore).orElse(1200.0));
        }

        // sort user ids by skill
        List<Long> sorted = users.stream()
                .map(User::getId)
                .sorted(Comparator.comparingDouble(skillMap::get))
                .collect(Collectors.toList());

        // pair adjacent users
        for (int i = 0; i + 1 < sorted.size(); i += 2) {
            Long a = sorted.get(i);
            Long b = sorted.get(i + 1);

            // pick a random problem from pool
            List<Problem> problems = problemRepository.findAll();
            if (problems.isEmpty())
                break;
            Problem p = problems.get(random.nextInt(problems.size()));

            Duel duel = new Duel();
            duel.setDuelDate(today);
            duel.setUser1Id(a);
            duel.setUser2Id(b);
            duel.setProblemId(p.getId());
            duel.setStatus("PENDING");
            duelRepository.save(duel);

            notificationService.notifyUser(a, "You've been matched for today's duel against user " + b);
            notificationService.notifyUser(b, "You've been matched for today's duel against user " + a);
        }
    }

    // runs at 23:59 to resolve duels
    @Scheduled(cron = "0 59 23 * * ?")
    @Transactional
    public void resolveDailyDuels() {
        LocalDate today = LocalDate.now();
        List<Duel> pending = duelRepository.findByDuelDateAndStatus(today, "PENDING");
        LocalDateTime start = today.atStartOfDay();
        LocalDateTime end = today.atTime(LocalTime.MAX);

        for (Duel duel : pending) {
            Long u1 = duel.getUser1Id();
            Long u2 = duel.getUser2Id();
            Long problemId = duel.getProblemId();

            List<Submission> s1 = submissionRepository.findByUserIdAndProblemId(u1, problemId).stream()
                    .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus())
                            && !s.getSubmittedAt().isBefore(start) && !s.getSubmittedAt().isAfter(end))
                    .sorted(Comparator.comparing(Submission::getSubmittedAt))
                    .collect(Collectors.toList());

            List<Submission> s2 = submissionRepository.findByUserIdAndProblemId(u2, problemId).stream()
                    .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus())
                            && !s.getSubmittedAt().isBefore(start) && !s.getSubmittedAt().isAfter(end))
                    .sorted(Comparator.comparing(Submission::getSubmittedAt))
                    .collect(Collectors.toList());

            Long winner = null;
            if (!s1.isEmpty() && !s2.isEmpty()) {
                LocalDateTime t1 = s1.get(0).getSubmittedAt();
                LocalDateTime t2 = s2.get(0).getSubmittedAt();
                if (t1.isBefore(t2))
                    winner = u1;
                else if (t2.isBefore(t1))
                    winner = u2;
                else {
                    // exact tie -> treat as draw
                    eloRatingService.updateRatingsForDraw(u1, u2);
                }
            } else if (!s1.isEmpty()) {
                winner = u1;
            } else if (!s2.isEmpty()) {
                winner = u2;
            }

            if (winner != null) {
                duel.setWinnerId(winner);
                duel.setStatus("COMPLETED");
                duelRepository.save(duel);

                // call Elo updates
                Long loser = winner.equals(u1) ? u2 : u1;
                eloRatingService.updateRatings(winner, loser);

                notificationService.notifyUser(winner, "You won today's duel!");
                notificationService.notifyUser(loser, "You lost today's duel.");
            } else {
                duel.setStatus("COMPLETED");
                duelRepository.save(duel);
                notificationService.notifyUser(u1, "Today's duel ended with no winner.");
                notificationService.notifyUser(u2, "Today's duel ended with no winner.");
            }
        }
    }
}

