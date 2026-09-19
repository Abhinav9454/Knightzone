package com.collegecontest.integrity.team;

import com.collegecontest.ipmonitor.model.UserIp;
import com.collegecontest.ipmonitor.repository.UserIpRepository;
import com.collegecontest.model.Submission;
import com.collegecontest.repository.SubmissionRepository;
import com.collegecontest.util.JsonUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Detect potential teams by grouping users by IP and checking submission time overlap.
 */
@Service
public class TeamCoordinationDetector {

    private final UserIpRepository userIpRepository;
    private final SubmissionRepository submissionRepository;
    private final TeamCoordinationFlagRepository flagRepository;

    public TeamCoordinationDetector(
            UserIpRepository userIpRepository,
            SubmissionRepository submissionRepository,
            TeamCoordinationFlagRepository flagRepository) {
        this.userIpRepository = userIpRepository;
        this.submissionRepository = submissionRepository;
        this.flagRepository = flagRepository;
    }

    @Transactional
    public void detectTeams(Long contestId) {
        // Get all users who participated in this contest
        List<Long> userIds = submissionRepository.findDistinctUserIdsByContestId(contestId);
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        // Group users by IP address
        Map<String, Set<Long>> ipGroups = new HashMap<>();
        for (Long userId : userIds) {
            List<UserIp> userIps = userIpRepository.findByUserId(userId);
            if (userIps == null || userIps.isEmpty()) {
                continue;
            }
            
            for (UserIp userIp : userIps) {
                String ip = userIp.getIpAddress();
                ipGroups.computeIfAbsent(ip, k -> new HashSet<>()).add(userId);
            }
        }

        int minGroupSize = 2;
        int timeWindowSeconds = 10;

        // Analyze each IP group
        for (Map.Entry<String, Set<Long>> entry : ipGroups.entrySet()) {
            String ipAddress = entry.getKey();
            Set<Long> group = entry.getValue();
            
            // Skip groups that are too small
            if (group.size() <= minGroupSize) {
                continue;
            }

            // Fetch submissions for these users in this contest
            List<Submission> submissions = submissionRepository
                .findByContestIdAndUserIdIn(contestId, new ArrayList<>(group));
            
            // Group submissions by user and collect timestamps
            Map<Long, List<Long>> userTimestamps = new HashMap<>();
            for (Submission submission : submissions) {
                Long userId = submission.getUser().getId();
                long timestamp = submission.getSubmittedAt().toEpochSecond(ZoneOffset.UTC);
                userTimestamps.computeIfAbsent(userId, k -> new ArrayList<>()).add(timestamp);
            }

            // Sort timestamps for each user
            for (List<Long> timestamps : userTimestamps.values()) {
                Collections.sort(timestamps);
            }

            // Check for suspicious overlap between users
            boolean suspicious = false;
            List<Long> groupUsers = new ArrayList<>(group);
            
            outerLoop:
            for (int i = 0; i < groupUsers.size() && !suspicious; i++) {
                for (int j = i + 1; j < groupUsers.size(); j++) {
                    Long userA = groupUsers.get(i);
                    Long userB = groupUsers.get(j);
                    
                    List<Long> timestampsA = userTimestamps.getOrDefault(userA, Collections.emptyList());
                    List<Long> timestampsB = userTimestamps.getOrDefault(userB, Collections.emptyList());
                    
                    double overlap = computeOverlapRatio(timestampsA, timestampsB, timeWindowSeconds);
                    
                    if (overlap > 0.5) {
                        suspicious = true;
                        break outerLoop;
                    }
                }
            }

            // Save flag if suspicious activity detected
            if (suspicious) {
                TeamCoordinationFlag flag = TeamCoordinationFlag.builder()
                        .contestId(contestId)
                        .userIdsJson(JsonUtils.toJson(new ArrayList<>(group)))
                        .reason("Shared IP " + ipAddress + " and high submission-time overlap")
                        .createdAt(LocalDateTime.now())
                        .build();
                flagRepository.save(flag);
                
                System.out.printf("Team coordination detected for IP %s with %d users in contest %d%n", 
                    ipAddress, group.size(), contestId);
            }
        }
    }

    /**
     * Compute the ratio of overlapping submissions between two users within a time window.
     */
    private double computeOverlapRatio(List<Long> timestampsA, List<Long> timestampsB, int windowSeconds) {
        if (timestampsA.isEmpty() || timestampsB.isEmpty()) {
            return 0.0;
        }

        int overlaps = 0;
        int i = 0, j = 0;
        
        while (i < timestampsA.size() && j < timestampsB.size()) {
            long timeA = timestampsA.get(i);
            long timeB = timestampsB.get(j);
            
            if (Math.abs(timeA - timeB) <= windowSeconds) {
                overlaps++;
                i++;
                j++;
            } else if (timeA < timeB) {
                i++;
            } else {
                j++;
            }
        }

        int maxSubmissions = Math.max(timestampsA.size(), timestampsB.size());
        return maxSubmissions > 0 ? (double) overlaps / maxSubmissions : 0.0;
    }
}
