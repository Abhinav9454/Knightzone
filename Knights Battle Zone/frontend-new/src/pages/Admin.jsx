import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Code2,
  HelpCircle,
  Briefcase,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Search,
  Eye,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Loader2,
  Calendar,
  Lock,
  FileText,
  Check,
  ExternalLink,
  Edit3,
  Filter,
} from "lucide-react";
import {
  adminApi,
  contestsApi,
  problemsApi,
  quizzesApi,
  jobsApi,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { KnightCrest, KnightLogo, TrophyIllustration } from "../components/svg";

export default function Admin() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview"); // overview, contests, problems, quizzes, jobs, integrity, users
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Data states
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [flaggedSubmissions, setFlaggedSubmissions] = useState([]);
  const [reviewFlags, setReviewFlags] = useState([]);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Search & Filters
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [problemSearchQuery, setProblemSearchQuery] = useState("");
  const [problemDiffFilter, setProblemDiffFilter] = useState("ALL");

  // Modals state
  const [showContestModal, setShowContestModal] = useState(false);
  const [editingContestId, setEditingContestId] = useState(null);
  const [contestForm, setContestForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    durationMinutes: 120,
  });

  const [showAddContestProblemModal, setShowAddContestProblemModal] = useState(false);
  const [selectedContestForProblem, setSelectedContestForProblem] = useState(null);
  const [contestProblemForm, setContestProblemForm] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    points: 100,
    timeLimit: 2,
    memoryLimit: 256,
    inputFormat: "Standard array or numbers on stdin",
    outputFormat: "Expected output result",
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    sampleOutput: "[0, 1]",
  });

  const [showProblemModal, setShowProblemModal] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [problemForm, setProblemForm] = useState({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    inputFormat: "Standard array or string input",
    outputFormat: "Expected output result",
    sampleInput: "nums = [2, 7, 11, 15], target = 9",
    sampleOutput: "[0, 1]",
    testCases: "nums = [2,7,11,15], target = 9 | [0,1]",
    points: 100,
    timeLimitSeconds: 2,
  });

  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    durationMinutes: 20,
    passingScore: 60,
  });
  const [quizQuestions, setQuizQuestions] = useState([
    {
      text: "What is the time complexity of searching in a balanced Binary Search Tree?",
      points: 10,
      options: [
        { text: "O(log N)", isCorrect: true },
        { text: "O(N)", isCorrect: false },
        { text: "O(1)", isCorrect: false },
        { text: "O(N log N)", isCorrect: false },
      ],
    },
  ]);

  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    companyName: "",
    location: "Bengaluru, India (Hybrid)",
    salaryRange: "₹18,00,000 - ₹26,00,000",
    jobType: "FULL_TIME",
    description: "Seeking high-caliber problem solver with DSA and systems expertise.",
    eligibilityCriteria: "B.Tech CSE/IT/ECE with 7.0+ CGPA",
    deadline: "",
  });

  // Applicants Review Drawer/Modal
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState(null);
  const [applicantsList, setApplicantsList] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [updatingApplicantId, setUpdatingApplicantId] = useState(null);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      loadAllAdminData();
    }
  }, [isAuthenticated, isAdmin]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      setActionError("");

      const [
        contestsRes,
        problemsRes,
        quizzesRes,
        jobsRes,
        flaggedRes,
        flagsRes,
        suspiciousRes,
        peersRes,
      ] = await Promise.allSettled([
        contestsApi.getAll(0, 50),
        problemsApi.getProblemSet({ page: 0, size: 50 }),
        quizzesApi.getAll(0, 50),
        jobsApi.getAll(),
        adminApi.getFlaggedSubmissions(),
        adminApi.getReviewFlags(),
        adminApi.getSuspiciousUsers(),
        adminApi.getUsers(),
      ]);

      if (contestsRes.status === "fulfilled") {
        setContests(Array.isArray(contestsRes.value) ? contestsRes.value : contestsRes.value?.content || []);
      }
      if (problemsRes.status === "fulfilled") {
        setProblems(Array.isArray(problemsRes.value?.content) ? problemsRes.value.content : []);
      }
      if (quizzesRes.status === "fulfilled") {
        setQuizzes(Array.isArray(quizzesRes.value) ? quizzesRes.value : quizzesRes.value?.content || []);
      }
      if (jobsRes.status === "fulfilled") {
        setJobs(Array.isArray(jobsRes.value) ? jobsRes.value : []);
      }
      if (flaggedRes.status === "fulfilled") {
        setFlaggedSubmissions(Array.isArray(flaggedRes.value) ? flaggedRes.value : []);
      }
      if (flagsRes.status === "fulfilled") {
        setReviewFlags(Array.isArray(flagsRes.value) ? flagsRes.value : []);
      }
      if (suspiciousRes.status === "fulfilled") {
        setSuspiciousUsers(Array.isArray(suspiciousRes.value) ? suspiciousRes.value : []);
      }
      if (peersRes.status === "fulfilled") {
        setUsersList(Array.isArray(peersRes.value) ? peersRes.value : []);
      }
    } catch (err) {
      console.warn("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(""), 4500);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(""), 4500);
    }
  };

  // ----------------------------------------------------
  // CONTEST ACTIONS
  // ----------------------------------------------------
  const handleOpenContestModal = (contestToEdit = null) => {
    if (contestToEdit) {
      setEditingContestId(contestToEdit.id);
      setContestForm({
        title: contestToEdit.title || "",
        description: contestToEdit.description || "",
        startTime: contestToEdit.startTime ? contestToEdit.startTime.slice(0, 16) : "",
        endTime: contestToEdit.endTime ? contestToEdit.endTime.slice(0, 16) : "",
        durationMinutes: contestToEdit.durationMinutes || 120,
      });
    } else {
      setEditingContestId(null);
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 3600000);
      const inTwoDays = new Date(now.getTime() + 172800000);
      setContestForm({
        title: "",
        description: "",
        startTime: inOneHour.toISOString().slice(0, 16),
        endTime: inTwoDays.toISOString().slice(0, 16),
        durationMinutes: 120,
      });
    }
    setShowContestModal(true);
  };

  const handleSaveContest = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const startTimeIso = contestForm.startTime
        ? new Date(contestForm.startTime).toISOString()
        : new Date(Date.now() + 3600000).toISOString();
      const endTimeIso = contestForm.endTime
        ? new Date(contestForm.endTime).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const payload = {
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        startTime: startTimeIso,
        endTime: endTimeIso,
        durationMinutes: Number(contestForm.durationMinutes) || 120,
      };

      if (editingContestId) {
        await adminApi.updateContest(editingContestId, payload);
        showNotification("Contest updated successfully!");
      } else {
        await adminApi.createContest(payload);
        showNotification("Contest scheduled successfully!");
      }

      setShowContestModal(false);
      setEditingContestId(null);
      loadAllAdminData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save contest", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contest?")) return;
    try {
      await adminApi.deleteContest(id);
      showNotification("Contest deleted.");
      setContests((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      showNotification("Could not delete contest.", true);
    }
  };

  // Add problem to contest
  const handleOpenAddContestProblem = (contest) => {
    setSelectedContestForProblem(contest);
    setContestProblemForm({
      title: "",
      description: "",
      difficulty: "MEDIUM",
      points: 100,
      timeLimit: 2,
      memoryLimit: 256,
      inputFormat: "Standard array or numbers on stdin",
      outputFormat: "Expected output result",
      sampleInput: "nums = [2, 7, 11, 15], target = 9",
      sampleOutput: "[0, 1]",
    });
    setShowAddContestProblemModal(true);
  };

  const handleSaveContestProblem = async (e) => {
    e.preventDefault();
    if (!selectedContestForProblem) return;
    try {
      setLoading(true);
      await adminApi.addProblemToContest(selectedContestForProblem.id, {
        title: contestProblemForm.title.trim(),
        description: contestProblemForm.description.trim(),
        difficulty: contestProblemForm.difficulty.toUpperCase(),
        points: Number(contestProblemForm.points) || 100,
        timeLimit: Number(contestProblemForm.timeLimit) || 2,
        memoryLimit: Number(contestProblemForm.memoryLimit) || 256,
        inputFormat: contestProblemForm.inputFormat.trim(),
        outputFormat: contestProblemForm.outputFormat.trim(),
        sampleInput: contestProblemForm.sampleInput.trim(),
        sampleOutput: contestProblemForm.sampleOutput.trim(),
      });
      showNotification(`Problem added to contest "${selectedContestForProblem.title}"!`);
      setShowAddContestProblemModal(false);
      loadAllAdminData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to add problem to contest", true);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // PROBLEM BANK ACTIONS
  // ----------------------------------------------------
  const handleOpenProblemModal = (problemToEdit = null) => {
    if (problemToEdit) {
      setEditingProblemId(problemToEdit.id);
      setProblemForm({
        title: problemToEdit.title || "",
        description: problemToEdit.description || "",
        difficulty: problemToEdit.difficulty || "MEDIUM",
        inputFormat: problemToEdit.inputFormat || "Standard input",
        outputFormat: problemToEdit.outputFormat || "Expected output",
        sampleInput: problemToEdit.sampleInput || "",
        sampleOutput: problemToEdit.sampleOutput || "",
        testCases: problemToEdit.testCases || `${problemToEdit.sampleInput || ""} | ${problemToEdit.sampleOutput || ""}`,
        points: problemToEdit.points || 100,
        timeLimitSeconds: problemToEdit.timeLimitSeconds || 2,
      });
    } else {
      setEditingProblemId(null);
      setProblemForm({
        title: "",
        description: "",
        difficulty: "MEDIUM",
        inputFormat: "Standard array or string input",
        outputFormat: "Expected output result",
        sampleInput: "nums = [2, 7, 11, 15], target = 9",
        sampleOutput: "[0, 1]",
        testCases: "nums = [2,7,11,15], target = 9 | [0,1]",
        points: 100,
        timeLimitSeconds: 2,
      });
    }
    setShowProblemModal(true);
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        title: problemForm.title.trim(),
        description: problemForm.description.trim(),
        difficulty: problemForm.difficulty.toUpperCase(),
        inputFormat: problemForm.inputFormat.trim(),
        outputFormat: problemForm.outputFormat.trim(),
        sampleInput: problemForm.sampleInput.trim(),
        sampleOutput: problemForm.sampleOutput.trim(),
        testCases: problemForm.testCases.trim(),
        points: Number(problemForm.points) || 100,
        timeLimitSeconds: Number(problemForm.timeLimitSeconds) || 2,
      };

      if (editingProblemId) {
        await adminApi.updateProblem(editingProblemId, payload);
        showNotification("Problem updated in problem bank!");
      } else {
        await adminApi.createProblem(payload);
        showNotification("Problem successfully added to problem bank!");
      }

      setShowProblemModal(false);
      setEditingProblemId(null);
      loadAllAdminData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to save problem", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProblem = async (id) => {
    if (!window.confirm("Delete this problem from the problem bank?")) return;
    try {
      await adminApi.deleteProblem(id);
      showNotification("Problem deleted.");
      setProblems((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      showNotification("Failed to delete problem.", true);
    }
  };

  // ----------------------------------------------------
  // QUIZ ACTIONS (WITH QUESTIONS BUILDER)
  // ----------------------------------------------------
  const handleOpenQuizModal = () => {
    const now = new Date();
    const inOneDay = new Date(now.getTime() + 86400000);
    setQuizForm({
      title: "",
      description: "",
      startTime: now.toISOString().slice(0, 16),
      endTime: inOneDay.toISOString().slice(0, 16),
      durationMinutes: 20,
      passingScore: 60,
    });
    setQuizQuestions([
      {
        text: "What is the amortized time complexity of inserting into a Dynamic Array (std::vector or ArrayList)?",
        points: 10,
        options: [
          { text: "O(1)", isCorrect: true },
          { text: "O(N)", isCorrect: false },
          { text: "O(log N)", isCorrect: false },
          { text: "O(N^2)", isCorrect: false },
        ],
      },
    ]);
    setShowQuizModal(true);
  };

  const handleAddQuestionToQuiz = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        text: "",
        points: 10,
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, text } : q))
    );
  };

  const handleOptionChange = (qIdx, optIdx, text) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oi) =>
          oi === optIdx ? { ...opt, text } : opt
        );
        return { ...q, options: newOptions };
      })
    );
  };

  const handleMarkCorrectOption = (qIdx, optIdx) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const newOptions = q.options.map((opt, oi) => ({
          ...opt,
          isCorrect: oi === optIdx,
        }));
        return { ...q, options: newOptions };
      })
    );
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const startTimeIso = quizForm.startTime
        ? new Date(quizForm.startTime).toISOString()
        : new Date().toISOString();
      const endTimeIso = quizForm.endTime
        ? new Date(quizForm.endTime).toISOString()
        : new Date(Date.now() + 86400000).toISOString();

      const formattedQuestions = quizQuestions
        .filter((q) => q.text.trim())
        .map((q) => ({
          text: q.text.trim(),
          points: Number(q.points) || 10,
          options: q.options.map((opt) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
        }));

      await adminApi.createQuiz({
        title: quizForm.title.trim(),
        description: quizForm.description.trim(),
        startTime: startTimeIso,
        endTime: endTimeIso,
        durationMinutes: Number(quizForm.durationMinutes) || 20,
        passingScore: Number(quizForm.passingScore) || 60,
        questions: formattedQuestions.length > 0 ? formattedQuestions : undefined,
      });

      showNotification("Quiz created with questions!");
      setShowQuizModal(false);
      loadAllAdminData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to create quiz", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm("Delete this quiz?")) return;
    try {
      await adminApi.deleteQuiz(id);
      showNotification("Quiz deleted.");
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      showNotification("Failed to delete quiz.", true);
    }
  };

  // ----------------------------------------------------
  // JOB PLACEMENT ACTIONS & APPLICANTS REVIEW
  // ----------------------------------------------------
  const handleOpenJobModal = (jobToEdit = null) => {
    if (jobToEdit) {
      setEditingJobId(jobToEdit.id);
      setJobForm({
        title: jobToEdit.title || "",
        companyName: jobToEdit.companyName || "",
        location: jobToEdit.location || "Bengaluru, India (Hybrid)",
        salaryRange: jobToEdit.salaryRange || "₹18,00,000 - ₹26,00,000",
        jobType: jobToEdit.jobType || "FULL_TIME",
        description: jobToEdit.description || "",
        eligibilityCriteria: jobToEdit.eligibilityCriteria || "",
        deadline: jobToEdit.deadline ? jobToEdit.deadline.slice(0, 16) : "",
      });
    } else {
      setEditingJobId(null);
      const inTwoWeeks = new Date(Date.now() + 14 * 86400000);
      setJobForm({
        title: "",
        companyName: "",
        location: "Bengaluru, India (Hybrid)",
        salaryRange: "₹18,00,000 - ₹26,00,000",
        jobType: "FULL_TIME",
        description: "Seeking high-caliber problem solver with DSA expertise.",
        eligibilityCriteria: "B.Tech CSE/IT/ECE with 7.0+ CGPA",
        deadline: inTwoWeeks.toISOString().slice(0, 16),
      });
    }
    setShowJobModal(true);
  };

  const handleSaveJob = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const deadlineIso = jobForm.deadline
        ? new Date(jobForm.deadline).toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString();

      const payload = {
        title: jobForm.title.trim(),
        companyName: jobForm.companyName.trim(),
        location: jobForm.location.trim(),
        salaryRange: jobForm.salaryRange.trim(),
        jobType: jobForm.jobType,
        description: jobForm.description.trim(),
        eligibilityCriteria: jobForm.eligibilityCriteria.trim(),
        deadline: deadlineIso,
      };

      if (editingJobId) {
        await adminApi.updateJob(editingJobId, payload);
        showNotification("Career opening updated!");
      } else {
        await adminApi.createJob(payload);
        showNotification("Placement opportunity published!");
      }

      setShowJobModal(false);
      setEditingJobId(null);
      loadAllAdminData();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to publish drive", true);
    } finally {
      setLoading(false);
    }
  };

  // View Applicants for a Job
  const handleOpenApplicantsModal = async (job) => {
    setSelectedJobForApplicants(job);
    setShowApplicantsModal(true);
    setLoadingApplicants(true);
    try {
      const data = await adminApi.getJobApplications(job.id);
      setApplicantsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not fetch applicants:", err);
      setApplicantsList([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleUpdateApplicantStatus = async (appId, newStatus) => {
    try {
      setUpdatingApplicantId(appId);
      await adminApi.updateApplicationStatus(appId, newStatus, `Updated by Admin on ${new Date().toLocaleDateString()}`);
      showNotification(`Application #${appId} set to ${newStatus}.`);
      setApplicantsList((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      showNotification("Failed to update candidate status", true);
    } finally {
      setUpdatingApplicantId(null);
    }
  };

  // ----------------------------------------------------
  // INTEGRITY & ANTI-CHEAT ACTIONS
  // ----------------------------------------------------
  const handleReviewFlaggedSubmission = async (id, action) => {
    try {
      await adminApi.reviewFlaggedSubmission(id, action);
      showNotification(`Submission #${id} marked as ${action}.`);
      setFlaggedSubmissions((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: action } : f))
      );
    } catch (err) {
      showNotification("Could not review flagged submission", true);
    }
  };

  const handleResolveReviewFlag = async (id) => {
    try {
      await adminApi.resolveReviewFlag(id);
      showNotification(`Flag #${id} resolved.`);
      setReviewFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "RESOLVED" } : f))
      );
    } catch (err) {
      showNotification("Could not resolve flag", true);
    }
  };

  const handleDismissReviewFlag = async (id) => {
    try {
      await adminApi.dismissReviewFlag(id);
      showNotification(`Flag #${id} dismissed.`);
      setReviewFlags((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "DISMISSED" } : f))
      );
    } catch (err) {
      showNotification("Could not dismiss flag", true);
    }
  };

  const handleInvestigateUser = async (userId) => {
    try {
      await adminApi.investigateUser(userId);
      showNotification(`User #${userId} flagged for formal investigation.`);
      setSuspiciousUsers((prev) =>
        prev.map((s) => (s.userId === userId ? { ...s, status: "INVESTIGATING" } : s))
      );
    } catch (err) {
      showNotification("Could not initiate investigation", true);
    }
  };

  // ----------------------------------------------------
  // USER ROLE MANAGEMENT (Strictly USER and ADMIN)
  // ----------------------------------------------------
  const handleToggleUserRole = async (targetUser) => {
    const newRole = targetUser.role === "ADMIN" ? "USER" : "ADMIN";
    if (!window.confirm(`Change ${targetUser.name || targetUser.email}'s role to ${newRole}?`)) {
      return;
    }

    try {
      await adminApi.updateUserRole(targetUser.id, newRole);
      showNotification(`Role updated to ${newRole}.`);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update role", true);
    }
  };

  // Unauthorized view
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#0c0f0a] flex flex-col items-center justify-center p-6 text-center">
        <Lock className="h-16 w-16 text-amber-500 mb-3" />
        <h2 className="text-2xl font-black text-white">Admin Privileges Required</h2>
        <p className="text-xs text-[#aab1a1] max-w-md mt-2 mb-6">
          You must be logged in as an <strong className="text-white">ADMIN</strong> account to access the Knightzone management console.
        </p>
        <Link
          to="/dashboard"
          className="rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Filtered problems list
  const filteredProblems = problems.filter((p) => {
    const matchesSearch = (p.title || "").toLowerCase().includes(problemSearchQuery.toLowerCase());
    const matchesDiff = problemDiffFilter === "ALL" || (p.difficulty || "").toUpperCase() === problemDiffFilter;
    return matchesSearch && matchesDiff;
  });

  // Filtered users list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (u.college || "").toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || (u.role || "USER").toUpperCase() === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-[#f1f2ec] pb-16">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden border-b border-white/10 bg-[#121610] py-8 px-6 sm:px-10">
        <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none">
          <KnightCrest className="w-80 h-80" glow={false} />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-purple-300 mb-2">
                <ShieldCheck size={14} />
                KNIGHT ADMIN PORTAL
              </div>
              <h1 className="text-3xl font-black text-white">
                Platform Control Center
              </h1>
              <p className="text-xs text-[#aab1a1] mt-1">
                Unified administration for contests, problem repository, career drives, anti-cheat, and user security.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadAllAdminData}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-white/10 transition"
              >
                <RefreshCw size={14} className={loading ? "animate-spin text-[#c5ff55]" : "text-[#c5ff55]"} />
                Sync Data
              </button>
            </div>
          </div>

          {/* Feedback alerts */}
          {actionSuccess && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} />
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs font-bold text-rose-400">
              <AlertTriangle size={16} />
              {actionError}
            </div>
          )}

          {/* TAB BUTTONS */}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-b border-white/10">
            {[
              { id: "overview", label: "Overview", icon: Layers },
              { id: "contests", label: `Contests (${contests.length})`, icon: Trophy },
              { id: "problems", label: `Problem Bank (${problems.length})`, icon: Code2 },
              { id: "quizzes", label: `Quizzes (${quizzes.length})`, icon: HelpCircle },
              { id: "jobs", label: `Career Drives (${jobs.length})`, icon: Briefcase },
              { id: "integrity", label: `Anti-Cheat (${flaggedSubmissions.length + reviewFlags.length})`, icon: ShieldAlert },
              { id: "users", label: `Users (${usersList.length})`, icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-bold transition border-b-2 ${
                    activeTab === tab.id
                      ? "border-[#c5ff55] text-[#c5ff55]"
                      : "border-transparent text-[#788874] hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="max-w-6xl mx-auto px-6 sm:px-10 mt-8">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "Active Contests", val: contests.length, icon: Trophy, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                { label: "DSA Problems", val: problems.length, icon: Code2, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" },
                { label: "Quizzes", val: quizzes.length, icon: HelpCircle, color: "text-[#c5ff55] bg-[#c5ff55]/10 border-[#c5ff55]/20" },
                { label: "Job Drives", val: jobs.length, icon: Briefcase, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
                { label: "Flagged Codes", val: flaggedSubmissions.length, icon: ShieldAlert, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                { label: "Registered Knights", val: usersList.length, icon: Users, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="rounded-2xl border border-white/10 bg-[#161a14] p-4 shadow-sm">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${stat.color} mb-3`}>
                      <Icon size={18} />
                    </div>
                    <div className="text-2xl font-black text-white">{stat.val}</div>
                    <div className="text-[11px] font-bold text-[#788874] mt-0.5">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
              <h3 className="text-base font-black text-white mb-2">Admin Quick Launcher</h3>
              <p className="text-xs text-[#aab1a1] mb-6">Directly dispatch new entities into the platform.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => handleOpenContestModal()}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-[#c5ff55]/50 hover:bg-white/10 transition"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Host Contest</h4>
                    <p className="text-[10px] text-[#788874]">Create new live battle</p>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenProblemModal()}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-[#c5ff55]/50 hover:bg-white/10 transition"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Add DSA Problem</h4>
                    <p className="text-[10px] text-[#788874]">With custom test cases</p>
                  </div>
                </button>

                <button
                  onClick={handleOpenQuizModal}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-[#c5ff55]/50 hover:bg-white/10 transition"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55]">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Build Timed Quiz</h4>
                    <p className="text-[10px] text-[#788874]">Interactive MCQs</p>
                  </div>
                </button>

                <button
                  onClick={() => handleOpenJobModal()}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:border-[#c5ff55]/50 hover:bg-white/10 transition"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Post Tech Drive</h4>
                    <p className="text-[10px] text-[#788874]">Placement opportunities</p>
                  </div>
                </button>
              </div>
            </div>

            {/* System Status & Rules Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#c5ff55]" />
                  Role Model Enforcement
                </h3>
                <p className="text-xs text-[#aab1a1] leading-relaxed mb-4">
                  The platform strictly operates on a two-tier authority system:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                    <span className="font-bold text-white">ROLE_USER</span>
                    <span className="text-[10px] text-[#788874]">Student & Competitor permissions</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
                    <span className="font-bold text-purple-300">ROLE_ADMIN</span>
                    <span className="text-[10px] text-purple-400">Full administrative authority</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-sm">
                <h3 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  Real-time Anti-Cheat Surveillance
                </h3>
                <p className="text-xs text-[#aab1a1] leading-relaxed mb-3">
                  Integrity monitors flag suspicious multi-accounting, duplicate syntax trees, and keystroke burst rates.
                </p>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-bold px-3 py-1">
                    {flaggedSubmissions.length} Flagged
                  </span>
                  <span className="rounded-full bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1">
                    {suspiciousUsers.length} Suspicious
                  </span>
                  <button
                    onClick={() => setActiveTab("integrity")}
                    className="ml-auto text-xs font-bold text-[#c5ff55] hover:text-[#d5ff83] flex items-center gap-1"
                  >
                    Open Console <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CONTESTS */}
        {/* ========================================================= */}
        {activeTab === "contests" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Contest Schedule & Management</h3>
                <p className="text-xs text-[#aab1a1]">Schedule live tournaments, edit parameters, and assign DSA problems.</p>
              </div>
              <button
                onClick={() => handleOpenContestModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Plus size={14} />
                Schedule Contest
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contests.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded-md bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#aab1a1]">
                          #{c.id}
                        </span>
                        <h4 className="font-bold text-white text-base mt-1">{c.title}</h4>
                      </div>
                      <span className="rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">
                        {c.durationMinutes || 120} mins
                      </span>
                    </div>

                    <p className="text-xs text-[#aab1a1] mt-2 line-clamp-2">{c.description || "No description provided."}</p>

                    <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] text-[#788874]">
                      <div>
                        <span className="font-bold block text-white/70">Start:</span>
                        {c.startTime ? new Date(c.startTime).toLocaleString() : "TBD"}
                      </div>
                      <div>
                        <span className="font-bold block text-white/70">End:</span>
                        {c.endTime ? new Date(c.endTime).toLocaleString() : "TBD"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenAddContestProblem(c)}
                      className="inline-flex items-center gap-1 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-500/30 px-3 py-1.5 text-xs font-bold hover:bg-purple-900/50 transition"
                    >
                      <Plus size={12} />
                      Attach Problem
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/contests/${c.id}`}
                        className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
                      >
                        Preview
                      </Link>
                      <button
                        onClick={() => handleOpenContestModal(c)}
                        className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                        title="Edit Contest"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteContest(c.id)}
                        className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2 text-rose-400 hover:bg-rose-900/40 transition"
                        title="Delete Contest"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PROBLEMS */}
        {/* ========================================================= */}
        {activeTab === "problems" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">DSA Problem Bank</h3>
                <p className="text-xs text-[#aab1a1]">Manage coding challenges with custom test cases, point values, and time constraints.</p>
              </div>
              <button
                onClick={() => handleOpenProblemModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Plus size={14} />
                Add Problem
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#161a14] p-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788874]" />
                <input
                  type="text"
                  placeholder="Search problem title..."
                  value={problemSearchQuery}
                  onChange={(e) => setProblemSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/50 pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1 w-full sm:w-auto">
                {["ALL", "EASY", "MEDIUM", "HARD"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setProblemDiffFilter(diff)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      problemDiffFilter === diff
                        ? "bg-[#c5ff55] text-[#14170f]"
                        : "bg-white/5 border border-white/10 text-[#aab1a1] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Problem Title</th>
                    <th className="p-3.5">Difficulty</th>
                    <th className="p-3.5">Points</th>
                    <th className="p-3.5">Time Limit</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProblems.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#788874]">#{p.id}</td>
                      <td className="p-3.5 font-bold text-white">
                        <Link to={`/problems/${p.id}`} className="text-inherit hover:text-[#c5ff55] transition-colors">
                          {p.title}
                        </Link>
                      </td>
                      <td className="p-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          p.difficulty === "HARD"
                            ? "bg-rose-950/50 border-rose-500/30 text-rose-300"
                            : p.difficulty === "EASY"
                            ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                            : "bg-amber-950/50 border-amber-500/30 text-amber-300"
                        }`}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[#aab1a1]">{p.points || 100} pts</td>
                      <td className="p-3.5 font-mono text-[#aab1a1]">{p.timeLimitSeconds || 2}s</td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenProblemModal(p)}
                          className="rounded-lg p-1.5 text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                          title="Edit Problem"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteProblem(p.id)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-950/40 transition"
                          title="Delete Problem"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: QUIZZES */}
        {/* ========================================================= */}
        {activeTab === "quizzes" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Technical Assessment Quizzes</h3>
                <p className="text-xs text-[#aab1a1]">Construct timed multiple choice assessments with live answer verification.</p>
              </div>
              <button
                onClick={handleOpenQuizModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Plus size={14} />
                Build Quiz
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <div key={q.id} className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#aab1a1]">
                        Quiz #{q.id}
                      </span>
                      <span className="rounded-full bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        {q.durationMinutes}m duration
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-base mt-2">{q.title}</h4>
                    <p className="text-xs text-[#aab1a1] mt-1 line-clamp-2">{q.description || "General engineering assessment."}</p>
                    <div className="mt-3 flex items-center gap-3 text-[11px] font-mono text-[#788874]">
                      <span>Pass Score: {q.passingScore || 60}%</span>
                      {q.questions && <span>• {q.questions.length} questions attached</span>}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                    <Link
                      to={`/quizzes/${q.id}`}
                      className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      Preview Quiz
                    </Link>
                    <button
                      onClick={() => handleDeleteQuiz(q.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2 text-rose-400 hover:bg-rose-900/40 transition"
                      title="Delete Quiz"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CAREER DRIVES & APPLICANTS */}
        {/* ========================================================= */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-white">Placement Drives & Candidate Review</h3>
                <p className="text-xs text-[#aab1a1]">Post campus opportunities and review/shortlist candidate applications.</p>
              </div>
              <button
                onClick={() => handleOpenJobModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
              >
                <Plus size={14} />
                Post Career Drive
              </button>
            </div>

            <div className="space-y-4">
              {jobs.map((j) => (
                <div key={j.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-base">{j.title}</h4>
                      <span className="rounded-md bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                        {j.companyName}
                      </span>
                    </div>
                    <p className="text-xs text-[#aab1a1]">{j.location} • <strong className="text-[#c5ff55]">{j.salaryRange}</strong></p>
                    <p className="text-[11px] text-[#788874]">Eligibility: {j.eligibilityCriteria}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenApplicantsModal(j)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] transition shadow-md shadow-[#c5ff55]/20"
                    >
                      <Users size={13} />
                      Review Applicants
                    </button>
                    <button
                      onClick={() => handleOpenJobModal(j)}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                      title="Edit Opening"
                    >
                      <Edit3 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ANTI-CHEAT & INTEGRITY */}
        {/* ========================================================= */}
        {activeTab === "integrity" && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-400" />
                Anti-Cheat & Code Similarity Console
              </h3>
              <p className="text-xs text-[#aab1a1]">
                Audit automated flags triggered by rapid clipboard paste, source token plagiarism, or abnormal submission bursts.
              </p>
            </div>

            {/* SECTION 1: Flagged Submissions */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#788874]">
                Flagged Submissions Queue ({flaggedSubmissions.length})
              </h4>
              <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                    <tr>
                      <th className="p-3.5">Sub ID</th>
                      <th className="p-3.5">Knight</th>
                      <th className="p-3.5">Reason</th>
                      <th className="p-3.5">Severity</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {flaggedSubmissions.map((flag) => (
                      <tr key={flag.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-3.5 font-mono text-[#788874]">#{flag.submissionId || flag.id}</td>
                        <td className="p-3.5 font-bold text-white">{flag.username || `User #${flag.userId}`}</td>
                        <td className="p-3.5 text-rose-400 font-semibold">{flag.reason}</td>
                        <td className="p-3.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            flag.severity === "HIGH" ? "bg-rose-950/50 border-rose-500/30 text-rose-300" : "bg-amber-950/50 border-amber-500/30 text-amber-300"
                          }`}>
                            {flag.severity}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[#aab1a1]">{flag.status}</td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => handleReviewFlaggedSubmission(flag.id, "REVIEWED")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleReviewFlaggedSubmission(flag.id, "DISMISS")}
                            className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
                          >
                            Dismiss
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: Code Review Flags */}
            {reviewFlags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#788874]">
                  Similarity Review Flags ({reviewFlags.length})
                </h4>
                <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                      <tr>
                        <th className="p-3.5">Flag ID</th>
                        <th className="p-3.5">Description</th>
                        <th className="p-3.5">Similarity %</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {reviewFlags.map((rf) => (
                        <tr key={rf.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-3.5 font-mono text-[#788874]">#{rf.id}</td>
                          <td className="p-3.5 font-medium text-[#aab1a1]">{rf.note || "Token match alert"}</td>
                          <td className="p-3.5 font-mono font-bold text-rose-400">{rf.similarity || 85}%</td>
                          <td className="p-3.5 font-mono text-[#aab1a1]">{rf.status}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleResolveReviewFlag(rf.id)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleDismissReviewFlag(rf.id)}
                              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
                            >
                              Dismiss
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 3: Suspicious Users */}
            {suspiciousUsers.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#788874]">
                  Suspicious Account Watchlist ({suspiciousUsers.length})
                </h4>
                <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                      <tr>
                        <th className="p-3.5">User ID</th>
                        <th className="p-3.5">Username</th>
                        <th className="p-3.5">Reason</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Investigate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {suspiciousUsers.map((su) => (
                        <tr key={su.userId} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-3.5 font-mono text-[#788874]">#{su.userId}</td>
                          <td className="p-3.5 font-bold text-white">{su.username}</td>
                          <td className="p-3.5 text-amber-400 font-semibold">{su.reason || "Suspicious behavior"}</td>
                          <td className="p-3.5 font-mono text-[#aab1a1]">{su.status}</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleInvestigateUser(su.userId)}
                              disabled={su.status === "INVESTIGATING"}
                              className="rounded-lg bg-rose-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition"
                            >
                              {su.status === "INVESTIGATING" ? "Investigating..." : "Launch Audit"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: USERS & ROLE MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white">Knight Directory & Security Roles</h3>
                <p className="text-xs text-[#aab1a1]">Manage user roles. Strictly adhering to <strong>USER</strong> and <strong>ADMIN</strong> authority.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#788874]" />
                  <input
                    type="text"
                    placeholder="Filter by name, email, college..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/50 pl-8 pr-3 py-1.5 text-xs font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1">
                  {["ALL", "USER", "ADMIN"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserRoleFilter(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        userRoleFilter === r
                          ? "bg-[#c5ff55] text-[#14170f]"
                          : "bg-white/5 border border-white/10 text-[#aab1a1] hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#161a14] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-black/40 font-bold uppercase tracking-wider text-[#788874]">
                  <tr>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">College</th>
                    <th className="p-3.5">Rating</th>
                    <th className="p-3.5">Current Role</th>
                    <th className="p-3.5 text-right">Switch Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((usr) => (
                    <tr key={usr.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="p-3.5 font-bold text-white">{usr.name || usr.username}</td>
                      <td className="p-3.5 text-[#aab1a1]">{usr.email}</td>
                      <td className="p-3.5 text-[#aab1a1]">{usr.college || "Independent"}</td>
                      <td className="p-3.5 font-mono font-bold text-[#c5ff55]">{usr.rating || 1000}</td>
                      <td className="p-3.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          usr.role === "ADMIN" ? "bg-purple-950/50 border-purple-500/30 text-purple-300" : "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                        }`}>
                          {usr.role || "USER"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleUserRole(usr)}
                          className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition ${
                            usr.role === "ADMIN"
                              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                              : "border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50"
                          }`}
                        >
                          Make {usr.role === "ADMIN" ? "USER" : "ADMIN"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CONTEST (CREATE & EDIT) */}
      {/* ========================================================= */}
      {showContestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl">
            <h3 className="text-lg font-black text-white mb-4">
              {editingContestId ? "Edit Contest Parameters" : "Schedule New Coding Tournament"}
            </h3>
            <form onSubmit={handleSaveContest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">Contest Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Grandmaster Challenge 48"
                  value={contestForm.title}
                  onChange={(e) => setContestForm({ ...contestForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the contest rules and topics..."
                  value={contestForm.description}
                  onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min={15}
                    max={600}
                    value={contestForm.durationMinutes}
                    onChange={(e) => setContestForm({ ...contestForm, durationMinutes: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={contestForm.startTime}
                    onChange={(e) => setContestForm({ ...contestForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={contestForm.endTime}
                    onChange={(e) => setContestForm({ ...contestForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowContestModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !contestForm.title.trim()}
                  className="rounded-xl bg-[#c5ff55] px-5 py-2 font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  {editingContestId ? "Save Changes" : "Publish Contest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADD PROBLEM TO CONTEST */}
      {/* ========================================================= */}
      {showAddContestProblemModal && selectedContestForProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl my-8">
            <h3 className="text-lg font-black text-white mb-1">
              Add Problem to Contest: {selectedContestForProblem.title}
            </h3>
            <p className="text-xs text-[#aab1a1] mb-4">Attach a specialized coding problem for this tournament.</p>

            <form onSubmit={handleSaveContestProblem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Knight's Minimum Chess Moves"
                  value={contestProblemForm.title}
                  onChange={(e) => setContestProblemForm({ ...contestProblemForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Difficulty</label>
                  <select
                    value={contestProblemForm.difficulty}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  >
                    <option value="EASY" className="bg-[#161a14] text-white">EASY</option>
                    <option value="MEDIUM" className="bg-[#161a14] text-white">MEDIUM</option>
                    <option value="HARD" className="bg-[#161a14] text-white">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Points</label>
                  <input
                    type="number"
                    value={contestProblemForm.points}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, points: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Time (s)</label>
                  <input
                    type="number"
                    value={contestProblemForm.timeLimit}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, timeLimit: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Mem (MB)</label>
                  <input
                    type="number"
                    value={contestProblemForm.memoryLimit}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, memoryLimit: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-white mb-1">Problem Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the problem premise..."
                  value={contestProblemForm.description}
                  onChange={(e) => setContestProblemForm({ ...contestProblemForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Sample Input</label>
                  <input
                    type="text"
                    value={contestProblemForm.sampleInput}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, sampleInput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-mono text-[11px] text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Sample Output</label>
                  <input
                    type="text"
                    value={contestProblemForm.sampleOutput}
                    onChange={(e) => setContestProblemForm({ ...contestProblemForm, sampleOutput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-mono text-[11px] text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddContestProblemModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !contestProblemForm.title.trim()}
                  className="rounded-xl bg-[#c5ff55] px-5 py-2 font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  Attach to Contest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: PROBLEM BANK (CREATE & EDIT) */}
      {/* ========================================================= */}
      {showProblemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl my-8">
            <h3 className="text-lg font-black text-white mb-4">
              {editingProblemId ? "Edit Problem Details" : "Add Problem to Global Bank"}
            </h3>
            <form onSubmit={handleSaveProblem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-white mb-1">Problem Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subarray with Given XOR"
                  value={problemForm.title}
                  onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Difficulty</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({ ...problemForm, difficulty: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  >
                    <option value="EASY" className="bg-[#161a14] text-white">EASY</option>
                    <option value="MEDIUM" className="bg-[#161a14] text-white">MEDIUM</option>
                    <option value="HARD" className="bg-[#161a14] text-white">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Points</label>
                  <input
                    type="number"
                    min={50}
                    max={1000}
                    value={problemForm.points}
                    onChange={(e) => setProblemForm({ ...problemForm, points: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Time Limit (s)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={problemForm.timeLimitSeconds}
                    onChange={(e) => setProblemForm({ ...problemForm, timeLimitSeconds: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain problem statement clearly..."
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({ ...problemForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Input Format</label>
                  <input
                    type="text"
                    value={problemForm.inputFormat}
                    onChange={(e) => setProblemForm({ ...problemForm, inputFormat: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Output Format</label>
                  <input
                    type="text"
                    value={problemForm.outputFormat}
                    onChange={(e) => setProblemForm({ ...problemForm, outputFormat: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Sample Input</label>
                  <input
                    type="text"
                    value={problemForm.sampleInput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleInput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium font-mono text-[11px] text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Sample Output</label>
                  <input
                    type="text"
                    value={problemForm.sampleOutput}
                    onChange={(e) => setProblemForm({ ...problemForm, sampleOutput: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium font-mono text-[11px] text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Automated Test Cases</label>
                <input
                  type="text"
                  placeholder="input | output"
                  value={problemForm.testCases}
                  onChange={(e) => setProblemForm({ ...problemForm, testCases: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium font-mono text-[11px] text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProblemModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !problemForm.title.trim()}
                  className="rounded-xl bg-[#c5ff55] px-5 py-2 font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  {editingProblemId ? "Save Changes" : "Save to Problem Bank"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: QUIZ (WITH QUESTIONS BUILDER) */}
      {/* ========================================================= */}
      {showQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl my-8">
            <h3 className="text-lg font-black text-white mb-1">Build Assessment Quiz</h3>
            <p className="text-xs text-[#aab1a1] mb-4">Set quiz guidelines and write multiple choice questions.</p>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Quiz Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. C++ Pointers & Memory Management"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Topics covered..."
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Duration (min)</label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={quizForm.durationMinutes}
                    onChange={(e) => setQuizForm({ ...quizForm, durationMinutes: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Pass Score (%)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    value={quizForm.startTime}
                    onChange={(e) => setQuizForm({ ...quizForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={quizForm.endTime}
                    onChange={(e) => setQuizForm({ ...quizForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>

              {/* QUESTIONS BUILDER */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-white text-xs">Questions ({quizQuestions.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionToQuiz}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#c5ff55]/15 text-[#c5ff55] border border-[#c5ff55]/30 px-2.5 py-1 text-[11px] font-bold hover:bg-[#c5ff55]/25 transition"
                  >
                    <Plus size={12} /> Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {quizQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-2xl border border-white/10 bg-black/30 p-3.5 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-[11px]">Q{qIdx + 1} Question Text</span>
                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-rose-400 hover:text-rose-300 text-[11px] transition"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Which data structure provides LIFO order?"
                        value={q.text}
                        onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-black/50 text-white p-2 font-medium placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                      />

                      {/* Options */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] text-[#788874] font-bold block">Options (Click radio to select correct answer)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-2.5 py-1">
                              <input
                                type="radio"
                                name={`q_${qIdx}_correct`}
                                checked={opt.isCorrect}
                                onChange={() => handleMarkCorrectOption(qIdx, optIdx)}
                                className="accent-[#c5ff55] focus:ring-[#c5ff55]"
                              />
                              <input
                                type="text"
                                placeholder={`Option ${optIdx + 1}`}
                                value={opt.text}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                className="w-full text-xs font-medium border-0 bg-transparent text-white focus:outline-none placeholder-[#5a6b56]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !quizForm.title.trim()}
                  className="rounded-xl bg-[#c5ff55] px-5 py-2 font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: POST / EDIT JOB */}
      {/* ========================================================= */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl my-8">
            <h3 className="text-lg font-black text-white mb-4">
              {editingJobId ? "Edit Career Opportunity" : "Post Placement Drive"}
            </h3>
            <form onSubmit={handleSaveJob} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Job Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer (Backend)"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Atlassian"
                    value={jobForm.companyName}
                    onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-white mb-1">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-white mb-1">Salary / CTC</label>
                  <input
                    type="text"
                    value={jobForm.salaryRange}
                    onChange={(e) => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Eligibility Criteria</label>
                <input
                  type="text"
                  placeholder="e.g. 2026/2027 Batch, CGPA > 7.0"
                  value={jobForm.eligibilityCriteria}
                  onChange={(e) => setJobForm({ ...jobForm, eligibilityCriteria: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Application Deadline</label>
                <input
                  type="datetime-local"
                  value={jobForm.deadline}
                  onChange={(e) => setJobForm({ ...jobForm, deadline: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-white mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 font-medium text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !jobForm.title.trim()}
                  className="rounded-xl bg-[#c5ff55] px-5 py-2 font-black uppercase tracking-wider text-[#14170f] hover:bg-[#d5ff83] disabled:opacity-50 transition shadow-md shadow-[#c5ff55]/20"
                >
                  {editingJobId ? "Save Changes" : "Publish Drive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: APPLICANTS REVIEW DRAWER */}
      {/* ========================================================= */}
      {showApplicantsModal && selectedJobForApplicants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-white/15 bg-[#161a14] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white">
                  Candidates for {selectedJobForApplicants.title}
                </h3>
                <p className="text-xs text-[#aab1a1]">
                  {selectedJobForApplicants.companyName} • {applicantsList.length} total applicant(s)
                </p>
              </div>
              <button
                onClick={() => setShowApplicantsModal(false)}
                className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            {loadingApplicants ? (
              <div className="flex items-center justify-center py-12 text-[#aab1a1]">
                <Loader2 size={24} className="animate-spin mr-2 text-[#c5ff55]" /> Loading candidate records...
              </div>
            ) : applicantsList.length === 0 ? (
              <div className="text-center py-12 text-[#788874] text-xs font-medium">
                No students have applied for this drive yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {applicantsList.map((app) => (
                  <div
                    key={app.id}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {app.studentName || app.student?.name || `Student #${app.studentId || app.id}`}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          app.status === "SELECTED"
                            ? "bg-emerald-950/50 border-emerald-500/30 text-emerald-300"
                            : app.status === "REJECTED"
                            ? "bg-rose-950/50 border-rose-500/30 text-rose-300"
                            : app.status === "SHORTLISTED"
                            ? "bg-blue-950/50 border-blue-500/30 text-blue-300"
                            : "bg-amber-950/50 border-amber-500/30 text-amber-300"
                        }`}>
                          {app.status || "APPLIED"}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#788874] mt-1">
                        Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "Recent"}
                      </p>
                      {app.coverLetter && (
                        <p className="text-[#aab1a1] mt-1 italic text-[11px]">"{app.coverLetter}"</p>
                      )}
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c5ff55] hover:underline mt-1"
                        >
                          <FileText size={12} /> View Resume <ExternalLink size={10} />
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={app.status || "APPLIED"}
                        disabled={updatingApplicantId === app.id}
                        onChange={(e) => handleUpdateApplicantStatus(app.id, e.target.value)}
                        className="rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-xs font-bold text-white focus:border-[#c5ff55] focus:outline-none"
                      >
                        <option value="APPLIED" className="bg-[#161a14] text-white">APPLIED</option>
                        <option value="SHORTLISTED" className="bg-[#161a14] text-white">SHORTLISTED</option>
                        <option value="INTERVIEWING" className="bg-[#161a14] text-white">INTERVIEWING</option>
                        <option value="SELECTED" className="bg-[#161a14] text-white">SELECTED</option>
                        <option value="REJECTED" className="bg-[#161a14] text-white">REJECTED</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
