package com.collegecontest.match.service;

import com.collegecontest.match.dto.BattleMatchDTO;
import com.collegecontest.match.model.Battle;
import com.collegecontest.match.repository.BattleRepository;
import com.collegecontest.adaptive.repository.UserSkillRepository;
import com.collegecontest.repository.ProblemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchmakingService {
    private static final String QUEUE_KEY = "matchmaking:queue";

    @Autowired private RedisTemplate<String, String> redisTemplate;
    @Autowired private UserSkillRepository userSkillRepository;
    @Autowired private ProblemRepository problemRepository;
    @Autowired private BattleRepository battleRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    public void joinQueue(Long userId) {
        redisTemplate.opsForZSet().add(QUEUE_KEY, String.valueOf(userId), Instant.now().toEpochMilli());
    }

    public void leaveQueue(Long userId) {
        redisTemplate.opsForZSet().remove(QUEUE_KEY, String.valueOf(userId));
    }

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void matchPlayers() {
        Set<String> members = redisTemplate.opsForZSet().range(QUEUE_KEY, 0, -1);
        if (members == null || members.size() < 2) return;

        List<Long> toMatch = members.stream().map(Long::valueOf).collect(Collectors.toList());
        Collections.sort(toMatch);

        while (toMatch.size() >= 2) {
            Long a = toMatch.remove(0);
            Long b = toMatch.remove(0);

            double skillA = userSkillRepository.findByUserId(a).map(s -> s.getSkillScore()).orElse(1200.0);
            double skillB = userSkillRepository.findByUserId(b).map(s -> s.getSkillScore()).orElse(1200.0);
            double targetDifficulty = (skillA + skillB) / 2.0;
            
            Long problemId = problemRepository.findAll().stream()
                    .min(Comparator.comparingDouble(p -> Math.abs(mapDifficultyToScore(p.getDifficulty()) - targetDifficulty)))
                    .map(p -> p.getId()).orElse(null);

            Battle battle = new Battle();
            battle.setUser1Id(a);
            battle.setUser2Id(b);
            battle.setProblemId(problemId);
            battle.setStatus("PENDING");
            battle.setStartTime(LocalDateTime.ofInstant(Instant.now(), ZoneOffset.UTC));
            Battle saved = battleRepository.save(battle);

            redisTemplate.opsForZSet().remove(QUEUE_KEY, String.valueOf(a), String.valueOf(b));

            messagingTemplate.convertAndSend("/topic/user/" + a + "/match", 
                new BattleMatchDTO(saved.getId(), saved.getProblemId(), b, saved.getStatus()));
            messagingTemplate.convertAndSend("/topic/user/" + b + "/match", 
                new BattleMatchDTO(saved.getId(), saved.getProblemId(), a, saved.getStatus()));
        }
    }

    private double mapDifficultyToScore(String difficulty) {
        if (difficulty == null) {
            return 1200.0;
        }
        return switch (difficulty.trim().toUpperCase()) {
            case "EASY" -> 1000.0;
            case "MEDIUM" -> 1400.0;
            case "HARD" -> 1800.0;
            default -> 1200.0;
        };
    }
}
