import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { SimpleAppLayout } from "@/components/SimpleAppLayout";
import { ScrollToTopOnRoute } from "@/components/RouteEnhancements";
import { FloatingChatWidget } from "@/components/FloatingChatWidget";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

const LoginPage = lazy(() => import("./pages/core/LoginPage"));
const RegisterPage = lazy(() => import("./pages/core/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/core/ForgotPasswordPage"));
const LandingPage = lazy(() => import("./pages/core/LandingPage"));
const DashboardPage = lazy(() => import("./pages/core/DashboardPage"));
const FeatureHubPage = lazy(() => import("./pages/core/FeatureHubPage"));
const AdaptiveInsightsPage = lazy(() => import("./pages/coding/AdaptiveInsightsPage"));
const ContributionsPage = lazy(() => import("./pages/coding/ContributionsPage"));
const TabSwitchMonitorPage = lazy(() => import("./pages/coding/TabSwitchMonitorPage"));
const ContestsPage = lazy(() => import("./pages/coding/ContestsPage"));
const QuizzesPage = lazy(() => import("./pages/coding/QuizzesPage"));
const QuizAttemptPage = lazy(() => import("./pages/coding/QuizAttemptPage"));
const ContestDetailPage = lazy(() => import("./pages/coding/ContestDetailPage"));
const ProblemDetailPage = lazy(() => import("./pages/coding/ProblemDetailPage"));
const ProblemSetPage = lazy(() => import("./pages/problem-set/ProblemSetPage"));
const SubmissionsPage = lazy(() => import("./pages/coding/SubmissionsPage"));
const LeaderboardPage = lazy(() => import("./pages/coding/LeaderboardPage"));
const ProfilePage = lazy(() => import("./pages/core/ProfilePage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const NotFound = lazy(() => import("./pages/core/NotFound"));
const DuelsPage = lazy(() => import("./pages/coding/DuelsPage"));
const InterCollegeArenaPage = lazy(() => import("./pages/community/InterCollegeArenaPage"));
const MockInterviewsPage = lazy(() => import("./pages/career/MockInterviewsPage"));
const TypingSpeedPage = lazy(() => import("./pages/coding/TypingSpeedPage"));
const PlacementReadinessPage = lazy(() => import("./pages/career/PlacementReadinessPage"));
const ResumeStrengthPage = lazy(() => import("./pages/career/ResumeStrengthPage"));
const ResumeBuilderPage = lazy(() => import("./pages/career/ResumeBuilderPage"));
const PlacementStudentDashboard = lazy(() => import("./pages/placement/StudentDashboard"));
const PlacementCompanyDashboard = lazy(() => import("./pages/placement/CompanyDashboard"));
const PlacementTPODashboard = lazy(() => import("./pages/placement/TPODashboard"));
const PlacementJobList = lazy(() => import("./pages/placement/JobList"));
const PlacementJobPost = lazy(() => import("./pages/placement/JobPost"));
const PlacementApplicationTracker = lazy(() => import("./pages/placement/ApplicationTracker"));
const PlacementResumeUpload = lazy(() => import("./pages/placement/ResumeUpload"));
const PlacementOnlineTest = lazy(() => import("./pages/placement/OnlineTest"));
const PlacementAnalytics = lazy(() => import("./pages/placement/Analytics"));
const TeamManagementPage = lazy(() => import("./pages/community/TeamManagementPage"));
const ClubsPage = lazy(() => import("./pages/community/ClubsPage"));
const ClubDetailPage = lazy(() => import("./pages/community/ClubDetailPage"));
const MarketplacePage = lazy(() => import("./pages/community/MarketplacePage"));
const TrackerPage = lazy(() => import("./pages/coding/TrackerPage"));
const IntegrityMonitoringPage = lazy(() => import("./pages/admin/IntegrityMonitoringPage"));
const ReviewFlagsPage = lazy(() => import("./pages/admin/ReviewFlagsPage"));
const SuspiciousActivityPage = lazy(() => import("./pages/admin/SuspiciousActivityPage"));
const BackendHealthPage = lazy(() => import("./pages/admin/BackendHealthPage"));
const HelpCenterPage = lazy(() => import("./pages/support/HelpCenterPage"));
const JobsPage = lazy(() => import("./pages/career/JobsPage"));
const BugBountyPage = lazy(() => import("./pages/support/BugBountyPage"));
const AssessmentPage = lazy(() => import("./pages/coding/AssessmentPage"));
const StudentsPage = lazy(() => import("./pages/career/StudentsPage"));
const TermsPage = lazy(() => import("./pages/support/TermsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/support/PrivacyPolicyPage"));
const MobileQuickCheckPage = lazy(() => import("./pages/core/MobileQuickCheckPage"));

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootEntry() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/simple/dashboard" replace />;
  return <LandingPage />;
}

function ChatWidgetGate() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated) return null;
  return <FloatingChatWidget />;
}

