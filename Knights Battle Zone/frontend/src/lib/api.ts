import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type {
  AuthRequest, AuthResponse, RegistrationRequest, GoogleAuthRequest, Contest, Problem, Submission,
  LeaderboardEntry, LeaderboardFilters, LeaderboardListResponse, User, DashboardStats, Duel,
  FlaggedSubmission, InterviewSlot,
  ResumeStrength,
  ReviewFlag, SuspiciousUser, Team, CollegeStats,
  ActivityDay, Badge, PlacementTopic, CompanyMatch, Job, Application, PlacementDashboardStats, PlacementJobPostPayload, Vote, Quiz, MockInterviewSession,
  InterviewQuestionBankItem, UserInterviewAnalytics, OverallInterviewAnalytics, InterviewMasteryTrackProgress,
  ContestFirstSolver, ContestAccess, QuizAttempt, TypingText, TypingLeaderboardEntry, TypingProfile,
  TypingScorePayload, TypingScoreResult, ChatMessage, ChatReply, TypingMode, TypingTimeRange, TypingTestResult,
  AdaptiveProblemRecommendation, AdaptiveSkillHistoryEntry, ContributorEntry, ContributionSummary, ContributionHistoryItem, ContributionTypeInfo,
  DuelAdvancedLeaderboardEntry, DuelMatchQuality, DuelFairPlaySummary, DuelFairPlayFlag,
  PlatformAnalytics, IntegrationStats,
  ClubSummary, ClubDetail, ClubChallenge, ClubRankingEntry, ClubPost, ClubMessage, ClubVisibility,
  MarketplacePassage, MarketplaceModeration, MarketplaceModerationAudit, PaginatedResponse, MarketplaceSort,
  LiveChatConversation, LiveChatSupportMessage,
  TrackerConnection, TrackerInsight, TrackerPlatform, TrackerSummary, TrackerSyncResult, TrackerSkillGap, TrackerPerformanceReport,
  ProblemSetPageResponse, ProblemSetUpsertPayload,
} from "./types";
import { emitAppDataRefresh, emitSmartNotification } from "./realtime";
import { clearSession, emitSessionExpired, getAccessToken, getRefreshToken, saveSession } from "./session";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

type BackendPagedResponse<T> = {
  content?: T[];
};

type BackendUserLiteDTO = {
  id: number;
  name: string;
  username?: string;
  publicUserId?: string;
  email?: string;
  role?: string;
  college?: string;
  department?: string;
};

type BackendContestDTO = {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  participantCount?: number;
  problems?: BackendProblemDTO[];
  createdBy?: BackendUserLiteDTO;
  createdAt?: string;
  updatedAt?: string;
};

type BackendProblemDTO = {
  id: number;
  title: string;
  description?: string;
  difficulty?: string;
  contestId?: number;
  contestMode?: string;
  inputFormat?: string;
  outputFormat?: string;
  sampleInput?: string;
  sampleOutput?: string;
  testCases?: string;
  points?: number;
  timeLimitSeconds?: number;
};

type BackendProblemSetPageDTO = {
  content: BackendProblemDTO[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  difficulty?: string | null;
  query?: string | null;
};

type BackendQuizOptionDTO = {
  id?: number;
  text: string;
  isCorrect?: boolean | null;
};

type BackendQuizQuestionDTO = {
  id?: number;
  text: string;
  points: number;
  options?: BackendQuizOptionDTO[];
};

type BackendQuizDTO = {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questions?: BackendQuizQuestionDTO[];
  createdBy?: BackendUserLiteDTO;
  createdAt?: string;
  updatedAt?: string;
};

type BackendSubmissionDTO = {
  id: number;
  problemId: number;
  userId?: number;
  problemTitle?: string;
  code: string;
  language: string;
  status?: string;
  output?: string;
  executionTime?: number;
  submittedAt: string;
};

type BackendLeaderboardDTO = {
  rank: number;
  userId?: number;
  name: string;
  college?: string;
  solved: number;
  totalPoints: number;
  firstAcceptedAt?: string;
};

type BackendLeaderboardListDTO = {
  content: BackendLeaderboardDTO[];
  total: number;
  page: number;
  size: number;
  appliedFilters?: Record<string, string>;
};

type BackendContestFirstSolverDTO = {
  problemId: number;
  problemTitle: string;
  firstSolverUserId?: number | null;
  firstSolverName?: string | null;
  firstSolvedAt?: string | null;
};

type BackendContestAccessDTO = {
  contestId: number;
  registered: boolean;
  durationMinutes: number;
  attemptStartTime?: string | null;
  attemptEndTime?: string | null;
  remainingSeconds?: number | null;
};

type BackendDuelDTO = {
  id: number;
  challengerId: number;
  challengerName: string;
  opponentId?: number | null;
  opponentName: string;
  status: Duel["status"];
  problemId?: number;
  problemTitle?: string;
  mode?: Duel["mode"];
  difficulty?: string;
  durationSeconds?: number;
  inviteCode?: string | null;
  player1Score?: number | null;
  player2Score?: number | null;
  player1Completed?: boolean;
  player2Completed?: boolean;
  player1RatingBefore?: number | null;
  player2RatingBefore?: number | null;
  player1RatingAfter?: number | null;
  player2RatingAfter?: number | null;
  remainingSeconds?: number | null;
  winner?: string;
  winnerId?: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

type BackendQuizAnswerDTO = {
  questionId: number;
  selectedOption?: number;
};

type BackendQuizAttemptDTO = {
  id: number;
  quizId: number;
  answers?: BackendQuizAnswerDTO[];
  score: number;
  totalPoints: number;
  submittedAt: string;
};

type BackendTypingTextDTO = {
  id: number;
  content: string;
  category: string;
  difficulty: string;
  source?: string;
};

type BackendTypingLeaderboardEntryDTO = {
  rank: number;
  userId: number;
  username: string;
  bestWpm: number;
  bestAccuracy: number;
  achievedAt?: string;
};

type BackendTypingProfileDTO = {
  userId: number;
  username: string;
  bestWpm: number;
  bestAccuracy: number;
  bestRawWpm: number;
  bestErrors: number;
  bestDuration: number;
  bestAchievedAt?: string;
  totalTests: number;
  totalPracticeSeconds: number;
  xp: number;
  level: number;
  streak: number;
  lastTestDate?: string;
  badges?: string[];
  rank?: number | null;
  keyHeatmap?: Record<string, number>;
};

type BackendTypingScoreResponseDTO = {
  success: boolean;
  newRecord: boolean;
  xpEarned: number;
  levelUp: boolean;
  badgesEarned?: string[];
  profile: BackendTypingProfileDTO;
};

type BackendTypingTestResultDTO = {
  id: number;
  userId: number;
  mode: TypingMode;
  wpm: number;
  accuracy: number;
  errors: number;
  durationSeconds?: number | null;
  wordCountTarget?: number | null;
  category?: string | null;
  textSnippet?: string | null;
  createdAt: string;
};

type BackendDashboardSummaryDTO = {
  contestsParticipated: number;
  problemsSolved: number;
  currentRating: number;
  globalRank: number;
  upcomingContests: number;
  recentSubmissions?: BackendSubmissionDTO[];
};

type BackendPlacementJobDTO = {
  id: number;
  title: string;
  companyId: number;
  companyName?: string | null;
  description?: string | null;
  eligibilityCriteria?: string | null;
  location?: string | null;
  salary?: string | null;
  postedDate?: string | null;
  deadline?: string | null;
  status?: "OPEN" | "CLOSED" | string | null;
};

type BackendPlacementApplicationDTO = {
  id: number;
  jobId: number;
  studentId?: number | null;
  userId?: number | null;
  status?: string | null;
  appliedDate?: string | null;
  appliedAt?: string | null;
  comments?: string | null;
};

type BackendLiveChatConversationDTO = {
  id: number;
  status: string;
  priority?: string | null;
  category?: string | null;
  summary?: string | null;
  sourcePage?: string | null;
  requesterUserId: number;
  requesterName: string;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
  messageCount?: number | null;
  createdAt: string;
  joinedAt?: string | null;
  closedAt?: string | null;
  lastMessageAt?: string | null;
};

type BackendLiveChatMessageDTO = {
  id: number;
  conversationId: number;
  senderType: string;
  senderUserId?: number | null;
  senderName?: string | null;
  messageText: string;
  messageType?: string | null;
  createdAt: string;
  readAt?: string | null;
};

export type CreateAdminRequest = {
  name: string;
  email: string;
  password: string;
  college?: string;
  accessDurationHours: number;
};

export type ApiProbeResult = {
  name: string;
  path: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  message?: string;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

const authApiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 5000,
});

const chatApiClient = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const AUTH_REFRESH_EXCLUDED_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/refresh",
];

let refreshPromise: Promise<string | null> | null = null;

const isRefreshExcludedPath = (url?: string) =>
  !!url && AUTH_REFRESH_EXCLUDED_PATHS.some((path) => url.includes(path));

const fastHash = (value: string) => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(36);
};

const buildSubmissionIdempotencyKey = (scope: "submit" | "run", payload: { problemId: number; language: string; code: string }) => {
  const normalizedLanguage = (payload.language || "").trim().toLowerCase();
  const codeHash = fastHash(payload.code || "");
  // 5s window dedupes accidental double-clicks but allows intentional re-runs shortly after.
  const timeBucket = Math.floor(Date.now() / 5000);
  return `sub:${scope}:${payload.problemId}:${normalizedLanguage}:${codeHash}:${timeBucket}`.slice(0, 180);
};

const setAuthHeader = (config: InternalAxiosRequestConfig, token: string) => {
  const value = `Bearer ${token}`;
  const headers = config.headers as { set?: (key: string, value: string) => void } | undefined;
  if (headers && typeof headers.set === "function") {
    headers.set("Authorization", value);
    return;
  }

  if (!config.headers) {
    config.headers = {} as InternalAxiosRequestConfig["headers"];
  }
  (config.headers as Record<string, string>).Authorization = value;
};

