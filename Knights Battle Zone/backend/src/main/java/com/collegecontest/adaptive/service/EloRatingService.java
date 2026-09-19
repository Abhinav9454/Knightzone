package com.collegecontest.adaptive.service;

import com.collegecontest.adaptive.dto.RatingHistoryDTO;
import com.collegecontest.adaptive.model.RatingHistory;
import com.collegecontest.adaptive.model.UserSkill;
import com.collegecontest.adaptive.repository.RatingHistoryRepository;
import com.collegecontest.adaptive.repository.UserSkillRepository;
import com.collegecontest.exception.UserNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class EloRatingService {

    private final UserSkillRepository userSkillRepository;
    private final RatingHistoryRepository ratingHistoryRepository;
    private final double kFactor;

    public EloRatingService(UserSkillRepository userSkillRepository,
            RatingHistoryRepository ratingHistoryRepository,
            @Value("${elo.k:32}") double kFactor) {
        this.userSkillRepository = userSkillRepository;
        this.ratingHistoryRepository = ratingHistoryRepository;
        this.kFactor = kFactor;
    }

    @Transactional
    public void updateRatings(Long winnerId, Long loserId) {
        Long safeWinnerId = requireUserId(winnerId);
        Long safeLoserId = requireUserId(loserId);

        UserSkill winner = userSkillRepository.findById(safeWinnerId)
                .orElseThrow(() -> new UserNotFoundException(safeWinnerId));
        UserSkill loser = userSkillRepository.findById(safeLoserId)
                .orElseThrow(() -> new UserNotFoundException(safeLoserId));

        double rA = winner.getSkillScore();
        double rB = loser.getSkillScore();

        double eA = expectedScore(rA, rB);
        double eB = expectedScore(rB, rA);

        double sA = 1.0; // winner
        double sB = 0.0; // loser

        double newA = rA + kFactor * (sA - eA);
        double newB = rB + kFactor * (sB - eB);

        saveNewRating(winner, rA, newA, "BATTLE_WIN");
        saveNewRating(loser, rB, newB, "BATTLE_LOSS");
    }

    @Transactional
    public void updateRatingsForDraw(Long player1Id, Long player2Id) {
        Long safePlayer1Id = requireUserId(player1Id);
        Long safePlayer2Id = requireUserId(player2Id);

        UserSkill p1 = userSkillRepository.findById(safePlayer1Id)
                .orElseThrow(() -> new UserNotFoundException(safePlayer1Id));
        UserSkill p2 = userSkillRepository.findById(safePlayer2Id)
                .orElseThrow(() -> new UserNotFoundException(safePlayer2Id));

        double rA = p1.getSkillScore();
        double rB = p2.getSkillScore();

        double eA = expectedScore(rA, rB);
        double eB = expectedScore(rB, rA);

        double s = 0.5;

        double newA = rA + kFactor * (s - eA);
        double newB = rB + kFactor * (s - eB);

        saveNewRating(p1, rA, newA, "BATTLE_DRAW");
        saveNewRating(p2, rB, newB, "BATTLE_DRAW");
    }

    private double expectedScore(double rA, double rB) {
        return 1.0 / (1.0 + Math.pow(10.0, (rB - rA) / 400.0));
    }

    @NonNull
    private Long requireUserId(Long userId) {
        return Objects.requireNonNull(userId, "userId is required");
    }

    private void saveNewRating(UserSkill userSkill, double oldRating, double newRating, String reason) {
        double change = newRating - oldRating;

        userSkill.setSkillScore(newRating);
        userSkill.setLastUpdated(LocalDateTime.now());
        userSkillRepository.save(userSkill);

        RatingHistory h = new RatingHistory();
        h.setUserId(userSkill.getUserId());
        h.setOldRating(oldRating);
        h.setNewRating(newRating);
        h.setChange(change);
        h.setReason(reason);
        h.setTimestamp(LocalDateTime.now());
        ratingHistoryRepository.save(h);
    }

    @Transactional(readOnly = true)
    public List<RatingHistoryDTO> getRatingHistory(Long userId) {
        List<RatingHistory> list = ratingHistoryRepository.findByUserIdOrderByTimestampDesc(userId);
        return list.stream().map(r -> new RatingHistoryDTO(
                r.getId(), r.getOldRating(), r.getNewRating(), r.getChange(), r.getReason(), r.getTimestamp()))
                .collect(Collectors.toList());
    }
}
