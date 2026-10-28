import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  Send,
  X,
  Maximize2,
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
  AlertCircle,
  HelpCircle,
  Flame,
  ChevronRight,
} from "lucide-react";
import { chatApi, liveChatApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const QUICK_PROMPTS = [
  { icon: "⚔️", label: "Arena 1v1 Battle rules", query: "How do 1v1 Speed Coding battles work in Knightzone Arena?" },
  { icon: "🛡️", label: "Contest Proctoring rules", query: "What are the full-screen proctoring and anti-cheat rules for live contests?" },
  { icon: "📄", label: "ATS Resume Tips", query: "How does the Knight ATS Resume Strength Auditor score my resume?" },
  { icon: "⚡", label: "Algorithm complexities", query: "What is the time and space complexity of QuickSort vs MergeSort?" },
  { icon: "🏆", label: "Leaderboard & Ratings", query: "How are rating points and global leaderboard ranks calculated?" },
];

export default function KnightChatWidget() {
  const { user, isAuthenticated } = useAuth();
  const { isNight } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai"); // "ai" | "live"

  // AI Chatbot State
  const [sessionId, setSessionId] = useState(() => {
    const saved = localStorage.getItem("knight_chat_session");
    if (saved) return saved;
    const generated = "sess_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("knight_chat_session", generated);
    return generated;
  });

  const [aiMessages, setAiMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hail, Knight! 🛡️ I am your **Knight AI Companion**. How can I help you today? Ask me about DSA algorithms, coding problems, contest rules, resume auditing, or platform features!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);

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
    if (isOpen) {
      scrollToBottom();
    }
  }, [aiMessages, liveMessages, isOpen, activeTab, isAiTyping]);

  // Load past AI history on mount
  useEffect(() => {
    let isMounted = true;
    chatApi
      .getHistory(sessionId)
      .then((history) => {
        if (!isMounted || !Array.isArray(history) || history.length === 0) return;
        setAiMessages((prev) => {
          const formatted = history.map((h, idx) => ({
            id: `hist-${idx}`,
            sender: h.sender === "user" ? "user" : "bot",
            text: h.text,
            timestamp: h.timestamp,
          }));
          return formatted;
        });
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Load Live Chat Conversations when tab switches to 'live'
  const loadLiveConversations = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await liveChatApi.getMyConversations();
      if (Array.isArray(data)) {
        setMyConversations(data);
        const openConv = data.find((c) => c.status !== "CLOSED");
        if (openConv) {
          setActiveConversation(openConv);
          loadLiveMessages(openConv.id);
        }
      }
    } catch {
      // Ignored for unauthenticated users
    }
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
    if (activeTab === "live" && isOpen && isAuthenticated) {
      loadLiveConversations();
    }
  }, [activeTab, isOpen, isAuthenticated]);

  // Live Chat Auto-polling every 3.5s when active conversation exists
  useEffect(() => {
    if (!isOpen || activeTab !== "live" || !activeConversation || activeConversation.status === "CLOSED") {
      return;
    }
    const interval = setInterval(() => {
      loadLiveMessages(activeConversation.id);
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, activeConversation]);

  // Send AI Message
  const handleSendAiMessage = async (customText = null) => {
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
      const res = await chatApi.sendMessage({
        message: textToSend,
        sessionId,
      });

      const replyText =
        res?.reply ||
        "I have received your query. You can explore our Contest Arena, algorithmic problem bank, or test your ATS resume score in the navigation menu!";

      setAiMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: replyText,
          timestamp: res?.timestamp || new Date().toISOString(),
        },
      ]);
    } catch (err) {
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

      // Fallback response if offline or backend error
      setAiMessages((prev) => [
        ...prev,
        {
          id: "bot-" + Date.now(),
          sender: "bot",
          text: geminiReply || `⚡ **Knight AI:** I received your query regarding "${textToSend}". Here is what you need to know:\n\n- **Contests & Quizzes:** Ensure you are in fullscreen mode with 0 window switches.\n- **ATS Resume Auditor:** Check your weak verbs and quantified metrics.\n- **Arena:** Join queue for rapid 1v1 coding battle.\n\nNeed human help? Switch to the **Live Support** tab above!`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Feedback for AI
  const handleAiFeedback = async (msgId, rating) => {
    try {
      await chatApi.sendFeedback({ sessionId, rating, comment: `Feedback for message ${msgId}` });
      setAiMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: rating } : m))
      );
    } catch {}
  };

  // Copy Message Text
  const handleCopyMessage = (msgId, text) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Create new Live Support Conversation
  const handleCreateSupportTicket = async (e) => {
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
      alert("Failed to start support ticket. Please try again.");
    } finally {
      setIsSendingLive(false);
    }
  };

  // Send message to active Live Conversation
  const handleSendLiveMessage = async (e) => {
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

  // Close Conversation
  const handleCloseConversation = async () => {
    if (!activeConversation) return;
    try {
      await liveChatApi.closeConversation(activeConversation.id);
      setActiveConversation((prev) => ({ ...prev, status: "CLOSED" }));
      setShowFeedbackModal(true);
    } catch (err) {
      alert("Failed to close conversation.");
    }
  };

  // Submit Live Chat Feedback
  const handleSubmitFeedback = async () => {
    if (!activeConversation) return;
    try {
      await liveChatApi.submitFeedback(activeConversation.id, {
        rating: feedbackRating,
        feedback: feedbackText,
      });
      setShowFeedbackModal(false);
      setActiveConversation(null);
      loadLiveConversations();
    } catch {}
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 rounded-full bg-[#121610] p-3.5 pr-5 border border-[#c5ff55]/30 shadow-2xl shadow-[#c5ff55]/15 backdrop-blur-xl hover:border-[#c5ff55] hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {/* Glowing Avatar */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#c5ff55] text-[#0c0f0a] font-black shadow-lg shadow-[#c5ff55]/30 group-hover:rotate-12 transition">
              <Bot size={22} />
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c5ff55] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c5ff55]"></span>
              </span>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  Knight AI & Live Chat
                </span>
                <span className="rounded bg-[#c5ff55]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#c5ff55]">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-[#8f9d8a] flex items-center gap-1">
                <Sparkles size={10} className="text-[#c5ff55]" /> Instant Help & 24/7 Support
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Modal Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[620px] w-[95vw] sm:w-[440px] flex-col rounded-3xl border border-white/15 bg-[#0c0f0a]/95 text-white shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-[#121610] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55]">
                {activeTab === "ai" ? <Bot size={20} /> : <LifeBuoy size={20} />}
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#c5ff55]"></span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    {activeTab === "ai" ? "Knight AI Companion" : "Live Human Support"}
                  </h3>
                  <span className="rounded bg-[#c5ff55]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#c5ff55]">
                    PRO
                  </span>
                </div>
                <div className="text-[10px] text-[#8f9d8a]">
                  {activeTab === "ai"
                    ? "Intelligent DSA, Contests & Career Assistant"
                    : activeConversation
                    ? `Ticket #${activeConversation.id} • ${activeConversation.status}`
                    : "Connect with Staff & Moderators"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                to="/chat"
                title="Expand to Full Page Chat Hub"
                className="rounded-lg p-1.5 text-[#8f9d8a] hover:bg-white/5 hover:text-white transition"
              >
                <Maximize2 size={16} />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-[#8f9d8a] hover:bg-white/5 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-white/10 bg-[#121610]/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "ai"
                  ? "bg-[#c5ff55] text-[#0c0f0a] shadow-sm shadow-[#c5ff55]/20 font-black"
                  : "text-[#8f9d8a] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Bot size={14} /> Knight AI Bot
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("live")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition ${
                activeTab === "live"
                  ? "bg-[#c5ff55] text-[#0c0f0a] shadow-sm shadow-[#c5ff55]/20 font-black"
                  : "text-[#8f9d8a] hover:bg-white/5 hover:text-white"
              }`}
            >
              <LifeBuoy size={14} /> Live Staff Chat
              {activeConversation && activeConversation.status !== "CLOSED" && (
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              )}
            </button>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: KNIGHT AI CHATBOT                                      */}
          {/* ============================================================== */}
          {activeTab === "ai" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
                {aiMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-end gap-2 max-w-[85%]">
                      {msg.sender === "bot" && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#c5ff55]/20 text-[#c5ff55]">
                          <Bot size={13} />
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-4 py-3 text-xs leading-relaxed transition ${
                          msg.sender === "user"
                            ? "bg-[#c5ff55] text-[#0c0f0a] font-semibold rounded-br-none shadow-md"
                            : "bg-[#161a14] text-[#e0e4dc] border border-white/10 rounded-bl-none shadow-md"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Bot Message Actions */}
                        {msg.sender === "bot" && msg.id !== "welcome" && (
                          <div className="mt-2.5 flex items-center justify-between border-t border-white/5 pt-1.5 text-[10px] text-[#788874]">
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyMessage(msg.id, msg.text)}
                                title="Copy to clipboard"
                                className="hover:text-white p-0.5 rounded transition"
                              >
                                {copiedMessageId === msg.id ? <Check size={12} className="text-[#c5ff55]" /> : <Copy size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAiFeedback(msg.id, 1)}
                                title="Helpful answer"
                                className={`p-0.5 rounded transition hover:text-[#c5ff55] ${
                                  msg.feedbackGiven === 1 ? "text-[#c5ff55]" : ""
                                }`}
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAiFeedback(msg.id, -1)}
                                title="Needs improvement"
                                className={`p-0.5 rounded transition hover:text-rose-400 ${
                                  msg.feedbackGiven === -1 ? "text-rose-400" : ""
                                }`}
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
                  <div className="flex items-center gap-2 text-xs text-[#8f9d8a] pl-2">
                    <Bot size={14} className="text-[#c5ff55] animate-bounce" />
                    <span className="font-mono text-[11px]">Knight AI is formulating answer...</span>
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#c5ff55] animate-ping"></span>
                    </span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div className="border-t border-white/5 bg-[#121610]/40 px-3 py-2 overflow-x-auto flex gap-1.5 no-scrollbar">
                {QUICK_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendAiMessage(p.query)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-[#aab1a1] hover:border-[#c5ff55]/40 hover:bg-[#c5ff55]/10 hover:text-white transition"
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
                className="border-t border-white/10 bg-[#121610] p-3 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask Knight AI any coding, contest, or prep question..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim() || isAiTyping}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-40 transition shadow-md shadow-[#c5ff55]/20"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: LIVE HUMAN SUPPORT CHAT                                 */}
          {/* ============================================================== */}
          {activeTab === "live" && (
            <div className="flex flex-1 flex-col overflow-hidden">
              {!isAuthenticated ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <Shield size={36} className="text-[#c5ff55] mb-3" />
                  <h4 className="text-sm font-black text-white">Login Required for Live Support</h4>
                  <p className="text-xs text-[#8f9d8a] max-w-xs mt-1 mb-4 leading-relaxed">
                    Live Human Support connects you directly with Knightzone moderators and mentors. Please login to initiate a session.
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl bg-[#c5ff55] px-4 py-2 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] transition"
                  >
                    Login to Account
                  </Link>
                </div>
              ) : activeConversation ? (
                // Active Live Conversation View
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Ticket Subheader */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-[#161a14] px-4 py-2 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#c5ff55]">
                        #{activeConversation.id}
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 font-bold uppercase text-[9px] text-[#aab1a1]">
                        {activeConversation.category}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase ${
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

                    <div className="flex items-center gap-2">
                      {activeConversation.status !== "CLOSED" && (
                        <button
                          type="button"
                          onClick={handleCloseConversation}
                          className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-400 hover:bg-rose-500/20 transition"
                        >
                          Resolve & Close
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                    {liveMessages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#8f9d8a]">
                        <Clock size={24} className="mx-auto mb-2 text-[#c5ff55] animate-pulse" />
                        Ticket queued! A staff moderator will review and reply shortly.
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
                              {isMe ? "You" : m.senderName || "Support Agent"}
                            </span>
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                                isMe
                                  ? "bg-[#c5ff55] text-[#0c0f0a] font-semibold rounded-br-none"
                                  : "bg-[#161a14] text-white border border-white/10 rounded-bl-none"
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
                    <div className="border-t border-white/10 bg-[#121610] p-3 text-center">
                      <p className="text-xs text-[#8f9d8a] mb-2">This conversation has been closed.</p>
                      <button
                        type="button"
                        onClick={() => setShowNewTicketModal(true)}
                        className="rounded-xl bg-[#c5ff55] px-4 py-1.5 text-xs font-black text-[#0c0f0a]"
                      >
                        Start New Live Chat
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSendLiveMessage}
                      className="border-t border-white/10 bg-[#121610] p-3 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Type message to human support..."
                        value={liveInput}
                        onChange={(e) => setLiveInput(e.target.value)}
                        className="flex-1 rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                      />
                      <button
                        type="submit"
                        disabled={!liveInput.trim() || isSendingLive}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c5ff55] text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-40 transition"
                      >
                        <Send size={15} />
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                // No Active Conversation: Start Screen
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c5ff55]/15 border border-[#c5ff55]/30 text-[#c5ff55] mb-4">
                    <LifeBuoy size={28} />
                  </div>
                  <h4 className="text-base font-black text-white">Live Support Desk</h4>
                  <p className="text-xs text-[#8f9d8a] max-w-xs mt-1 mb-6 leading-relaxed">
                    Have an issue during a contest, question evaluation bug, or rating discrepancy? Our mentors and moderators are here to help.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(true)}
                    className="flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#0c0f0a] shadow-lg shadow-[#c5ff55]/20 hover:bg-[#d5ff83] transition"
                  >
                    <MessageSquare size={14} /> Start Live Support Chat
                  </button>

                  {/* Past tickets list if any */}
                  {myConversations.length > 0 && (
                    <div className="mt-6 w-full text-left">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#788874] block mb-2">
                        Past Conversations ({myConversations.length})
                      </span>
                      <div className="max-h-36 overflow-y-auto space-y-2">
                        {myConversations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setActiveConversation(c);
                              loadLiveMessages(c.id);
                            }}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-2.5 hover:border-[#c5ff55]/40 cursor-pointer transition text-xs"
                          >
                            <div>
                              <div className="font-bold text-white">Ticket #{c.id}</div>
                              <div className="text-[10px] text-[#8f9d8a] truncate max-w-[200px]">
                                {c.summary || c.category}
                              </div>
                            </div>
                            <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] uppercase font-bold text-[#aab1a1]">
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* New Ticket Modal Form */}
          {showNewTicketModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full rounded-3xl border border-white/20 bg-[#161a14] p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Start Support Session
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="text-[#8f9d8a] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#8f9d8a] mb-1">
                      Issue Category
                    </label>
                    <select
                      value={newTicketForm.category}
                      onChange={(e) =>
                        setNewTicketForm({ ...newTicketForm, category: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white focus:outline-none focus:border-[#c5ff55]"
                    >
                      <option value="GENERAL_QUERY" className="bg-[#161a14]">General Query / Question</option>
                      <option value="CONTEST_ISSUE" className="bg-[#161a14]">Live Contest / Code Judge Issue</option>
                      <option value="BUG_REPORT" className="bg-[#161a14]">Bug Report / Glitch</option>
                      <option value="ACCOUNT_BILLING" className="bg-[#161a14]">Account / Rating Discrepancy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#8f9d8a] mb-1">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["NORMAL", "HIGH", "URGENT"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewTicketForm({ ...newTicketForm, priority: p })}
                          className={`rounded-xl border py-1.5 text-[10px] font-black uppercase transition ${
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
                      Brief Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Briefly state what you need help with..."
                      value={newTicketForm.summary}
                      onChange={(e) =>
                        setNewTicketForm({ ...newTicketForm, summary: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white placeholder-[#5a6b56] focus:outline-none focus:border-[#c5ff55]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTicketModal(false)}
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-bold text-[#8f9d8a] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateSupportTicket}
                    disabled={!newTicketForm.summary.trim() || isSendingLive}
                    className="flex-1 rounded-xl bg-[#c5ff55] py-2 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-50"
                  >
                    Start Chat
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Modal */}
          {showFeedbackModal && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full rounded-3xl border border-white/20 bg-[#161a14] p-5 shadow-2xl text-center space-y-4">
                <Check size={28} className="mx-auto text-[#c5ff55]" />
                <h4 className="text-sm font-black text-white">Chat Resolved! How was the support?</h4>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 text-amber-400 hover:scale-125 transition"
                    >
                      <Star
                        size={20}
                        className={star <= feedbackRating ? "fill-amber-400" : "text-[#5a6b56]"}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  placeholder="Optional review feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/50 p-2 text-xs text-white placeholder-[#5a6b56] focus:outline-none focus:border-[#c5ff55]"
                />
                <button
                  type="button"
                  onClick={handleSubmitFeedback}
                  className="w-full rounded-xl bg-[#c5ff55] py-2 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83]"
                >
                  Submit & Finish
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
