import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Send,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Check,
  Copy,
  RotateCcw,
  LifeBuoy,
  Clock,
  Star,
  User,
  Shield,
  HelpCircle,
  Download,
  Trash2,
  AlertTriangle,
  Code2,
  Terminal,
  Activity,
  Zap,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import { chatApi, liveChatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const QUICK_KNOWLEDGE_TOPICS = [
  {
    title: "Live Contest Fullscreen & Anti-Cheat",
    query: "How does the anti-cheat and fullscreen proctoring work during live contests?",
    category: "Contests",
  },
  {
    title: "1v1 Speed Coding Arena Rules",
    query: "What are the rules and forfeit conditions in Knightzone 1v1 Arena?",
    category: "Arena",
  },
  {
    title: "ATS Resume Auditor Scoring",
    query: "How does the Knight ATS Resume Strength Auditor calculate the recruiter screening %?",
    category: "Resume",
  },
  {
    title: "Dynamic Programming Guide",
    query: "Can you explain the memoization vs tabulation approach in Dynamic Programming with an example?",
    category: "DSA",
  },
  {
    title: "Graph Traversal: BFS vs DFS",
    query: "When should I use BFS vs DFS in competitive programming?",
    category: "DSA",
  },
  {
    title: "Mock Interview Technical Prep",
    query: "What are the top 5 technical concepts asked in senior full-stack developer interviews?",
    category: "Career",
  },
];

export default function LiveChatHub() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();

  const [activeChannel, setActiveChannel] = useState("ai"); // "ai" | "live" | "faqs"

  // AI Chat State
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem("knight_chat_session");
    if (saved) return saved;
    const generated = "sess_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("knight_chat_session", generated);
    return generated;
  });

  const [aiMessages, setAiMessages] = useState([
    {
      id: "welcome-hub",
      sender: "bot",
      text: "⚔️ **Welcome to Knightzone Command Hub & Intelligence Center!**\n\nI am your dedicated **Knight AI Companion**. You can query me on algorithm design, contest problem analysis, live quiz strategies, resume screening criteria, or platform support.\n\nType your query below or pick a topic from the sidebar!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Live Support State
  const [myConversations, setMyConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const [liveInput, setLiveInput] = useState("");
  const [isSendingLive, setIsSendingLive] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState({
    category: "GENERAL_QUERY",
    priority: "NORMAL",
    summary: "",
  });
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, liveMessages, isAiTyping, activeChannel]);

  // Load past AI history
  useEffect(() => {
    chatApi
      .getHistory(sessionId)
      .then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          setAiMessages(
            history.map((h, idx) => ({
              id: `hist-${idx}`,
              sender: h.sender === "user" ? "user" : "bot",
              text: h.text,
              timestamp: h.timestamp,
            }))
          );
        }
      })
      .catch(() => {});
  }, [sessionId]);

  // Load Live Conversations
  const loadConversations = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await liveChatApi.getMyConversations();
      if (Array.isArray(data)) {
        setMyConversations(data);
        if (!activeConversation && data.length > 0) {
          const openOne = data.find((c) => c.status !== "CLOSED") || data[0];
          setActiveConversation(openOne);
          loadLiveMessages(openOne.id);
        }
      }
    } catch {}
  };

  const loadLiveMessages = async (convId) => {
    try {
      const msgs = await liveChatApi.getMessages(convId);
      if (Array.isArray(msgs)) {
        setLiveMessages(msgs);
      }
    } catch {}
  };

  useEffect(() => {
    if (activeChannel === "live" && isAuthenticated) {
      loadConversations();
    }
  }, [activeChannel, isAuthenticated]);

  // Auto polling for live conversation
  useEffect(() => {
    if (activeChannel !== "live" || !activeConversation || activeConversation.status === "CLOSED") {
      return;
    }
    const interval = setInterval(() => {
      loadLiveMessages(activeConversation.id);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeChannel, activeConversation]);

  // Send AI Message
  const handleSendAi = async (customText = null) => {
    const textToSend = (customText || aiInput).trim();
    if (!textToSend || isAiTyping) return;

    const userMsg = {
      id: "user-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    if (!customText) setAiInput("");
    setIsAiTyping(true);

    try {
      const res = await chatApi.sendMessage({ message: textToSend, sessionId });
      setAiMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: res?.reply || "I have received your inquiry.",
          timestamp: res?.timestamp || new Date().toISOString(),
        },
      ]);
    } catch {
      let geminiReply = null;
      const key = import.meta.env.VITE_GEMINI_API_KEY;
      if (key) {
        try {
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: textToSend }] }],
              }),
            }
          );
          if (geminiRes.ok) {
            const data = await geminiRes.json();
            geminiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          }
        } catch (e) {
          console.warn("Direct Gemini fallback error:", e);
        }
      }

      setAiMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: geminiReply || `⚡ **Knight AI:** Regarding "${textToSend}":\n- **Live Contests:** Strict full-screen anti-cheat enforced (>3 window blurs results in forfeit).\n- **Resume Auditor:** Live HR criteria with power verbs upgrade.\n- **Need human support?** Select **Live Staff Support Desk** from the left panel!`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Clear AI chat
  const handleClearAi = () => {
    if (!window.confirm("Clear current AI chat history?")) return;
    const newSess = "sess_" + Math.random().toString(36).slice(2, 10);
    setSessionId(newSess);
    localStorage.setItem("knight_chat_session", newSess);
    setAiMessages([
      {
        id: "welcome-fresh",
        sender: "bot",
        text: "Chat cleared! How can I assist you with code, contests, or resumes today?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  // Export AI Chat as TXT
  const handleExportChat = () => {
    const text = aiMessages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.sender.toUpperCase()}:\n${m.text}\n`
      )
      .join("\n----------------------------------------\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knightzone_chat_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create Support Ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    try {
      setIsSendingLive(true);
      const conv = await liveChatApi.createConversation({
        category: newTicketForm.category,
        priority: newTicketForm.priority,
        summary: newTicketForm.summary.trim(),
        sourcePage: window.location.pathname,
      });
      setShowNewTicketModal(false);
      setNewTicketForm({ category: "GENERAL_QUERY", priority: "NORMAL", summary: "" });
      setActiveConversation(conv);
      setMyConversations((prev) => [conv, ...prev]);
      loadLiveMessages(conv.id);
    } catch (err) {
      alert("Failed to create ticket.");
    } finally {
      setIsSendingLive(false);
    }
  };

  // Send message in live chat
  const handleSendLive = async (e) => {
    e.preventDefault();
    if (!liveInput.trim() || !activeConversation || isSendingLive) return;
    try {
      setIsSendingLive(true);
      const sent = await liveChatApi.sendMessage(activeConversation.id, {
        message: liveInput.trim(),
        messageType: "TEXT",
      });
      setLiveMessages((prev) => [...prev, sent]);
      setLiveInput("");
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSendingLive(false);
    }
  };

  // Close live ticket
  const handleCloseTicket = async () => {
    if (!activeConversation) return;
    try {
      await liveChatApi.closeConversation(activeConversation.id);
      setActiveConversation((prev) => ({ ...prev, status: "CLOSED" }));
      setShowFeedbackModal(true);
    } catch {
      alert("Failed to close conversation.");
    }
  };

  // Submit feedback
  const handleSubmitFeedback = async () => {
    if (!activeConversation) return;
    try {
      await liveChatApi.submitFeedback(activeConversation.id, {
        rating: feedbackRating,
        feedback: feedbackText,
      });
      setShowFeedbackModal(false);
      setActiveConversation(null);
      loadConversations();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#0c0f0a] text-white">
      {/* Top Banner / Header */}
      <div className="border-b border-white/10 bg-[#121610]/95 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55] shadow-lg shadow-[#c5ff55]/20">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  Knight Intelligence & Support Hub
                </h1>
                <span className="rounded-full bg-[#c5ff55]/15 px-2 py-0.5 text-[10px] font-black text-[#c5ff55] border border-[#c5ff55]/30 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c5ff55] animate-ping"></span>
                  LIVE ENGINE
                </span>
              </div>
              <p className="text-xs text-[#8f9d8a]">
                AI-Powered Code & Algorithmic Companion • Human Moderator Live Support
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportChat}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-[#aab1a1] hover:bg-white/10 hover:text-white transition"
            >
              <Download size={14} /> Export Log
            </button>
            <button
              type="button"
              onClick={handleClearAi}
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
            >
              <RotateCcw size={14} /> New Session
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: 3 Columns Layout */}
      <div className="mx-auto max-w-7xl p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[640px]">
          {/* ============================================================== */}
          {/* LEFT COLUMN: Channels & Tickets Navigation (3 cols)            */}
          {/* ============================================================== */}
          <div className="lg:col-span-3 flex flex-col rounded-3xl border border-white/10 bg-[#121610] p-4 shadow-xl space-y-5 overflow-hidden">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block mb-2 px-1">
                Communication Channels
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setActiveChannel("ai")}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition ${
                    activeChannel === "ai"
                      ? "bg-[#c5ff55] text-[#0c0f0a] shadow-md shadow-[#c5ff55]/20 font-black"
                      : "text-[#aab1a1] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Bot size={18} />
                    <span>Knight AI Assistant</span>
                  </div>
                  <span className="rounded bg-black/20 px-1.5 py-0.5 text-[9px] uppercase font-mono">
                    24/7
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveChannel("live")}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition ${
                    activeChannel === "live"
                      ? "bg-[#c5ff55] text-[#0c0f0a] shadow-md shadow-[#c5ff55]/20 font-black"
                      : "text-[#aab1a1] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LifeBuoy size={18} />
                    <span>Live Staff Support</span>
                  </div>
                  {activeConversation && activeConversation.status !== "CLOSED" && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveChannel("faqs")}
                  className={`w-full flex items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition ${
                    activeChannel === "faqs"
                      ? "bg-[#c5ff55] text-[#0c0f0a] shadow-md shadow-[#c5ff55]/20 font-black"
                      : "text-[#aab1a1] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={18} />
                    <span>Knowledge & FAQs</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Support Tickets List if in Live Mode */}
            {activeChannel === "live" && (
              <div className="flex-1 flex flex-col overflow-hidden border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
                    Your Support Tickets
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(true)}
                    className="flex items-center gap-1 text-[10px] font-black text-[#c5ff55] hover:underline"
                  >
                    <Plus size={12} /> New Ticket
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {myConversations.length === 0 ? (
                    <div className="py-6 text-center text-[11px] text-[#8f9d8a]">
                      No tickets open. Click "New Ticket" to chat with human staff.
                    </div>
                  ) : (
                    myConversations.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setActiveConversation(c);
                          loadLiveMessages(c.id);
                        }}
                        className={`rounded-2xl border p-3 cursor-pointer transition text-xs ${
                          activeConversation?.id === c.id
                            ? "border-[#c5ff55] bg-[#c5ff55]/10"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-white">Ticket #{c.id}</span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
                              c.status === "WAITING"
                                ? "bg-amber-400/20 text-amber-400"
                                : c.status === "ASSIGNED"
                                ? "bg-emerald-400/20 text-emerald-400"
                                : "bg-white/10 text-[#8f9d8a]"
                            }`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#8f9d8a] line-clamp-1">
                          {c.summary || c.category}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* System Status Footnote */}
            <div className="mt-auto border-t border-white/10 pt-3 text-[10px] text-[#788874] space-y-1">
              <div className="flex items-center justify-between">
                <span>AI Gateway</span>
                <span className="font-bold text-[#c5ff55]">OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Support Queue</span>
                <span className="font-bold text-[#aab1a1]">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Session ID</span>
                <span className="font-mono text-[#aab1a1] truncate max-w-[100px]">{sessionId}</span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CENTER COLUMN: Main Chat Conversation View (6 cols)            */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 flex flex-col rounded-3xl border border-white/10 bg-[#161a14] shadow-xl overflow-hidden">
            {/* ----------------- AI CHATBOT MODE ----------------- */}
            {activeChannel === "ai" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Chat Feed */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {aiMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-end gap-2.5 max-w-[88%]">
                        {msg.sender === "bot" && (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55]">
                            <Bot size={15} />
                          </div>
                        )}

                        <div
                          className={`rounded-2xl p-4 text-xs leading-relaxed transition ${
                            msg.sender === "user"
                              ? "bg-[#c5ff55] text-[#0c0f0a] font-semibold rounded-br-none shadow-md shadow-[#c5ff55]/15"
                              : "bg-[#121610] text-[#e0e4dc] border border-white/10 rounded-bl-none shadow-lg"
                          }`}
                        >
                          <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                          {msg.sender === "bot" && (
                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-[#788874]">
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(msg.text);
                                    setCopiedId(msg.id);
                                    setTimeout(() => setCopiedId(null), 2000);
                                  }}
                                  className="hover:text-white p-1 rounded transition"
                                  title="Copy text"
                                >
                                  {copiedId === msg.id ? (
                                    <Check size={12} className="text-[#c5ff55]" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    chatApi.sendFeedback({ sessionId, rating: 1, comment: "Good" })
                                  }
                                  className="hover:text-[#c5ff55] p-1 rounded transition"
                                  title="Helpful"
                                >
                                  <ThumbsUp size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    chatApi.sendFeedback({ sessionId, rating: -1, comment: "Needs work" })
                                  }
                                  className="hover:text-rose-400 p-1 rounded transition"
                                  title="Not helpful"
                                >
                                  <ThumbsDown size={12} />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isAiTyping && (
                    <div className="flex items-center gap-2.5 text-xs text-[#8f9d8a] pl-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#c5ff55]/15 text-[#c5ff55]">
                        <Bot size={15} className="animate-spin" />
                      </div>
                      <span className="font-mono text-xs">Knight AI is thinking & coding...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendAi();
                  }}
                  className="border-t border-white/10 bg-[#121610] p-4 flex items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder="Ask about DSA, contests, resume audits, or coding tips..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!aiInput.trim() || isAiTyping}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-40 transition shadow-lg shadow-[#c5ff55]/20"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* ----------------- LIVE STAFF SUPPORT MODE ----------------- */}
            {activeChannel === "live" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                {!isAuthenticated ? (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <Shield size={42} className="text-[#c5ff55] mb-3" />
                    <h3 className="text-base font-black text-white">Authentication Required</h3>
                    <p className="text-xs text-[#8f9d8a] max-w-sm mt-1 mb-6 leading-relaxed">
                      Please sign in with your Knightzone account to open a direct live channel with our mentors and technical support staff.
                    </p>
                    <Link
                      to="/login"
                      className="rounded-2xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] transition"
                    >
                      Login Now
                    </Link>
                  </div>
                ) : activeConversation ? (
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Ticket Header Bar */}
                    <div className="flex items-center justify-between border-b border-white/10 bg-[#121610] px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-[#c5ff55]">
                          #{activeConversation.id}
                        </span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-[#aab1a1]">
                          {activeConversation.category}
                        </span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                            activeConversation.status === "WAITING"
                              ? "bg-amber-400/20 text-amber-400"
                              : activeConversation.status === "ASSIGNED"
                              ? "bg-emerald-400/20 text-emerald-400"
                              : "bg-white/10 text-[#8f9d8a]"
                          }`}
                        >
                          {activeConversation.status}
                        </span>
                      </div>

                      {activeConversation.status !== "CLOSED" && (
                        <button
                          type="button"
                          onClick={handleCloseTicket}
                          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          Resolve & Close Ticket
                        </button>
                      )}
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
                      {liveMessages.length === 0 ? (
                        <div className="py-12 text-center text-xs text-[#8f9d8a]">
                          <Clock size={28} className="mx-auto mb-2 text-[#c5ff55] animate-pulse" />
                          Waiting for staff response. A mentor will join your ticket shortly.
                        </div>
                      ) : (
                        liveMessages.map((m) => {
                          const isMe = m.senderType === "USER";
                          return (
                            <div
                              key={m.id}
                              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                              <span className="text-[10px] text-[#788874] mb-1 px-1">
                                {isMe ? "You" : m.senderName || "Support Moderator"}
                              </span>
                              <div
                                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                                  isMe
                                    ? "bg-[#c5ff55] text-[#0c0f0a] font-semibold rounded-br-none shadow-md"
                                    : "bg-[#121610] text-white border border-white/10 rounded-bl-none shadow-md"
                                }`}
                              >
                                {m.messageText}
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input or Closed Notice */}
                    {activeConversation.status === "CLOSED" ? (
                      <div className="border-t border-white/10 bg-[#121610] p-4 text-center">
                        <p className="text-xs text-[#8f9d8a] mb-2">This support session is closed.</p>
                        <button
                          type="button"
                          onClick={() => setShowNewTicketModal(true)}
                          className="rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black text-[#0c0f0a]"
                        >
                          Open Another Ticket
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleSendLive}
                        className="border-t border-white/10 bg-[#121610] p-4 flex items-center gap-3"
                      >
                        <input
                          type="text"
                          placeholder="Type response to staff support..."
                          value={liveInput}
                          onChange={(e) => setLiveInput(e.target.value)}
                          className="flex-1 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                        />
                        <button
                          type="submit"
                          disabled={!liveInput.trim() || isSendingLive}
                          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-40 transition"
                        >
                          <Send size={16} />
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                    <LifeBuoy size={42} className="text-[#c5ff55] mb-3" />
                    <h3 className="text-base font-black text-white">Live Staff Support Desk</h3>
                    <p className="text-xs text-[#8f9d8a] max-w-sm mt-1 mb-6 leading-relaxed">
                      Connect with human organizers, judges, and mentors for immediate support during live coding contests or platform queries.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowNewTicketModal(true)}
                      className="rounded-2xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] shadow-lg shadow-[#c5ff55]/20 transition"
                    >
                      Create Support Ticket
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ----------------- FAQS & KNOWLEDGE MODE ----------------- */}
            {activeChannel === "faqs" && (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-white mb-2">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {QUICK_KNOWLEDGE_TOPICS.map((topic, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/10 bg-[#121610] p-4 hover:border-[#c5ff55]/40 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{topic.title}</span>
                        <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] uppercase font-bold text-[#c5ff55]">
                          {topic.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#8f9d8a] mb-3">{topic.query}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChannel("ai");
                          handleSendAi(topic.query);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#c5ff55] hover:underline"
                      >
                        Ask Knight AI <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: Quick Prompts & Platform Guidelines (3 cols)    */}
          {/* ============================================================== */}
          <div className="lg:col-span-3 flex flex-col rounded-3xl border border-white/10 bg-[#121610] p-5 shadow-xl space-y-5 overflow-y-auto">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block mb-2">
                Quick Prompts
              </span>
              <div className="space-y-2">
                {QUICK_KNOWLEDGE_TOPICS.slice(0, 4).map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveChannel("ai");
                      handleSendAi(t.query);
                    }}
                    className="w-full text-left rounded-2xl border border-white/10 bg-white/5 p-3 hover:border-[#c5ff55]/40 hover:bg-[#c5ff55]/5 transition group"
                  >
                    <div className="text-xs font-bold text-white group-hover:text-[#c5ff55] transition">
                      {t.title}
                    </div>
                    <div className="text-[10px] text-[#788874] mt-0.5 line-clamp-1">{t.query}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block">
                Platform Navigation
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <Link
                  to="/contests"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[#aab1a1] hover:text-[#c5ff55] hover:border-[#c5ff55]/30 transition"
                >
                  Contests
                </Link>
                <Link
                  to="/arena"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[#aab1a1] hover:text-[#c5ff55] hover:border-[#c5ff55]/30 transition"
                >
                  1v1 Arena
                </Link>
                <Link
                  to="/quizzes"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[#aab1a1] hover:text-[#c5ff55] hover:border-[#c5ff55]/30 transition"
                >
                  Quizzes
                </Link>
                <Link
                  to="/resume-strength"
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center text-[#aab1a1] hover:text-[#c5ff55] hover:border-[#c5ff55]/30 transition"
                >
                  ATS Auditor
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block mb-2">
                🛡️ Live Proctoring Policy
              </span>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-[11px] text-[#aab1a1] space-y-1.5 leading-relaxed">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Strict 3-Strike Rule
                </div>
                <div>Exiting full-screen or switching tabs 3 times triggers permanent disqualification from live contests & quizzes.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#161a14] p-6 shadow-2xl space-y-4">
            <h4 className="text-sm font-black uppercase tracking-wider text-white">
              Open Support Ticket
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[#8f9d8a] mb-1">
                  Category
                </label>
                <select
                  value={newTicketForm.category}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, category: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white"
                >
                  <option value="GENERAL_QUERY" className="bg-[#161a14]">General Query</option>
                  <option value="CONTEST_ISSUE" className="bg-[#161a14]">Contest / Problem Issue</option>
                  <option value="BUG_REPORT" className="bg-[#161a14]">Bug Report</option>
                  <option value="ACCOUNT_BILLING" className="bg-[#161a14]">Account / Rating</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#8f9d8a] mb-1">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["NORMAL", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTicketForm({ ...newTicketForm, priority: p })}
                      className={`rounded-xl border py-2 text-xs font-black uppercase transition ${
                        newTicketForm.priority === p
                          ? "border-[#c5ff55] bg-[#c5ff55]/20 text-[#c5ff55]"
                          : "border-white/10 bg-white/5 text-[#8f9d8a]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[#8f9d8a] mb-1">
                  Issue Summary *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your issue in detail..."
                  value={newTicketForm.summary}
                  onChange={(e) => setNewTicketForm({ ...newTicketForm, summary: e.target.value })}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white placeholder-[#5a6b56]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-[#8f9d8a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTicket}
                disabled={!newTicketForm.summary.trim() || isSendingLive}
                className="flex-1 rounded-xl bg-[#c5ff55] py-2.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-50"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#161a14] p-6 text-center space-y-4 shadow-2xl">
            <Check size={36} className="mx-auto text-[#c5ff55]" />
            <h4 className="text-base font-black text-white">Ticket Resolved!</h4>
            <p className="text-xs text-[#8f9d8a]">How would you rate the support received?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFeedbackRating(star)}
                  className="p-1 text-amber-400 hover:scale-125 transition"
                >
                  <Star
                    size={24}
                    className={star <= feedbackRating ? "fill-amber-400" : "text-[#5a6b56]"}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              placeholder="Optional remarks..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-black/50 p-3 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleSubmitFeedback}
              className="w-full rounded-xl bg-[#c5ff55] py-2.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83]"
            >
              Submit & Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
