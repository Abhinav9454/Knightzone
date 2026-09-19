package com.collegecontest.adaptive.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class EloUtilTest {

    private static final double DELTA = 1e-9;

    @Test
    void calculateExpected_shouldReturnCorrectProbability() {
        double expected = EloUtil.calculateExpected(1500, 1600);
        assertEquals(0.359935, expected, 1e-6, "Expected probability for 1500 vs 1600");
    }

    @Test
    void calculateNewRating_shouldIncreaseAfterWin() {
        double player = 1500, opponent = 1600;
        double newRating = EloUtil.calculateNewRating(player, opponent, true);
        assertTrue(newRating > player, "Winning should increase rating");
        double expectedWin = player + 32 * (1 - EloUtil.calculateExpected(player, opponent));
        assertEquals(expectedWin, newRating, DELTA);
    }

    @Test
    void calculateNewRating_shouldDecreaseAfterLoss() {
        double player = 1500, opponent = 1400;
        double newRating = EloUtil.calculateNewRating(player, opponent, false);
        assertTrue(newRating < player, "Losing should decrease rating");
        double expectedLoss = player + 32 * (0 - EloUtil.calculateExpected(player, opponent));
        assertEquals(expectedLoss, newRating, DELTA);
    }

    @Test
    void calculateNewRating_shouldHandleEqualPlayers() {
        double rating = 1500;
        double newWin = EloUtil.calculateNewRating(rating, rating, true);
        double newLoss = EloUtil.calculateNewRating(rating, rating, false);
        assertEquals(rating + 32 * (1 - 0.5), newWin, DELTA);
        assertEquals(rating + 32 * (0 - 0.5), newLoss, DELTA);
    }
}