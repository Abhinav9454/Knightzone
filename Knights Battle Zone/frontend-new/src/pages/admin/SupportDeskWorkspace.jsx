import React, { useState, useEffect, useRef } from "react";
import {
  LifeBuoy,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  User,
  Shield,
  RefreshCw,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { liveChatApi } from "../../services/api";

export default function SupportDeskWorkspace({
  supportQueue = [],
  onRefresh = () => {},
  showNotification = () => {},
  currentUser = null,
}) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticketMessages]);

  const handleSelectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const msgs = await liveChatApi.getMessages(ticket.id);
      setTicketMessages(Array.isArray(msgs) ? msgs : []);
    } catch {
      setTicketMessages([]);
    }
  };

  // Auto poll messages if ticket selected
  useEffect(() => {
    if (!selectedTicket || selectedTicket.status === "CLOSED") return;
    const interval = setInterval(async () => {
      try {
        const msgs = await liveChatApi.getMessages(selectedTicket.id);
        if (Array.isArray(msgs)) {
          setTicketMessages(msgs);
        }
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleAssignToMe = async (ticketId) => {
    try {
      await liveChatApi.assignConversation(ticketId);
      showNotification(`Ticket #${ticketId} assigned to you.`);
      onRefresh();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => ({
          ...prev,
          status: "ASSIGNED",
          assignedAgentName: currentUser?.name || "Staff Admin",
        }));
      }
    } catch {
      showNotification("Failed to assign ticket", true);
    }
  };

  const handleSendReply = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!adminReplyText.trim() || !selectedTicket || sendingReply) return;
    try {
      setSendingReply(true);
      const sent = await liveChatApi.sendMessage(selectedTicket.id, {
        message: adminReplyText.trim(),
        messageType: "TEXT",
      });
      setTicketMessages((prev) => [...prev, sent]);
      setAdminReplyText("");
      showNotification("Staff reply dispatched to user!");
    } catch (err) {
      showNotification("Failed to send message: " + (err.response?.data?.message || err.message), true);
    } finally {
      setSendingReply(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    try {
      await liveChatApi.closeConversation(ticketId);
      showNotification(`Ticket #${ticketId} resolved and closed.`);
      onRefresh();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => ({ ...prev, status: "CLOSED" }));
      }
    } catch {
      showNotification("Failed to close ticket", true);
    }
  };

  const filteredQueue = supportQueue.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const waitingCount = supportQueue.filter((t) => t.status === "WAITING").length;
  const assignedCount = supportQueue.filter((t) => t.status === "ASSIGNED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <LifeBuoy size={22} className="text-[#c5ff55]" /> Live Support & Moderation Desk
          </h2>
          <p className="text-xs text-[#aab1a1] mt-0.5">
            Real-time incoming support tickets from live coding contests, code judge evaluation, and user queries.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
        >
          <RefreshCw size={14} className="text-[#c5ff55]" /> Refresh Queue
        </button>
      </div>

      {/* 2-Columns Desk Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left: Queue List (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#161a14] p-5 flex flex-col space-y-4 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#788874]">
              Active Tickets Queue ({supportQueue.length})
            </span>
            <div className="flex gap-1 text-[10px] font-bold">
              {["ALL", "WAITING", "ASSIGNED", "CLOSED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-2 py-0.5 uppercase transition ${
                    statusFilter === s
                      ? "bg-[#c5ff55] text-[#0c0f0a] font-black"
                      : "bg-white/5 text-[#aab1a1] hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/10">
            {filteredQueue.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#8f9d8a]">
                <CheckCircle2 size={36} className="mx-auto mb-2 text-[#c5ff55]" />
                No tickets matching current filter. All users are assisted!
              </div>
            ) : (
              filteredQueue.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTicket(t)}
                  className={`rounded-2xl border p-4 cursor-pointer transition ${
                    selectedTicket?.id === t.id
                      ? "border-[#c5ff55] bg-[#c5ff55]/10 shadow-lg"
                      : "border-white/10 bg-black/40 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#c5ff55]">#{t.id}</span>
                      <span className="font-bold text-xs text-white truncate max-w-[150px]">
                        {t.requesterName || "User #" + t.requesterUserId}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                        t.status === "WAITING"
                          ? "bg-amber-400/20 text-amber-400 border border-amber-400/30"
                          : t.status === "ASSIGNED"
                          ? "bg-emerald-400/20 text-emerald-400 border border-emerald-400/30"
                          : "bg-white/10 text-[#8f9d8a]"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <p className="text-xs text-[#e0e4dc] line-clamp-2 leading-relaxed mb-3">
                    {t.summary || t.category}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#788874] border-t border-white/5 pt-2">
                    <span className="font-bold uppercase text-[#aab1a1]">{t.category}</span>
                    <span className="font-mono">{t.priority} priority</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Response Console (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#161a14] flex flex-col shadow-xl overflow-hidden">
          {selectedTicket ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-[#121610] px-6 py-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-black text-white">
                      Ticket #{selectedTicket.id} • {selectedTicket.requesterName}
                    </h3>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase text-[#c5ff55]">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#8f9d8a] mt-0.5">
                    Assigned Agent: <strong className="text-white">{selectedTicket.assignedAgentName || "Unassigned"}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {selectedTicket.status === "WAITING" && (
                    <button
                      type="button"
                      onClick={() => handleAssignToMe(selectedTicket.id)}
                      className="rounded-xl bg-[#c5ff55] px-3.5 py-1.5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] transition"
                    >
                      Assign to Me
                    </button>
                  )}
                  {selectedTicket.status !== "CLOSED" && (
                    <button
                      type="button"
                      onClick={() => handleCloseTicket(selectedTicket.id)}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                    >
                      Resolve & Close
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10">
                {ticketMessages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[#8f9d8a]">
                    No messages in this ticket yet.
                  </div>
                ) : (
                  ticketMessages.map((m) => {
                    const isStaff = m.senderType === "AGENT";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isStaff ? "items-end" : "items-start"}`}
                      >
                        <span className="text-[10px] text-[#788874] mb-1 px-1">
                          {isStaff ? "Staff Moderator" : m.senderName || "User"}
                        </span>
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                            isStaff
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

              {/* Reply Bar */}
              {selectedTicket.status === "CLOSED" ? (
                <div className="border-t border-white/10 bg-[#121610] p-4 text-center text-xs text-[#8f9d8a]">
                  This support ticket is resolved and closed.
                </div>
              ) : (
                <form
                  onSubmit={handleSendReply}
                  className="border-t border-white/10 bg-[#121610] p-4 flex items-center gap-3"
                >
                  <input
                    type="text"
                    placeholder="Type official staff response to the user..."
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 text-xs text-white placeholder-[#5a6b56] focus:border-[#c5ff55] focus:outline-none transition"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim() || sendingReply}
                    className="flex h-11 items-center gap-2 rounded-2xl bg-[#c5ff55] px-5 text-xs font-black uppercase text-[#0c0f0a] hover:bg-[#d5ff83] disabled:opacity-40 transition shadow-md shadow-[#c5ff55]/20"
                  >
                    <Send size={15} /> Send Reply
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-[#8f9d8a]">
              <MessageSquare size={42} className="text-[#5a6b56] mb-3" />
              <h4 className="text-base font-bold text-white">Select a Ticket from the Queue</h4>
              <p className="text-xs max-w-sm mt-1 leading-relaxed">
                Click any incoming user support ticket on the left to read their inquiry, assign moderator, and reply directly.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
