import type {
  Contest, Problem, Submission, LeaderboardEntry, DashboardStats, User, Badge,
  ActivityDay, DepartmentLeague, Duel, FlaggedSubmission,
  InterviewSlot, PlacementTopic, CompanyMatch,
  ResumeStrength, ReviewFlag,
  SuspiciousUser, Team, CollegeStats
} from "./types";

export const mockUser: User = {
  id: 1, name: "Alex Chen", email: "alex@university.edu", college: "MIT",
  department: "Computer Science", role: "USER", rating: 1542, streak: 7, streakShields: 2,
  badges: [
    { id: 1, name: "First Blood", description: "Solved your first problem", earned: true, progress: 1, maxProgress: 1 },
    { id: 2, name: "Contest Warrior", description: "Participated in 10 contests", earned: true, progress: 12, maxProgress: 10 },
    { id: 3, name: "Speed Demon", description: "Solved a problem in under 5 minutes", earned: true, progress: 1, maxProgress: 1 },
  ],
};

export const mockContests: Contest[] = [
  { id: 1, title: "Weekly Challenge #42", description: "Algorithmic contest covering DP and graphs", startTime: "2026-02-24T14:00:00Z", endTime: "2026-02-24T17:00:00Z", duration: 180, status: "UPCOMING", participantCount: 156, registered: false, proctored: true },
  { id: 2, title: "Spring Coding Sprint", description: "Data structures and algorithms", startTime: "2026-02-22T10:00:00Z", endTime: "2026-02-22T14:00:00Z", duration: 240, status: "ONGOING", participantCount: 342, registered: true, proctored: true, tabSwitchCount: 2 },
  { id: 3, title: "Binary Search Blitz", description: "Master binary search techniques", startTime: "2026-02-20T09:00:00Z", endTime: "2026-02-20T11:00:00Z", duration: 120, status: "PAST", participantCount: 89 },
  { id: 4, title: "Graph Theory Marathon", description: "BFS, DFS, shortest paths and more", startTime: "2026-02-18T13:00:00Z", endTime: "2026-02-18T17:00:00Z", duration: 240, status: "PAST", participantCount: 210 },
  { id: 5, title: "Inter-College Sprint", description: "Large-scale inter-college competitive programming contest", startTime: "2026-03-01T09:00:00Z", endTime: "2026-03-01T14:00:00Z", duration: 300, status: "UPCOMING", participantCount: 520, registered: true },
];

