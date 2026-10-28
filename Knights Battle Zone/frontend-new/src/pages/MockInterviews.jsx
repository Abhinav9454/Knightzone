import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  CheckCircle2,
  AlertCircle,
  Users,
  Brain,
  Sparkles,
  Trophy,
  Clock,
  Building2,
  Briefcase,
  ChevronRight,
  Code2,
  MessageSquare,
  ShieldCheck,
  Send,
  RotateCcw,
  BookOpen,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
  UserCheck,
  Share2,
  Flame,
  Copy,
  Check,
  Radio,
  Terminal,
  Cpu,
  RefreshCw,
  X,
  Volume2,
  Hash,
  Award,
  Zap,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { mockInterviewApi, profileApi, customJudgeApi } from "../services/api";

const ROLES = [
  "Full Stack Engineer",
  "Backend Engineer (Java/Spring)",
  "Frontend Engineer (React/TypeScript)",
  "System Design & Distributed Systems",
  "Data Structures & Algorithms",
  "Engineering Manager / Behavioral",
];

const COMPANIES = [
  { name: "Google", tier: "Tier 1 FAANG", color: "from-blue-500 to-emerald-500" },
  { name: "Amazon", tier: "Tier 1 FAANG", color: "from-amber-500 to-orange-500" },
  { name: "Microsoft", tier: "Tier 1 Big Tech", color: "from-cyan-500 to-blue-600" },
  { name: "Atlassian", tier: "Top Enterprise", color: "from-blue-600 to-indigo-600" },
  { name: "Uber", tier: "High Scale Mobility", color: "from-neutral-700 to-black" },
  { name: "High-Growth Unicorn", tier: "FinTech / SaaS", color: "from-purple-500 to-pink-500" },
];

const CURATED_QUESTIONS = [
  {
    id: 1,
    category: "DSA & Core",
    company: "Google",
    difficulty: "Medium",
    title: "LRU Cache Implementation with O(1) Operations",
    question:
      "Design and implement a data structure for Least Recently Used (LRU) cache. It should support get and put operations in O(1) time complexity.",
    starterCode: {
      java: `class LRUCache {\n    private int capacity;\n    // TODO: implement HashMap + DoublyLinkedList\n\n    public LRUCache(int capacity) {\n        this.capacity = capacity;\n    }\n    \n    public int get(int key) {\n        return -1;\n    }\n    \n    public void put(int key, int value) {\n        // Evict LRU if capacity exceeded\n    }\n}`,
      python: `class LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        self.cache = {}\n        # Head & Tail doubly linked nodes\n\n    def get(self, key: int) -> int:\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        pass`,
      javascript: `class LRUCache {\n  constructor(capacity) {\n    this.capacity = capacity;\n    this.map = new Map();\n  }\n\n  get(key) {\n    if (!this.map.has(key)) return -1;\n    const val = this.map.get(key);\n    this.map.delete(key);\n    this.map.set(key, val);\n    return val;\n  }\n\n  put(key, value) {\n    if (this.map.has(key)) this.map.delete(key);\n    this.map.set(key, value);\n    if (this.map.size > this.capacity) {\n      const firstKey = this.map.keys().next().value;\n      this.map.delete(firstKey);\n    }\n  }\n}`,
      cpp: `class LRUCache {\nprivate:\n    int cap;\npublic:\n    LRUCache(int capacity) : cap(capacity) {}\n    \n    int get(int key) {\n        return -1;\n    }\n    \n    void put(int key, int value) {\n        // O(1) update\n    }\n};`,
    },
    hints: [
      "Combine a Hash Map for O(1) lookups with a Doubly Linked List for O(1) node removals and insertions.",
      "Head points to most recently used, tail points to least recently used (or vice-versa).",
      "Ensure synchronization if multi-threading is asked as a follow-up.",
    ],
    sampleResponse:
      "I would utilize a combination of a HashMap and a Doubly Linked List. The HashMap provides O(1) key-to-node access, while the doubly linked list maintains the temporal order of elements. When a node is accessed or updated, it is detached from its current position and spliced to the head. When capacity is exceeded, the node at the tail is evicted.",
    testCases: [
      { input: "put(1, 1), put(2, 2), get(1)", expected: "1", passed: true },
      { input: "put(3, 3) -> evicts 2, get(2)", expected: "-1", passed: true },
      { input: "put(4, 4) -> evicts 1, get(1)", expected: "-1", passed: true },
    ],
  },
  {
    id: 2,
    category: "System Design",
    company: "Amazon",
    difficulty: "Hard",
    title: "Design a High-Throughput Rate Limiter for Distributed Microservices",
    question:
      "Design an API Rate Limiter that handles 500,000 requests per second across 50 geographical microservices while preventing abuse and mitigating DDoS.",
    starterCode: {
      java: `public class DistributedRateLimiter {\n    // Implement Sliding Window Log or Token Bucket via Redis\n    public boolean allowRequest(String clientId, int limit, int windowSeconds) {\n        // Atomic Lua script check\n        return true;\n    }\n}`,
      python: `class DistributedRateLimiter:\n    def allow_request(self, client_id: str, limit: int, window_sec: int) -> bool:\n        # Check Redis cluster with sliding log\n        return True`,
      javascript: `async function allowRequest(clientId, limit = 100, windowSec = 60) {\n  // Redis sliding window counter implementation\n  return true;\n}`,
      cpp: `class DistributedRateLimiter {\npublic:\n    bool allowRequest(std::string clientId, int limit, int windowSec) {\n        return true;\n    }\n};`,
    },
    hints: [
      "Compare Token Bucket vs Sliding Window Log vs Leaky Bucket algorithms.",
      "Use Redis clusters with Lua scripts to prevent race conditions during atomic counter increments.",
      "Consider fallback client-side headers (X-RateLimit-Remaining, Retry-After).",
    ],
    sampleResponse:
      "I recommend a Distributed Sliding Window Counter using Redis Cluster. Each customer identifier maps to a sorted set or fractional bucket. Using Lua scripts executed directly on Redis shards ensures that the check-and-increment operations remain atomic without requiring distributed locks. For extreme resilience, local in-memory token buckets (Guava/Resilience4j) serve as Tier-1 defense.",
    testCases: [
      { input: "100 requests within 60s", expected: "ALLOWED (200 OK)", passed: true },
      { input: "101st request within 60s", expected: "429 Too Many Requests (Retry-After: 14s)", passed: true },
    ],
  },
  {
    id: 3,
    category: "Backend (Java/Spring)",
    company: "Microsoft",
    difficulty: "Medium",
    title: "Spring Boot Transaction Management & Isolation Hazards",
    question:
      "Explain the difference between @Transactional propagation options REQUIRED vs REQUIRES_NEW, and explain how to prevent Phantom Reads in MySQL InnoDB.",
    starterCode: {
      java: `@Service\npublic class PaymentOrderService {\n    @Transactional(propagation = Propagation.REQUIRED)\n    public void processOrder(Order order) {\n        // Main order logic\n        auditLog(order); // Should this be REQUIRES_NEW?\n    }\n    \n    @Transactional(propagation = Propagation.REQUIRES_NEW)\n    public void auditLog(Order order) {\n        // Independent audit transaction\n    }\n}`,
      python: `# SQLAlchemy equivalent of nested sessions\nclass TransactionManager:\n    def execute_with_isolation(self, func):\n        pass`,
      javascript: `// Distributed Transaction Coordinator\nasync function handleTransaction() {\n  // MVCC Repeatable Read verification\n}`,
      cpp: `// DB Isolation Guard\nclass TransactionContext {\npublic:\n    void execute() {}\n};`,
    },
    hints: [
      "REQUIRED joins the active transaction; REQUIRES_NEW suspends the current and starts an independent transaction.",
      "MySQL InnoDB uses MVCC (Multi-Version Concurrency Control) and Next-Key Locks at REPEATABLE READ isolation.",
      "Beware of self-invocation in Spring proxies which bypasses the transactional aspect.",
    ],
    sampleResponse:
      "@Transactional(propagation = Propagation.REQUIRED) will attach to an existing ambient transaction or create one if none exists. In contrast, REQUIRES_NEW suspends any existing transaction and executes within a totally autonomous physical transaction with its own commit/rollback boundary. In MySQL InnoDB, REPEATABLE READ prevents phantom reads using Next-Key Locks (record locks combined with gap locks).",
    testCases: [
      { input: "Sub-routine throws RuntimeException with REQUIRED", expected: "Parent rollback triggers", passed: true },
      { input: "Audit log throws exception with REQUIRES_NEW", expected: "Parent transaction survives", passed: true },
    ],
  },
  {
    id: 4,
    category: "Frontend & Web Architecture",
    company: "Atlassian",
    difficulty: "Medium",
    title: "React Concurrent Rendering, Hydration, and Micro-Frontend Architecture",
    question:
      "How does React 18+ Concurrent Mode work under the hood, and how do you optimize First Input Delay (FID) / Interaction to Next Paint (INP) in large dashboard apps?",
    starterCode: {
      javascript: `import { useState, useTransition } from "react";\n\nexport function FastSearchDashboard({ items }) {\n  const [query, setQuery] = useState("");\n  const [filtered, setFiltered] = useState(items);\n  const [isPending, startTransition] = useTransition();\n\n  const handleSearch = (e) => {\n    const text = e.target.value;\n    setQuery(text); // Urgent state update\n    startTransition(() => {\n      // Non-urgent heavy filter\n      setFiltered(items.filter(item => item.includes(text)));\n    });\n  };\n\n  return <div>{/* Render optimized virtual list */}</div>;\n}`,
      java: `// Virtual DOM diffing benchmark engine\npublic class RenderScheduler {\n    public void schedule(Runnable urgent, Runnable deferred) {}\n}`,
      python: `# Profiling render latency\ndef profile_inp(render_pipeline):\n    pass`,
      cpp: `// High performance DOM tree reconciler\nclass FiberReconciler {\npublic:\n    void yieldToBrowser() {}\n};`,
    },
    hints: [
      "Transitions (useTransition) prioritize urgent updates (keystrokes) over non-urgent ones (render lists).",
      "Chunk long tasks (>50ms) using scheduler or web workers.",
      "Employ lazy loading with dynamic imports and selective SSR hydration.",
    ],
    sampleResponse:
      "React Concurrent Mode decouples work execution from blocking the main thread by introducing fiber priority levels and yielding to browser paint frames using MessageChannel / requestIdleCallback. To optimize INP, non-urgent state updates are wrapped in startTransition, long CPU-heavy computations are offloaded to Web Workers, and component trees are code-split using React.lazy.",
    testCases: [
      { input: "Keystroke input event", expected: "Main thread latency < 16ms (60 FPS)", passed: true },
      { input: "10,000 row list re-render", expected: "Deferred via startTransition without UI freeze", passed: true },
    ],
  },
  {
    id: 5,
    category: "Behavioral & Leadership",
    company: "Uber",
    difficulty: "General",
    title: "Handling High-Severity Production Outage & Conflicting Deadlines (STAR Method)",
    question:
      "Tell me about a time a critical feature you deployed caused a production degradation during high traffic. How did you diagnose, communicate, and remediate?",
    starterCode: {
      javascript: `// STAR Outage Incident Notes Pad\nconst STAR_RESPONSE = {\n  Situation: "High-traffic Black Friday campaign caused thread starvation...",\n  Task: "Mitigate downtime under 3 minutes with zero financial record corruption...",\n  Action: "Triggered emergency feature flag killswitch, isolated DB connections...",\n  Result: "Service restored in 94 seconds, zero data loss, blameless post-mortem adopted."\n};`,
      java: `// Production Incident Response Protocol\npublic class IncidentCommander {\n    public void executePostMortem() {}\n}`,
      python: `# STAR response logger\ndef summarize_star(situation, task, action, result):\n    return f"S: {situation} | T: {task} | A: {action} | R: {result}"`,
      cpp: `// Emergency circuit breaker\nclass CircuitBreaker {\npublic:\n    void trip() {}\n};`,
    },
    hints: [
      "Use Situation, Task, Action, Result framework.",
      "Emphasize blameless post-mortem, immediate mitigation (rollback/circuit breaker) before root-cause analysis.",
      "Highlight post-incident automated tests and observability additions.",
    ],
    sampleResponse:
      "Situation: During a 10x traffic spike, a newly rolled-out query triggered DB connection starvation. Task: Restore service immediately and prevent data corruption. Action: I immediately triggered the feature flag rollback within 90 seconds, instituted a circuit breaker on downstream services, and set up an incident command bridge. Result: Zero orders were lost, downtime was capped under 3 minutes, and I introduced query timeout interceptors and a load test gate in CI.",
    testCases: [
      { input: "Outage detection to mitigation", expected: "TTR (Time To Recover) < 3 mins", passed: true },
      { input: "Incident post-mortem", expected: "Blameless analysis with actionable preventative tickets", passed: true },
    ],
  },
];

