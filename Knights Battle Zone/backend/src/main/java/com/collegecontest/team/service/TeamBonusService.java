package com.collegecontest.team.service;

import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.team.model.TeamContestScore;
import com.collegecontest.team.model.TeamMember;
import com.collegecontest.team.model.Team;
import com.collegecontest.team.repository.TeamContestScoreRepository;
import com.collegecontest.team.repository.TeamMemberRepository;
import com.collegecontest.team.repository.TeamRepository;
import com.collegecontest.repository.ProblemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamBonusService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final TeamContestScoreRepository scoreRepository;

    public TeamBonusService(TeamRepository teamRepository,
            TeamMemberRepository memberRepository,
            SubmissionRepository submissionRepository,
            ProblemRepository problemRepository,
            TeamContestScoreRepository scoreRepository) {
        this.teamRepository = teamRepository;
        this.memberRepository = memberRepository;
        this.submissionRepository = submissionRepository;
        this.problemRepository = problemRepository;
        this.scoreRepository = scoreRepository;
    }

    @Transactional
    public void awardTeamStrategyBonus(Long contestId) {
        List<Team> teams = teamRepository.findAll();
        for (Team team : teams) {
            List<TeamMember> members = memberRepository.findByTeamId(team.getId());
            if (members.isEmpty())
                continue;

            Map<Long, Set<String>> memberCategories = new HashMap<>();
            for (TeamMember m : members) {
                List<Submission> solved = submissionRepository.findByUserIdOrderBySubmittedAtDesc(m.getUserId())
                        .stream()
                        .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()) && s.getProblem() != null
                                && s.getProblem().getContest() != null
                                && s.getProblem().getContest().getId().equals(contestId))
                        .collect(Collectors.toList());

                Set<String> cats = solved.stream()
                        .map(s -> s.getProblem().getDifficulty())
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
                memberCategories.put(m.getUserId(), cats);
            }

            boolean pairwiseDisjoint = true;
            List<Long> ids = new ArrayList<>(memberCategories.keySet());
            for (int i = 0; i < ids.size(); i++) {
                for (int j = i + 1; j < ids.size(); j++) {
                    Set<String> a = memberCategories.get(ids.get(i));
                    Set<String> b = memberCategories.get(ids.get(j));
                    Set<String> intersection = new HashSet<>(a);
                    intersection.retainAll(b);
                    if (!intersection.isEmpty()) {
                        pairwiseDisjoint = false;
                        break;
                    }
                }
                if (!pairwiseDisjoint)
                    break;
            }

            if (pairwiseDisjoint) {
                // calculate total team points for contest
                double totalPoints = 0.0;
                Set<Long> solvedProblems = new HashSet<>();
                for (TeamMember m : members) {
                    List<Submission> solved = submissionRepository.findByUserIdOrderBySubmittedAtDesc(m.getUserId())
                            .stream()
                            .filter(s -> "ACCEPTED".equalsIgnoreCase(s.getStatus()) && s.getProblem() != null
                                    && s.getProblem().getContest() != null
                                    && s.getProblem().getContest().getId().equals(contestId))
                            .collect(Collectors.toList());
                    for (Submission s : solved) {
                        if (solvedProblems.add(s.getProblem().getId())) {
                            totalPoints += s.getProblem().getPoints() != null ? s.getProblem().getPoints() : 0.0;
                        }
                    }
                }

                double bonus = totalPoints * 0.10; // 10% bonus
                final double finalTotalPoints = totalPoints;

                TeamContestScore tcs = scoreRepository.findByTeamIdAndContestId(team.getId(), contestId)
                        .orElseGet(() -> {
                            TeamContestScore t = new TeamContestScore();
                            t.setTeamId(team.getId());
                            t.setContestId(contestId);
                            t.setTotalScore(finalTotalPoints);
                            t.setBonusAwarded(0.0);
                            return t;
                        });

                tcs.setTotalScore((tcs.getTotalScore() != null ? tcs.getTotalScore() : 0.0) + bonus);
                tcs.setBonusAwarded((tcs.getBonusAwarded() != null ? tcs.getBonusAwarded() : 0.0) + bonus);
                scoreRepository.save(tcs);
            }
        }
    }
}