export const mockProblems: Problem[] = [
  { id: 1, title: "Two Sum", difficulty: "EASY", description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.", constraints: "2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9", inputFormat: "First line: n (size of array)\nSecond line: n integers\nThird line: target", outputFormat: "Two indices separated by space", sampleInput: "4\n2 7 11 15\n9", sampleOutput: "0 1", tags: ["Array", "Hash Table"], contestId: 2, acceptanceRate: 78, upvotes: 142, downvotes: 8, hints: ["Think about what complement you need for each number.", "A hash map can help you look up complements in O(1)."] },
  { id: 2, title: "Longest Palindromic Substring", difficulty: "MEDIUM", description: "Given a string s, return the longest palindromic substring in s.", constraints: "1 <= s.length <= 1000\ns consists of only digits and English letters.", inputFormat: "A single string s", outputFormat: "The longest palindromic substring", sampleInput: "babad", sampleOutput: "bab", tags: ["String", "Dynamic Programming"], contestId: 2, acceptanceRate: 45, upvotes: 98, downvotes: 12, hints: ["Expand around center.", "Consider both odd and even length palindromes."] },
  { id: 3, title: "Merge K Sorted Lists", difficulty: "HARD", description: "You are given an array of k linked-lists, each linked-list is sorted in ascending order. Merge all the linked-lists into one sorted linked-list and return it.", constraints: "k == lists.length\n0 <= k <= 10^4\n0 <= lists[i].length <= 500", inputFormat: "k sorted linked lists", outputFormat: "One merged sorted linked list", sampleInput: "[[1,4,5],[1,3,4],[2,6]]", sampleOutput: "[1,1,2,3,4,4,5,6]", tags: ["Linked List", "Heap", "Divide and Conquer"], contestId: 2, acceptanceRate: 32, upvotes: 67, downvotes: 5, hints: ["Use a min-heap to efficiently get the smallest element.", "Divide and conquer by merging pairs."] },
  { id: 4, title: "Valid Parentheses", difficulty: "EASY", description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.", constraints: "1 <= s.length <= 10^4", inputFormat: "A single string", outputFormat: "true or false", sampleInput: "()[]{}", sampleOutput: "true", tags: ["Stack", "String"], contestId: 1, acceptanceRate: 82, upvotes: 200, downvotes: 3 },
  { id: 5, title: "Maximum Subarray", difficulty: "MEDIUM", description: "Given an integer array nums, find the subarray with the largest sum, and return its sum.", constraints: "1 <= nums.length <= 10^5\n-10^4 <= nums[i] <= 10^4", inputFormat: "Array of integers", outputFormat: "Maximum subarray sum", sampleInput: "[-2,1,-3,4,-1,2,1,-5,4]", sampleOutput: "6", tags: ["Array", "Divide and Conquer", "DP"], contestId: 1, acceptanceRate: 55, upvotes: 115, downvotes: 9 },
];

export const mockSubmissions: Submission[] = [
  { id: 1, problemId: 1, problemTitle: "Two Sum", userId: 1, language: "cpp", code: '#include <vector>\nusing namespace std;\nvector<int> twoSum(vector<int>& nums, int target) {\n  return {};\n}', verdict: "ACCEPTED", executionTime: 12, memoryUsed: 8400, submittedAt: "2026-02-22T11:30:00Z", testCasesPassed: 55, totalTestCases: 55 },
  { id: 2, problemId: 2, problemTitle: "Longest Palindromic Substring", userId: 1, language: "python", code: 'def longestPalindrome(s):\n    pass', verdict: "WRONG_ANSWER", executionTime: 45, memoryUsed: 12000, submittedAt: "2026-02-22T11:15:00Z", testCasesPassed: 40, totalTestCases: 55 },
  { id: 3, problemId: 3, problemTitle: "Merge K Sorted Lists", userId: 1, language: "java", code: 'class Solution {}', verdict: "TIME_LIMIT", executionTime: 2000, memoryUsed: 64000, submittedAt: "2026-02-22T10:45:00Z", testCasesPassed: 20, totalTestCases: 55 },
  { id: 4, problemId: 4, problemTitle: "Valid Parentheses", userId: 1, language: "cpp", code: '', verdict: "ACCEPTED", executionTime: 4, memoryUsed: 7200, submittedAt: "2026-02-21T15:00:00Z", testCasesPassed: 30, totalTestCases: 30 },
  { id: 5, problemId: 1, problemTitle: "Two Sum", userId: 1, language: "python", code: '', verdict: "RUNTIME_ERROR", executionTime: 0, memoryUsed: 0, submittedAt: "2026-02-22T11:25:00Z", testCasesPassed: 0, totalTestCases: 55 },
];

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: 10, username: "CodeMaster99", score: 2450, problemsSolved: 312, college: "Stanford" },
  { rank: 2, userId: 11, username: "AlgoQueen", score: 2380, problemsSolved: 298, college: "MIT" },
  { rank: 3, userId: 12, username: "ByteWizard", score: 2310, problemsSolved: 275, college: "CMU" },
  { rank: 4, userId: 1, username: "Alex Chen", score: 1542, problemsSolved: 145, college: "MIT" },
  { rank: 5, userId: 13, username: "DataNinja", score: 1480, problemsSolved: 132, college: "Berkeley" },
  { rank: 6, userId: 14, username: "RecursiveRider", score: 1420, problemsSolved: 128, college: "Georgia Tech" },
  { rank: 7, userId: 15, username: "GraphGuru", score: 1350, problemsSolved: 115, college: "Caltech" },
  { rank: 8, userId: 16, username: "StackOverflow", score: 1290, problemsSolved: 102, college: "Princeton" },
  { rank: 9, userId: 17, username: "BinaryBoss", score: 1210, problemsSolved: 95, college: "Harvard" },
  { rank: 10, userId: 18, username: "HeapHero", score: 1180, problemsSolved: 88, college: "UCLA" },
];

export const mockDashboardStats: DashboardStats = {
  contestsParticipated: 12, problemsSolved: 145, currentRating: 1542, globalRank: 4,
  upcomingContests: 2, recentSubmissions: mockSubmissions.slice(0, 3),
};

// Activity calendar (last 90 days)
export const mockActivityDays: ActivityDay[] = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (89 - i));
  return { date: d.toISOString().slice(0, 10), count: Math.random() > 0.3 ? Math.floor(Math.random() * 8) : 0 };
});

