package com.collegecontest.controller;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@RestController
@RequestMapping("/discussions")
public class DiscussionController {

    private final UserRepository userRepository;
    private static final AtomicLong ID_GEN = new AtomicLong(100);
    private static final List<Map<String, Object>> DISCUSSIONS = Collections.synchronizedList(new ArrayList<>());

    static {
        // Seed default discussions for common problems
        Map<String, Object> d1 = new LinkedHashMap<>();
        d1.put("id", 1L);
        d1.put("problemId", 1L);
        d1.put("title", "Optimal O(N) Hash Map Solution with Detailed Walkthrough");
        d1.put("content", "Instead of using nested loops which takes O(N^2), we can maintain a hash map of value -> index as we traverse the array.");
        d1.put("codeSnippet", "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}");
        d1.put("language", "JavaScript");
        d1.put("authorName", "Devendra Rao");
        d1.put("authorRole", "Knight Candidate");
        d1.put("college", "NIT Surathkal");
        d1.put("votes", 42);
        d1.put("userVote", 0);
        d1.put("isAccepted", true);
        d1.put("tags", List.of("Optimal", "HashMap", "O(N)"));
        d1.put("createdAt", Instant.now().minusSeconds(86400 * 2).toString());
        d1.put("repliesCount", 5);

        Map<String, Object> d2 = new LinkedHashMap<>();
        d2.put("id", 2L);
        d2.put("problemId", 1L);
        d2.put("title", "C++ Two Pointers approach after sorting (O(N log N))");
        d2.put("content", "If modifying the array indices isn't an issue or we preserve pairs with index, two pointers from left and right gives clean O(1) space.");
        d2.put("codeSnippet", "vector<int> twoSum(vector<int>& nums, int target) {\n    vector<pair<int, int>> valIdx;\n    for(int i=0; i<nums.size(); ++i) valIdx.push_back({nums[i], i});\n    sort(valIdx.begin(), valIdx.end());\n    int l = 0, r = nums.size() - 1;\n    while(l < r) {\n        int sum = valIdx[l].first + valIdx[r].first;\n        if(sum == target) return {valIdx[l].second, valIdx[r].second};\n        else if(sum < target) l++;\n        else r--;\n    }\n    return {};\n}");
        d2.put("language", "C++");
        d2.put("authorName", "Sneha Sharma");
        d2.put("authorRole", "Code Knight");
        d2.put("college", "BITS Pilani");
        d2.put("votes", 27);
        d2.put("userVote", 0);
        d2.put("isAccepted", false);
        d2.put("tags", List.of("TwoPointers", "C++", "O(1)Space"));
        d2.put("createdAt", Instant.now().minusSeconds(86400).toString());
        d2.put("repliesCount", 2);

        DISCUSSIONS.add(d1);
        DISCUSSIONS.add(d2);
    }

    public DiscussionController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private String currentUserName() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return "Anonymous Knight";
        }
        return userRepository.findByEmail(auth.getName()).map(User::getName).orElse(auth.getName());
    }

    @GetMapping({"/{problemId}", "/problem/{problemId}"})
    public ResponseEntity<List<Map<String, Object>>> getDiscussionsByProblem(@PathVariable Long problemId) {
        List<Map<String, Object>> result = new ArrayList<>();
        synchronized (DISCUSSIONS) {
            for (Map<String, Object> d : DISCUSSIONS) {
                Long pid = ((Number) d.get("problemId")).longValue();
                if (pid.equals(problemId)) {
                    result.add(new LinkedHashMap<>(d));
                }
            }
        }
        // If empty for this problem, provide a helpful default starter
        if (result.isEmpty()) {
            Map<String, Object> starter = new LinkedHashMap<>();
            starter.put("id", ID_GEN.incrementAndGet());
            starter.put("problemId", problemId);
            starter.put("title", "Community Discussion & Approaches for Problem #" + problemId);
            starter.put("content", "Share your algorithmic ideas, edge cases, time/space trade-offs, and clean implementations with other knights.");
            starter.put("codeSnippet", "// Share your solution here\n");
            starter.put("language", "Java");
            starter.put("authorName", "Knightzone Moderator");
            starter.put("authorRole", "FACULTY");
            starter.put("college", "Knightzone Academy");
            starter.put("votes", 15);
            starter.put("userVote", 0);
            starter.put("isAccepted", true);
            starter.put("tags", List.of("Discussion", "Guide"));
            starter.put("createdAt", Instant.now().toString());
            starter.put("repliesCount", 0);
            DISCUSSIONS.add(starter);
            result.add(starter);
        }

        // Sort descending by votes
        result.sort((a, b) -> Integer.compare((int) b.get("votes"), (int) a.get("votes")));
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createDiscussion(@RequestBody Map<String, Object> body) {
        Long problemId = Long.valueOf(String.valueOf(body.getOrDefault("problemId", 1)));
        String title = String.valueOf(body.getOrDefault("title", "Untitled Solution"));
        String content = String.valueOf(body.getOrDefault("content", ""));
        String codeSnippet = String.valueOf(body.getOrDefault("codeSnippet", ""));
        String language = String.valueOf(body.getOrDefault("language", "Java"));
        
        List<?> rawTags = (List<?>) body.getOrDefault("tags", List.of("Solution", language));
        List<String> tags = new ArrayList<>();
        for (Object t : rawTags) tags.add(String.valueOf(t));

        Map<String, Object> newDisc = new LinkedHashMap<>();
        long newId = ID_GEN.incrementAndGet();
        newDisc.put("id", newId);
        newDisc.put("problemId", problemId);
        newDisc.put("title", title);
        newDisc.put("content", content);
        newDisc.put("codeSnippet", codeSnippet);
        newDisc.put("language", language);
        newDisc.put("authorName", currentUserName());
        newDisc.put("authorRole", "Knight Candidate");
        newDisc.put("college", "University Partner");
        newDisc.put("votes", 1);
        newDisc.put("userVote", 1);
        newDisc.put("isAccepted", false);
        newDisc.put("tags", tags);
        newDisc.put("createdAt", Instant.now().toString());
        newDisc.put("repliesCount", 0);

        DISCUSSIONS.add(0, newDisc);
        return ResponseEntity.ok(newDisc);
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<Map<String, Object>> voteDiscussion(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        int delta = Integer.parseInt(String.valueOf(body.getOrDefault("delta", 1)));
        
        synchronized (DISCUSSIONS) {
            for (Map<String, Object> d : DISCUSSIONS) {
                if (Long.valueOf(String.valueOf(d.get("id"))).equals(id)) {
                    int currentVotes = (int) d.get("votes");
                    int updatedVotes = Math.max(0, currentVotes + delta);
                    d.put("votes", updatedVotes);
                    d.put("userVote", delta);
                    return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "discussionId", id,
                        "updatedVotes", updatedVotes,
                        "userVote", delta
                    ));
                }
            }
        }

        return ResponseEntity.notFound().build();
    }
}