const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await authApiClient.post<AuthResponse>("/auth/refresh", { refreshToken });
    const payload = response.data;
    if (!payload?.token) return null;

    saveSession({
      token: payload.token,
      refreshToken: payload.refreshToken ?? refreshToken,
      user: payload.user,
    });
    return payload.token;
  } catch {
    return null;
  }
};

const getOrCreateRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

const handleExpiredSession = () => {
  clearSession();
  emitSessionExpired();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) setAuthHeader(config, token);
  return config;
});

api.interceptors.response.use(
  (res) => {
    const contentType = String(res.headers?.["content-type"] || "");
    if (contentType.includes("application/json") || Array.isArray(res.data) || isPlainObject(res.data)) {
      res.data = sanitizeApiPayload(res.data);
    }
    return res;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (isRefreshExcludedPath(originalRequest.url)) {
      return Promise.reject(error);
    }

    const hasStoredAccessToken = !!getAccessToken();
    const hasStoredRefreshToken = !!getRefreshToken();
    if (!hasStoredRefreshToken) {
      if (hasStoredAccessToken) {
        handleExpiredSession();
      }
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      handleExpiredSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const nextAccessToken = await getOrCreateRefreshPromise();

    if (!nextAccessToken) {
      handleExpiredSession();
      return Promise.reject(error);
    }

    setAuthHeader(originalRequest, nextAccessToken);
    return api(originalRequest);
  }
);

const getPageContent = <T>(payload: BackendPagedResponse<T> | T[]) => {
  if (Array.isArray(payload)) return payload;
  return payload.content || [];
};

const NULL_LIKE_STRINGS = new Set(["null", "undefined"]);

const isNullLikeString = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return NULL_LIKE_STRINGS.has(value.trim().toLowerCase());
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

const normalizeText = (value?: string | null, fallback?: string) => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed || isNullLikeString(trimmed)) return fallback;
  return trimmed;
};

const sanitizeApiPayload = <T>(payload: T): T => {
  if (isNullLikeString(payload)) {
    return undefined as T;
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeApiPayload(item)) as T;
  }
  if (isPlainObject(payload)) {
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload)) {
      next[key] = sanitizeApiPayload(value);
    }
    return next as T;
  }
  return payload;
};

const toContestStatus = (startTime: string, endTime: string): Contest["status"] => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  if (Number.isNaN(start) || Number.isNaN(end)) return "UPCOMING";
  if (now < start) return "UPCOMING";
  if (now > end) return "PAST";
  return "ONGOING";
};

const toDifficulty = (difficulty?: string): Problem["difficulty"] => {
  const normalized = (difficulty || "MEDIUM").toUpperCase();
  if (normalized === "EASY" || normalized === "MEDIUM" || normalized === "HARD") return normalized;
  return "MEDIUM";
};