// Department Leagues
export const mockDepartmentLeagues: DepartmentLeague[] = [
  { id: 1, name: "Computer Science", college: "MIT", points: 12500, memberCount: 85, rank: 1 },
  { id: 2, name: "Electrical Engineering", college: "Stanford", points: 11200, memberCount: 62, rank: 2 },
  { id: 3, name: "Mathematics", college: "CMU", points: 9800, memberCount: 45, rank: 3 },
  { id: 4, name: "Computer Science", college: "Berkeley", points: 9200, memberCount: 78, rank: 4 },
  { id: 5, name: "Data Science", college: "Georgia Tech", points: 8600, memberCount: 55, rank: 5 },
];

// Duels
export const mockDuels: Duel[] = [
  { id: 1, challengerId: 1, challengerName: "Alex Chen", opponentId: 10, opponentName: "CodeMaster99", status: "ACTIVE", problemId: 1, problemTitle: "Two Sum", createdAt: "2026-02-22T12:00:00Z" },
  { id: 2, challengerId: 11, challengerName: "AlgoQueen", opponentId: 1, opponentName: "Alex Chen", status: "PENDING", createdAt: "2026-02-22T11:00:00Z" },
  { id: 3, challengerId: 1, challengerName: "Alex Chen", opponentId: 12, opponentName: "ByteWizard", status: "COMPLETED", problemId: 2, problemTitle: "Longest Palindromic Substring", winner: "Alex Chen", createdAt: "2026-02-21T15:00:00Z" },
];

// Flagged Submissions
export const mockFlaggedSubmissions: FlaggedSubmission[] = [
  { id: 1, submissionId: 101, userId: 25, username: "ShadyUser1", reason: "Code similarity > 95% with another submission", severity: "HIGH", status: "PENDING", detectedAt: "2026-02-22T10:00:00Z" },
  { id: 2, submissionId: 102, userId: 26, username: "QuickPaste", reason: "Submission within 10 seconds of problem opening", severity: "MEDIUM", status: "PENDING", detectedAt: "2026-02-22T09:30:00Z" },
  { id: 3, submissionId: 103, userId: 27, username: "CopyBot", reason: "Exact match with online solution", severity: "HIGH", status: "REVIEWED", detectedAt: "2026-02-21T14:00:00Z" },
];

// Interview Slots
export const mockInterviewSlots: InterviewSlot[] = [
  { id: 1, date: "2026-02-25", time: "10:00 AM", duration: 45, interviewer: "Dr. Smith", topic: "Data Structures", booked: false, status: "AVAILABLE" },
  { id: 2, date: "2026-02-25", time: "2:00 PM", duration: 60, interviewer: "Prof. Johnson", topic: "System Design", booked: true, status: "BOOKED" },
  { id: 3, date: "2026-02-26", time: "11:00 AM", duration: 45, interviewer: "Dr. Williams", topic: "Algorithms", booked: false, status: "AVAILABLE" },
  { id: 4, date: "2026-02-27", time: "3:00 PM", duration: 30, interviewer: "Ms. Davis", topic: "Behavioral", booked: false, status: "AVAILABLE" },
];

// Placement
export const mockPlacementTopics: PlacementTopic[] = [
  { name: "Data Structures", mastery: 82, importance: "HIGH" },
  { name: "Algorithms", mastery: 68, importance: "HIGH" },
  { name: "System Design", mastery: 35, importance: "HIGH" },
  { name: "OOP Concepts", mastery: 75, importance: "MEDIUM" },
  { name: "Database", mastery: 50, importance: "MEDIUM" },
  { name: "Networking", mastery: 30, importance: "LOW" },
];

export const mockCompanyMatches: CompanyMatch[] = [
  { name: "Google", match: 72, requiredTopics: ["Algorithms", "System Design", "Data Structures"] },
  { name: "Microsoft", match: 78, requiredTopics: ["OOP Concepts", "Data Structures", "Algorithms"] },
  { name: "Amazon", match: 68, requiredTopics: ["System Design", "Algorithms", "Database"] },
  { name: "Meta", match: 65, requiredTopics: ["Algorithms", "System Design", "Data Structures"] },
];