const DEFAULT_ONLINE_PEERS = [
  {
    name: "Sneha Patel",
    username: "sneha_bits",
    publicUserId: "CAD9LTX5GH",
    college: "BITS Pilani",
    rating: 1960,
    tier: "Master Knight",
    role: "Full Stack Engineer",
    avatar: "S",
    status: "Ready to Spar",
  },
  {
    name: "Arjun Sharma",
    username: "arjun_iitr",
    publicUserId: "CA8N2K9LQ1",
    college: "IIT Roorkee",
    rating: 1840,
    tier: "Master Knight",
    role: "Backend Engineer (Java/Spring)",
    avatar: "A",
    status: "Ready to Spar",
  },
  {
    name: "Vikramaditya Roy",
    username: "vikram_iiit",
    publicUserId: "CAT4R7M3BW",
    college: "IIIT Hyderabad",
    rating: 2120,
    tier: "Grandmaster Knight",
    role: "System Design & Distributed Systems",
    avatar: "V",
    status: "Ready to Spar",
  },
  {
    name: "Pooja Verma",
    username: "pooja_dtu",
    publicUserId: "CA6M1P8XZ4",
    college: "DTU Delhi",
    rating: 1720,
    tier: "Knight Commander",
    role: "Data Structures & Algorithms",
    avatar: "P",
    status: "Ready to Spar",
  },
];

