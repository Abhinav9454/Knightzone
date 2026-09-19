package com.collegecontest.service;

import com.collegecontest.ipmonitor.model.UserIp;
import com.collegecontest.ipmonitor.repository.UserIpRepository;
import com.collegecontest.team.repository.TeamMemberRepository;
import com.collegecontest.repository.SubmissionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IPMonitorService {

    private final UserIpRepository userIpRepository;
    private final SubmissionRepository submissionRepository;

    @Value("${ipmonitor.whitelist:}")
    private String whitelist;

    public IPMonitorService(UserIpRepository userIpRepository, SubmissionRepository submissionRepository) {
        this.userIpRepository = userIpRepository;
        this.submissionRepository = submissionRepository;
    }

    @Transactional
    public void recordUserIp(Long userId, String ipAddress) {
        List<UserIp> existing = userIpRepository.findByUserId(userId).stream()
                .filter(u -> u.getIpAddress().equals(ipAddress)).collect(Collectors.toList());
        if (existing.isEmpty()) {
            UserIp u = new UserIp();
            u.setUserId(userId);
            u.setIpAddress(ipAddress);
            u.setLastSeen(LocalDateTime.now());
            userIpRepository.save(u);
        } else {
            UserIp u = existing.get(0);
            u.setLastSeen(LocalDateTime.now());
            userIpRepository.save(u);
        }
    }

    public List<Long> getUsersSharingIpInContest(String ipAddress, Long contestId, int maxUsers) {
        List<UserIp> users = userIpRepository.findByIpAddress(ipAddress);
        List<Long> userIds = users.stream().map(UserIp::getUserId).collect(Collectors.toList());
        // filter users who have submissions in contest
        List<Long> active = submissionRepository.findAll().stream()
                .filter(s -> s.getProblem() != null
                        && s.getProblem().getContest() != null
                        && s.getProblem().getContest().getId().equals(contestId))
                .map(s -> s.getUser().getId()).distinct().collect(Collectors.toList());

        List<Long> shared = userIds.stream().filter(active::contains).collect(Collectors.toList());
        if (shared.size() > maxUsers)
            return shared;
        return List.of();
    }

    public boolean isIpWhitelisted(String ipAddress) {
        if (whitelist == null || whitelist.isBlank())
            return false;
        String[] arr = whitelist.split(",");
        for (String w : arr) {
            if (w.trim().equals(ipAddress))
                return true;
        }
        return false;
    }
}


