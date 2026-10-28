import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("kbz_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRequest =
        error.config?.url?.includes("/auth/login") ||
        error.config?.url?.includes("/auth/register");
      if (!isAuthRequest) {
        localStorage.removeItem("kbz_token");
        localStorage.removeItem("kbz_user");

        // Allow guest browsing: only redirect to login if an active mutation failed or on restricted pages
        const method = (error.config?.method || "get").toLowerCase();
        const isMutation =
          method === "post" ||
          method === "put" ||
          method === "delete" ||
          method === "patch";
        const currentPath = window.location.pathname;
        const isRestrictedPath =
          currentPath.startsWith("/profile") || currentPath.startsWith("/admin");

        if (
          (isMutation || isRestrictedPath) &&
          currentPath !== "/login" &&
          currentPath !== "/register"
        ) {
          window.location.href = `/login?redirect=${encodeURIComponent(
            currentPath
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials) => {
    const response = await API.post("/auth/login", credentials);
    if (response.data?.token) {
      localStorage.setItem("kbz_token", response.data.token);
      localStorage.setItem("kbz_user", JSON.stringify(response.data.user || { email: credentials.email }));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await API.post("/auth/register", userData);
    if (response.data?.token) {
      localStorage.setItem("kbz_token", response.data.token);
      localStorage.setItem("kbz_user", JSON.stringify(response.data.user || { email: userData.email, name: userData.name }));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("kbz_token");
    localStorage.removeItem("kbz_user");
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem("kbz_user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken: () => localStorage.getItem("kbz_token"),
};

export const problemsApi = {
  getProblemSet: async ({ page = 0, size = 20, q, difficulty } = {}) => {
    const params = { page, size };
    if (q) params.q = q;
    if (difficulty && difficulty !== "All") params.difficulty = difficulty.toUpperCase();
    const response = await API.get("/problems/problem-set", { params });
    return response.data;
  },

  getProblem: async (id) => {
    const response = await API.get(`/problems/problem-set/${id}`);
    return response.data;
  },
};

export const dashboardApi = {
  getSummary: async () => {
    const response = await API.get("/dashboard/summary");
    return response.data;
  },
};

export const contestsApi = {
  getAll: async (page = 0, size = 20) => {
    const response = await API.get("/contests", { params: { page, size } });
    return response.data;
  },

  getContest: async (id) => {
    const response = await API.get(`/contests/${id}`);
    return response.data;
  },

  registerForContest: async (id) => {
    const response = await API.post(`/contests/${id}/register`);
    return response.data;
  },

  getAccess: async (id) => {
    const response = await API.get(`/contests/${id}/access`);
    return response.data;
  },

  getProblems: async (contestId) => {
    const response = await API.get(`/problems/contest/${contestId}`);
    return response.data;
  },

  getLeaderboard: async (contestId) => {
    const response = await API.get(`/leaderboard/${contestId}`);
    return response.data;
  },

  getFirstSolvers: async (contestId) => {
    const response = await API.get(`/leaderboard/${contestId}/first-solvers`);
    return response.data;
  },
};

export const duelsApi = {
  getMyDuels: async () => {
    const response = await API.get("/duels");
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/duels/${id}`);
    return response.data;
  },

  joinMatchmaking: async (data) => {
    const response = await API.post("/duels/matchmaking", data);
    return response.data;
  },

  submit: async (id, data) => {
    const response = await API.post(`/duels/${id}/submit`, data);
    return response.data;
  },

  abandon: async (id) => {
    const response = await API.post(`/duels/${id}/abandon`);
    return response.data;
  },

  getGames: async () => {
    const response = await API.get("/duels/games");
    return response.data;
  },

  getLeaderboard: async (params = {}) => {
    const response = await API.get("/duels/leaderboard", { params });
    return response.data;
  },

  challenge: async (data) => {
    const response = await API.post("/duels", data);
    return response.data;
  },

  accept: async (id) => {
    const response = await API.post(`/duels/${id}/accept`);
    return response.data;
  },

  decline: async (id) => {
    const response = await API.post(`/duels/${id}/decline`);
    return response.data;
  },

  getReplay: async (duelId) => {
    const response = await API.get(`/duels/${duelId}/replay`);
    return response.data;
  },

  getInsights: async (duelId) => {
    const response = await API.get(`/duels/${duelId}/insights`);
    return response.data;
  },
};

