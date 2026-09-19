package com.collegecontest.hint.util;

import com.collegecontest.hint.exception.InvalidConditionException;

public final class ConditionEvaluator {

    private ConditionEvaluator() {
    }

    public static boolean evaluate(String condition, int timeSpent, int attempts) {
        if (condition == null || condition.isBlank())
            return true;

        // Simple grammar: <field><op><number>, e.g. "time>300" or "attempts>=2"
        condition = condition.trim();
        String field;
        String op;
        String numStr;

        if (condition.contains(">=")) {
            op = ">=";
        } else if (condition.contains("<=")) {
            op = "<=";
        } else if (condition.contains("==")) {
            op = "==";
        } else if (condition.contains(">")) {
            op = ">";
        } else if (condition.contains("<")) {
            op = "<";
        } else if (condition.contains("!=")) {
            op = "!=";
        } else
            throw new InvalidConditionException("Unsupported operator in condition: " + condition);

        String[] parts = condition.split(op);
        if (parts.length != 2)
            throw new InvalidConditionException("Invalid condition format: " + condition);
        field = parts[0].trim();
        numStr = parts[1].trim();

        int value;
        try {
            value = Integer.parseInt(numStr);
        } catch (NumberFormatException ex) {
            throw new InvalidConditionException("Invalid number in condition: " + numStr);
        }

        int target;
        switch (field) {
            case "time":
                target = timeSpent;
                break;
            case "attempts":
                target = attempts;
                break;
            default:
                throw new InvalidConditionException("Unsupported field in condition: " + field);
        }

        return switch (op) {
            case ">" -> target > value;
            case ">=" -> target >= value;
            case "<" -> target < value;
            case "<=" -> target <= value;
            case "==" -> target == value;
            case "!=" -> target != value;
            default -> throw new InvalidConditionException("Unsupported operator: " + op);
        };
    }
}
