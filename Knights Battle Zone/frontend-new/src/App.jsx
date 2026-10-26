
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import AppLayout from "./components/AppLayout";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Problems from "./pages/Problems";
import Contests from "./pages/Contests";
import Arena from "./pages/Arena";
import Leaderboard from "./pages/Leaderboard";
import ProblemDetails from "./pages/ProblemDetails";
import Quizzes from "./pages/Quizzes";
import QuizAttempt from "./pages/QuizAttempt";
import Clubs from "./pages/Clubs";
import ClubDetails from "./pages/ClubDetails";
import TypingSpeed from "./pages/TypingSpeed";
import Jobs from "./pages/Jobs";
import Profile from "./pages/Profile";

const App = () => {
  return (
    <BrowserRouter>
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
            <Route path="/arena" element={<Arena />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/problems/:id" element={<ProblemDetails />} />

            {/* Missing backend modules added */}
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quizzes/:id" element={<QuizAttempt />} />
            <Route path="/clubs" element={<Clubs />} />
            <Route path="/clubs/:id" element={<ClubDetails />} />
            <Route path="/typing" element={<TypingSpeed />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