export const aiApi = {
  useAi: async (data) => {
    const response = await API.post("/ai/use", data);
    return response.data;
  },

  getQuota: async () => {
    const response = await API.get("/ai/quota");
    return response.data;
  },
};

export const leaderboardApi = {
  getGlobal: async (params = {}) => {
    const response = await API.get("/leaderboard", { params });
    return response.data;
  },

  getInterCollege: async () => {
    const response = await API.get("/inter-college/rankings/current");
    return response.data;
  },

  getColleges: async () => {
    const response = await API.get("/inter-college/colleges");
    return response.data;
  },
};

export const placementApi = {
  getReadiness: async () => {
    const response = await API.get("/placement/readiness");
    return response.data;
  },
};

export const resumeApi = {
  getStrength: async () => {
    const response = await API.get("/resume/strength");
    return response.data;
  },

  upload: async (formData) => {
    const response = await API.post("/resume/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  parseText: async (text) => {
    const response = await API.post("/resume/parse", { text });
    return response.data;
  },
};

export const mockInterviewApi = {
  getInterviews: async (params = {}) => {
    const response = await API.get("/interviews", { params });
    return response.data;
  },

  getInterview: async (id) => {
    const response = await API.get(`/interviews/${id}`);
    return response.data;
  },

  startAi: async (data) => {
    const response = await API.post("/interviews/ai", data);
    return response.data;
  },

  submitAiAnswer: async (data) => {
    const response = await API.post("/interviews/ai/submit", data);
    return response.data;
  },

  requestPeer: async (data) => {
    const response = await API.post("/interviews/peer", data);
    return response.data;
  },

  invitePeer: async (data) => {
    const response = await API.post("/interviews/peer/invite", data);
    return response.data;
  },

  randomPeerMatch: async (params = {}) => {
    const response = await API.post("/interviews/peer/match", null, { params });
    return response.data;
  },

  joinPeerSession: async (sessionId) => {
    const response = await API.post("/interviews/peer/join", null, { params: { sessionId } });
    return response.data;
  },

  getSession: async (sessionId) => {
    const response = await API.get(`/interviews/session/${sessionId}`);
    return response.data;
  },

  schedule: async (data) => {
    const response = await API.post("/interviews/schedule", data);
    return response.data;
  },

  addFeedback: async (id, data) => {
    const response = await API.put(`/interviews/${id}/feedback`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await API.delete(`/interviews/${id}`);
    return response.data;
  },

  getQuestions: async (params = {}) => {
    const response = await API.get("/questions", { params });
    return response.data;
  },

  getMasteryProgress: async () => {
    const response = await API.get("/interviews/mastery/progress");
    return response.data;
  },

  getUserAnalytics: async (userId) => {
    const response = await API.get(`/analytics/user/${userId}`);
    return response.data;
  },
};

export const badgesApi = {
  getAll: async () => {
    const response = await API.get("/badges");
    return response.data;
  },

  getUserBadges: async (userId) => {
    const response = await API.get(`/users/${userId}/badges`);
    return response.data;
  },
};

export const activityApi = {
  getCalendar: async () => {
    const response = await API.get("/activity/calendar");
    return response.data;
  },
};

export const teamsApi = {
  getAll: async () => {
    const response = await API.get("/teams");
    return response.data;
  },

  create: async (data) => {
    const response = await API.post("/teams", data);
    return response.data;
  },
};

export const hintsApi = {
  getForProblem: async (problemId, userId) => {
    const response = await API.get(`/hints/problem/${problemId}`, {
      params: { userId },
    });
    return response.data;
  },
};

export const adminApi = {
  getFlaggedSubmissions: async () => {
    const response = await API.get("/integrity/flagged");
    return response.data;
  },

  reviewFlaggedSubmission: async (id, action) => {
    const response = await API.post(`/integrity/${id}/review`, { action });
    return response.data;
  },

  getReviewFlags: async () => {
    const response = await API.get("/review-flags");
    return response.data;
  },

  resolveReviewFlag: async (id) => {
    const response = await API.post(`/review-flags/${id}/resolve`);
    return response.data;
  },

  dismissReviewFlag: async (id) => {
    const response = await API.post(`/review-flags/${id}/dismiss`);
    return response.data;
  },

  // Plagiarism & Code Similarity
  scanContestPlagiarism: async (contestId) => {
    const response = await API.post(`/admin/plagiarism/check/${contestId}`);
    return response.data;
  },

  getPlagiarismFlags: async () => {
    const response = await API.get("/admin/plagiarism/flags");
    return response.data;
  },

  getContestPlagiarismFlags: async (contestId) => {
    const response = await API.get(`/admin/plagiarism/contest/${contestId}`);
    return response.data;
  },

  resolvePlagiarismFlag: async (flagId, resolution = "RESOLVED") => {
    const response = await API.post(`/admin/plagiarism/resolve/${flagId}`, { resolution });
    return response.data;
  },

  getPlagiarismComparison: async (flagId) => {
    const response = await API.get(`/admin/plagiarism/comparison/${flagId}`);
    return response.data;
  },

  getSuspiciousUsers: async () => {
    const response = await API.get("/suspicious");
    return response.data;
  },

  investigateUser: async (userId) => {
    const response = await API.post(`/suspicious/${userId}/investigate`);
    return response.data;
  },

  getUsers: async () => {
    const response = await API.get("/users/peers");
    return response.data;
  },

  updateUserRole: async (id, role) => {
    const response = await API.put(`/users/${id}/role`, { role });
    return response.data;
  },

  createProblem: async (data) => {
    const response = await API.post("/problems/problem-set", data);
    return response.data;
  },

  deleteProblem: async (id) => {
    const response = await API.delete(`/problems/problem-set/${id}`);
    return response.data;
  },

  createContest: async (data) => {
    const response = await API.post("/contests", data);
    return response.data;
  },

  updateContest: async (id, data) => {
    const response = await API.put(`/contests/${id}`, data);
    return response.data;
  },

  deleteContest: async (id) => {
    const response = await API.delete(`/contests/${id}`);
    return response.data;
  },

  addProblemToContest: async (contestId, problemData) => {
    const response = await API.post(`/contests/${contestId}/problems`, problemData);
    return response.data;
  },

  createQuiz: async (data) => {
    const response = await API.post("/quizzes", data);
    return response.data;
  },

  updateQuiz: async (id, data) => {
    const response = await API.put(`/quizzes/${id}`, data);
    return response.data;
  },

  deleteQuiz: async (id) => {
    const response = await API.delete(`/quizzes/${id}`);
    return response.data;
  },

  createJob: async (data) => {
    const response = await API.post("/placement/jobs", data);
    return response.data;
  },

  updateJob: async (id, data) => {
    const response = await API.put(`/placement/jobs/${id}`, data);
    return response.data;
  },

  getJobApplications: async (jobId) => {
    const response = await API.get(`/placement/jobs/${jobId}/applications`);
    return response.data;
  },

  updateApplicationStatus: async (applicationId, status, comments = "") => {
    const response = await API.put(`/placement/applications/${applicationId}/status`, null, {
      params: { status, comments },
    });
    return response.data;
  },

  updateProblem: async (id, data) => {
    const response = await API.put(`/problems/problem-set/${id}`, data);
    return response.data;
  },
};

export const submissionsApi = {
  runCode: async ({ problemId, language, code }) => {
    const response = await API.post("/submissions/run", {
      problemId,
      language,
      code,
    });
    return response.data;
  },

  submitCode: async ({ problemId, language, code }) => {
    const response = await API.post("/submissions", {
      problemId,
      language,
      code,
    });
    return response.data;
  },

  getMySubmissions: async () => {
    const response = await API.get("/submissions/my");
    return response.data;
  },

  getByProblem: async (problemId) => {
    const response = await API.get(`/submissions/problem/${problemId}`);
    return response.data;
  },
};

export const quizzesApi = {
  getAll: async (page = 0, size = 20) => {
    const response = await API.get("/quizzes", { params: { page, size } });
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/quizzes/${id}`);
    return response.data;
  },

  submitAttempt: async (attempt) => {
    const response = await API.post("/quiz-attempts", attempt);
    return response.data;
  },

  getMyAttempts: async () => {
    const response = await API.get("/quiz-attempts/my");
    return response.data;
  },
};

export const clubsApi = {
  getAll: async () => {
    const response = await API.get("/clubs");
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/clubs/${id}`);
    return response.data;
  },

  createClub: async (data) => {
    const response = await API.post("/clubs", data);
    return response.data;
  },

  join: async (id) => {
    const response = await API.post(`/clubs/${id}/join`);
    return response.data;
  },

  leave: async (id) => {
    const response = await API.post(`/clubs/${id}/leave`);
    return response.data;
  },

  getPosts: async (id) => {
    const response = await API.get(`/clubs/${id}/posts`);
    return response.data;
  },

  createPost: async (id, data) => {
    const response = await API.post(`/clubs/${id}/posts`, data);
    return response.data;
  },

  getRankings: async (id) => {
    const response = await API.get(`/clubs/${id}/rankings`);
    return response.data;
  },

  getChallenges: async (id) => {
    const response = await API.get(`/clubs/${id}/challenges`);
    return response.data;
  },

  createChallenge: async (id, data) => {
    const response = await API.post(`/clubs/${id}/challenges`, data);
    return response.data;
  },

  submitChallengeAttempt: async (id, challengeId, data) => {
    const response = await API.post(`/clubs/${id}/challenges/${challengeId}/attempts`, data);
    return response.data;
  },

  getMessages: async (id) => {
    const response = await API.get(`/clubs/${id}/messages`);
    return response.data;
  },

  createMessage: async (id, data) => {
    const response = await API.post(`/clubs/${id}/messages`, data);
    return response.data;
  },
};

export const jobsApi = {
  getAll: async () => {
    const response = await API.get("/placement/jobs");
    return response.data;
  },

  getById: async (id) => {
    const response = await API.get(`/placement/jobs/${id}`);
    return response.data;
  },

  apply: async (jobId, data) => {
    const response = await API.post(`/placement/jobs/${jobId}/apply`, data);
    return response.data;
  },

  getMyApplications: async () => {
    const response = await API.get("/placement/applications/my");
    return response.data;
  },
};

export const profileApi = {
  getMe: async () => {
    const response = await API.get("/users/me");
    return response.data;
  },

  getUserByToken: async (token) => {
    const response = await API.get(`/users/by-token/${encodeURIComponent(token)}`);
    return response.data;
  },

  getPeers: async () => {
    const response = await API.get("/users/peers");
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await API.put("/users/profile", data);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await API.post("/users/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  removeAvatar: async () => {
    const response = await API.delete("/users/avatar");
    return response.data;
  },

  changePassword: async (data) => {
    const response = await API.put("/users/password", data);
    return response.data;
  },

  getSettings: async () => {
    const response = await API.get("/users/settings");
    return response.data;
  },

  updateSettings: async (data) => {
    const response = await API.put("/users/settings", data);
    return response.data;
  },

  getAchievements: async () => {
    const response = await API.get("/users/achievements");
    return response.data;
  },

  getActivity: async () => {
    const response = await API.get("/users/activity");
    return response.data;
  },
};

export const notificationsApi = {
  getForUser: async (userId) => {
    const response = await API.get("/placement/notifications", { params: { userId } });
    return response.data;
  },

  getNotifications: async (userId) => {
    const response = await API.get("/placement/notifications", { params: { userId } });
    return response.data;
  },

  getUnreadCount: async (userId) => {
    const response = await API.get("/placement/notifications/unread-count", { params: { userId } });
    return response.data;
  },
};

export const interCollegeApi = {
  getCurrentRankings: async () => {
    const response = await API.get("/inter-college/rankings/current");
    return response.data;
  },

  getColleges: async () => {
    const response = await API.get("/inter-college/colleges");
    return response.data;
  },
};

export const contributionsApi = {
  getLeaderboard: async (limit = 10) => {
    const response = await API.get("/contributions/leaderboard", { params: { limit } });
    return response.data;
  },

  getTypes: async () => {
    const response = await API.get("/contributions/types");
    return response.data;
  },

  getUserSummary: async (userId) => {
    const response = await API.get(`/contributions/users/${userId}/summary`);
    return response.data;
  },

  getUserHistory: async (userId, limit = 40) => {
    const response = await API.get(`/contributions/users/${userId}/history`, { params: { limit } });
    return response.data;
  },

  addContribution: async (data) => {
    const response = await API.post("/contributions", data);
    return response.data;
  },
};

export const chatApi = {
  sendMessage: async ({ message, sessionId }) => {
    const response = await API.post("/chat", { message, sessionId });
    return response.data;
  },

  getHistory: async (sessionId) => {
    const response = await API.get("/chat/history", { params: { sessionId } });
    return response.data;
  },

  sendFeedback: async ({ sessionId, rating, comment }) => {
    const response = await API.post("/chat/feedback", { sessionId, rating, comment });
    return response.data;
  },
};

export const liveChatApi = {
  createConversation: async ({ priority = "NORMAL", category = "GENERAL_QUERY", summary = "", sourcePage = "" } = {}) => {
    const response = await API.post("/live-chat/conversations", {
      priority,
      category,
      summary,
      sourcePage,
    });
    return response.data;
  },

  getMyConversations: async () => {
    const response = await API.get("/live-chat/conversations/my");
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await API.get(`/live-chat/conversations/${conversationId}`);
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await API.get(`/live-chat/conversations/${conversationId}/messages`);
    return response.data;
  },

  sendMessage: async (conversationId, { message, messageType = "TEXT" }) => {
    const response = await API.post(`/live-chat/conversations/${conversationId}/messages`, {
      message,
      messageType,
    });
    return response.data;
  },

  closeConversation: async (conversationId) => {
    const response = await API.post(`/live-chat/conversations/${conversationId}/close`);
    return response.data;
  },

  submitFeedback: async (conversationId, { rating, feedback = "" }) => {
    const response = await API.post(`/live-chat/conversations/${conversationId}/feedback`, {
      rating,
      feedback,
    });
    return response.data;
  },

  getQueue: async () => {
    const response = await API.get("/live-chat/conversations/queue");
    return response.data;
  },

  assignConversation: async (conversationId) => {
    const response = await API.post(`/live-chat/conversations/${conversationId}/assign`);
    return response.data;
  },
};

export const proctoringApi = {
  logTabSwitch: async (contestId, userId) => {
    const response = await API.post(`/contests/${contestId}/tab-switch`, null, {
      params: { userId },
    });
    return response.data;
  },

  getTabSwitchCount: async (contestId, userId) => {
    const response = await API.get(`/contests/${contestId}/tab-switch-count`, {
      params: { userId },
    });
    return response.data;
  },

  logEvent: async (eventData) => {
    const response = await API.post("/proctoring/events", eventData);
    return response.data;
  },

  getViolations: async (contestId) => {
    const response = await API.get(`/proctoring/contest/${contestId}/violations`);
    return response.data;
  },
};

export const customJudgeApi = {
  executeCustom: async ({ language, code, input, timeLimitSeconds = 5, memoryMb = 256 }) => {
    const response = await API.post("/judge/run-custom", {
      language,
      code,
      input,
      timeLimitSeconds,
      memoryMb,
    });
    return response.data;
  },
};


export const streaksApi = {
  getMy: async () => {
    const response = await API.get("/streaks/my");
    return response.data;
  },

  activateFreeze: async () => {
    const response = await API.post("/streaks/freeze");
    return response.data;
  },

  getLeaderboard: async (limit = 10) => {
    const response = await API.get("/streaks/leaderboard", { params: { limit } });
    return response.data;
  },
};

export const discussionsApi = {
  getByProblem: async (problemId) => {
    const response = await API.get(`/discussions/problem/${problemId}`);
    return response.data;
  },

  create: async (data) => {
    const response = await API.post("/discussions", data);
    return response.data;
  },

  vote: async (id, delta = 1) => {
    const response = await API.post(`/discussions/${id}/vote`, { delta });
    return response.data;
  },
};

export const bookmarksApi = {
  getBookmarkedProblems: async () => {
    const response = await API.get("/bookmarks/problems");
    return response.data;
  },

  toggle: async (problemId) => {
    const response = await API.post(`/bookmarks/toggle/${problemId}`);
    return response.data;
  },
};

export const auditLogsApi = {
  getLogs: async ({ search, action } = {}) => {
    const response = await API.get("/audit-logs", { params: { search, action } });
    return response.data;
  },

  exportCsvUrl: () => "/api/audit-logs/export",
};

export const systemConfigApi = {
  getConfig: async () => {
    const response = await API.get("/admin/config");
    return response.data;
  },

  updateConfig: async (updates) => {
    const response = await API.post("/admin/config/maintenance", updates);
    return response.data;
  },
};

export const certificatesApi = {
  generate: async (contestId) => {
    const response = await API.post(`/certificates/generate/${contestId}`);
    return response.data;
  },

  verify: async (uuid) => {
    const response = await API.get(`/certificates/verify/${uuid}`);
    return response.data;
  },
};

export default API;


