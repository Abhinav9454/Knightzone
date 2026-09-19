package com.collegecontest.service;

import com.collegecontest.hint.dto.HintDTO;
import com.collegecontest.hint.model.Hint;
import com.collegecontest.hint.model.UserProblemAttempts;
import com.collegecontest.hint.repository.HintRepository;
import com.collegecontest.hint.repository.UserProblemAttemptsRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Deprecated
public class HintService {

    private final HintRepository hintRepository;
    private final UserProblemAttemptsRepository attemptsRepository;

    public HintService(HintRepository hintRepository, UserProblemAttemptsRepository attemptsRepository) {
        this.hintRepository = hintRepository;
        this.attemptsRepository = attemptsRepository;
    }

    @Transactional(readOnly = true)
    public List<HintDTO> getAvailableHints(Long userId, Long problemId) {
        Optional<UserProblemAttempts> maybe = attemptsRepository.findByIdUserIdAndIdProblemId(userId, problemId);
        int timeSpent = 0;
        int attempts = 0;
        if (maybe.isPresent()) {
            UserProblemAttempts upa = maybe.get();
            timeSpent = upa.getTimeSpent() != null ? upa.getTimeSpent() : 0;
            attempts = upa.getAttemptCount() != null ? upa.getAttemptCount() : 0;
        }

        List<Hint> hints = hintRepository.findByProblemIdOrderByUnlockOrderAsc(problemId);
        List<HintDTO> available = new ArrayList<>();
        for (Hint h : hints) {
            String cond = h.getUnlockCondition();
            boolean ok;
            if (cond == null || cond.isBlank()) {
                ok = true;
            } else {
                ok = evaluateCondition(cond.trim(), timeSpent, attempts);
            }
            if (ok) {
                available.add(new HintDTO(h.getId(), h.getProblemId(), h.getHintText(), h.getUnlockOrder()));
            }
        }

        return available;
    }

    /**
     * Evaluate simple condition strings like "time>300" or "attempts>=2".
     * Supported fields: time, attempts
     * Supported operators: >, >=, <, <=, ==, !=
     */
    private boolean evaluateCondition(String cond, int timeSpent, int attempts) {
        String[] ops = new String[] { ">=", "<=", "==", "!=", ">", "<" };
        String opFound = null;
        for (String op : ops) {
            int idx = cond.indexOf(op);
            if (idx > 0) {
                opFound = op;
                break;
            }
        }
        if (opFound == null) {
            throw new RuntimeException("Unsupported or missing operator in condition: " + cond);
        }

        String[] parts = cond.split(java.util.regex.Pattern.quote(opFound));
        if (parts.length != 2) {
            throw new RuntimeException("Invalid condition format: " + cond);
        }

        String left = parts[0].trim();
        String right = parts[1].trim();
        int rightVal;
        try {
            rightVal = Integer.parseInt(right);
        } catch (NumberFormatException e) {
            throw new RuntimeException("Right side of condition must be an integer: " + cond);
        }

        int leftVal;
        if (left.equalsIgnoreCase("time")) {
            leftVal = timeSpent;
        } else if (left.equalsIgnoreCase("attempts")) {
            leftVal = attempts;
        } else {
            throw new RuntimeException("Unsupported left-hand field in condition: " + left);
        }

        return switch (opFound) {
            case ">" -> leftVal > rightVal;
            case ">=" -> leftVal >= rightVal;
            case "<" -> leftVal < rightVal;
            case "<=" -> leftVal <= rightVal;
            case "==" -> leftVal == rightVal;
            case "!=" -> leftVal != rightVal;
            default -> throw new RuntimeException("Unsupported operator: " + opFound);
        };
    }
}
