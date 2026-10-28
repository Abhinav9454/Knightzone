import React, { useState } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { adminApi } from "../../services/api";
import { useTheme } from "../../context/ThemeContext";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";

export default function UsersWorkspace({
  usersList = [],
  onRefresh = () => {},
  showNotification = () => {},
  currentUser = null,
}) {
  const { isNight } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [demoteConfirmTarget, setDemoteConfirmTarget] = useState(null);

  const handleToggleUserRole = (usr) => {
    const newRole = (usr.role || "USER").toUpperCase() === "ADMIN" ? "USER" : "ADMIN";
    if (usr.id === currentUser?.id && newRole === "USER") {
      setDemoteConfirmTarget(usr);
      return;
    }
    executeRoleChange(usr, newRole);
  };

  const executeRoleChange = async (usr, newRole) => {
    try {
      setUpdatingUserId(usr.id);
      await adminApi.updateUserRole(usr.id, newRole);
      showNotification(`User "${usr.name || usr.username}" is now ${newRole}!`);
      setDemoteConfirmTarget(null);
      onRefresh();
    } catch (err) {
      showNotification(err.response?.data?.message || "Failed to update role", true);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.college || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || (u.role || "USER").toUpperCase() === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = usersList.filter((u) => (u.role || "USER").toUpperCase() === "ADMIN").length;
  const standardCount = usersList.length - adminCount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2.5 ${isNight ? "text-white" : "text-slate-900"}`}>
            <Users size={22} className={isNight ? "text-[#c5ff55]" : "text-emerald-700"} /> Registered Knights & Role Permissions
          </h2>
          <p className={`text-xs mt-0.5 ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>
            Manage user accounts, assign Administrator privileges, and review college representation.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
            isNight
              ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          <RefreshCw size={14} className={isNight ? "text-[#c5ff55]" : "text-emerald-600"} /> Sync Users List
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-[#788874]" : "text-slate-500"}`}>Total Knights Registered</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-slate-900"}`}>{usersList.length}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-purple-500/20 bg-purple-500/5" : "border-purple-200 bg-purple-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-purple-400" : "text-purple-700"}`}>Platform Administrators</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-purple-950"}`}>{adminCount}</div>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${isNight ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50"}`}>
          <div className={`text-[11px] font-bold ${isNight ? "text-emerald-400" : "text-emerald-700"}`}>Standard Competitive Users</div>
          <div className={`text-2xl font-black mt-1 ${isNight ? "text-white" : "text-emerald-950"}`}>{standardCount}</div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border p-3 shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <div className="relative flex-1">
          <Search size={15} className={`absolute left-3.5 top-3 ${isNight ? "text-[#5a6b56]" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder="Search by name, email, or college..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-xl border pl-10 pr-4 py-2 text-xs focus:outline-none transition ${
              isNight
                ? "border-white/10 bg-black/40 text-white placeholder-[#5a6b56] focus:border-[#c5ff55]"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-emerald-600"
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {["ALL", "USER", "ADMIN"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                roleFilter === r
                  ? isNight
                    ? "bg-[#c5ff55] text-[#0c0f0a] font-black"
                    : "bg-emerald-600 text-white font-black"
                  : isNight
                  ? "bg-white/5 border border-white/10 text-[#aab1a1] hover:text-white"
                  : "bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${
        isNight ? "border-white/10 bg-[#161a14]" : "border-slate-200 bg-white"
      }`}>
        <table className="w-full text-left text-xs">
          <thead className={`border-b font-bold uppercase tracking-wider ${
            isNight ? "border-white/10 bg-black/40 text-[#788874]" : "border-slate-200 bg-slate-50 text-slate-500"
          }`}>
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Email</th>
              <th className="p-4">College / Affiliation</th>
              <th className="p-4">Skill Rating</th>
              <th className="p-4">Current Role</th>
              <th className="p-4 text-right">Switch Authority</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isNight ? "divide-white/5" : "divide-slate-100"}`}>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className={`py-12 text-center ${isNight ? "text-[#8f9d8a]" : "text-slate-500"}`}>
                  No users found matching search criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((usr) => {
                const isAdmin = (usr.role || "USER").toUpperCase() === "ADMIN";
                return (
                  <tr key={usr.id} className={`transition ${isNight ? "hover:bg-white/[0.02]" : "hover:bg-slate-50"}`}>
                    <td className={`p-4 font-bold ${isNight ? "text-white" : "text-slate-900"}`}>{usr.name || usr.username}</td>
                    <td className={`p-4 font-mono ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>{usr.email}</td>
                    <td className={`p-4 ${isNight ? "text-[#aab1a1]" : "text-slate-600"}`}>{usr.college || "Independent"}</td>
                    <td className={`p-4 font-mono font-bold ${isNight ? "text-[#c5ff55]" : "text-emerald-700"}`}>{usr.rating || 1000}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                          isAdmin
                            ? isNight
                              ? "bg-purple-950/60 border border-purple-500/40 text-purple-300"
                              : "bg-purple-50 border border-purple-200 text-purple-700"
                            : isNight
                            ? "bg-emerald-950/60 border border-emerald-500/40 text-emerald-300"
                            : "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        }`}
                      >
                        {usr.role || "USER"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleUserRole(usr)}
                        disabled={updatingUserId === usr.id}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                          isAdmin
                            ? isNight
                              ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : isNight
                            ? "border-purple-500/30 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50"
                            : "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
                        }`}
                      >
                        Make {isAdmin ? "USER" : "ADMIN"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ENTERPRISE CONFIRM ROLE REVOCATION MODAL */}
      <ConfirmDeleteModal
        isOpen={Boolean(demoteConfirmTarget)}
        onClose={() => setDemoteConfirmTarget(null)}
        onConfirm={() => executeRoleChange(demoteConfirmTarget, "USER")}
        title="Revoke Administrator Role?"
        itemType="Admin Privileges"
        itemId={demoteConfirmTarget?.id}
        itemName={demoteConfirmTarget?.name || demoteConfirmTarget?.username}
        loading={Boolean(updatingUserId)}
        warningMessage="CAUTION: You are revoking your own Administrator authority. Once confirmed, you will immediately lose access to Platform Administration, live tournaments management, problem editing, and proctoring logs."
      />
    </div>
  );
}
