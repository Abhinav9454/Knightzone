package com.collegecontest.controller;

import com.collegecontest.model.User;
import com.collegecontest.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/bookmarks")
public class BookmarkController {

    private final UserRepository userRepository;
    // User -> Set of Bookmarked problem IDs
    private static final Map<Long, Set<Long>> USER_BOOKMARKS = new ConcurrentHashMap<>();

    static {
        // Pre-seed some default bookmarks for demo user 1
        Set<Long> set = ConcurrentHashMap.newKeySet();
        set.add(1L);
        set.add(3L);
        USER_BOOKMARKS.put(1L, set);
    }

    public BookmarkController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return 1L;
        }
        return userRepository.findByEmail(auth.getName()).map(User::getId).orElse(1L);
    }

    @GetMapping("/problems")
    public ResponseEntity<Map<String, Object>> getBookmarkedProblems() {
        Long userId = currentUserId();
        Set<Long> bookmarks = USER_BOOKMARKS.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        return ResponseEntity.ok(Map.of(
            "userId", userId,
            "bookmarkedProblemIds", new ArrayList<>(bookmarks),
            "count", bookmarks.size()
        ));
    }

    @PostMapping({"/toggle/{problemId}", "/toggle"})
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable(required = false) Long problemId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) Long id) {
        Long targetId = problemId;
        if (targetId == null && id != null) targetId = id;
        if (targetId == null && body != null && body.get("problemId") != null) {
            targetId = Long.valueOf(String.valueOf(body.get("problemId")));
        }
        if (targetId == null) targetId = 1L;

        Long userId = currentUserId();
        Set<Long> bookmarks = USER_BOOKMARKS.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet());
        
        boolean isNowBookmarked;
        if (bookmarks.contains(targetId)) {
            bookmarks.remove(targetId);
            isNowBookmarked = false;
        } else {
            bookmarks.add(targetId);
            isNowBookmarked = true;
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("status", "success");
        resp.put("problemId", targetId);
        resp.put("bookmarked", isNowBookmarked);
        resp.put("message", isNowBookmarked ? "Problem saved to revision bookmarks." : "Problem removed from bookmarks.");
        resp.put("totalBookmarks", bookmarks.size());

        return ResponseEntity.ok(resp);
    }
}