// Resume
export const mockResumeStrength: ResumeStrength = {
  overallScore: 72,
  breakdown: [
    { category: "Problem Solving", score: 85, suggestion: "Keep solving hard problems to maintain your edge" },
    { category: "Contest Experience", score: 78, suggestion: "Participate in more inter-college contests" },
    { category: "Topic Diversity", score: 60, suggestion: "Work on graphs and dynamic programming" },
    { category: "Consistency", score: 70, suggestion: "Maintain a daily streak for better consistency" },
    { category: "Projects", score: 45, suggestion: "Add more project work to showcase practical skills" },
  ],
};

// Review Flags
export const mockReviewFlags: ReviewFlag[] = [
  { id: 1, type: "PROBLEM", targetId: 3, reason: "Unclear problem statement", reportedBy: 15, reporterName: "GraphGuru", status: "OPEN", createdAt: "2026-02-22T08:00:00Z" },
  { id: 2, type: "SUBMISSION", targetId: 101, reason: "Inappropriate variable names", reportedBy: 14, reporterName: "RecursiveRider", status: "OPEN", createdAt: "2026-02-21T16:00:00Z" },
  { id: 3, type: "COMMENT", targetId: 50, reason: "Spam content", reportedBy: 13, reporterName: "DataNinja", status: "RESOLVED", createdAt: "2026-02-20T12:00:00Z" },
];

// Suspicious Users
export const mockSuspiciousUsers: SuspiciousUser[] = [
  { userId: 30, username: "MultiAcct1", reason: "Multiple accounts detected from same IP", severity: "HIGH", detectedAt: "2026-02-22T09:00:00Z", status: "INVESTIGATING" },
  { userId: 31, username: "SpeedHacker", reason: "Impossibly fast submission times", severity: "CRITICAL", detectedAt: "2026-02-21T15:00:00Z", status: "INVESTIGATING" },
  { userId: 32, username: "IPSharer", reason: "IP sharing with banned user", severity: "MEDIUM", detectedAt: "2026-02-20T11:00:00Z", status: "CLEARED" },
];

// Teams
export const mockTeams: Team[] = [
  { id: 1, name: "Code Crushers", members: [{ userId: 1, name: "Alex Chen", role: "Captain" }, { userId: 13, name: "DataNinja", role: "Member" }, { userId: 14, name: "RecursiveRider", role: "Member" }], score: 4200, contestsPlayed: 8 },
  { id: 2, name: "Binary Beasts", members: [{ userId: 10, name: "CodeMaster99", role: "Captain" }, { userId: 11, name: "AlgoQueen", role: "Member" }], score: 5800, contestsPlayed: 12 },
];

// All badges (including unearned)
export const mockAllBadges: Badge[] = [
  { id: 1, name: "First Blood", description: "Solved your first problem", icon: "🗡️", earned: true, progress: 1, maxProgress: 1 },
  { id: 2, name: "Contest Warrior", description: "Participated in 10 contests", icon: "⚔️", earned: true, progress: 12, maxProgress: 10 },
  { id: 3, name: "Speed Demon", description: "Solved a problem in under 5 minutes", icon: "⚡", earned: true, progress: 1, maxProgress: 1 },
  { id: 4, name: "Century Club", description: "Solve 100 problems", icon: "💯", earned: true, progress: 145, maxProgress: 100 },
  { id: 5, name: "Streak Master", description: "Maintain a 30-day streak", icon: "🔥", earned: false, progress: 7, maxProgress: 30 },
  { id: 6, name: "Problem Setter", description: "Create 5 problems", icon: "✏️", earned: false, progress: 0, maxProgress: 5 },
  { id: 7, name: "Team Player", description: "Win 5 team contests", icon: "🤝", earned: false, progress: 2, maxProgress: 5 },
  { id: 8, name: "Unbeatable", description: "Win 3 duels in a row", icon: "👑", earned: false, progress: 1, maxProgress: 3 },
];

// College stats for inter-college arena
export const mockCollegeStats: CollegeStats[] = [
  { college: "MIT", totalPoints: 45200, memberCount: 120, contestsWon: 8, rank: 1 },
  { college: "Stanford", totalPoints: 42100, memberCount: 105, contestsWon: 7, rank: 2 },
  { college: "CMU", totalPoints: 38500, memberCount: 95, contestsWon: 5, rank: 3 },
  { college: "Berkeley", totalPoints: 35800, memberCount: 110, contestsWon: 4, rank: 4 },
  { college: "Georgia Tech", totalPoints: 32000, memberCount: 88, contestsWon: 3, rank: 5 },
  { college: "Caltech", totalPoints: 28500, memberCount: 60, contestsWon: 3, rank: 6 },
];