function renderProtectedAppRoutes() {
  return (
    <>
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="features" element={<FeatureHubPage />} />
      <Route path="adaptive-insights" element={<AdaptiveInsightsPage />} />
      <Route path="contributions" element={<ContributionsPage />} />
      <Route path="tab-switch-monitor" element={<TabSwitchMonitorPage />} />
      <Route path="contests" element={<ContestsPage />} />
      <Route path="quizzes" element={<QuizzesPage />} />
      <Route path="quizzes/:id" element={<QuizAttemptPage />} />
      <Route path="contests/:id" element={<ContestDetailPage />} />
      <Route path="problem-set" element={<ProblemSetPage />} />
      <Route path="problem-set/:id" element={<ProblemDetailPage />} />
      <Route path="problems/:id" element={<ProblemDetailPage />} />
      <Route path="submissions" element={<SubmissionsPage />} />
      <Route path="leaderboard" element={<LeaderboardPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="my-profile" element={<ProfilePage />} />
      <Route path="profile/:username" element={<ProfilePage />} />
      <Route path="duels/*" element={<DuelsPage />} />
      <Route path="inter-college" element={<InterCollegeArenaPage />} />
      <Route path="mock-interviews" element={<MockInterviewsPage />} />
      <Route path="typing-speed/*" element={<TypingSpeedPage />} />
      <Route path="placement" element={<PlacementReadinessPage />} />
      <Route path="placement/student" element={<PlacementStudentDashboard />} />
      <Route path="placement/company" element={<PlacementCompanyDashboard />} />
      <Route path="placement/tpo" element={<PlacementTPODashboard />} />
      <Route path="placement/jobs" element={<PlacementJobList />} />
      <Route path="placement/jobs/new" element={<ProtectedRoute adminOnly><PlacementJobPost /></ProtectedRoute>} />
      <Route path="placement/applications" element={<PlacementApplicationTracker />} />
      <Route path="placement/resume-upload" element={<PlacementResumeUpload />} />
      <Route path="placement/tests/online" element={<PlacementOnlineTest />} />
      <Route path="placement/analytics" element={<PlacementAnalytics />} />
      <Route path="resume" element={<ResumeStrengthPage />} />
      <Route path="resume-builder" element={<ResumeBuilderPage />} />
      <Route path="teams" element={<TeamManagementPage />} />
      <Route path="clubs" element={<ClubsPage />} />
      <Route path="clubs/:id" element={<ClubDetailPage />} />
      <Route path="marketplace" element={<MarketplacePage />} />
      <Route path="tracker/*" element={<TrackerPage />} />
      <Route path="backend-health" element={<BackendHealthPage />} />
      <Route path="help" element={<HelpCenterPage />} />
      <Route path="jobs" element={<JobsPage />} />
      <Route path="bug-bounty" element={<BugBountyPage />} />
      <Route path="assessment" element={<AssessmentPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="terms" element={<TermsPage />} />
      <Route path="privacy" element={<PrivacyPolicyPage />} />
      <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="admin/integrity" element={<ProtectedRoute adminOnly><IntegrityMonitoringPage /></ProtectedRoute>} />
      <Route path="admin/review-flags" element={<ProtectedRoute adminOnly><ReviewFlagsPage /></ProtectedRoute>} />
      <Route path="admin/suspicious" element={<ProtectedRoute adminOnly><SuspiciousActivityPage /></ProtectedRoute>} />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ThemeProvider>
        <BrowserRouter>
          <ScrollToTopOnRoute />
          <AuthProvider>
            <NotificationProvider>
              <AppErrorBoundary>
                <Suspense fallback={null}>
                  <Routes>
                    <Route path="/" element={<RootEntry />} />
                    <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
                    <Route path="/register" element={<AuthRedirect><RegisterPage /></AuthRedirect>} />
                    <Route path="/forgot-password" element={<AuthRedirect><ForgotPasswordPage /></AuthRedirect>} />
                    <Route path="/mobile-check" element={<MobileQuickCheckPage />} />

                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      {renderProtectedAppRoutes()}
                    </Route>

                    <Route path="/simple" element={<ProtectedRoute><SimpleAppLayout /></ProtectedRoute>}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      {renderProtectedAppRoutes()}
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <ChatWidgetGate />
              </AppErrorBoundary>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;