const toContest = (item: BackendContestDTO): Contest => {
  const start = new Date(item.startTime).getTime();
  const end = new Date(item.endTime).getTime();
  const computedDuration = Number.isNaN(start) || Number.isNaN(end) ? 0 : Math.max(0, Math.round((end - start) / 60000));
  const duration = item.durationMinutes && item.durationMinutes > 0 ? item.durationMinutes : computedDuration;

  return {
    id: item.id,
    title: normalizeText(item.title, "Untitled Contest") || "Untitled Contest",
    description: normalizeText(item.description, "") || "",
    startTime: item.startTime,
    endTime: item.endTime,
    duration,
    durationMinutes: duration,
    participantCount: item.participantCount,
    status: toContestStatus(item.startTime, item.endTime),
    problems: item.problems?.map(toProblem),
    createdBy: toUserLite(item.createdBy),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const toProblem = (item: BackendProblemDTO): Problem => ({
  id: item.id,
  title: normalizeText(item.title, "Untitled Problem") || "Untitled Problem",
  description: normalizeText(item.description, "") || "",
  difficulty: toDifficulty(item.difficulty),
  contestId: item.contestId,
  contestMode: normalizeText(item.contestMode),
  inputFormat: normalizeText(item.inputFormat),
  outputFormat: normalizeText(item.outputFormat),
  sampleInput: normalizeText(item.sampleInput),
  sampleOutput: normalizeText(item.sampleOutput),
  points: item.points,
  testCases: normalizeText(item.testCases),
  timeLimitSeconds: item.timeLimitSeconds,
});

const toProblemSetPage = (item: BackendProblemSetPageDTO): ProblemSetPageResponse => ({
  content: (item.content || []).map(toProblem),
  totalElements: item.totalElements ?? 0,
  totalPages: item.totalPages ?? 0,
  page: item.page ?? 0,
  size: item.size ?? 20,
  difficulty: (normalizeText(item.difficulty) as ProblemSetPageResponse["difficulty"]) ?? null,
  query: normalizeText(item.query) ?? null,
});

const toQuiz = (item: BackendQuizDTO): Quiz => ({
  id: item.id,
  title: normalizeText(item.title, "Untitled Quiz") || "Untitled Quiz",
  description: normalizeText(item.description, "") || "",
  startTime: item.startTime,
  endTime: item.endTime,
  durationMinutes: item.durationMinutes,
  questions: (item.questions || []).map((question) => ({
    id: question.id,
    text: normalizeText(question.text, "Untitled Question") || "Untitled Question",
    points: question.points,
    options: (question.options || []).map((option) => ({
      id: option.id,
      text: normalizeText(option.text, "Option") || "Option",
      isCorrect: option.isCorrect,
    })),
  })),
  createdBy: toUserLite(item.createdBy),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const toVerdict = (status?: string): Submission["verdict"] => {
  const normalized = (status || "QUEUED").toUpperCase();
  if (normalized === "PENDING") return "QUEUED";
  if (normalized === "COMPILE_ERROR") return "COMPILATION_ERROR";
  if (normalized === "TIME_LIMIT_EXCEEDED") return "TIME_LIMIT";
  if (normalized === "ACCEPTED") return "ACCEPTED";
  if (normalized === "WRONG_ANSWER") return "WRONG_ANSWER";
  if (normalized === "TIME_LIMIT") return "TIME_LIMIT";
  if (normalized === "RUNTIME_ERROR") return "RUNTIME_ERROR";
  if (normalized === "COMPILATION_ERROR") return "COMPILATION_ERROR";
  if (normalized === "RUNNING") return "RUNNING";
  return "QUEUED";
};

const toSubmission = (item: BackendSubmissionDTO): Submission => ({
  id: item.id,
  problemId: item.problemId,
  problemTitle: normalizeText(item.problemTitle),
  userId: item.userId ?? 0,
  language: normalizeText(item.language, "text") || "text",
  code: normalizeText(item.code, "") || "",
  verdict: toVerdict(item.status),
  output: normalizeText(item.output, "") || "",
  executionTime: item.executionTime,
  submittedAt: item.submittedAt,
});

type BackendMockInterviewDTO = {
  id: number;
  sessionId: string;
  userId: number;
  userName?: string;
  interviewerId?: number;
  interviewerName?: string;
  scheduledTime: string;
  durationMinutes: number;
  interviewType?: "TECHNICAL" | "BEHAVIORAL" | "HR" | "CUSTOM" | string;
  mode?: "AI" | "PEER" | "EXPERT" | string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  topics?: string;
  meetingLink?: string;
  strictMode?: boolean;
  negativeMarking?: boolean;
  masteryTrackId?: string;
  masteryTrackTitle?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  feedback?: string;
  recordingUrl?: string;
  overallScore?: number;
  technicalScore?: number;
  communicationScore?: number;
  problemSolvingScore?: number;
  confidenceScore?: number;
  strengths?: string;
  weaknesses?: string;
  recommendations?: string;
  certificateUrl?: string;
  chatTranscript?: string;
  questions?: {
    questionId?: number;
    questionFormat?: "OPEN_ENDED" | "MCQ" | "CODING" | string;
    questionText: string;
    options?: string[];
    selectedOption?: string;
    expectedComplexity?: string;
    userAnswer?: string;
    aiFeedback?: string;
    score?: number;
    timeSpent?: number;
  }[];
  problemIds?: number[];
};

type BackendMasteryTrackProgressDTO = {
  id: number;
  userId: number;
  trackId: string;
  trackTitle?: string;
  interviewType?: string;
  difficulty?: string;
  questionFormat?: string;
  topics?: string;
  targetCompany?: string;
  weeklyGoal?: string;
  plannedSprintsPerWeek?: number;
  completedSprints?: number;
  totalSessionsCompleted?: number;
  currentWeek?: number;
  readinessScore?: number;
  lastSessionScore?: number;
  strictMode?: boolean;
  negativeMarking?: boolean;
  status?: string;
  completionPercent?: number;
  lastSyncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const toMockInterviewSession = (item: BackendMockInterviewDTO): MockInterviewSession => ({
  id: item.id,
  sessionId: item.sessionId,
  userId: item.userId,
  userName: normalizeText(item.userName),
  interviewerId: item.interviewerId,
  interviewerName: normalizeText(item.interviewerName),
  scheduledTime: item.scheduledTime,
  durationMinutes: item.durationMinutes,
  interviewType: item.interviewType,
  mode: item.mode,
  difficulty: item.difficulty,
  topics: normalizeText(item.topics),
  meetingLink: normalizeText(item.meetingLink),
  strictMode: !!item.strictMode,
  negativeMarking: !!item.negativeMarking,
  masteryTrackId: normalizeText(item.masteryTrackId),
  masteryTrackTitle: normalizeText(item.masteryTrackTitle),
  status: item.status,
  feedback: normalizeText(item.feedback),
  recordingUrl: normalizeText(item.recordingUrl),
  overallScore: item.overallScore,
  technicalScore: item.technicalScore,
  communicationScore: item.communicationScore,
  problemSolvingScore: item.problemSolvingScore,
  confidenceScore: item.confidenceScore,
  strengths: normalizeText(item.strengths),
  weaknesses: normalizeText(item.weaknesses),
  recommendations: normalizeText(item.recommendations),
  certificateUrl: normalizeText(item.certificateUrl),
  chatTranscript: normalizeText(item.chatTranscript),
  questions: item.questions || [],
  problemIds: item.problemIds || [],
});

const toMasteryTrackProgress = (item: BackendMasteryTrackProgressDTO): InterviewMasteryTrackProgress => ({
  id: item.id,
  userId: item.userId,
  trackId: item.trackId,
  trackTitle: normalizeText(item.trackTitle),
  interviewType: normalizeText(item.interviewType),
  difficulty: normalizeText(item.difficulty),
  questionFormat: normalizeText(item.questionFormat),
  topics: normalizeText(item.topics),
  targetCompany: normalizeText(item.targetCompany),
  weeklyGoal: normalizeText(item.weeklyGoal),
  plannedSprintsPerWeek: item.plannedSprintsPerWeek,
  completedSprints: item.completedSprints,
  totalSessionsCompleted: item.totalSessionsCompleted,
  currentWeek: item.currentWeek,
  readinessScore: item.readinessScore,
  lastSessionScore: item.lastSessionScore,
  strictMode: !!item.strictMode,
  negativeMarking: !!item.negativeMarking,
  status: normalizeText(item.status),
  completionPercent: item.completionPercent,
  lastSyncedAt: item.lastSyncedAt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const toDuel = (item: BackendDuelDTO): Duel => ({
  id: item.id,
  challengerId: item.challengerId,
  challengerName: normalizeText(item.challengerName, "Challenger") || "Challenger",
  opponentId: item.opponentId,
  opponentName: normalizeText(item.opponentName, "Waiting for opponent") || "Waiting for opponent",
  status: item.status,
  problemId: item.problemId,
  problemTitle: normalizeText(item.problemTitle),
  mode: item.mode,
  difficulty: item.difficulty,
  durationSeconds: item.durationSeconds,
  inviteCode: item.inviteCode,
  player1Score: item.player1Score,
  player2Score: item.player2Score,
  player1Completed: item.player1Completed,
  player2Completed: item.player2Completed,
  player1RatingBefore: item.player1RatingBefore,
  player2RatingBefore: item.player2RatingBefore,
  player1RatingAfter: item.player1RatingAfter,
  player2RatingAfter: item.player2RatingAfter,
  remainingSeconds: item.remainingSeconds,
  winner: normalizeText(item.winner),
  winnerId: item.winnerId,
  createdAt: item.createdAt,
  startedAt: item.startedAt,
  completedAt: item.completedAt,
});

const toQuizAttempt = (item: BackendQuizAttemptDTO): QuizAttempt => ({
  id: item.id,
  quizId: item.quizId,
  answers: item.answers?.map((answer) => ({
    questionId: answer.questionId,
    selectedOption: answer.selectedOption,
  })) || [],
  score: item.score,
  totalPoints: item.totalPoints,
  submittedAt: item.submittedAt,
});

const toLeaderboardEntry = (item: BackendLeaderboardDTO, fallbackRank: number): LeaderboardEntry => ({
  rank: item.rank || fallbackRank,
  userId: item.userId || fallbackRank,
  username: normalizeText(item.name, "Anonymous") || "Anonymous",
  score: item.totalPoints,
  problemsSolved: item.solved,
  college: normalizeText(item.college),
  firstAcceptedAt: item.firstAcceptedAt,
});

const toContestAccess = (item: BackendContestAccessDTO): ContestAccess => ({
  contestId: item.contestId,
  registered: item.registered,
  durationMinutes: item.durationMinutes,
  attemptStartTime: item.attemptStartTime ?? null,
  attemptEndTime: item.attemptEndTime ?? null,
  remainingSeconds: item.remainingSeconds ?? null,
});

const toTypingText = (item: BackendTypingTextDTO): TypingText => ({
  id: item.id,
  content: normalizeText(item.content, "") || "",
  category: normalizeText(item.category, "General") || "General",
  difficulty: normalizeText(item.difficulty, "MEDIUM") || "MEDIUM",
  source: normalizeText(item.source),
});

const toTypingLeaderboardEntry = (item: BackendTypingLeaderboardEntryDTO): TypingLeaderboardEntry => ({
  rank: item.rank,
  userId: item.userId,
  username: normalizeText(item.username, "Anonymous") || "Anonymous",
  bestWpm: item.bestWpm,
  bestAccuracy: item.bestAccuracy,
  achievedAt: item.achievedAt,
});

const toTypingTestResult = (item: BackendTypingTestResultDTO): TypingTestResult => ({
  id: item.id,
  userId: item.userId,
  mode: item.mode,
  wpm: item.wpm,
  accuracy: item.accuracy,
  errors: item.errors,
  durationSeconds: item.durationSeconds ?? null,
  wordCountTarget: item.wordCountTarget ?? null,
  category: normalizeText(item.category ?? undefined) ?? null,
  textSnippet: normalizeText(item.textSnippet ?? undefined) ?? null,
  createdAt: item.createdAt,
});

const toTypingProfile = (item: BackendTypingProfileDTO): TypingProfile => ({
  userId: item.userId,
  username: normalizeText(item.username, "User") || "User",
  bestWpm: item.bestWpm ?? 0,
  bestAccuracy: item.bestAccuracy ?? 0,
  bestRawWpm: item.bestRawWpm ?? 0,
  bestErrors: item.bestErrors ?? 0,
  bestDuration: item.bestDuration ?? 0,
  bestAchievedAt: item.bestAchievedAt,
  totalTests: item.totalTests ?? 0,
  totalPracticeSeconds: item.totalPracticeSeconds ?? 0,
  xp: item.xp ?? 0,
  level: item.level ?? 1,
  streak: item.streak ?? 0,
  lastTestDate: item.lastTestDate,
  badges: item.badges || [],
  rank: item.rank,
  keyHeatmap: item.keyHeatmap || {},
});

const parseCommentValue = (comments: string | null | undefined, key: "resumeUrl" | "coverLetter") => {
  const cleanedComments = normalizeText(comments);
  if (!cleanedComments) return undefined;
  const match = cleanedComments.match(new RegExp(`${key}=([^|]+)`));
  if (!match || match.length < 2) return undefined;
  const value = normalizeText(match[1]);
  if (!value) return undefined;
  return value.length > 0 ? value : undefined;
};

const toPlacementStatus = (value?: string | null): Application["status"] => {
  const normalized = (value || "APPLIED").toUpperCase();
  switch (normalized) {
    case "APPLIED":
    case "SHORTLISTED":
    case "REJECTED":
    case "SELECTED":
    case "REVIEW":
    case "INTERVIEW":
    case "OFFERED":
      return normalized as Application["status"];
    default:
      return "APPLIED";
  }
};

const toPlacementJob = (item: BackendPlacementJobDTO): Job => ({
  id: item.id,
  title: normalizeText(item.title, "Untitled Role") || "Untitled Role",
  companyId: item.companyId,
  companyName: normalizeText(item.companyName ?? undefined),
  location: normalizeText(item.location ?? undefined),
  postedAt: item.postedDate ?? new Date().toISOString(),
  postedDate: item.postedDate ?? undefined,
  expiresAt: item.deadline ?? undefined,
  deadline: item.deadline ?? undefined,
  description: normalizeText(item.description ?? undefined),
  eligibilityCriteria: normalizeText(item.eligibilityCriteria ?? undefined),
  salaryRange: normalizeText(item.salary ?? undefined),
  salary: normalizeText(item.salary ?? undefined),
  status: item.status === "CLOSED" ? "CLOSED" : "OPEN",
});

const toPlacementApplication = (item: BackendPlacementApplicationDTO): Application => {
  const appliedAt = item.appliedDate ?? item.appliedAt ?? new Date().toISOString();
  const comments = normalizeText(item.comments ?? undefined);

  return {
    id: item.id,
    jobId: item.jobId,
    userId: item.studentId ?? item.userId ?? 0,
    studentId: item.studentId ?? item.userId ?? undefined,
    status: toPlacementStatus(item.status),
    appliedAt,
    appliedDate: appliedAt,
    comments,
    resumeUrl: parseCommentValue(item.comments, "resumeUrl"),
    coverLetter: parseCommentValue(item.comments, "coverLetter"),
  };
};

const toChatMessage = (item: unknown): ChatMessage | null => {
  if (!isPlainObject(item)) return null;
  const senderRaw = normalizeText(String(item.sender ?? ""));
  const sender = senderRaw === "user" || senderRaw === "bot" ? senderRaw : null;
  const text = normalizeText(String(item.text ?? ""));
  const timestamp = normalizeText(String(item.timestamp ?? ""));
  if (!sender || !text || !timestamp) return null;
  return { sender, text, timestamp };
};

const toChatReply = (item: unknown): ChatReply => {
  if (!isPlainObject(item)) {
    throw new Error("Invalid chat response");
  }

  const sessionId = normalizeText(String(item.sessionId ?? ""));
  const reply = normalizeText(String(item.reply ?? ""));
  const timestamp = normalizeText(String(item.timestamp ?? ""));

  if (!sessionId || !reply || !timestamp) {
    throw new Error("Incomplete chat response");
  }

  return { sessionId, reply, timestamp };
};

const toLiveChatConversationStatus = (value: unknown): LiveChatConversation["status"] => {
  const normalized = normalizeText(String(value ?? ""), "WAITING").toUpperCase();
  switch (normalized) {
    case "WAITING":
    case "ACTIVE":
    case "CLOSED":
      return normalized;
    default:
      return "WAITING";
  }
};

const toLiveChatSenderType = (value: unknown): LiveChatSupportMessage["senderType"] => {
  const normalized = normalizeText(String(value ?? ""), "SYSTEM").toUpperCase();
  switch (normalized) {
    case "USER":
    case "AGENT":
    case "BOT":
    case "SYSTEM":
      return normalized;
    default:
      return "SYSTEM";
  }
};

const toLiveChatConversation = (item: BackendLiveChatConversationDTO): LiveChatConversation => ({
  id: item.id,
  status: toLiveChatConversationStatus(item.status),
  priority: normalizeText(item.priority ?? undefined, "NORMAL") || "NORMAL",
  category: normalizeText(item.category ?? undefined) ?? null,
  summary: normalizeText(item.summary ?? undefined) ?? null,
  sourcePage: normalizeText(item.sourcePage ?? undefined) ?? null,
  requesterUserId: item.requesterUserId,
  requesterName: normalizeText(item.requesterName, "Unknown") || "Unknown",
  assignedAgentId: item.assignedAgentId ?? null,
  assignedAgentName: normalizeText(item.assignedAgentName ?? undefined) ?? null,
  messageCount: Number(item.messageCount ?? 0) || 0,
  createdAt: item.createdAt,
  joinedAt: item.joinedAt ?? null,
  closedAt: item.closedAt ?? null,
  lastMessageAt: item.lastMessageAt ?? item.createdAt,
});

const toLiveChatSupportMessage = (item: BackendLiveChatMessageDTO): LiveChatSupportMessage => ({
  id: item.id,
  conversationId: item.conversationId,
  senderType: toLiveChatSenderType(item.senderType),
  senderUserId: item.senderUserId ?? null,
  senderName: normalizeText(item.senderName ?? undefined) ?? null,
  messageText: normalizeText(item.messageText, "") || "",
  messageType: normalizeText(item.messageType ?? undefined, "TEXT") || "TEXT",
  createdAt: item.createdAt,
  readAt: item.readAt ?? null,
});

export const authApi = {
  login: (data: AuthRequest) => api.post<AuthResponse>("/auth/login", data),
  register: (data: RegistrationRequest) => api.post<AuthResponse>("/auth/register", data),
  googleLogin: (data: GoogleAuthRequest) => api.post<AuthResponse>("/auth/google", data),
  refresh: async (refreshToken?: string) => {
    const fallbackToken = getRefreshToken();
    const activeRefreshToken = refreshToken || fallbackToken;
    if (!activeRefreshToken) {
      throw new Error("Missing refresh token");
    }
    const res = await authApiClient.post<AuthResponse>("/auth/refresh", { refreshToken: activeRefreshToken });
    return res.data;
  },
  logout: async (refreshToken?: string) => {
    const token = refreshToken || getRefreshToken();
    if (!token) return;
    await authApiClient.post<{ message: string }>("/auth/logout", { refreshToken: token });
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<{ message: string; resetToken?: string | null }>("/auth/forgot-password", { email });
    return res.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const res = await api.post<{ message: string }>("/auth/reset-password", { token, newPassword });
    return res.data;
  },
};

export const chatApi = {
  sendMessage: async (payload: { message: string; sessionId?: string }) => {
    const res = await chatApiClient.post<unknown>("/chat", payload);
    return toChatReply(sanitizeApiPayload(res.data));
  },
  getHistory: async (sessionId: string) => {
    const res = await chatApiClient.get<unknown>("/chat/history", { params: { sessionId } });
    const sanitized = sanitizeApiPayload(res.data);
    if (!Array.isArray(sanitized)) return [];
    return sanitized
      .map((item) => toChatMessage(item))
      .filter((item): item is ChatMessage => item !== null);
  },
  sendFeedback: async (payload: { sessionId: string; rating: -1 | 1 }) => {
    await chatApiClient.post("/chat/feedback", payload);
  },
};

export const liveChatApi = {
  createConversation: async (payload: {
    category?: string;
    summary?: string;
    sourcePage?: string;
    priority?: string;
  }) => {
    const res = await api.post<BackendLiveChatConversationDTO>("/live-chat/conversations", payload);
    return toLiveChatConversation(res.data);
  },
  getMyConversations: async () => {
    const res = await api.get<BackendLiveChatConversationDTO[]>("/live-chat/conversations/my");
    return (res.data || []).map(toLiveChatConversation);
  },
  getQueue: async () => {
    const res = await api.get<BackendLiveChatConversationDTO[]>("/live-chat/conversations/queue");
    return (res.data || []).map(toLiveChatConversation);
  },
  getConversation: async (conversationId: number) => {
    const res = await api.get<BackendLiveChatConversationDTO>(`/live-chat/conversations/${conversationId}`);
    return toLiveChatConversation(res.data);
  },
  assignConversation: async (conversationId: number) => {
    const res = await api.post<BackendLiveChatConversationDTO>(`/live-chat/conversations/${conversationId}/assign`);
    return toLiveChatConversation(res.data);
  },
  closeConversation: async (conversationId: number) => {
    const res = await api.post<BackendLiveChatConversationDTO>(`/live-chat/conversations/${conversationId}/close`);
    return toLiveChatConversation(res.data);
  },
  getMessages: async (conversationId: number) => {
    const res = await api.get<BackendLiveChatMessageDTO[]>(`/live-chat/conversations/${conversationId}/messages`);
    return (res.data || []).map(toLiveChatSupportMessage);
  },
  sendMessage: async (
    conversationId: number,
    payload: { message: string; messageType?: string },
  ) => {
    const res = await api.post<BackendLiveChatMessageDTO>(`/live-chat/conversations/${conversationId}/messages`, payload);
    return toLiveChatSupportMessage(res.data);
  },
  submitFeedback: async (
    conversationId: number,
    payload: { rating: -1 | 1; comment?: string },
  ) => {
    await api.post(`/live-chat/conversations/${conversationId}/feedback`, payload);
  },
};

export const superAdminApi = {
  getAdmins: async () => {
    const res = await api.get<User[]>("/super-admin/admins");
    return res.data;
  },
  createAdmin: async (data: CreateAdminRequest) => {
    const res = await api.post<User>("/super-admin/admins", data);
    return res.data;
  },
  deleteAdmin: async (adminId: number) => {
    await api.delete(`/super-admin/admins/${adminId}`);
  },
};

export const contestApi = {
  getAll: async () => {
    const res = await api.get<BackendPagedResponse<BackendContestDTO> | BackendContestDTO[]>("/contests");
    return getPageContent(res.data).map(toContest);
  },
  getById: async (id: number) => {
    const res = await api.get<BackendContestDTO>(`/contests/${id}`);
    return toContest(res.data);
  },
  getProblems: async (contestId: number) => {
    const res = await api.get<BackendProblemDTO[]>(`/problems/contest/${contestId}`);
    return res.data.map(toProblem);
  },
  register: async (contestId: number) => {
    const res = await api.post<BackendContestAccessDTO>(`/contests/${contestId}/register`);
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    return toContestAccess(res.data);
  },
  getAccess: async (contestId: number) => {
    const res = await api.get<BackendContestAccessDTO>(`/contests/${contestId}/access`);
    return toContestAccess(res.data);
  },
  logTabSwitch: async (contestId: number, userId: number) => {
    await api.post(`/contests/${contestId}/tab-switch`, null, { params: { userId } });
  },
  getTabSwitchCount: async (contestId: number, userId: number) => {
    const res = await api.get<number>(`/contests/${contestId}/tab-switch-count`, { params: { userId } });
    return res.data;
  },
  create: (data: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    durationMinutes?: number;
    problems?: {
      title: string;
      description?: string;
      difficulty: "EASY" | "MEDIUM" | "HARD";
      inputFormat?: string;
      outputFormat?: string;
      sampleInput?: string;
      sampleOutput?: string;
      testCases?: string;
      points: number;
    }[];
  }) => api.post<Contest>("/contests", data).then((res) => {
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    return res;
  }),
  update: (id: number, data: Partial<Contest>) => api.put<Contest>(`/contests/${id}`, data).then((res) => {
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    return res;
  }),
  delete: (id: number) => api.delete(`/contests/${id}`).then((res) => {
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    return res;
  }),
};

export const interCollegeApi = {
  getCurrentRankings: async () => {
    const res = await api.get<{
      college: string;
      totalPoints: number;
      memberCount: number;
      contestsWon: number;
      rank: number;
    }[]>("/inter-college/rankings/current");
    return res.data.map((item) => ({
      college: item.college,
      totalPoints: item.totalPoints || 0,
      memberCount: item.memberCount || 0,
      contestsWon: item.contestsWon || 0,
      rank: item.rank || 0,
    }));
  },
};

type QuizCreatePayload = {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questions: {
    text: string;
    points: number;
    options: {
      text: string;
      isCorrect: boolean;
    }[];
  }[];
};

export const quizApi = {
  getAll: async () => {
    const res = await api.get<BackendPagedResponse<BackendQuizDTO> | BackendQuizDTO[]>("/quizzes");
    return getPageContent(res.data).map(toQuiz);
  },
  getById: async (id: number) => {
    const res = await api.get<BackendQuizDTO>(`/quizzes/${id}`);
    return toQuiz(res.data);
  },
  create: async (data: QuizCreatePayload) => {
    const res = await api.post<BackendQuizDTO>("/quizzes", data);
    return toQuiz(res.data);
  },
  update: async (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      startTime: string;
      endTime: string;
      durationMinutes: number;
      questions: {
        text: string;
        points: number;
        options: {
          text: string;
          isCorrect: boolean;
        }[];
      }[];
    }>,
  ) => {
    const res = await api.put<BackendQuizDTO>(`/quizzes/${id}`, data);
    return toQuiz(res.data);
  },
  delete: async (id: number) => {
    await api.delete(`/quizzes/${id}`);
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
  },
};

export const quizAttemptApi = {
  submit: async (data: { quizId: number; answers: { questionId: number; selectedOption?: number }[] }) => {
    const res = await api.post<BackendQuizAttemptDTO>("/quiz-attempts", data);
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    return toQuizAttempt(res.data);
  },
  getMy: async () => {
    const res = await api.get<BackendQuizAttemptDTO[]>("/quiz-attempts/my");
    return res.data.map(toQuizAttempt);
  },
};

export const problemApi = {
  getById: async (id: number) => {
    const res = await api.get<BackendProblemDTO>(`/problems/${id}`);
    return toProblem(res.data);
  },
  getAll: async () => {
    const page = await problemApi.getProblemSetPage({ page: 0, size: 100 });
    return page.content;
  },
  getProblemSetPage: async (params?: {
    page?: number;
    size?: number;
    q?: string;
    difficulty?: "EASY" | "MEDIUM" | "HARD" | "ALL";
  }) => {
    const res = await api.get<BackendProblemSetPageDTO>("/problems/problem-set", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        q: params?.q?.trim() || undefined,
        difficulty: params?.difficulty && params.difficulty !== "ALL" ? params.difficulty : undefined,
      },
    });
    return toProblemSetPage(res.data);
  },
  getProblemSetById: async (id: number) => {
    const res = await api.get<BackendProblemDTO>(`/problems/problem-set/${id}`);
    return toProblem(res.data);
  },
  create: async (data: ProblemSetUpsertPayload) => {
    const res = await api.post<BackendProblemDTO>("/problems/problem-set", data);
    emitAppDataRefresh("contests");
    emitAppDataRefresh("dashboard");
    return toProblem(res.data);
  },
  update: async (id: number, data: ProblemSetUpsertPayload) => {
    const res = await api.put<BackendProblemDTO>(`/problems/problem-set/${id}`, data);
    emitAppDataRefresh("contests");
    emitAppDataRefresh("dashboard");
    return toProblem(res.data);
  },
  delete: async (id: number) => {
    await api.delete(`/problems/problem-set/${id}`);
    emitAppDataRefresh("contests");
    emitAppDataRefresh("dashboard");
  },
  getProblemSetMeta: async () => {
    const res = await api.get<{ contestId: number }>("/problems/problem-set/meta");
    return res.data;
  },
  vote: (id: number, data: { value: 1 | -1 }) => api.post(`/problems/${id}/vote`, data),
  getHints: (id: number) => api.get<string[]>(`/problems/${id}/hints`),
};

export const submissionApi = {
  submit: async (data: { problemId: number; language: string; code: string }) => {
    const res = await api.post<BackendSubmissionDTO>("/submissions", data, {
      headers: {
        "Idempotency-Key": buildSubmissionIdempotencyKey("submit", data),
      },
    });
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    emitAppDataRefresh("submissions");
    return toSubmission(res.data);
  },
  run: async (data: { problemId: number; language: string; code: string }) => {
    const res = await api.post<BackendSubmissionDTO>("/submissions/run", data, {
      headers: {
        "Idempotency-Key": buildSubmissionIdempotencyKey("run", data),
      },
    });
    emitAppDataRefresh("dashboard");
    return toSubmission(res.data);
  },
  getUserSubmissions: async () => {
    const res = await api.get<BackendSubmissionDTO[]>("/submissions/my");
    return res.data.map(toSubmission);
  },
  getById: async (id: number) => {
    const all = await submissionApi.getUserSubmissions();
    const found = all.find((submission) => submission.id === id);
    if (!found) throw new Error("Submission not found");
    return found;
  },
  getByProblem: async (problemId: number) => {
    const res = await api.get<BackendSubmissionDTO[]>(`/submissions/problem/${problemId}`);
    return res.data.map(toSubmission);
  },
};

const DEFAULT_LEADERBOARD_FILTERS: LeaderboardFilters = {
  timeRange: "all-time",
  page: 0,
  size: 20,
};

export const leaderboardApi = {
  getGlobalFiltered: async (filters?: Partial<LeaderboardFilters>): Promise<LeaderboardListResponse> => {
    const params = {
      ...DEFAULT_LEADERBOARD_FILTERS,
      ...filters,
    };
    const res = await api.get<BackendLeaderboardListDTO>("/leaderboard", {
      params: {
        region: params.region || undefined,
        country: params.country || undefined,
        college: params.college || undefined,
        department: params.department || undefined,
        mode: params.mode || undefined,
        difficulty: params.difficulty || undefined,
        timeRange: params.timeRange,
        page: params.page,
        size: params.size,
      },
    });

    return {
      content: (res.data.content || []).map((entry, index) =>
        toLeaderboardEntry(entry, params.page * params.size + index + 1),
      ),
      total: res.data.total ?? 0,
      page: res.data.page ?? params.page,
      size: res.data.size ?? params.size,
      appliedFilters: res.data.appliedFilters || {},
    };
  },
  getGlobal: async () => {
    const res = await leaderboardApi.getGlobalFiltered(DEFAULT_LEADERBOARD_FILTERS);
    return res.content;
  },
  getByContest: async (contestId: number) => {
    const res = await api.get<BackendLeaderboardDTO[]>(`/leaderboard/${contestId}`);
    return res.data.map((entry, index) => toLeaderboardEntry(entry, index + 1));
  },
  getFirstSolversByContest: async (contestId: number): Promise<ContestFirstSolver[]> => {
    const res = await api.get<BackendContestFirstSolverDTO[]>(`/leaderboard/${contestId}/first-solvers`);
    return res.data.map((item) => ({
      problemId: item.problemId,
      problemTitle: item.problemTitle,
      firstSolverUserId: item.firstSolverUserId,
      firstSolverName: item.firstSolverName,
      firstSolvedAt: item.firstSolvedAt,
    }));
  },
  getShadow: async () => {
    try {
      const res = await api.get<{
        userId: number;
        username: string;
        rating: number;
        wins: number;
      }[]>("/duels/leaderboard", { params: { game: "all", limit: 50 } });

      if (!res.data.length) return [];

      return res.data
        .sort((a, b) => b.rating - a.rating)
        .map((entry, index) => ({
          rank: index + 1,
          userId: entry.userId,
          username: entry.username,
          score: entry.rating,
          problemsSolved: entry.wins,
          college: "Duel Arena",
        }));
    } catch {
      return leaderboardApi.getGlobal();
    }
  },
};

const normalizeUserRole = (value?: string | null): User["role"] => {
  const normalized = normalizeText(value, "USER")?.toUpperCase();
  if (normalized === "ADMIN" || normalized === "SUPER_ADMIN" || normalized === "STUDENT" || normalized === "USER") {
    return normalized;
  }
  return "USER";
};

const toUserLite = (
  item?: BackendUserLiteDTO,
): Pick<User, "id" | "name" | "username" | "publicUserId" | "email" | "role" | "college" | "department"> | undefined => {
  if (!item) return undefined;
  return {
    id: item.id,
    name: normalizeText(item.name, "User") || "User",
    username: normalizeText(item.username),
    publicUserId: normalizeText(item.publicUserId),
    email: normalizeText(item.email, "") || "",
    role: normalizeUserRole(item.role),
    college: normalizeText(item.college),
    department: normalizeText(item.department),
  };
};

const toUser = (item: User): User => ({
  ...item,
  name: normalizeText(item.name, "User") || "User",
  username: normalizeText(item.username),
  publicUserId: normalizeText(item.publicUserId),
  email: normalizeText(item.email, "") || "",
  college: normalizeText(item.college),
  department: normalizeText(item.department),
  avatarUrl: normalizeText(item.avatarUrl),
  bio: normalizeText(item.bio),
  phone: normalizeText(item.phone),
  location: normalizeText(item.location),
  timezone: normalizeText(item.timezone),
  githubUrl: normalizeText(item.githubUrl),
  linkedinUrl: normalizeText(item.linkedinUrl),
  twitterUrl: normalizeText(item.twitterUrl),
  portfolioUrl: normalizeText(item.portfolioUrl),
  role: normalizeUserRole(item.role),
  skills: (item.skills || [])
    .map((skill) => normalizeText(skill))
    .filter((skill): skill is string => Boolean(skill)),
});

export const userApi = {
  getProfile: async () => {
    const res = await api.get<User>("/auth/me");
    return toUser(res.data);
  },
  getMyProfile: async () => {
    const res = await api.get<User>("/users/me");
    return toUser(res.data);
  },
  getPublicProfileByUsername: async (username: string) => {
    const res = await api.get<User>(`/users/profile/${username}`);
    return toUser(res.data);
  },
  updateProfile: (data: {
    displayName?: string;
    bio?: string;
    college?: string;
    department?: string;
    phone?: string;
    location?: string;
    timezone?: string;
    dateOfBirth?: string;
    skills?: string[];
    githubUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    portfolioUrl?: string;
  }) => api.put<User>("/users/profile", data).then((res) => {
    emitAppDataRefresh("profile");
    res.data = toUser(res.data);
    return res;
  }),
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<User>("/users/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    emitAppDataRefresh("profile");
    return toUser(res.data);
  },
  removeAvatar: async () => {
    const res = await api.delete<User>("/users/avatar");
    emitAppDataRefresh("profile");
    return toUser(res.data);
  },
  getSettings: async () => {
    const res = await api.get<{
      privacyEmail: string;
      privacyActivity: string;
      emailNotifications: boolean;
      pushNotifications: boolean;
      twoFactorEnabled: boolean;
      emailVerified: boolean;
    }>("/users/settings");
    return res.data;
  },
  updateSettings: async (data: {
    privacyEmail?: string;
    privacyActivity?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    twoFactorEnabled?: boolean;
  }) => {
    const res = await api.put("/users/settings", data);
    emitAppDataRefresh("profile");
    return res.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.put("/users/password", { currentPassword, newPassword });
  },
  deleteAccount: async (confirmText = "DELETE") => {
    await api.delete("/users/account", { data: { confirmText } });
  },
  getActivity: async () => {
    const res = await api.get<string[]>("/users/activity");
    return res.data;
  },
  getAchievements: async () => {
    const res = await api.get<string[]>("/users/achievements");
    return res.data;
  },
  getAll: () => api.get<User[]>("/users"),
  updateRole: (userId: number, role: string) => api.put(`/users/${userId}/role`, { role }).then((res) => {
    emitAppDataRefresh("leaderboard");
    return res;
  }),
};

export const dashboardApi = {
  getStats: async () => {
    let payload: BackendDashboardSummaryDTO | null = null;

    try {
      const summaryRes = await api.get<BackendDashboardSummaryDTO>("/dashboard/summary");
      payload = summaryRes.data;
    } catch {
      // Fall back to derived stats when summary endpoint is temporarily unavailable.
    }

    const stats: DashboardStats = {
      contestsParticipated: payload?.contestsParticipated ?? 0,
      problemsSolved: payload?.problemsSolved ?? 0,
      currentRating: payload?.currentRating ?? 0,
      globalRank: payload?.globalRank ?? 0,
      upcomingContests: payload?.upcomingContests ?? 0,
      recentSubmissions: (payload?.recentSubmissions || []).map(toSubmission).slice(0, 3),
    };

    const [profile, contests, mySubmissions] = await Promise.all([
      userApi.getMyProfile().catch(() => null),
      contestApi.getAll().catch(() => [] as Contest[]),
      submissionApi.getUserSubmissions().catch(() => [] as Submission[]),
    ]);

    if (stats.currentRating <= 0 && profile?.rating) {
      stats.currentRating = profile.rating;
    }

    if (stats.upcomingContests <= 0) {
      stats.upcomingContests = contests.filter((contest) => contest.status === "UPCOMING").length;
    }

    if (stats.recentSubmissions.length === 0) {
      stats.recentSubmissions = mySubmissions.slice(0, 3);
    }

    if (stats.problemsSolved <= 0) {
      const acceptedProblemIds = new Set(
        mySubmissions
          .filter((submission) => submission.verdict === "ACCEPTED")
          .map((submission) => submission.problemId),
      );
      stats.problemsSolved = acceptedProblemIds.size;
    }

    if (stats.globalRank <= 0 && profile?.id) {
      const globalRows = await leaderboardApi.getGlobal().catch(() => [] as LeaderboardEntry[]);
      const me = globalRows.find((row) => row.userId === profile.id);
      if (me?.rank) {
        stats.globalRank = me.rank;
      }
    }

    return stats;
  },
};

export const activityApi = {
  getCalendar: () => api.get<ActivityDay[]>("/activity/calendar"),
};

export const adaptiveApi = {
  updateSkill: async (payload: { userId: number; problemId: number; solved?: boolean }) => {
    await api.post("/adaptive/skill/update", null, {
      params: {
        userId: payload.userId,
        problemId: payload.problemId,
        solved: payload.solved ?? false,
      },
    });
  },
  getRecommendedProblem: async (userId: number) => {
    const res = await api.get<AdaptiveProblemRecommendation>("/adaptive/problems/recommend", {
      params: { userId },
      validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
    });
    return res.status === 204 ? null : res.data;
  },
  getSkill: async (userId: number) => {
    const res = await api.get<number>(`/adaptive/skill/${userId}`);
    return res.data;
  },
  getSkillHistory: async (userId: number, limit = 10) => {
    const res = await api.get<AdaptiveSkillHistoryEntry[]>(`/adaptive/skill/${userId}/history`, {
      params: { limit },
    });
    return res.data;
  },
};

export const contributionApi = {
  addContribution: async (payload: { userId: number; type: string; referenceId?: number }) => {
    await api.post("/contributions", payload);
  },
  getLeaderboard: async (limit = 10) => {
    const res = await api.get<ContributorEntry[]>("/contributions/leaderboard", {
      params: { limit },
    });
    return res.data;
  },
  getUserIndex: async (userId: number) => {
    const res = await api.get<number>(`/contributions/users/${userId}/index`);
    return res.data;
  },
  getTypes: async () => {
    const res = await api.get<ContributionTypeInfo[]>("/contributions/types");
    return res.data;
  },
  getUserSummary: async (userId: number) => {
    const res = await api.get<ContributionSummary>(`/contributions/users/${userId}/summary`);
    return res.data;
  },
  getUserHistory: async (userId: number, limit = 40) => {
    const res = await api.get<ContributionHistoryItem[]>(`/contributions/users/${userId}/history`, {
      params: { limit },
    });
    return res.data;
  },
};

export const tabSwitchApi = {
  logSwitch: async (contestId: number, userId: number) => {
    await api.post(`/contests/${contestId}/tab-switch`, null, {
      params: { userId },
    });
  },
  getCount: async (contestId: number, userId: number) => {
    const res = await api.get<number>(`/contests/${contestId}/tab-switch-count`, {
      params: { userId },
    });
    return res.data;
  },
};

export const duelApi = {
  getAll: async () => {
    const res = await api.get<BackendDuelDTO[]>("/duels");
    return res.data.map(toDuel);
  },
  getById: async (id: number) => {
    const res = await api.get<BackendDuelDTO>(`/duels/${id}`);
    return toDuel(res.data);
  },
  challenge: async (data: { opponentId?: number; mode?: string; difficulty?: string; durationSeconds?: number }) => {
    const res = await api.post<BackendDuelDTO>("/duels", data);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    return toDuel(res.data);
  },
  matchmaking: async (data: { mode?: string; difficulty?: string; durationSeconds?: number; maxRatingGap?: number }) => {
    const res = await api.post<BackendDuelDTO>("/duels/matchmaking", data);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    if (res.data.status === "ACTIVE") {
      emitSmartNotification("match_found");
    }
    return toDuel(res.data);
  },
  accept: async (id: number) => {
    const res = await api.post<BackendDuelDTO>(`/duels/${id}/accept`);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    return toDuel(res.data);
  },
  decline: async (id: number) => {
    const res = await api.post<BackendDuelDTO>(`/duels/${id}/decline`);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    return toDuel(res.data);
  },
  submit: async (id: number, data: { score: number; completed?: boolean; gameData?: string }) => {
    const res = await api.post<BackendDuelDTO>(`/duels/${id}/submit`, data);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    return toDuel(res.data);
  },
  abandon: async (id: number) => {
    const res = await api.post<BackendDuelDTO>(`/duels/${id}/abandon`);
    emitAppDataRefresh("duels");
    emitAppDataRefresh("leaderboard");
    return toDuel(res.data);
  },
  leaderboard: async (game = "all", limit = 10) => {
    const res = await api.get<{
      userId: number;
      username: string;
      rating: number;
      wins: number;
      losses: number;
      totalDuels: number;
    }[]>("/duels/leaderboard", { params: { game, limit } });
    return res.data;
  },
  games: async () => {
    const res = await api.get<{
      slug: string;
      name: string;
      description: string;
      difficultyLevels: string[];
      active: boolean;
    }[]>("/duels/games");
    return res.data;
  },
  achievements: async () => {
    const res = await api.get<{
      code: string;
      name: string;
      description: string;
      earned: boolean;
    }[]>("/duels/achievements");
    return res.data;
  },
  userAchievements: async (userId: number) => {
    const res = await api.get<{
      code: string;
      name: string;
      description: string;
      earned: boolean;
    }[]>(`/duels/users/${userId}/achievements`);
    return res.data;
  },
  advancedLeaderboard: async (limit = 20) => {
    const res = await api.get<DuelAdvancedLeaderboardEntry[]>("/duels/advanced/leaderboard", {
      params: { limit },
    });
    return res.data;
  },
  matchQuality: async (params?: {
    mode?: string;
    difficulty?: string;
    durationSeconds?: number;
    maxRatingGap?: number;
  }) => {
    const res = await api.get<DuelMatchQuality>("/duels/advanced/match-quality", { params });
    return res.data;
  },
  fairPlaySummary: async () => {
    const res = await api.get<DuelFairPlaySummary>("/duels/fairplay/summary");
    return res.data;
  },
  fairPlayFlags: async (duelId: number) => {
    const res = await api.get<DuelFairPlayFlag[]>("/duels/fairplay/flags", { params: { duelId } });
    return res.data;
  },
  reportFairPlay: async (payload: { duelId: number; reportedUserId: number; reason: string }) => {
    const res = await api.post<DuelFairPlayFlag>("/duels/fairplay/report", payload);
    emitAppDataRefresh("duels");
    return res.data;
  },
  platformAnalytics: async () => {
    const res = await api.get<PlatformAnalytics>("/duels/analytics/platform");
    return res.data;
  },
  integrationStats: async (platform: "discord" | "github", username: string) => {
    const res = await api.get<IntegrationStats>(`/duels/integrations/${platform}/${encodeURIComponent(username)}`);
    return res.data;
  },
};

export const integrityApi = {
  getFlagged: () => api.get<FlaggedSubmission[]>("/integrity/flagged"),
  review: (id: number, action: string) => api.post(`/integrity/${id}/review`, { action }),
};

export const interviewApi = {
  getSlots: () => api.get<InterviewSlot[]>("/interviews/slots"),
  book: (id: number) => api.post(`/interviews/slots/${id}/book`),
  getMyInterviews: async (params?: { mode?: string; type?: string; status?: string }) => {
    const res = await api.get<BackendMockInterviewDTO[]>("/interviews", { params });
    return res.data.map(toMockInterviewSession);
  },
  getById: async (id: number) => {
    const res = await api.get<BackendMockInterviewDTO>(`/interviews/${id}`);
    return toMockInterviewSession(res.data);
  },
  createSession: async (data: {
    interviewerId?: number;
    interviewerName?: string;
    scheduledTime: string;
    durationMinutes: number;
    interviewType?: string;
    mode?: string;
    difficulty?: string;
    topics?: string;
    meetingLink?: string;
    problemIds?: number[];
  }) => {
    const res = await api.post<BackendMockInterviewDTO>("/interviews", data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  startAi: async (data: {
    interviewType?: string;
    difficulty?: string;
    questionFormat?: "MIXED" | "OPEN_ENDED" | "MCQ" | "CODING" | string;
    topics?: string;
    targetCompany?: string;
    durationMinutes?: number;
    questionCount?: number;
    mcqCount?: number;
    codingCount?: number;
    strictMode?: boolean;
    negativeMarking?: boolean;
    masteryTrackId?: string;
    masteryTrackTitle?: string;
  }) => {
    const res = await api.post<BackendMockInterviewDTO>("/interviews/ai", data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  submitAi: async (data: {
    interviewId: number;
    questionId: number;
    answer: string;
    selectedOption?: string;
    timeSpent?: number;
  }) => {
    const res = await api.post<BackendMockInterviewDTO>("/interviews/ai/submit", data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  requestPeer: async (data: {
    interviewerId?: number;
    interviewerName?: string;
    scheduledTime?: string;
    durationMinutes?: number;
    interviewType?: string;
    difficulty?: string;
    topics?: string;
    meetingLink?: string;
  }) => {
    const res = await api.post<BackendMockInterviewDTO>("/interviews/peer", data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  scheduleExpert: async (data: {
    interviewerId?: number;
    interviewerName?: string;
    scheduledTime?: string;
    durationMinutes?: number;
    interviewType?: string;
    difficulty?: string;
    topics?: string;
    meetingLink?: string;
  }) => {
    const res = await api.post<BackendMockInterviewDTO>("/interviews/schedule", data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  addFeedback: async (id: number, data: {
    feedback?: string;
    recordingUrl?: string;
    overallScore?: number;
    technicalScore?: number;
    communicationScore?: number;
    problemSolvingScore?: number;
    confidenceScore?: number;
    strengths?: string;
    weaknesses?: string;
    recommendations?: string;
  }) => {
    const res = await api.put<BackendMockInterviewDTO>(`/interviews/${id}/feedback`, data);
    emitAppDataRefresh("mock-interviews");
    return toMockInterviewSession(res.data);
  },
  cancel: async (id: number) => {
    await api.delete(`/interviews/${id}`);
    emitAppDataRefresh("mock-interviews");
  },
  getBySessionId: async (sessionId: string) => {
    const res = await api.get<BackendMockInterviewDTO>(`/interviews/session/${sessionId}`);
    return toMockInterviewSession(res.data);
  },
  getForUser: async (userId: number) => {
    const res = await api.get<BackendMockInterviewDTO[]>(`/users/${userId}/interviews`);
    return res.data.map(toMockInterviewSession);
  },
  getQuestions: async (params?: { type?: string; difficulty?: string }) => {
    const res = await api.get<InterviewQuestionBankItem[]>("/questions", { params });
    return res.data;
  },
  createQuestion: async (data: Omit<InterviewQuestionBankItem, "id">) => {
    const res = await api.post<InterviewQuestionBankItem>("/questions", data);
    return res.data;
  },
  updateQuestion: async (id: number, data: Partial<Omit<InterviewQuestionBankItem, "id">>) => {
    const res = await api.put<InterviewQuestionBankItem>(`/questions/${id}`, data);
    return res.data;
  },
  deleteQuestion: async (id: number) => {
    await api.delete(`/questions/${id}`);
  },
  getPeers: async () => {
    const res = await api.get<User[]>("/users/peers");
    return res.data;
  },
  getUserAnalytics: async (userId: number) => {
    const res = await api.get<UserInterviewAnalytics>(`/analytics/user/${userId}`);
    return res.data;
  },
  getOverallAnalytics: async () => {
    const res = await api.get<OverallInterviewAnalytics>("/analytics/overall");
    return res.data;
  },
  getMasteryProgress: async () => {
    const res = await api.get<BackendMasteryTrackProgressDTO[]>("/interviews/mastery/progress");
    return res.data.map(toMasteryTrackProgress);
  },
  upsertMasteryProgress: async (data: {
    trackId: string;
    trackTitle?: string;
    interviewType?: string;
    difficulty?: string;
    questionFormat?: string;
    topics?: string;
    targetCompany?: string;
    weeklyGoal?: string;
    plannedSprintsPerWeek?: number;
    currentWeek?: number;
    readinessScore?: number;
    strictMode?: boolean;
    negativeMarking?: boolean;
  }) => {
    const res = await api.post<BackendMasteryTrackProgressDTO>("/interviews/mastery/progress", data);
    emitAppDataRefresh("mock-interviews");
    return toMasteryTrackProgress(res.data);
  },
  recordMasterySession: async (data: {
    trackId: string;
    interviewId?: number;
    sessionScore?: number;
  }) => {
    const res = await api.post<BackendMasteryTrackProgressDTO>("/interviews/mastery/progress/session", data);
    emitAppDataRefresh("mock-interviews");
    return toMasteryTrackProgress(res.data);
  },
};

export const resumeApi = {
  getStrength: () => api.get<ResumeStrength>("/resume/strength"),
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<ResumeStrength>(
      "/resume/upload",
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  },
};

export const typingApi = {
  getTexts: async (params?: { category?: string; difficulty?: string; page?: number; size?: number }) => {
    const res = await api.get<BackendTypingTextDTO[]>("/typing/texts", { params });
    return res.data.map(toTypingText);
  },
  getCategories: async () => {
    const res = await api.get<string[]>("/typing/categories");
    return res.data;
  },
  getRandomText: async (params?: { category?: string; difficulty?: string; daily?: boolean }) => {
    const res = await api.get<BackendTypingTextDTO>("/typing/texts/random", { params });
    return toTypingText(res.data);
  },
  getRandomQuote: async (category?: string) => {
    const res = await api.get<BackendTypingTextDTO>("/typing/quotes/random", { params: { category } });
    return toTypingText(res.data);
  },
  getQuoteCategories: async () => {
    const res = await api.get<string[]>("/typing/quotes/categories");
    return res.data;
  },
  getLeaderboard: async (
    params?: number | { mode?: TypingMode | "ALL"; timeRange?: TypingTimeRange; limit?: number },
  ) => {
    const query =
      typeof params === "number"
        ? { limit: params }
        : {
            mode: params?.mode ?? "ALL",
            timeRange: params?.timeRange ?? "ALL",
            limit: params?.limit ?? 50,
          };
    const res = await api.get<BackendTypingLeaderboardEntryDTO[]>("/typing/leaderboard", { params: query });
    return res.data.map(toTypingLeaderboardEntry);
  },
  getMyProfile: async () => {
    const res = await api.get<BackendTypingProfileDTO>("/typing/profile");
    return toTypingProfile(res.data);
  },
  getMyResults: async (params?: { page?: number; size?: number }) => {
    const res = await api.get<BackendTypingTestResultDTO[]>("/typing/results/user", { params });
    return res.data.map(toTypingTestResult);
  },
  submitScore: async (payload: TypingScorePayload): Promise<TypingScoreResult> => {
    const res = await api.post<BackendTypingScoreResponseDTO>("/typing/score", payload);
    emitAppDataRefresh("typing");
    emitAppDataRefresh("dashboard");
    emitAppDataRefresh("leaderboard");
    if (res.data.newRecord || (res.data.badgesEarned?.length ?? 0) > 0) {
      emitSmartNotification("achievement_unlocked", {
        message: res.data.newRecord
          ? "New personal best saved."
          : "You earned a new typing badge.",
      });
    }
    return {
      success: res.data.success,
      newRecord: res.data.newRecord,
      xpEarned: res.data.xpEarned,
      levelUp: res.data.levelUp,
      badgesEarned: res.data.badgesEarned || [],
      profile: toTypingProfile(res.data.profile),
    };
  },
};

export const reviewFlagApi = {
  getAll: () => api.get<ReviewFlag[]>("/review-flags"),
  resolve: (id: number) => api.post(`/review-flags/${id}/resolve`),
  dismiss: (id: number) => api.post(`/review-flags/${id}/dismiss`),
};

export const suspiciousApi = {
  getAll: () => api.get<import("./types").SuspiciousUser[]>("/suspicious"),
  investigate: (userId: number) => api.post(`/suspicious/${userId}/investigate`),
};

export const teamApi = {
  getAll: () => api.get<Team[]>("/teams"),
  create: (name: string) => api.post<Team>("/teams", { name }).then((res) => {
    emitAppDataRefresh("teams");
    return res;
  }),
  invite: (teamId: number, userId: number) => api.post(`/teams/${teamId}/invite`, { userId }).then((res) => {
    emitAppDataRefresh("teams");
    return res;
  }),
};

export const badgeApi = {
  getAll: () => api.get<Badge[]>("/badges"),
};

export const collegeApi = {
  getStats: () => api.get<CollegeStats[]>("/colleges/stats"),
};

export const placementApi = {
  getReadiness: () => api.get<{ topics: PlacementTopic[]; companies: CompanyMatch[] }>("/placement/readiness"),
  getJobs: async (params?: { page?: number; size?: number; q?: string }) => {
    const res = await api.get<BackendPlacementJobDTO[]>("/placement/jobs", { params });
    return {
      ...res,
      data: (res.data || []).map(toPlacementJob),
    } as AxiosResponse<Job[]>;
  },
  getJob: async (id: number) => {
    const res = await api.get<BackendPlacementJobDTO>(`/placement/jobs/${id}`);
    return {
      ...res,
      data: toPlacementJob(res.data),
    } as AxiosResponse<Job>;
  },
  createJob: async (payload: PlacementJobPostPayload) => {
    const body = {
      companyId: payload.companyId,
      companyName: payload.companyName,
      title: payload.title,
      description: payload.description,
      eligibilityCriteria:
        payload.eligibilityCriteria
        || payload.requirements?.join(", ")
        || payload.responsibilities?.join(", ")
        || undefined,
      location: payload.location,
      salary: payload.salary ?? payload.salaryRange,
      deadline: payload.deadline ?? payload.expiresAt,
      status: payload.status ?? "OPEN",
    };
    const res = await api.post<BackendPlacementJobDTO>("/placement/jobs", body);
    emitAppDataRefresh("placement");
    emitAppDataRefresh("dashboard");
    return toPlacementJob(res.data);
  },
  updateJob: async (id: number, payload: PlacementJobPostPayload) => {
    const body = {
      companyId: payload.companyId,
      companyName: payload.companyName,
      title: payload.title,
      description: payload.description,
      eligibilityCriteria:
        payload.eligibilityCriteria
        || payload.requirements?.join(", ")
        || payload.responsibilities?.join(", ")
        || undefined,
      location: payload.location,
      salary: payload.salary ?? payload.salaryRange,
      deadline: payload.deadline ?? payload.expiresAt,
      status: payload.status ?? "OPEN",
    };
    const res = await api.put<BackendPlacementJobDTO>(`/placement/jobs/${id}`, body);
    emitAppDataRefresh("placement");
    return toPlacementJob(res.data);
  },
  applyJob: async (jobId: number, payload: { resumeUrl?: string; coverLetter?: string }) => {
    const res = await api.post<BackendPlacementApplicationDTO>(`/placement/jobs/${jobId}/apply`, payload);
    emitAppDataRefresh("placement");
    return toPlacementApplication(res.data);
  },
  getMyApplications: async () => {
    const res = await api.get<BackendPlacementApplicationDTO[]>("/placement/applications/my");
    return (res.data || []).map(toPlacementApplication);
  },
  getApplicationsForJob: async (jobId: number) => {
    const res = await api.get<BackendPlacementApplicationDTO[]>(`/placement/jobs/${jobId}/applications`);
    return (res.data || []).map(toPlacementApplication);
  },
  uploadResume: (formData: FormData) => api.post('/placement/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  getDashboard: () => api.get<PlacementDashboardStats>('/placement/dashboard').then((r) => r.data),
};

export const clubApi = {
  createClub: async (payload: { name: string; description?: string; visibility?: ClubVisibility }) => {
    const res = await api.post<ClubDetail>("/clubs", payload);
    emitAppDataRefresh("clubs");
    return res.data;
  },
  listClubs: async () => {
    const res = await api.get<ClubSummary[]>("/clubs");
    return res.data;
  },
  getClub: async (clubId: number) => {
    const res = await api.get<ClubDetail>(`/clubs/${clubId}`);
    return res.data;
  },
  joinClub: async (clubId: number) => {
    const res = await api.post<ClubDetail>(`/clubs/${clubId}/join`);
    emitAppDataRefresh("clubs");
    return res.data;
  },
  leaveClub: async (clubId: number) => {
    await api.post(`/clubs/${clubId}/leave`);
    emitAppDataRefresh("clubs");
  },
  getChallenges: async (clubId: number) => {
    const res = await api.get<ClubChallenge[]>(`/clubs/${clubId}/challenges`);
    return res.data;
  },
  createChallenge: async (
    clubId: number,
    payload: { title: string; description?: string; frequency: "WEEKLY" | "MONTHLY"; startsAt: string; endsAt: string },
  ) => {
    const res = await api.post<ClubChallenge>(`/clubs/${clubId}/challenges`, payload);
    emitAppDataRefresh("clubs");
    return res.data;
  },
  submitChallengeAttempt: async (clubId: number, challengeId: number, payload: { wpm: number; accuracy: number }) => {
    const res = await api.post<ClubRankingEntry>(`/clubs/${clubId}/challenges/${challengeId}/attempts`, payload);
    emitAppDataRefresh("clubs");
    return res.data;
  },
  getRankings: async (clubId: number) => {
    const res = await api.get<ClubRankingEntry[]>(`/clubs/${clubId}/rankings`);
    return res.data;
  },
  getPosts: async (clubId: number) => {
    const res = await api.get<ClubPost[]>(`/clubs/${clubId}/posts`);
    return res.data;
  },
  createPost: async (clubId: number, payload: { title: string; content: string }) => {
    const res = await api.post<ClubPost>(`/clubs/${clubId}/posts`, payload);
    emitAppDataRefresh("clubs");
    return res.data;
  },
  deletePost: async (clubId: number, postId: number) => {
    await api.delete(`/clubs/${clubId}/posts/${postId}`);
    emitAppDataRefresh("clubs");
  },
  getMessages: async (clubId: number) => {
    const res = await api.get<ClubMessage[]>(`/clubs/${clubId}/messages`);
    return res.data;
  },
  createMessage: async (clubId: number, payload: { message: string }) => {
    const res = await api.post<ClubMessage>(`/clubs/${clubId}/messages`, payload);
    return res.data;
  },
  deleteMessage: async (clubId: number, messageId: number) => {
    await api.delete(`/clubs/${clubId}/messages/${messageId}`);
    emitAppDataRefresh("clubs");
  },
  muteMember: async (clubId: number, memberUserId: number, minutes: number) => {
    await api.post(`/clubs/${clubId}/members/${memberUserId}/mute`, { minutes });
    emitAppDataRefresh("clubs");
  },
};


export const marketplaceApi = {
  createPassage: async (payload: {
    title: string;
    content: string;
    syntaxMode?: string;
    tags?: string[];
    featured?: boolean;
  }) => {
    const res = await api.post<MarketplacePassage>("/passages", payload);
    emitAppDataRefresh("marketplace");
    return res.data;
  },
  listPassages: async (params?: {
    search?: string;
    tag?: string;
    sort?: MarketplaceSort;
    mine?: boolean;
    page?: number;
    size?: number;
  }) => {
    const res = await api.get<PaginatedResponse<MarketplacePassage>>("/passages", {
      params: {
        search: params?.search,
        tag: params?.tag,
        sort: params?.sort ?? "new",
        mine: params?.mine ?? false,
        page: params?.page ?? 0,
        size: params?.size ?? 12,
      },
    });
    return res.data;
  },
  getPassage: async (id: number) => {
    const res = await api.get<MarketplacePassage>(`/passages/${id}`);
    return res.data;
  },
  ratePassage: async (id: number, payload: { rating: number; completed?: boolean }) => {
    const res = await api.post<{ passageId: number; rating: number; averageRating: number; ratingCount: number }>(
      `/passages/${id}/rate`,
      payload,
    );
    emitAppDataRefresh("marketplace");
    return res.data;
  },
  toggleBookmark: async (id: number) => {
    const res = await api.post<{ passageId: number; bookmarked: boolean }>(`/passages/${id}/bookmark`);
    emitAppDataRefresh("marketplace");
    return res.data;
  },
  getFeatured: async (params?: { search?: string; tag?: string; page?: number; size?: number }) => {
    const res = await api.get<PaginatedResponse<MarketplacePassage>>("/passages/featured", { params });
    return res.data;
  },
  getTrending: async (params?: { search?: string; tag?: string; page?: number; size?: number }) => {
    const res = await api.get<PaginatedResponse<MarketplacePassage>>("/passages/trending", { params });
    return res.data;
  },
  reportPassage: async (id: number, reason: string) => {
    await api.post(`/passages/${id}/report`, { reason });
  },
  getModerationReports: async (params?: { status?: string; page?: number; size?: number }) => {
    const res = await api.get<PaginatedResponse<MarketplaceModeration>>("/passages/moderation/reports", { params });
    return res.data;
  },
  getModerationAudit: async (params?: { reviewerEmail?: string; page?: number; size?: number }) => {
    const res = await api.get<PaginatedResponse<MarketplaceModerationAudit>>("/passages/moderation/audit", { params });
    return res.data;
  },
  reviewModeration: async (
    moderationId: number,
    payload: { decision: "APPROVE" | "REJECT"; notes?: string; featured?: boolean },
  ) => {
    const res = await api.post<MarketplaceModeration>(`/passages/moderation/${moderationId}/review`, payload);
    emitAppDataRefresh("marketplace");
    return res.data;
  },
};

export const trackerApi = {
  getConnections: async () => {
    const res = await api.get<TrackerConnection[]>("/tracker/platforms");
    return res.data;
  },
  connectPlatform: async (payload: { platform: TrackerPlatform; username: string; accessToken?: string }) => {
    const res = await api.post<TrackerConnection>("/tracker/platforms/connect", payload);
    emitAppDataRefresh("tracker");
    return res.data;
  },
  syncPlatform: async (platform: TrackerPlatform) => {
    const res = await api.post<TrackerSyncResult>(`/tracker/platforms/${platform}/sync`);
    emitAppDataRefresh("tracker");
    return res.data;
  },
  syncAll: async () => {
    const res = await api.post<TrackerSyncResult[]>("/tracker/sync-all");
    emitAppDataRefresh("tracker");
    return res.data;
  },
  getSummary: async () => {
    const res = await api.get<TrackerSummary>("/tracker/summary");
    return res.data;
  },
  getWeeklyInsight: async (useAi = false) => {
    const res = await api.get<TrackerInsight>("/tracker/insights/weekly", {
      params: { useAi },
    });
    return res.data;
  },
  getSkillGap: async (targetRole = "SDE", useAi = false) => {
    const res = await api.get<TrackerSkillGap>("/tracker/insights/skill-gap", {
      params: { targetRole, useAi },
    });
    return res.data;
  },
  getReport: async (targetRole = "SDE", useAi = false) => {
    const res = await api.get<TrackerPerformanceReport>("/tracker/report", {
      params: { targetRole, useAi },
    });
    return res.data;
  },
};

const extractErrorMessage = (data: unknown) => {
  if (!data || typeof data !== "object") return undefined;
  const payload = data as { message?: string; error?: string };
  return payload.message || payload.error;
};

const probeEndpoint = async (name: string, path: string): Promise<ApiProbeResult> => {
  const startedAt = Date.now();
  try {
    const response = await api.get(path);
    return {
      name,
      path,
      ok: response.status < 500,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      message: "Connected",
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const message = extractErrorMessage(error.response.data) || error.message;
      return {
        name,
        path,
        ok: status < 500,
        status,
        latencyMs: Date.now() - startedAt,
        message,
      };
    }

    return {
      name,
      path,
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      message: axios.isAxiosError(error) ? error.message : "Network error",
    };
  }
};

export const systemApi = {
  checkBackendConnections: async () => {
    const targets = [
      { name: "Backend Health", path: "/actuator/health" },
      { name: "Auth", path: "/auth/me" },
      { name: "Contests", path: "/contests" },
      { name: "Quizzes", path: "/quizzes" },
      { name: "Duels", path: "/duels" },
      { name: "Submissions", path: "/submissions/my" },
      { name: "Resume", path: "/resume/strength" },
      { name: "Teams", path: "/teams" },
    ];

    return Promise.all(targets.map((target) => probeEndpoint(target.name, target.path)));
  },
};

export default api;



