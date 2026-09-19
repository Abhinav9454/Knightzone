package com.collegecontest.legacy;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class LegacyScoreService {

    private final UserLegacyScoreRepository legacyRepo;
    private final ContestParticipantRepository contestParticipantRepository;
    private static final double DECAY_RATE = 0.01; // decay per day

    public LegacyScoreService(
            UserLegacyScoreRepository legacyRepo,
            ContestParticipantRepository contestParticipantRepository) {
        this.legacyRepo = legacyRepo;
        this.contestParticipantRepository = contestParticipantRepository;
    }

    @Scheduled(cron = "0 0 3 * * ?") // Run at 3 AM daily
    @Transactional
    public void computeAllLegacyScores() {
        // Fetch all users from contest_participants
        List<Long> userIds = contestParticipantRepository.findDistinctUserIds();
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        LocalDate today = LocalDate.now();
        
        for (Long userId : userIds) {
            try {
                double legacyScore = calculateLegacyScore(userId, today);
                
                UserLegacyScore userLegacyScore = UserLegacyScore.builder()
                        .userId(userId)
                        .legacyScore(legacyScore)
                        .lastUpdated(LocalDateTime.now())
                        .build();
                
                legacyRepo.save(userLegacyScore);
            } catch (Exception e) {
                System.err.printf("Error computing legacy score for user %d: %s%n", userId, e.getMessage());
            }
        }
    }

    public Double getLegacyScore(Long userId) {
        return legacyRepo.findById(userId)
                .map(UserLegacyScore::getLegacyScore)
                .orElse(0.0);
    }

    @Transactional
    public void updateLegacyScoreForUser(Long userId) {
        LocalDate today = LocalDate.now();
        double legacyScore = calculateLegacyScore(userId, today);
        
        UserLegacyScore userLegacyScore = UserLegacyScore.builder()
                .userId(userId)
                .legacyScore(legacyScore)
                .lastUpdated(LocalDateTime.now())
                .build();
        
        legacyRepo.save(userLegacyScore);
    }

    private double calculateLegacyScore(Long userId, LocalDate today) {
        List<Object[]> rawData = contestParticipantRepository.findByUserIdRaw(userId);
        List<ContestParticipation> participations = mapToParticipations(rawData);
        
        double totalScore = 0.0;
        
        for (ContestParticipation participation : participations) {
            long daysAgo = ChronoUnit.DAYS.between(participation.getEndDate().toLocalDate(), today);
            if (daysAgo < 0) {
                daysAgo = 0;
            }
            
            // Apply exponential decay: score * e^(-? * days)
            double decayedScore = participation.getTotalScore() * Math.exp(-DECAY_RATE * daysAgo);
            totalScore += decayedScore;
        }
        
        return totalScore;
    }

    private List<ContestParticipation> mapToParticipations(List<Object[]> rawData) {
        List<ContestParticipation> participations = new ArrayList<>();
        
        if (rawData == null || rawData.isEmpty()) {
            return participations;
        }

        for (Object[] row : rawData) {
            if (row.length >= 2) {
                ContestParticipation participation = new ContestParticipation();
                
                // Parse end date
                if (row[0] != null) {
                    participation.setEndDate(LocalDateTime.parse(row[0].toString()));
                } else {
                    participation.setEndDate(LocalDateTime.now());
                }
                
                // Parse total score
                if (row[1] != null) {
                    participation.setTotalScore(((Number) row[1]).doubleValue());
                } else {
                    participation.setTotalScore(0.0);
                }
                
                participations.add(participation);
            }
        }
        
        return participations;
    }
}

// Helper class
class ContestParticipation {
    private LocalDateTime endDate;
    private Double totalScore;

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public Double getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(Double totalScore) {
        this.totalScore = totalScore;
    }
}
