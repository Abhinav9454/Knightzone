import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

import Navbar from "./components/Navbar";
import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Contests from "./pages/Contests";
import ContestDetails from "./pages/ContestDetails";
import Arena from "./pages/Arena";
import Leaderboard from "./pages/Leaderboard";
import ProblemDetails from "./pages/ProblemDetails";
import Quizzes from "./pages/Quizzes";
import QuizAttempt from "./pages/QuizAttempt";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import Jobs from "./pages/Jobs";
import MockInterviews from "./pages/MockInterviews";
import ResumeBuilder from "./pages/ResumeBuilder";
import ResumeStrength from "./pages/ResumeStrength";
import InterCollege from "./pages/InterCollege";
import Contributions from "./pages/Contributions";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import LiveChatHub from "./pages/LiveChatHub";
import VerifyCertificate from "./pages/VerifyCertificate";
import NotFound from "./pages/NotFound";

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          {/* Public homepage */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main application layout */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/contests" element={<Contests />} />
            <Route path="/contests/:id" element={<ContestDetails />} />
            <Route path="/arena" element={<Arena />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/problems/:id" element={<ProblemDetails />} />

            {/* Modules */}
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quizzes/:id" element={<QuizAttempt />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/:id" element={<ClubDetails />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/inter-college" element={<InterCollege />} />
            <Route path="/contributions" element={<Contributions />} />
            <Route path="/mock-interviews" element={<MockInterviews />} />
            <Route path="/interviews" element={<MockInterviews />} />
            <Route path="/resume-builder" element={<ResumeBuilder />} />
            <Route path="/resume-strength" element={<ResumeStrength />} />
            <Route path="/chat" element={<LiveChatHub />} />
            <Route path="/live-chat" element={<LiveChatHub />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/:tab" element={<Admin />} />
          </Route>

          {/* Public Certificate Verification (Recruiters & Verification Engine) */}
          <Route path="/verify-cert" element={<VerifyCertificate />} />
          <Route path="/verify-cert/:uuid" element={<VerifyCertificate />} />
          <Route path="/verify-certificate/:uuid" element={<VerifyCertificate />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
