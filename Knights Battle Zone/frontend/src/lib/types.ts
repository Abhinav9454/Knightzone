export interface User {
  id: number;
  name: string;
  username?: string;
  publicUserId?: string;
  email: string;
  college?: string;
  department?: string;
  adminExpiresAt?: string;
  role: "USER" | "STUDENT" | "ADMIN" | "SUPER_ADMIN";
  rating?: number;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  dateOfBirth?: string;
  skills?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  privacyEmail?: "public" | "loggedin" | "private" | string;
  privacyActivity?: "public" | "loggedin" | "private" | string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  twoFactorEnabled?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  badges?: Badge[];
  streak?: number;
  streakShields?: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegistrationRequest {
  name: string;
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface Contest {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number;
  durationMinutes?: number;
  status: "UPCOMING" | "ONGOING" | "PAST";
  registered?: boolean;
  participantCount?: number;
  problems?: Problem[];
  proctored?: boolean;
  tabSwitchCount?: number;
  createdBy?: Pick<User, "id" | "name" | "username" | "publicUserId" | "email" | "role" | "college" | "department">;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContestAccess {
  contestId: number;
  registered: boolean;
  durationMinutes: number;
  attemptStartTime?: string | null;
  attemptEndTime?: string | null;
  remainingSeconds?: number | null;
}

export interface QuizOption {
  id?: number;
  text: string;
  isCorrect?: boolean | null;
}

export interface QuizQuestion {
  id?: number;
  text: string;
  points: number;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questions: QuizQuestion[];
  createdBy?: Pick<User, "id" | "name" | "username" | "publicUserId" | "email" | "role" | "college" | "department">;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizAnswerPayload {
  questionId: number;
  selectedOption?: number;
}

export interface QuizAttempt {
  id: number;
  quizId: number;
  answers: QuizAnswerPayload[];
  score: number;
  totalPoints: number;
  submittedAt: string;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  constraints?: string;
  inputFormat?: string;
  outputFormat?: string;
  sampleInput?: string;
  sampleOutput?: string;
  tags?: string[];
  contestId?: number;
  contestMode?: string;
  acceptanceRate?: number;
  upvotes?: number;
  downvotes?: number;
  hints?: string[];
  points?: number;
  testCases?: string;
  timeLimitSeconds?: number;
}

export interface ProblemSetPageResponse {
  content: Problem[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
  query?: string | null;
}

export interface ProblemSetUpsertPayload {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  inputFormat: string;
  outputFormat: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: string;
  points: number;
  timeLimitSeconds: number;
}

export interface Submission {
  id: number;
  problemId: number;
  problemTitle?: string;
  userId: number;
  language: string;
  code: string;
  verdict: "QUEUED" | "RUNNING" | "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT" | "RUNTIME_ERROR" | "COMPILATION_ERROR";
  output?: string;
  executionTime?: number;
  memoryUsed?: number;
  submittedAt: string;
  testCasesPassed?: number;
  totalTestCases?: number;
  flagged?: boolean;
  flagReason?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  score: number;
  problemsSolved: number;
  college?: string;
  firstAcceptedAt?: string;
}

export type LeaderboardTimeRange = "today" | "week" | "all-time";

export interface LeaderboardFilters {
  region?: string;
  country?: string;
  college?: string;
  department?: string;
  mode?: string;
  difficulty?: string;
  timeRange: LeaderboardTimeRange;
  page: number;
  size: number;
}

export interface LeaderboardListResponse {
  content: LeaderboardEntry[];
  total: number;
  page: number;
  size: number;
  appliedFilters: Record<string, string>;
}

export interface ContestFirstSolver {
  problemId: number;
  problemTitle: string;
  firstSolverUserId?: number | null;
  firstSolverName?: string | null;
  firstSolvedAt?: string | null;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon?: string;
  earned?: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface DashboardStats {
  contestsParticipated: number;
  problemsSolved: number;
  currentRating: number;
  globalRank: number;
  upcomingContests: number;
  recentSubmissions: Submission[];
}

export interface TypingText {
  id: number;
  content: string;
  category: string;
  difficulty: string;
  source?: string;
}

export type TypingMode = "TIMED" | "WORD_COUNT" | "QUOTE" | "CUSTOM";

export type TypingTimeRange = "TODAY" | "WEEK" | "ALL";

export interface TypingScorePayload {
  mode?: TypingMode;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  testDuration: number;
  wordCountTarget?: number;
  category?: string;
  textSnippet?: string;
  textId?: number;
  errors: number;
  keyPresses: number;
  keyMistakes?: Record<string, number>;
}

export interface TypingProfile {
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
  badges: string[];
  rank?: number | null;
  keyHeatmap?: Record<string, number>;
}

export interface TypingLeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  bestWpm: number;
  bestAccuracy: number;
  achievedAt?: string;
}

export interface TypingTestResult {
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
}

export interface TypingScoreResult {
  success: boolean;
  newRecord: boolean;
  xpEarned: number;
  levelUp: boolean;
  badgesEarned: string[];
  profile: TypingProfile;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface ChatReply {
  sessionId: string;
  reply: string;
  timestamp: string;
}

export type LiveChatConversationStatus = "WAITING" | "ACTIVE" | "CLOSED";
export type LiveChatSenderType = "USER" | "AGENT" | "BOT" | "SYSTEM";

export interface LiveChatConversation {
  id: number;
  status: LiveChatConversationStatus;
  priority: string;
  category?: string | null;
  summary?: string | null;
  sourcePage?: string | null;
  requesterUserId: number;
  requesterName: string;
  assignedAgentId?: number | null;
  assignedAgentName?: string | null;
  messageCount: number;
  createdAt: string;
  joinedAt?: string | null;
  closedAt?: string | null;
  lastMessageAt: string;
}

export interface LiveChatSupportMessage {
  id: number;
  conversationId: number;
  senderType: LiveChatSenderType;
  senderUserId?: number | null;
  senderName?: string | null;
  messageText: string;
  messageType: string;
  createdAt: string;
  readAt?: string | null;
}

export type NotificationType =
  | "achievement_unlocked"
  | "friend_logged_in"
  | "match_found"
  | "daily_challenge"
  | "tournament_starting"
  | "challenge_received";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationPreference {
  enabled: boolean;
  muted: boolean;
}

export type NotificationPreferences = Record<NotificationType, NotificationPreference>;

// Adaptive Difficulty
export interface AdaptiveProblemRecommendation {
  id: number;
  title: string;
  difficulty: number;
  category: string;
  timeLimit: number;
  memoryLimit: number;
}

export interface AdaptiveSkillHistoryEntry {
  userId: number;
  skillLevel: number;
  updatedAt: string;
  problemId: number;
  solved: boolean;
}

// Consistency
export interface ConsistencySummary {
  score: number;
  activeDays: number;
  totalDays: number;
  coefficientOfVariation: number;
  activityWeight: number;
  regularityWeight: number;
  grade?: string | null;
  message?: string | null;
}

export interface ConsistencyHistoryEntry {
  date: string;
  active: boolean;
  submissions: number;
  dailyScore: number;
}

// Contributions
export interface ContributorEntry {
  userId: number;
  username: string;
  totalPoints: number;
  contributionsCount?: number;
  lastContributionAt?: string | null;
}

export interface ContributionTypeInfo {
  key: string;
  label: string;
  description: string;
  points: number;
  hint: string;
  requiresReferenceId: boolean;
}

export interface ContributionTypeStat {
  type: string;
  label: string;
  count: number;
  points: number;
}

export interface ContributionHistoryItem {
  id: number;
  type: string;
  label: string;
  referenceId?: number | null;
  points: number;
  createdAt: string;
}

export interface ContributionSummary {
  userId: number;
  totalPoints: number;
  totalContributions: number;
  pointsLast30Days: number;
  contributionsLast30Days: number;
  currentStreakDays: number;
  badgeLevel: string;
  bestType: string;
  lastContributionAt?: string | null;
  typeBreakdown: ContributionTypeStat[];
}

// Consistency Calendar
export interface ActivityDay {
  date: string;
  count: number;
}

// Department Leagues
export interface DepartmentLeague {
  id: number;
  name: string;
  college: string;
  points: number;
  memberCount: number;
  rank: number;
}

// Duel
export interface Duel {
  id: number;
  challengerId: number;
  challengerName: string;
  opponentId?: number | null;
  opponentName: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "DECLINED" | "ABANDONED";
  problemId?: number;
  problemTitle?: string;
  mode?: "CODING" | "TYPING" | "QUIZ" | string;
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
  winnerId?: number | null;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DuelAdvancedLeaderboardEntry {
  userId: number;
  username: string;
  rating: number;
  effectiveRating: number;
  wins: number;
  losses: number;
  totalDuels: number;
  winRate: number;
  inactiveDays: number;
  rankDecayPenalty: number;
  skillTier: string;
}

export interface DuelMatchQuality {
  mode: string;
  difficulty: string;
  durationSeconds: number;
  userRating: number;
  maxRatingGap: number;
  recommendedRatingGap: number;
  queuePoolSize: number;
  estimatedWaitSeconds: number;
  rankDecayRisk: "LOW" | "MEDIUM" | "HIGH" | string;
}

export interface DuelFairPlayFlag {
  id: number;
  duelId: number;
  reporterUserId: number;
  reportedUserId: number;
  flagType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | string;
  reason: string;
  analysisDetails?: string;
  status: string;
  createdAt: string;
}

export interface DuelFairPlaySummary {
  totalFlagsAgainstUser: number;
  openFlagsAgainstUser: number;
  reportsSubmitted: number;
  recentFlagsAgainstUser: DuelFairPlayFlag[];
}

export interface PlatformAnalytics {
  retention: {
    dau: number;
    wau: number;
    mau: number;
  };
  engagement: {
    totalDuels: number;
    completedDuels: number;
    activePendingDuels: number;
    avgCompletionMinutes: number;
  };
  popularPassages: {
    snippet: string;
    uses: number;
  }[];
  difficultyDistribution: {
    difficulty: string;
    count: number;
  }[];
}

export interface IntegrationStats {
  platform: string;
  username: string;
  publicUserId: string;
  rating: number;
  wins: number;
  losses: number;
  bestWpm: number;
  profileUrl: string;
  widgetUrl: string;
  summary: string;
}

// Integrity
export interface FlaggedSubmission {
  id: number;
  submissionId: number;
  userId: number;
  username: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "REVIEWED" | "DISMISSED";
  detectedAt: string;
}

// Mock Interview
export interface InterviewSlot {
  id: number;
  date: string;
  time: string;
  duration: number;
  interviewer: string;
  topic: string;
  booked: boolean;
  status: "AVAILABLE" | "BOOKED" | "COMPLETED";
}

export interface MockInterviewSession {
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
  problemIds: number[];
}

export interface InterviewMasteryTrackProgress {
  id: number;
  userId: number;
  trackId: string;
  trackTitle?: string;
  interviewType?: "TECHNICAL" | "BEHAVIORAL" | "HR" | "CUSTOM" | string;
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  questionFormat?: "MIXED" | "OPEN_ENDED" | "MCQ" | "CODING" | string;
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
  status?: "ON_TRACK" | "NEEDS_ATTENTION" | "COMPLETED" | string;
  completionPercent?: number;
  lastSyncedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InterviewQuestionBankItem {
  id: number;
  type: "TECHNICAL" | "BEHAVIORAL" | "HR" | "CUSTOM" | string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | string;
  category: string;
  questionFormat?: "OPEN_ENDED" | "MCQ" | "CODING" | string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  expectedComplexity?: string;
  companyTag?: string;
  estimatedSeconds?: number;
  expectedPoints?: string;
  aiEvaluationCriteria?: string;
  tags?: string;
  isActive?: boolean;
}

export interface UserInterviewAnalytics {
  userId: number;
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  technicalAverage: number;
  communicationAverage: number;
  problemSolvingAverage: number;
  confidenceAverage: number;
  strongestArea: string;
  weakestArea: string;
}

export interface OverallInterviewAnalytics {
  totalUsers: number;
  totalInterviews: number;
  scheduledInterviews: number;
  inProgressInterviews: number;
  completedInterviews: number;
  averageOverallScore: number;
}

// Placement Readiness
export interface PlacementTopic {
  name: string;
  mastery: number;
  importance: "HIGH" | "MEDIUM" | "LOW";
}

export interface CompanyMatch {
  name: string;
  match: number;
  requiredTopics: string[];
}

// Resume
export interface ResumeHardCheck {
  id: string;
  title: string;
  status: "PASS" | "WARN" | "FAIL" | string;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | string;
  detail: string;
  action: string;
}

export interface ResumeStrength {
  overallScore: number;
  breakdown: { category: string; score: number; suggestion: string }[];
  grade?: string;
  verdict?: string;
  benchmark?: string;
  checkedAt?: string;
  deepAnalysis?: boolean;
  hardChecks?: ResumeHardCheck[];
  priorityActions?: string[];
  message?: string;
  fileName?: string;
  sizeBytes?: number;
  parserUsed?: boolean;
  validationMode?: "DEEP" | "FILE_ONLY" | string;
  validationNote?: string;
}

// Review Flags
export interface ReviewFlag {
  id: number;
  type: "PROBLEM" | "COMMENT" | "SUBMISSION";
  targetId: number;
  reason: string;
  reportedBy: number;
  reporterName: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  createdAt: string;
}

// Suspicious Activity
export interface SuspiciousUser {
  userId: number;
  username: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  detectedAt: string;
  status: "INVESTIGATING" | "CLEARED" | "BANNED";
}

// Team
export interface Team {
  id: number;
  name: string;
  members: { userId: number; name: string; role: string }[];
  score: number;
  contestsPlayed: number;
}

// Typing Speed
export interface TypingResult {
  wpm: number;
  accuracy: number;
  date: string;
}

// Vote
export interface Vote {
  userId: number;
  targetId: number;
  targetType: "PROBLEM" | "SOLUTION";
  value: 1 | -1;
}

// Inter-College Arena
export interface CollegeStats {
  college: string;
  totalPoints: number;
  memberCount: number;
  contestsWon: number;
  rank: number;
}

// Placement module types
export interface Job {
  id: number;
  title: string;
  companyId: number;
  companyName?: string;
  location?: string;
  remote?: boolean;
  postedAt: string;
  postedDate?: string;
  expiresAt?: string;
  deadline?: string;
  description?: string;
  responsibilities?: string[];
  requirements?: string[];
  minCgpa?: number | null;
  eligibleDepartments?: string[];
  employmentType?: 'FULL_TIME' | 'INTERNSHIP' | 'CONTRACT' | string;
  salaryRange?: string;
  salary?: string;
  eligibilityCriteria?: string;
  tags?: string[];
  status?: 'OPEN' | 'CLOSED';
}

export interface Application {
  id: number;
  jobId: number;
  userId: number;
  studentId?: number;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'APPLIED' | 'REVIEW' | 'SHORTLISTED' | 'INTERVIEW' | 'OFFERED' | 'REJECTED' | 'SELECTED';
  appliedAt: string;
  appliedDate?: string;
  updatedAt?: string;
  comments?: string;
}

export interface PlacementDashboardStats {
  totalJobs: number;
  openJobs: number;
  myApplications: number;
  interviewsScheduled: number;
  companiesHiring: number;
}

export interface PlacementJobPostPayload {
  companyId?: number;
  companyName?: string;
  title: string;
  description: string;
  eligibilityCriteria?: string;
  requirements?: string[];
  responsibilities?: string[];
  location?: string;
  remote?: boolean;
  minCgpa?: number | null;
  eligibleDepartments?: string[];
  employmentType?: string;
  expiresAt?: string;
  deadline?: string;
  salaryRange?: string;
  salary?: string;
  status?: 'OPEN' | 'CLOSED';
}

// Clubs / Guilds
export type ClubVisibility = "PUBLIC" | "PRIVATE";
export type ClubMemberRole = "OWNER" | "MODERATOR" | "MEMBER";
export type ClubChallengeFrequency = "WEEKLY" | "MONTHLY";
export type ClubChallengeStatus = "ACTIVE" | "CLOSED";

export interface ClubSummary {
  id: number;
  name: string;
  description?: string;
  visibility: ClubVisibility;
  memberCount: number;
  joined: boolean;
  myRole?: ClubMemberRole | null;
}

export interface ClubDetail {
  id: number;
  name: string;
  description?: string;
  visibility: ClubVisibility;
  ownerId: number;
  ownerName: string;
  memberCount: number;
  joined: boolean;
  myRole?: ClubMemberRole | null;
  createdAt: string;
}

export interface ClubChallenge {
  id: number;
  clubId: number;
  title: string;
  description?: string;
  frequency: ClubChallengeFrequency;
  status: ClubChallengeStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface ClubRankingEntry {
  userId: number;
  userName: string;
  totalPoints: number;
  bestWpm: number;
  bestAccuracy: number;
}

export interface ClubPost {
  id: number;
  clubId: number;
  authorId: number;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClubMessage {
  id: number;
  clubId: number;
  senderId: number;
  senderName: string;
  message: string;
  createdAt: string;
}

export interface ClubUpdateEvent {
  type: string;
  message: string;
  clubId: number;
  at: string;
}

// Content Marketplace
export type MarketplaceSort = "featured" | "trending" | "new";
export type MarketplacePassageStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MarketplaceModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface MarketplacePassage {
  id: number;
  title: string;
  preview?: string | null;
  content?: string | null;
  syntaxMode: string;
  tags: string[];
  authorId: number;
  authorName: string;
  featured: boolean;
  approved: boolean;
  status: MarketplacePassageStatus;
  averageRating: number;
  ratingCount: number;
  playCount: number;
  completionRate: number;
  bookmarked: boolean;
  myRating?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceModeration {
  id: number;
  passageId: number;
  passageTitle: string;
  reporterId: number;
  reporterName: string;
  reason: string;
  status: MarketplaceModerationStatus;
  reviewNotes?: string | null;
  reviewerId?: number | null;
  reviewerName?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}

export interface MarketplaceModerationAudit {
  id: number;
  moderationId: number;
  passageId: number;
  passageTitle: string;
  reviewerId: number;
  reviewerName: string;
  decision: "APPROVE" | "REJECT" | string;
  previousStatus: MarketplaceModerationStatus;
  nextStatus: MarketplaceModerationStatus;
  reviewNotes?: string | null;
  featuredAfterDecision: boolean;
  createdAt: string;
}

// Multi-platform tracking
export type TrackerPlatform = "LEETCODE" | "CODEFORCES" | "GITHUB";

export interface TrackerConnection {
  id: number;
  platform: TrackerPlatform;
  username: string;
  lastFetchedAt?: string | null;
  connectedAt?: string | null;
}

export interface TrackerSyncResult {
  platform: TrackerPlatform;
  success: boolean;
  message: string;
  fetchedItems: number;
  newItems: number;
  fetchedRepositories: number;
  updatedAt: string;
}

export interface TrackerSummary {
  totalSolved: number;
  weeklySolved: number;
  monthlySolved: number;
  currentStreakDays: number;
  bestStreakDays: number;
  platformSolvedCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  topicCounts: Record<string, number>;
  dailySolvedLast30Days: Record<string, number>;
  strongTopics: string[];
  weakTopics: string[];
  githubRepositories: number;
  githubCommits: number;
  githubLanguages: Record<string, number>;
  githubTopRepos: TrackerGithubRepo[];
  recentProblems: TrackerRecentProblem[];
  lastSyncedAt?: string | null;
}

export interface TrackerInsight {
  summary: string;
  recommendations: string[];
  aiGenerated: boolean;
  generatedAt: string;
}

export interface TrackerRecentProblem {
  platform: string;
  problemId: string;
  problemName: string;
  problemUrl?: string;
  difficulty: string;
  topicTags: string[];
  solvedAt?: string;
}

export interface TrackerGithubRepo {
  repoName: string;
  commits: number;
  stars: number;
  forks: number;
  lastUpdated?: string;
}

export interface TrackerSkillRecommendation {
  topic: string;
  reason: string;
  suggestedProblems: string[];
}

export interface TrackerSkillGap {
  targetRole: string;
  strongTopics: string[];
  weakTopics: string[];
  recommendedPractice: TrackerSkillRecommendation[];
  aiGenerated: boolean;
}

export interface TrackerPerformanceReport {
  summary: TrackerSummary;
  weeklyInsight: TrackerInsight;
  skillGap: TrackerSkillGap;
  generatedAt: string;
}
