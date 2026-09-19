package com.collegecontest.voting;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class VotingService {

    private final VoteRepository voteRepository;

    public VotingService(VoteRepository voteRepository) {
        this.voteRepository = voteRepository;
    }

    @Transactional
    public void vote(Long userId, String targetType, Long targetId, int value) {
        if (value != 1 && value != -1)
            throw new IllegalArgumentException("vote value must be 1 or -1");
        var existing = voteRepository.findByUserIdAndTargetTypeAndTargetId(userId, targetType, targetId);
        if (existing.isEmpty()) {
            Vote v = Vote.builder().userId(userId).targetType(targetType).targetId(targetId).voteValue(value)
                    .createdAt(LocalDateTime.now()).updatedAt(LocalDateTime.now()).build();
            voteRepository.save(v);
            return;
        }
        Vote ev = existing.get();
        if (ev.getVoteValue() == value) {
            voteRepository.delete(ev); // toggle off
        } else {
            ev.setVoteValue(value);
            ev.setUpdatedAt(LocalDateTime.now());
            voteRepository.save(ev);
        }
    }

    public Integer getNetVotes(String targetType, Long targetId) {
        return voteRepository.getNetVotes(targetType, targetId);
    }

    public Map<Long, Integer> getBulkNetVotes(String targetType, List<Long> targetIds) {
        List<Object[]> rows = voteRepository.getBulkNetVotes(targetType, targetIds);
        Map<Long, Integer> map = new HashMap<>();
        for (Object[] r : rows) {
            Long id = ((Number) r[0]).longValue();
            Integer net = ((Number) r[1]).intValue();
            map.put(id, net);
        }
        return map;
    }
}