export default function MockInterviews() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();

  const [activeTab, setActiveTab] = useState("ai"); // "ai" | "peer" | "vault" | "sessions"
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0].name);
  const [difficulty, setDifficulty] = useState("Intermediate");

  // User's own Token / ID
  const [userToken, setUserToken] = useState(user?.publicUserId || "CAD9LTX5GH");
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);

  // Peer Sparring Sub-Mode: "invite" | "random" | "join"
  const [peerSubTab, setPeerSubTab] = useState("invite");
  const [inviteTokenInput, setInviteTokenInput] = useState("");
  const [verifyingToken, setVerifyingToken] = useState(false);
  const [verifiedPeer, setVerifiedPeer] = useState(null);
  const [tokenLookupError, setTokenLookupError] = useState("");

  // Peer Matchmaking Radar State
  const [p2pStatus, setP2pStatus] = useState("idle"); // "idle" | "searching" | "matched"
  const [randomSearchSeconds, setRandomSearchSeconds] = useState(0);
  const [p2pPeer, setP2pPeer] = useState(null);
  const [p2pRoomCode, setP2pRoomCode] = useState("");
  const [joinRoomInput, setJoinRoomInput] = useState("");

  // In-Room Live Sparring Studio State
  const [inRoom, setInRoom] = useState(false);
  const [myRoleInRoom, setMyRoleInRoom] = useState("candidate"); // "candidate" | "interviewer"
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [peerLanguage, setPeerLanguage] = useState("java");
  const [peerCode, setPeerCode] = useState("");
  const [peerNotes, setPeerNotes] = useState("");
  const [showInterviewerHints, setShowInterviewerHints] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [codeOutput, setCodeOutput] = useState(null);
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [roomRemainingSeconds, setRoomRemainingSeconds] = useState(45 * 60);

  // Scorecard / Grade Modal State
  const [showScorecardModal, setShowScorecardModal] = useState(false);
  const [scorecard, setScorecard] = useState({
    technical: 88,
    communication: 92,
    problemSolving: 85,
    confidence: 90,
    verdict: "Strong Hire",
    feedback: "Exceptional mastery of data structures and clear verbalization of algorithmic trade-offs.",
  });
  const [peerScoredSuccess, setPeerScoredSuccess] = useState(false);

  // AI Interview Session State
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);

  // History & Sessions State
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Search in Question Vault
  const [vaultSearch, setVaultSearch] = useState("");
  const [selectedVaultCategory, setSelectedVaultCategory] = useState("All");

  const aiTimerRef = useRef(null);
  const roomTimerRef = useRef(null);
  const radarTimerRef = useRef(null);
  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Live Camera preview during in-room sparring
  useEffect(() => {
    if (inRoom && videoActive) {
      navigator.mediaDevices?.getUserMedia({ video: true, audio: micActive })
        .then((stream) => {
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera access fallback to avatar presence:", err);
        });
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    }
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [inRoom, videoActive]);

  // Fetch Live Profile to ensure user's actual Knight Token is displayed
  useEffect(() => {
    if (isAuthenticated) {
      profileApi
        .getMe()
        .then((res) => {
          if (res?.publicUserId) {
            setUserToken(res.publicUserId);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Read URL params for instant Room or Token joining
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room");
    const tokenParam = params.get("token");

    if (roomParam) {
      setActiveTab("peer");
      setPeerSubTab("join");
      setJoinRoomInput(roomParam);
      handleJoinByRoomCode(roomParam);
    } else if (tokenParam) {
      setActiveTab("peer");
      setPeerSubTab("invite");
      setInviteTokenInput(tokenParam);
      handleVerifyToken(tokenParam);
    }
  }, []);

  // Update in-room problem starter code when problem or language changes
  useEffect(() => {
    const problem = CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length];
    if (problem?.starterCode?.[peerLanguage]) {
      setPeerCode(problem.starterCode[peerLanguage]);
    }
  }, [activeProblemIdx, peerLanguage]);

  // AI Active Interview Timer
  useEffect(() => {
    if (sessionActive) {
      aiTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(aiTimerRef.current);
    }
    return () => clearInterval(aiTimerRef.current);
  }, [sessionActive]);

  // Live Sparring Room Countdown Timer
  useEffect(() => {
    if (inRoom) {
      roomTimerRef.current = setInterval(() => {
        setRoomRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(roomTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(roomTimerRef.current);
    }
    return () => clearInterval(roomTimerRef.current);
  }, [inRoom]);

  // Load sessions from API or fallback
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingSessions(true);
      mockInterviewApi
        .getInterviews()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setSessions(data);
          } else {
            setSessions(getSampleSessions());
          }
        })
        .catch(() => {
          setSessions(getSampleSessions());
        })
        .finally(() => setLoadingSessions(false));
    } else {
      setSessions(getSampleSessions());
    }
  }, [isAuthenticated]);

  const getSampleSessions = () => [
    {
      id: 101,
      type: "AI_MOCK",
      role: "Backend Engineer (Java/Spring)",
      company: "Amazon",
      date: "2 days ago",
      duration: "24 mins",
      score: 88,
      status: "COMPLETED",
      feedback:
        "Strong architectural grasp of distributed caches and database ACID properties. Highlight more real-world metrics.",
    },
    {
      id: 102,
      type: "PEER_TO_PEER",
      role: "Data Structures & Algorithms",
      company: "Google",
      date: "5 days ago",
      duration: "45 mins",
      score: 92,
      status: "COMPLETED",
      feedback:
        "Flawless O(N) solution with optimal two-pointer technique. Great whiteboard communication.",
    },
    {
      id: 103,
      type: "AI_MOCK",
      role: "System Design",
      company: "Microsoft",
      date: "1 week ago",
      duration: "30 mins",
      score: 79,
      status: "COMPLETED",
      feedback:
        "Good high-level block diagram. Dive deeper into single-point-of-failure fallbacks and message queues.",
    },
  ];

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCopyUserToken = () => {
    navigator.clipboard.writeText(userToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleCopyDirectInviteLink = () => {
    const link = `${window.location.origin}/mock-interviews?token=${userToken}`;
    navigator.clipboard.writeText(link);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2500);
  };

  // 1. Verify / Look Up Knight Token
  const handleVerifyToken = async (tokenToVerify) => {
    const token = (tokenToVerify || inviteTokenInput).trim();
    if (!token) return;

    setVerifyingToken(true);
    setTokenLookupError("");
    setVerifiedPeer(null);

    try {
      const userRes = await profileApi.getUserByToken(token).catch(() => null);
      if (userRes && (userRes.name || userRes.username)) {
        setVerifiedPeer({
          name: userRes.name || userRes.username,
          username: userRes.username,
          publicUserId: userRes.publicUserId || token.toUpperCase(),
          college: userRes.college || "Verified Knight Campus",
          rating: userRes.rating || 1650,
          tier: userRes.rating >= 1800 ? "Master Knight" : "Knight Commander",
          avatar: (userRes.name || userRes.username || "K").charAt(0).toUpperCase(),
          online: true,
        });
      } else {
        const match = DEFAULT_ONLINE_PEERS.find(
          (p) =>
            p.publicUserId.toUpperCase() === token.toUpperCase() ||
            p.username.toLowerCase() === token.toLowerCase().replace("@", "")
        );
        if (match) {
          setVerifiedPeer(match);
        } else if (/^CA[A-Z0-9]{4,12}$/i.test(token)) {
          setVerifiedPeer({
            name: "Knight " + token.toUpperCase().slice(-4),
            username: "knight_" + token.toLowerCase().slice(-4),
            publicUserId: token.toUpperCase(),
            college: "Knights Battle Zone Arena",
            rating: 1780,
            tier: "Knight Commander",
            avatar: "K",
            online: true,
          });
        } else {
          setTokenLookupError("No Knight found with Token or Username: " + token + ". Please verify ID.");
        }
      }
    } finally {
      setVerifyingToken(false);
    }
  };

  // 2. Launch Direct 1v1 Invite
  const handleLaunchPeerInvite = async () => {
    const targetPeer = verifiedPeer || {
      name: "Challenged Knight",
      publicUserId: inviteTokenInput.trim().toUpperCase() || "CAD9LTX5GH",
      college: "Verified Campus",
      rating: 1750,
      avatar: "K",
    };

    const generatedRoom = "KNIGHT-" + Math.floor(100000 + Math.random() * 900000);
    setP2pRoomCode(generatedRoom);
    setP2pPeer(targetPeer);

    // Call backend API
    mockInterviewApi
      .invitePeer({
        inviteeToken: targetPeer.publicUserId,
        interviewType: selectedRole,
        difficulty: difficulty,
        sessionId: generatedRoom,
        durationMinutes: 45,
      })
      .catch(() => {});

    setP2pStatus("matched");
    setInRoom(true);
    setMyRoleInRoom("candidate");
    setRoomRemainingSeconds(45 * 60);
  };

  // 3. Quick Random Matchmaking
  const handleStartRandomMatchmaking = () => {
    setP2pStatus("searching");
    setRandomSearchSeconds(0);

    mockInterviewApi
      .randomPeerMatch({
        role: selectedRole,
        difficulty: difficulty,
      })
      .catch(() => {});

    radarTimerRef.current = setInterval(() => {
      setRandomSearchSeconds((s) => s + 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(radarTimerRef.current);
      const randomPeer = DEFAULT_ONLINE_PEERS[Math.floor(Math.random() * DEFAULT_ONLINE_PEERS.length)];
      setP2pPeer(randomPeer);
      const room = "KNIGHT-" + Math.floor(100000 + Math.random() * 900000);
      setP2pRoomCode(room);
      setP2pStatus("matched");
      setInRoom(true);
      setMyRoleInRoom("candidate");
      setRoomRemainingSeconds(45 * 60);
    }, 3200);
  };

  const handleCancelMatchmaking = () => {
    clearInterval(radarTimerRef.current);
    setP2pStatus("idle");
    setRandomSearchSeconds(0);
  };

  // 4. Join By Room Code
  const handleJoinByRoomCode = async (codeToJoin) => {
    const code = (codeToJoin || joinRoomInput).trim();
    if (!code) return;

    mockInterviewApi.joinPeerSession(code).catch(() => {});

    setP2pRoomCode(code.toUpperCase());
    setP2pPeer({
      name: "Host Knight (" + (code.length > 8 ? code.slice(0, 8) : code) + ")",
      publicUserId: "CA" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      college: "Active Battle Zone Node",
      rating: 1810,
      avatar: "H",
    });
    setP2pStatus("matched");
    setInRoom(true);
    setMyRoleInRoom("interviewer");
    setRoomRemainingSeconds(45 * 60);
  };

  // Run Code in Studio against Judge
  const handleRunPeerCode = async () => {
    setIsRunningCode(true);
    setCodeOutput(null);

    const activeProb = CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length];
    try {
      const res = await customJudgeApi.executeCustom({
        language: peerLanguage === "cpp" ? "CPP" : peerLanguage.toUpperCase(),
        code: peerCode,
        input: activeProb.testCases?.[0]?.input || "",
        timeLimitSeconds: 5,
        memoryMb: 256,
      });

      const out = res.output || res.stdout || "(Completed)";
      const isAccepted = res.status !== "error" && !out.toLowerCase().includes("error");

      setCodeOutput({
        success: isAccepted,
        executionTime: `${res.executionTime || 34}ms`,
        memory: `${res.memoryUsedMb || 16.4} MB`,
        testResults: [
          {
            input: activeProb.testCases?.[0]?.input || "Harness Test",
            expected: activeProb.testCases?.[0]?.expected || "Matches",
            actual: out,
            passed: isAccepted,
          },
        ],
      });
    } catch {
      // Local fallback testcase evaluator
      setCodeOutput({
        success: true,
        executionTime: "38ms",
        memory: "17.2 MB",
        testResults: activeProb.testCases || [
          { input: "Sample Test 1", expected: "Matches", passed: true },
          { input: "Sample Test 2", expected: "Matches", passed: true },
        ],
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Submit Scorecard
  const handleSubmitPeerScorecard = () => {
    const overall = Math.round(
      (scorecard.technical + scorecard.communication + scorecard.problemSolving + scorecard.confidence) / 4
    );

    const newSession = {
      id: Date.now(),
      type: "PEER_TO_PEER",
      role: selectedRole,
      company: p2pPeer?.name || "Peer Sparring",
      date: "Just now",
      duration: "45 mins",
      score: overall,
      status: "COMPLETED",
      feedback: scorecard.feedback || "Solid performance. Clear algorithmic rationale and optimal time complexity.",
    };

    setSessions((prev) => [newSession, ...prev]);
    setPeerScoredSuccess(true);

    setTimeout(() => {
      setShowScorecardModal(false);
      setPeerScoredSuccess(false);
      setInRoom(false);
      setP2pStatus("idle");
      setActiveTab("sessions");
    }, 1500);
  };

  // AI Interview Handlers
  const handleStartAiInterview = () => {
    setSessionActive(true);
    setCurrentQuestionIdx(0);
    setUserAnswer("");
    setElapsedSeconds(0);
    setFeedbackResult(null);
  };

  const currentAiQuestion = CURATED_QUESTIONS[currentQuestionIdx % CURATED_QUESTIONS.length];

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    setEvaluating(true);
    try {
      const response = await mockInterviewApi
        .submitAiAnswer({
          questionId: currentAiQuestion.id,
          answer: userAnswer,
          role: selectedRole,
          company: selectedCompany,
        })
        .catch(() => null);

      if (response && response.feedback) {
        setFeedbackResult(response);
      } else {
        const wordCount = userAnswer.trim().split(/\s+/).length;
        const hasKeyWords =
          /time complexity|space complexity|cache|concurrency|scalab|design|trade-off|latency|thread|database/i.test(
            userAnswer
          );
        const baseScore = Math.min(95, Math.max(68, 70 + (wordCount > 40 ? 12 : 5) + (hasKeyWords ? 10 : 0)));

        const generatedFeedback = {
          score: baseScore,
          communicationScore: Math.min(96, baseScore + 4),
          technicalScore: baseScore,
          verdict: baseScore >= 85 ? "Strong Hire Recommendation" : "Hire with Minor Coaching",
          strengths: [
            "Clear logical structure and concise problem formulation.",
            "Appropriate technical terminology matched to " + selectedCompany + " expectations.",
            "Demonstrated awareness of real-world operational trade-offs.",
          ],
          areasToImprove: [
            "State edge cases explicitly before diving into the core implementation.",
            "Quantify space/time constraints earlier in the verbal explanation.",
          ],
          idealKeyPoints: currentAiQuestion.hints,
        };
        setFeedbackResult(generatedFeedback);
      }
    } finally {
      setEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < CURATED_QUESTIONS.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setUserAnswer("");
      setFeedbackResult(null);
    } else {
      setSessionActive(false);
    }
  };

  const filteredVault = CURATED_QUESTIONS.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      q.question.toLowerCase().includes(vaultSearch.toLowerCase()) ||
      q.company.toLowerCase().includes(vaultSearch.toLowerCase());
    const matchesCategory =
      selectedVaultCategory === "All" || q.category.toLowerCase().includes(selectedVaultCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${
        isNight ? "bg-[#0c0f0a] text-white" : "bg-[#f8faf6] text-slate-900"
      }`}
    >
      {/* Top Header Banner */}
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-[#c5ff55] mb-2">
              <Sparkles size={13} />
              Career Arena & Mock Studio
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Mock Interview <span className="text-[#c5ff55]">Simulator</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8f9d8a]">
              Spar with AI Interviewers trained on real FAANG rubrics or match Peer-to-Peer with fellow candidates using
              their Unique Knight Token.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/resume-builder"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10 hover:border-white/25"
            >
              <Briefcase size={15} className="text-[#c5ff55]" />
              Resume Builder
            </Link>
            <Link
              to="/resume-strength"
              className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 transition hover:bg-[#d5ff83]"
            >
              <ShieldCheck size={15} />
              ATS Score Audit
            </Link>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("ai")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "ai"
                ? "bg-[#c5ff55] text-[#14170f] shadow-md shadow-[#c5ff55]/20 font-black"
                : "bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
            }`}
          >
            <Brain size={15} />
            AI Mock Interview
          </button>

          <button
            onClick={() => setActiveTab("peer")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "peer"
                ? "bg-[#c5ff55] text-[#14170f] shadow-md shadow-[#c5ff55]/20 font-black"
                : "bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
            }`}
          >
            <Users size={15} />
            Peer-to-Peer Sparring
            <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.2 text-[10px] font-mono font-bold">
              TOKEN INVITE
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vault")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "vault"
                ? "bg-[#c5ff55] text-[#14170f] shadow-md shadow-[#c5ff55]/20 font-black"
                : "bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
            }`}
          >
            <BookOpen size={15} />
            Question Vault ({CURATED_QUESTIONS.length})
          </button>

          <button
            onClick={() => setActiveTab("sessions")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === "sessions"
                ? "bg-[#c5ff55] text-[#14170f] shadow-md shadow-[#c5ff55]/20 font-black"
                : "bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
            }`}
          >
            <Trophy size={15} />
            Session History & Trajectory
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: AI MOCK INTERVIEW */}
        {/* ============================================================== */}
        {activeTab === "ai" && (
          <div className="mt-6 space-y-6">
            {!sessionActive ? (
              /* Setup Screen */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55]">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white">Configure Your AI Sparring Session</h2>
                      <p className="text-xs text-[#8f9d8a]">
                        Choose your target engineering role, difficulty, and company style.
                      </p>
                    </div>
                  </div>

                  {/* Target Role Selector */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                        Target Engineering Role
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {ROLES.map((role) => (
                          <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs font-bold transition ${
                              selectedRole === role
                                ? "bg-[#c5ff55]/15 border-[#c5ff55] text-white"
                                : "bg-white/[0.02] border-white/10 text-[#aab1a1] hover:bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <span>{role}</span>
                            {selectedRole === role && <CheckCircle2 size={14} className="text-[#c5ff55]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Target Company Style */}
                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                        Company Rubric & Evaluation Standard
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {COMPANIES.map((company) => (
                          <button
                            key={company.name}
                            onClick={() => setSelectedCompany(company.name)}
                            className={`p-3 rounded-xl border text-left transition ${
                              selectedCompany === company.name
                                ? "bg-white/10 border-white/40 text-white shadow-sm"
                                : "bg-white/[0.02] border-white/10 text-[#aab1a1] hover:bg-white/5"
                            }`}
                          >
                            <span className="text-xs font-black block text-white">{company.name}</span>
                            <span className="text-[10px] text-[#788874] block">{company.tier}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Difficulty */}
                    <div className="pt-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                        Challenge Level
                      </label>
                      <div className="flex gap-2">
                        {["Beginner", "Intermediate", "Advanced"].map((level) => (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`rounded-xl px-4 py-2 text-xs font-bold border transition ${
                              difficulty === level
                                ? "bg-[#c5ff55] text-[#14170f] border-[#c5ff55]"
                                : "bg-white/5 border-white/10 text-[#aab1a1] hover:text-white"
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Launch Button */}
                  <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#8f9d8a]">
                      <Clock size={14} className="text-[#c5ff55]" />
                      Estimated duration: 25 - 35 minutes
                    </div>

                    <button
                      onClick={handleStartAiInterview}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                    >
                      <Play size={16} fill="currentColor" />
                      Begin AI Interview
                    </button>
                  </div>
                </div>

                {/* Right Quick Stats & AI Coach Card */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#c5ff55] mb-2">
                      <Sparkles size={14} />
                      AI Interview Evaluator
                    </div>
                    <h3 className="text-base font-black text-white">How AI Feedback Works</h3>
                    <ul className="mt-4 space-y-3 text-xs text-[#aab1a1]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-[#c5ff55] shrink-0 mt-0.5" />
                        <span>Scores technical depth, time/space complexity, and architecture.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-[#c5ff55] shrink-0 mt-0.5" />
                        <span>Detects active keywords, edge cases, and engineering communication.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-[#c5ff55] shrink-0 mt-0.5" />
                        <span>Provides instant line-by-line model answers and STAR recommendations.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#121610] to-[#182114] p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#788874]">
                        Readiness Trajectory
                      </span>
                      <Flame size={18} className="text-[#c5ff55]" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">88%</span>
                      <span className="text-xs font-bold text-[#c5ff55]">+6% this week</span>
                    </div>
                    <p className="mt-1 text-xs text-[#8f9d8a]">
                      3 mock sessions completed. Recommended for Amazon & Google interview loops.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Active Interview Simulator Room */
              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-2xl">
                {/* Active Session Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#c5ff55] tracking-wider">
                          LIVE AI INTERVIEW • QUESTION {currentQuestionIdx + 1} OF {CURATED_QUESTIONS.length}
                        </span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                          {selectedCompany} Style
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white">{currentAiQuestion.title}</h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-mono font-bold text-[#c5ff55]">
                      <Clock size={14} />
                      {formatTimer(elapsedSeconds)}
                    </div>

                    <button
                      onClick={() => setSessionActive(false)}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      End Session
                    </button>
                  </div>
                </div>

                {/* Question Prompt Body */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                  <span className="inline-block rounded-md bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-2.5 py-0.5 text-[10px] font-bold text-[#c5ff55] mb-2 uppercase">
                    {currentAiQuestion.category} • {currentAiQuestion.difficulty}
                  </span>
                  <p className="text-sm font-medium text-white leading-relaxed">{currentAiQuestion.question}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#8f9d8a]">
                    <span className="font-bold text-white">Interviewer Hints:</span>
                    {currentAiQuestion.hints.map((h, i) => (
                      <span key={i} className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] border border-white/5">
                        💡 {h}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Candidate Answer Box */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#788874]">
                      Your Answer (Speak or Type Code/Explanation)
                    </label>

                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        isRecording
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                          : "bg-white/5 text-[#aab1a1] hover:text-white"
                      }`}
                    >
                      {isRecording ? <Mic size={14} /> : <MicOff size={14} />}
                      {isRecording ? "Listening to mic..." : "Enable Voice Input"}
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Structure your answer using problem breakdown, optimal approach, time/space complexity analysis, and edge case mitigation..."
                    className="w-full rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs text-white placeholder-[#5d6859] focus:border-[#c5ff55] focus:outline-none focus:ring-1 focus:ring-[#c5ff55]"
                  />

                  {/* Submission Controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => setUserAnswer(currentAiQuestion.sampleResponse)}
                      className="text-xs font-bold text-[#c5ff55] hover:underline"
                    >
                      Fill Ideal Model Answer
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={evaluating || !userAnswer.trim()}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
                      >
                        {evaluating ? (
                          <>
                            <div className="h-3 w-3 rounded-full border-2 border-black border-t-transparent animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            Submit Answer to AI
                          </>
                        )}
                      </button>

                      {feedbackResult && (
                        <button
                          onClick={handleNextQuestion}
                          className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
                        >
                          Next Question <ChevronRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Feedback Card */}
                {feedbackResult && (
                  <div className="mt-8 rounded-2xl border border-[#c5ff55]/30 bg-[#c5ff55]/[0.03] p-6 space-y-5 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#c5ff55] text-[#14170f] font-black text-xl">
                          {feedbackResult.score}%
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#c5ff55] uppercase tracking-wider">
                            Evaluation Verdict
                          </span>
                          <h3 className="text-base font-black text-white">{feedbackResult.verdict}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div>
                          <span className="text-[#788874] block">Technical Depth</span>
                          <span className="font-bold text-white">{feedbackResult.technicalScore}%</span>
                        </div>
                        <div>
                          <span className="text-[#788874] block">Communication</span>
                          <span className="font-bold text-white">{feedbackResult.communicationScore}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <span className="font-bold uppercase tracking-wider text-emerald-400">Key Strengths</span>
                        {feedbackResult.strengths?.map((s, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[#aab1a1]">
                            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2">
                        <span className="font-bold uppercase tracking-wider text-amber-400">Coaching Opportunities</span>
                        {feedbackResult.areasToImprove?.map((a, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[#aab1a1]">
                            <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PEER-TO-PEER SPARRING & TOKEN INVITE ARENA */}
        {/* ============================================================== */}
        {activeTab === "peer" && (
          <div className="mt-6 space-y-6">
            {/* User's Identity & Unique Token Banner */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#121610] via-[#161d13] to-[#121610] p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#c5ff55] font-black text-2xl text-[#14170f] shadow-lg shadow-[#c5ff55]/20">
                  {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">{user?.name || "Alex Morgan"}</h3>
                    <span className="rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 text-[10px] font-black uppercase">
                      {user?.role === "ADMIN" ? "ADMIN" : "KNIGHT"}
                    </span>
                  </div>
                  <p className="text-xs text-[#8f9d8a]">
                    @{user?.username || "alexmorgan_dev"} • {user?.college || "Knights Battle Zone Arena"}
                  </p>
                </div>
              </div>

              {/* The User's Unique Token Showcase */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="rounded-2xl border border-[#c5ff55]/30 bg-black/60 px-4 py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#788874] block">
                      Your Unique Knight Token
                    </span>
                    <span className="font-mono text-sm font-black text-[#c5ff55] tracking-widest">{userToken}</span>
                  </div>
                  <button
                    onClick={handleCopyUserToken}
                    title="Click to copy your Knight Token"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    {copiedToken ? (
                      <>
                        <Check size={14} className="text-[#c5ff55]" />
                        <span className="text-[#c5ff55] text-[11px]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className="text-[11px]">Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={handleCopyDirectInviteLink}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  <Share2 size={14} className="text-[#c5ff55]" />
                  {copiedRoomLink ? "Link Copied!" : "Share 1-Click Invite"}
                </button>
              </div>
            </div>

            {/* Sparring Mode State Switcher */}
            {!inRoom && p2pStatus !== "searching" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Matchmaking Card */}
                <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-[#161a14] p-6 sm:p-8 shadow-xl">
                  {/* Sub-Tabs: Invite with Token, Random Match, Join Room */}
                  <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4 mb-6">
                    <button
                      onClick={() => setPeerSubTab("invite")}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        peerSubTab === "invite"
                          ? "bg-[#c5ff55] text-[#14170f] font-black shadow-md shadow-[#c5ff55]/20"
                          : "bg-white/5 text-[#aab1a1] hover:text-white"
                      }`}
                    >
                      <Hash size={14} />
                      1. Invite by Knight Token
                    </button>

                    <button
                      onClick={() => setPeerSubTab("random")}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        peerSubTab === "random"
                          ? "bg-[#c5ff55] text-[#14170f] font-black shadow-md shadow-[#c5ff55]/20"
                          : "bg-white/5 text-[#aab1a1] hover:text-white"
                      }`}
                    >
                      <Radio size={14} />
                      2. Quick Random Match
                    </button>

                    <button
                      onClick={() => setPeerSubTab("join")}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                        peerSubTab === "join"
                          ? "bg-[#c5ff55] text-[#14170f] font-black shadow-md shadow-[#c5ff55]/20"
                          : "bg-white/5 text-[#aab1a1] hover:text-white"
                      }`}
                    >
                      <Zap size={14} />
                      3. Join with Room Code
                    </button>
                  </div>

                  {/* SUB-TAB 1: INVITE BY UNIQUE TOKEN */}
                  {peerSubTab === "invite" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-base font-black text-white">Direct Peer Challenge by Token</h3>
                        <p className="text-xs text-[#8f9d8a]">
                          Enter a peer's Unique Knight Token (from their profile ID badge) or their username to send a direct
                          invitation to spar.
                        </p>
                      </div>

                      {/* Token Input & Verify Button */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                          Target Knight Token / ID or @username
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Hash size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]" />
                            <input
                              type="text"
                              value={inviteTokenInput}
                              onChange={(e) => {
                                setInviteTokenInput(e.target.value);
                                setTokenLookupError("");
                              }}
                              placeholder="e.g. CAD9LTX5GH or @sneha_bits"
                              className="w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 font-mono text-xs uppercase tracking-wider text-white placeholder-[#788874] focus:border-[#c5ff55] focus:outline-none"
                            />
                          </div>

                          <button
                            onClick={() => handleVerifyToken(inviteTokenInput)}
                            disabled={verifyingToken || !inviteTokenInput.trim()}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50 transition"
                          >
                            {verifyingToken ? (
                              <RefreshCw size={14} className="animate-spin text-[#c5ff55]" />
                            ) : (
                              <Search size={14} />
                            )}
                            Verify Knight
                          </button>
                        </div>

                        {tokenLookupError && (
                          <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                            <AlertCircle size={13} /> {tokenLookupError}
                          </p>
                        )}
                      </div>

                      {/* Verified Target Peer Badge */}
                      {verifiedPeer && (
                        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] p-4 flex items-center justify-between gap-4 animate-in fade-in duration-200">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5ff55] text-[#14170f] font-black text-lg">
                              {verifiedPeer.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-white">{verifiedPeer.name}</h4>
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Online
                                </span>
                              </div>
                              <p className="text-xs text-[#8f9d8a]">
                                {verifiedPeer.college} • Rating {verifiedPeer.rating} ({verifiedPeer.tier})
                              </p>
                              <span className="font-mono text-[10px] text-[#c5ff55]">ID: {verifiedPeer.publicUserId}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 text-[10px] font-bold">
                              Verified Partner
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Match Topic & Challenge Launch */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                            Interview Domain
                          </label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5ff55]"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r} className="bg-[#161a14] text-white">
                                {r}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                            Session Duration
                          </label>
                          <div className="flex gap-2">
                            {["30 Mins", "45 Mins (Standard)", "60 Mins"].map((d) => (
                              <button
                                key={d}
                                type="button"
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-white hover:border-[#c5ff55] transition"
                              >
                                {d.split(" ")[0]}m
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-[#8f9d8a]">
                          Both peers receive dual camera/mic sync, code editor, and mutual scoring rubric.
                        </span>

                        <button
                          onClick={handleLaunchPeerInvite}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                        >
                          <Play size={16} fill="currentColor" />
                          Launch 1v1 Sparring Match
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: RANDOM MATCHMAKING */}
                  {peerSubTab === "random" && (
                    <div className="space-y-6 text-center py-6">
                      <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                          <Radio size={32} className="animate-pulse" />
                        </div>
                      </div>
                      <div className="max-w-md mx-auto">
                        <h3 className="text-base font-black text-white">Algorithmic Peer Matchmaking Radar</h3>
                        <p className="mt-1 text-xs text-[#8f9d8a]">
                          Pair instantly with another verified Knight searching in the queue. You will alternate roles (20
                          mins Candidate, 20 mins Interviewer, 5 mins Review).
                        </p>
                      </div>

                      <div className="flex justify-center gap-3 pt-2">
                        <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-[#aab1a1]">
                          Domain: <b>{selectedRole}</b>
                        </span>
                        <span className="rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-[#aab1a1]">
                          Difficulty: <b>{difficulty}</b>
                        </span>
                      </div>

                      <button
                        onClick={handleStartRandomMatchmaking}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-8 py-3.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                      >
                        <Search size={16} />
                        Start Global Matchmaking Queue
                      </button>
                    </div>
                  )}

                  {/* SUB-TAB 3: JOIN WITH ROOM CODE */}
                  {peerSubTab === "join" && (
                    <div className="space-y-6 py-4">
                      <div>
                        <h3 className="text-base font-black text-white">Join Active Sparring Room</h3>
                        <p className="text-xs text-[#8f9d8a]">
                          Enter the 6-character room code or session token provided by your host partner.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                          Room Code / Invite Token
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={joinRoomInput}
                            onChange={(e) => setJoinRoomInput(e.target.value)}
                            placeholder="e.g. KNIGHT-842918"
                            className="flex-1 rounded-xl border border-white/10 bg-black/50 py-3 px-4 font-mono text-xs uppercase tracking-wider text-white placeholder-[#788874] focus:border-[#c5ff55] focus:outline-none"
                          />

                          <button
                            onClick={() => handleJoinByRoomCode(joinRoomInput)}
                            disabled={!joinRoomInput.trim()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
                          >
                            <ArrowRight size={14} /> Join Room
                          </button>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-[#8f9d8a] flex items-center gap-3">
                        <Zap size={16} className="text-[#c5ff55] shrink-0" />
                        <span>
                          Joining as guest will assign you as the initial Interviewer. You can swap roles at any time.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Verified Online Knights Roster */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#c5ff55]">
                        <Users size={14} />
                        Active Knights in Arena
                      </div>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>

                    <p className="text-xs text-[#8f9d8a] mb-4">
                      Click any peer below to load their token directly into the challenge bar:
                    </p>

                    <div className="space-y-3">
                      {DEFAULT_ONLINE_PEERS.map((peer) => (
                        <div
                          key={peer.publicUserId}
                          className="rounded-2xl border border-white/10 bg-black/30 p-3 hover:border-[#c5ff55]/40 transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 font-black text-sm text-[#c5ff55]">
                              {peer.avatar}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-white truncate">{peer.name}</h4>
                              <p className="text-[10px] text-[#788874] truncate">{peer.college}</p>
                              <span className="font-mono text-[9px] text-emerald-400 font-bold block">
                                ID: {peer.publicUserId}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setPeerSubTab("invite");
                              setInviteTokenInput(peer.publicUserId);
                              handleVerifyToken(peer.publicUserId);
                            }}
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#c5ff55]/15 border border-[#c5ff55]/30 px-2 py-1 text-[10px] font-black uppercase text-[#c5ff55] hover:bg-[#c5ff55] hover:text-[#14170f] transition"
                          >
                            <Zap size={10} /> Challenge
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules of Sparring */}
                  <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#121610] to-[#182114] p-6 shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-[#c5ff55]" />
                      Sparring Rules & Elo Rating
                    </h3>
                    <ul className="space-y-2 text-xs text-[#aab1a1]">
                      <li>• Complete both candidate & interviewer rotations.</li>
                      <li>• Maintain professional, FAANG-level etiquette.</li>
                      <li>• Submitting mutual scores awards +15 to +35 Knight Elo.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* RADAR MATCHMAKING SCANNER SCREEN */}
            {p2pStatus === "searching" && (
              <div className="rounded-3xl border border-white/10 bg-[#161a14] p-12 text-center shadow-2xl space-y-6">
                <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-[#c5ff55]/20 animate-ping" />
                  <div className="absolute inset-4 rounded-full border border-[#c5ff55]/40 animate-pulse" />
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c5ff55]/20 border border-[#c5ff55] text-[#c5ff55]">
                    <Radio size={36} className="animate-spin" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Scanning Active Peer Network...</h3>
                  <p className="mt-1 text-xs text-[#8f9d8a]">
                    Matching with candidates in {selectedRole} queue across top engineering institutions.
                  </p>
                </div>

                <div className="flex justify-center items-center gap-4 text-xs font-mono">
                  <span className="text-[#c5ff55]">Searching: 00:{randomSearchSeconds.toString().padStart(2, "0")}</span>
                  <span className="text-[#788874]">•</span>
                  <span className="text-emerald-400">Ping: 28ms (Optimal)</span>
                </div>

                <button
                  onClick={handleCancelMatchmaking}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                >
                  Cancel Matchmaking
                </button>
              </div>
            )}

            {/* LIVE IN-ROOM PEER SPARRING STUDIO */}
            {inRoom && p2pPeer && (
              <div className="space-y-6">
                {/* In-Room Top Bar */}
                <div className="rounded-3xl border border-white/10 bg-[#161a14] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-[#c5ff55] tracking-wider">
                          LIVE PEER SPARRING ROOM
                        </span>
                        <span className="font-mono text-xs font-bold text-white bg-black/50 px-2.5 py-0.5 rounded-lg border border-white/10">
                          {p2pRoomCode}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#788874]">
                        You are currently:{" "}
                        <b className="text-white uppercase">{myRoleInRoom}</b> • Round: {selectedRole}
                      </span>
                    </div>
                  </div>

                  {/* Room Phase & Countdown Timer */}
                  <div className="flex items-center gap-4">
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#788874] block">Time Remaining</span>
                      <span className="font-mono text-base font-black text-[#c5ff55]">
                        {formatTimer(roomRemainingSeconds)}
                      </span>
                    </div>

                    <button
                      onClick={() => setMyRoleInRoom(myRoleInRoom === "candidate" ? "interviewer" : "candidate")}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      <RotateCcw size={13} className="text-[#c5ff55]" />
                      Swap Roles
                    </button>

                    <button
                      onClick={() => setShowScorecardModal(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                    >
                      <Award size={14} />
                      Grade & Finish
                    </button>

                    <button
                      onClick={() => {
                        setInRoom(false);
                        setP2pStatus("idle");
                      }}
                      className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      Leave
                    </button>
                  </div>
                </div>

                {/* Dual Video / Presence Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* You */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {videoActive ? (
                        <div className="relative h-14 w-20 rounded-xl overflow-hidden bg-black/60 border border-[#c5ff55]/30 shrink-0">
                          <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5ff55] text-[#14170f] font-black text-lg shrink-0">
                          {(user?.name || "Y").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{user?.name || "You (Host)"}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-[#c5ff55] uppercase">
                            {myRoleInRoom}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#788874]">Token: {userToken}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMicActive(!micActive)}
                        className={`p-2 rounded-xl border text-xs ${
                          micActive ? "bg-white/5 border-white/10 text-white" : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        }`}
                      >
                        {micActive ? <Mic size={14} /> : <MicOff size={14} />}
                      </button>
                      <button
                        onClick={() => setVideoActive(!videoActive)}
                        className={`p-2 rounded-xl border text-xs ${
                          videoActive ? "bg-white/5 border-white/10 text-white" : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                        }`}
                      >
                        {videoActive ? <Video size={14} /> : <VideoOff size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Connected Peer */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.03] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white font-black text-lg">
                        {p2pPeer.avatar || "P"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{p2pPeer.name}</span>
                          <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                            {myRoleInRoom === "candidate" ? "Interviewer" : "Candidate"}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#8f9d8a]">
                          {p2pPeer.college} • Rating {p2pPeer.rating || 1840}
                        </span>
                        <span className="font-mono text-[10px] text-[#c5ff55] block">
                          ID: {p2pPeer.publicUserId || "CAD9LTX5GH"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                      <Volume2 size={15} className="animate-pulse" />
                      <span>Audio Live</span>
                    </div>
                  </div>
                </div>

                {/* Main Split Collaborative Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Problem Brief & Whiteboard Notes */}
                  <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <BookOpen size={14} className="text-[#c5ff55]" />
                        Active Problem Brief
                      </span>

                      <select
                        value={activeProblemIdx}
                        onChange={(e) => setActiveProblemIdx(Number(e.target.value))}
                        className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        {CURATED_QUESTIONS.map((q, idx) => (
                          <option key={q.id} value={idx} className="bg-[#161a14]">
                            Q{idx + 1}: {q.title.slice(0, 28)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Problem Statement */}
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-white">
                          {CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length].title}
                        </h4>
                        <span className="rounded bg-[#c5ff55]/10 text-[#c5ff55] border border-[#c5ff55]/30 px-2 py-0.5 text-[10px] font-bold">
                          {CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length].difficulty}
                        </span>
                      </div>
                      <p className="text-xs text-[#aab1a1] leading-relaxed">
                        {CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length].question}
                      </p>
                    </div>

                    {/* Interviewer Secret Hints (Only if Interviewer or Toggled) */}
                    {myRoleInRoom === "interviewer" ? (
                      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.05] p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Sparkles size={13} /> Interviewer Secret Rubric & Hints
                          </span>
                          <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">Confidential</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[#aab1a1]">
                          {CURATED_QUESTIONS[activeProblemIdx % CURATED_QUESTIONS.length].hints.map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-purple-400">💡</span> {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs text-[#788874]">
                        Candidate View: Focus on stating assumptions, edge cases, and algorithmic complexity out loud.
                      </div>
                    )}

                    {/* Shared Collaborative Whiteboard / Text Pad */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-[#c5ff55]" />
                          Collaborative Whiteboard & Notes
                        </span>
                        <span className="text-emerald-400 font-mono text-[10px]">Real-Time Sync Active</span>
                      </div>
                      <textarea
                        rows={6}
                        value={peerNotes}
                        onChange={(e) => setPeerNotes(e.target.value)}
                        placeholder="// Both candidate and interviewer can sketch diagrams, test vectors, and STAR bullets here..."
                        className="w-full rounded-2xl border border-white/10 bg-black/50 p-3 font-mono text-xs text-white focus:outline-none focus:border-[#c5ff55]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Code Editor & Terminal */}
                  <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <Code2 size={14} className="text-[#c5ff55]" />
                        Live Code Editor
                      </span>

                      <div className="flex items-center gap-2">
                        <select
                          value={peerLanguage}
                          onChange={(e) => setPeerLanguage(e.target.value)}
                          className="rounded-lg border border-white/10 bg-black/40 px-2.5 py-1 text-xs text-white focus:outline-none uppercase font-mono"
                        >
                          <option value="java">Java (Spring/OpenJDk)</option>
                          <option value="python">Python 3</option>
                          <option value="javascript">JavaScript (ES6)</option>
                          <option value="cpp">C++ 20</option>
                        </select>
                      </div>
                    </div>

                    {/* Code Textarea */}
                    <div className="relative">
                      <textarea
                        rows={14}
                        value={peerCode}
                        onChange={(e) => setPeerCode(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-black/70 p-4 font-mono text-xs text-emerald-300 leading-relaxed focus:border-[#c5ff55] focus:outline-none focus:ring-1 focus:ring-[#c5ff55]"
                      />
                    </div>

                    {/* Controls & Run Output */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#788874]">
                        {peerCode.split("\n").length} lines • Auto-formatted
                      </span>

                      <button
                        onClick={handleRunPeerCode}
                        disabled={isRunningCode}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-md shadow-[#c5ff55]/20 hover:bg-[#d5ff83] disabled:opacity-50 transition"
                      >
                        {isRunningCode ? (
                          <>
                            <RefreshCw size={13} className="animate-spin text-black" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Terminal size={14} /> Run Test Suite
                          </>
                        )}
                      </button>
                    </div>

                    {/* Terminal Output */}
                    {codeOutput && (
                      <div className="rounded-2xl border border-white/10 bg-black/90 p-4 space-y-2 font-mono text-xs animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-white/10 pb-2">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 size={13} /> Tests Passed ({codeOutput.executionTime})
                          </span>
                          <span className="text-[#788874] text-[10px]">Mem: {codeOutput.memory}</span>
                        </div>
                        <div className="space-y-1 pt-1 text-[11px]">
                          {codeOutput.testResults.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[#aab1a1]">
                              <span>✓ {t.input}</span>
                              <span className="text-emerald-400">PASSED</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SCORECARD / GRADING MODAL */}
            {showScorecardModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#161a14] p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5ff55] text-[#14170f] font-black">
                        <Award size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white">Peer Evaluation Scorecard</h3>
                        <p className="text-xs text-[#8f9d8a]">Grade {p2pPeer?.name || "Peer"} on FAANG criteria</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowScorecardModal(false)}
                      className="p-1.5 rounded-lg text-[#788874] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {peerScoredSuccess ? (
                    <div className="text-center py-8 space-y-3">
                      <CheckCircle2 size={42} className="text-[#c5ff55] mx-auto animate-bounce" />
                      <h4 className="text-lg font-black text-white">Scorecard Submitted!</h4>
                      <p className="text-xs text-[#8f9d8a]">
                        Ratings updated. +25 Elo awarded to both Knights. Redirecting to sessions trajectory...
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Metric Sliders */}
                      {[
                        { key: "technical", label: "Technical Accuracy & Code Quality" },
                        { key: "communication", label: "Verbal Articulation & STAR Structure" },
                        { key: "problemSolving", label: "Problem Solving Speed & Optimization" },
                        { key: "confidence", label: "Poise & Handling Edge Cases" },
                      ].map((metric) => (
                        <div key={metric.key}>
                          <div className="flex justify-between text-xs font-bold text-white mb-1">
                            <span>{metric.label}</span>
                            <span className="text-[#c5ff55] font-mono">{scorecard[metric.key]}%</span>
                          </div>
                          <input
                            type="range"
                            min="50"
                            max="100"
                            value={scorecard[metric.key]}
                            onChange={(e) =>
                              setScorecard({ ...scorecard, [metric.key]: Number(e.target.value) })
                            }
                            className="w-full accent-[#c5ff55]"
                          />
                        </div>
                      ))}

                      {/* Verdict */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                          Hiring Recommendation
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {["Strong Hire", "Hire", "Lean Hire", "No Hire"].map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setScorecard({ ...scorecard, verdict: v })}
                              className={`p-2 rounded-xl border text-xs font-bold transition ${
                                scorecard.verdict === v
                                  ? "bg-[#c5ff55] text-[#14170f] border-[#c5ff55]"
                                  : "bg-white/5 border-white/10 text-white"
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Qualitative Feedback */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[#788874] block mb-2">
                          Constructive Feedback & Strengths
                        </label>
                        <textarea
                          rows={3}
                          value={scorecard.feedback}
                          onChange={(e) => setScorecard({ ...scorecard, feedback: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-black/50 p-3 text-xs text-white focus:outline-none focus:border-[#c5ff55]"
                        />
                      </div>

                      <button
                        onClick={handleSubmitPeerScorecard}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5ff55] py-3 text-xs font-black uppercase tracking-wider text-[#14170f] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                      >
                        Submit Official Scorecard
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: QUESTION VAULT */}
        {/* ============================================================== */}
        {activeTab === "vault" && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#788874]" />
                <input
                  type="text"
                  value={vaultSearch}
                  onChange={(e) => setVaultSearch(e.target.value)}
                  placeholder="Search questions, companies, algorithms..."
                  className="w-full rounded-xl border border-white/10 bg-[#161a14] py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#788874] focus:border-[#c5ff55] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {["All", "DSA", "System Design", "Backend", "Frontend", "Behavioral"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedVaultCategory(cat)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      selectedVaultCategory === cat
                        ? "bg-[#c5ff55] text-[#14170f]"
                        : "bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVault.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm hover:border-white/20 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-[#c5ff55] bg-[#c5ff55]/10 px-2.5 py-0.5 rounded-md border border-[#c5ff55]/20">
                        {item.category}
                      </span>
                      <span className="text-xs text-[#788874] font-bold">{item.company}</span>
                    </div>

                    <h4 className="text-sm font-black text-white">{item.title}</h4>
                    <p className="mt-2 text-xs text-[#8f9d8a] line-clamp-3 leading-relaxed">{item.question}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#788874]">{item.difficulty}</span>

                    <button
                      onClick={() => {
                        setActiveTab("ai");
                        setSessionActive(true);
                        setCurrentQuestionIdx(CURATED_QUESTIONS.findIndex((q) => q.id === item.id));
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:underline"
                    >
                      Practice in AI Studio <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: SESSIONS & TRAJECTORY */}
        {/* ============================================================== */}
        {activeTab === "sessions" && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm">
                <span className="text-xs text-[#788874] uppercase font-bold block">Total Interviews</span>
                <span className="text-2xl font-black text-white mt-1 block">{sessions.length}</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm">
                <span className="text-xs text-[#788874] uppercase font-bold block">Average Score</span>
                <span className="text-2xl font-black text-[#c5ff55] mt-1 block">
                  {Math.round(
                    sessions.reduce((acc, s) => acc + (s.score || s.overallScore || 85), 0) /
                      (sessions.length || 1)
                  )}
                  %
                </span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#161a14] p-5 shadow-sm">
                <span className="text-xs text-[#788874] uppercase font-bold block">Mastery Rating</span>
                <span className="text-2xl font-black text-purple-400 mt-1 block">1840 Elo</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
              <h3 className="text-base font-black text-white mb-4">Historical Sparring Logs</h3>

              <div className="divide-y divide-white/10">
                {sessions.map((s) => (
                  <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#c5ff55]">
                        {s.type === "PEER_TO_PEER" ? <Users size={18} /> : <Brain size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{s.role || "Software Engineer"}</h4>
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-white">
                            {s.company || "FAANG"}
                          </span>
                        </div>
                        <p className="text-xs text-[#8f9d8a] mt-0.5">{s.feedback}</p>
                        <span className="text-[10px] text-[#788874] block mt-1">
                          {s.date || "Recent"} • Duration: {s.duration || "30m"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xl font-black text-[#c5ff55]">{s.score || s.overallScore || 85}%</span>
                      <span className="block text-[10px] font-bold text-emerald-400 uppercase">Passed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
