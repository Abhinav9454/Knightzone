package com.collegecontest.adaptive.util;

public final class EloUtil {

    private static final double K = 32.0;

    private EloUtil() {
    }

    public static double calculateExpected(double playerRating, double opponentRating) {
        return 1.0 / (1.0 + Math.pow(10.0, (opponentRating - playerRating) / 400.0));
    }

    public static double calculateNewRating(double playerRating, double opponentRating, boolean win) {
        double expected = calculateExpected(playerRating, opponentRating);
        double actual = win ? 1.0 : 0.0;
        return playerRating + K * (actual - expected);
    }
}
