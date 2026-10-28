import React, { useState, useEffect } from "react";
import {
  Settings,
  AlertTriangle,
  Power,
  ShieldAlert,
  Server,
  Cpu,
  Clock,
  Radio,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  Megaphone,
  Sliders,
  RefreshCw,
} from "lucide-react";
import { systemConfigApi } from "../../services/api";

export default function SystemConfigWorkspace({ showNotification = () => {} }) {
  const [config, setConfig] = useState({
    maintenanceMode: false,
    registrationOpen: true,
    aiHintsEnabled: true,
    sandboxCpuLimitPercent: 80,
    sandboxMemoryLimitMb: 512,
    sandboxTimeoutSeconds: 5,
    strictProctoringStrikes: 3,
    announcementBanner: "Welcome to Knightzone Arena 2026! National Coding Battles are now active.",
    lastModifiedBy: "admin@knightzone.dev",
    lastUpdatedAt: new Date().toISOString(),
  });

  const [initialConfig, setInitialConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmMaintenance, setShowConfirmMaintenance] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await systemConfigApi.getConfig();
      if (res && typeof res === "object") {
        setConfig((prev) => ({ ...prev, ...res }));
        setInitialConfig(res);
      }
    } catch (err) {
      console.warn("Could not fetch remote system config:", err);
      showNotification("Using local system configuration state", false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggleMaintenance = () => {
    if (!config.maintenanceMode) {
      // Prompt confirmation before entering maintenance mode
      setShowConfirmMaintenance(true);
    } else {
      // Exiting maintenance is immediately allowed
      setConfig((prev) => ({ ...prev, maintenanceMode: false }));
    }
  };

  const confirmEnterMaintenance = () => {
    setConfig((prev) => ({ ...prev, maintenanceMode: true }));
    setShowConfirmMaintenance(false);
    showNotification("Maintenance Mode activated. Non-admin traffic will be throttled.", false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        maintenanceMode: config.maintenanceMode,
        registrationOpen: config.registrationOpen,
        aiHintsEnabled: config.aiHintsEnabled,
        sandboxMemoryLimitMb: Number(config.sandboxMemoryLimitMb),
        sandboxTimeoutSeconds: Number(config.sandboxTimeoutSeconds),
        announcementBanner: config.announcementBanner,
      };

      const res = await systemConfigApi.updateConfig(payload);
      if (res?.config) {
        setConfig((prev) => ({ ...prev, ...res.config }));
      }
      showNotification("Global System Settings applied & deployed to Docker workers successfully!", false);
    } catch (err) {
      console.error("Failed to update system config:", err);
      showNotification("Error saving configuration changes", true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialConfig) {
      setConfig({ ...initialConfig });
      showNotification("Reverted to previous deployed configuration", false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-lg">
            <Sliders className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-purple-300 uppercase">
                Kernel & Sandbox Control
              </span>
              <span className="text-xs text-[#788071]">
                Last modified by: <span className="font-mono text-white">{config.lastModifiedBy}</span>
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mt-1">
              Global System Config & Maintenance Mode
            </h2>
            <p className="text-xs text-[#aab1a1] mt-0.5">
              Live operational toggles for maintenance freeze, student registrations, AI quota throttles, and Docker sandbox resource limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchConfig}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-[#c5ff55]" : "text-[#c5ff55]"} />
            Sync State
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-5 py-2.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20 disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? "Deploying..." : "Save & Deploy"}
          </button>
        </div>
      </div>

      {/* MASTER MAINTENANCE MODE CARD */}
      <div
        className={`rounded-3xl border p-6 transition-all shadow-2xl ${
          config.maintenanceMode
            ? "border-rose-500/50 bg-rose-950/20 shadow-rose-500/10"
            : "border-emerald-500/30 bg-emerald-950/10"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
                config.maintenanceMode
                  ? "border-rose-500/40 bg-rose-500/20 text-rose-400"
                  : "border-emerald-500/40 bg-emerald-500/20 text-emerald-400"
              }`}
            >
              <Power className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    config.maintenanceMode
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      config.maintenanceMode ? "bg-rose-400 animate-ping" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  {config.maintenanceMode ? "MAINTENANCE MODE ACTIVE" : "PLATFORM ONLINE & HEALTHY"}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                {config.maintenanceMode
                  ? "Emergency Platform Freeze Activated"
                  : "Normal Production Operation"}
              </h3>
              <p className="text-xs text-[#aab1a1] mt-0.5 max-w-xl">
                {config.maintenanceMode
                  ? "All contestant code submissions and contest lobbies are temporarily frozen. Only authorized administrators can browse and make database alterations."
                  : "All public contest APIs, code runner sandboxes, and student leaderboards are operational with zero throttling."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleMaintenance}
            className={`px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg ${
              config.maintenanceMode
                ? "bg-emerald-500 text-black hover:bg-emerald-400 shadow-emerald-500/20"
                : "bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/30"
            }`}
          >
            {config.maintenanceMode ? "Exit Maintenance Mode" : "Activate Maintenance Mode"}
          </button>
        </div>
      </div>

      {/* OPERATIONAL TOGGLE SWITCHES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Toggle 1: Registrations */}
        <div className="rounded-3xl border border-white/10 bg-[#161a14] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#788071]">
                Identity Gateway
              </span>
              {config.registrationOpen ? (
                <Unlock size={16} className="text-emerald-400" />
              ) : (
                <Lock size={16} className="text-amber-400" />
              )}
            </div>
            <h4 className="text-base font-bold text-white mt-2">New Student Registration</h4>
            <p className="text-xs text-[#aab1a1] mt-1 leading-relaxed">
              When toggled off, registration for new students is locked. Existing users can still log in normally.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#c5ff55]">
              {config.registrationOpen ? "Open to Public" : "Frozen (Invite-only)"}
            </span>
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, registrationOpen: !p.registrationOpen }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.registrationOpen ? "bg-[#c5ff55]" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-[#121610] transition-transform ${
                  config.registrationOpen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Toggle 2: AI Hints & Gemini Quota */}
        <div className="rounded-3xl border border-white/10 bg-[#161a14] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#788071]">
                AI Intelligence
              </span>
              <Sparkles size={16} className="text-purple-400" />
            </div>
            <h4 className="text-base font-bold text-white mt-2">Gemini AI Hints & Mock Engine</h4>
            <p className="text-xs text-[#aab1a1] mt-1 leading-relaxed">
              Enable or disable AI hints and mock interview simulator dynamically to preserve API quotas or during contests.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-purple-300">
              {config.aiHintsEnabled ? "AI Features Active" : "AI Temporarily Disabled"}
            </span>
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, aiHintsEnabled: !p.aiHintsEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.aiHintsEnabled ? "bg-purple-500" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.aiHintsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Toggle 3: Strict 3-Strike Proctoring */}
        <div className="rounded-3xl border border-white/10 bg-[#161a14] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#788071]">
                Integrity Engine
              </span>
              <ShieldAlert size={16} className="text-amber-400" />
            </div>
            <h4 className="text-base font-bold text-white mt-2">Strict 3-Strike Anti-Cheat</h4>
            <p className="text-xs text-[#aab1a1] mt-1 leading-relaxed">
              Auto-disqualifies contest candidates who violate full-screen lock or tab switch policy {config.strictProctoringStrikes} times.
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-amber-300">
              {config.strictProctoringStrikes}-Strike Auto-DQ
            </span>
            <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
              ARMED
            </span>
          </div>
        </div>
      </div>

      {/* DOCKER RUNNER RESOURCE ALLOCATION */}
      <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Server className="h-5 w-5 text-[#c5ff55]" />
          <div>
            <h3 className="text-base font-bold text-white">Docker Judge Sandbox Constraints</h3>
            <p className="text-xs text-[#aab1a1]">
              Tune resource limits enforced by cgroups and Docker daemon on every candidate code compilation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Memory Limit */}
          <div className="rounded-2xl bg-black/40 border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#aab1a1] font-medium flex items-center gap-1.5">
                <Cpu size={14} className="text-cyan-400" /> Memory Ceiling (RAM)
              </span>
              <span className="font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                {config.sandboxMemoryLimitMb} MB
              </span>
            </div>
            <input
              type="range"
              min="128"
              max="1024"
              step="128"
              value={config.sandboxMemoryLimitMb}
              onChange={(e) => setConfig((p) => ({ ...p, sandboxMemoryLimitMb: Number(e.target.value) }))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#788071]">
              <span>128 MB</span>
              <span>512 MB (Default)</span>
              <span>1024 MB</span>
            </div>
          </div>

          {/* Slider 2: Execution Timeout */}
          <div className="rounded-2xl bg-black/40 border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#aab1a1] font-medium flex items-center gap-1.5">
                <Clock size={14} className="text-[#c5ff55]" /> Execution Timeout (TLE)
              </span>
              <span className="font-mono font-bold text-[#c5ff55] bg-[#c5ff55]/10 border border-[#c5ff55]/30 px-2 py-0.5 rounded">
                {config.sandboxTimeoutSeconds} Seconds
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={config.sandboxTimeoutSeconds}
              onChange={(e) => setConfig((p) => ({ ...p, sandboxTimeoutSeconds: Number(e.target.value) }))}
              className="w-full accent-[#c5ff55] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#788071]">
              <span>2s</span>
              <span>5s (Standard)</span>
              <span>15s</span>
            </div>
          </div>

          {/* Slider 3: CPU Limit */}
          <div className="rounded-2xl bg-black/40 border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#aab1a1] font-medium flex items-center gap-1.5">
                <Radio size={14} className="text-amber-400" /> Worker CPU Core Cap
              </span>
              <span className="font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
                {config.sandboxCpuLimitPercent}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={config.sandboxCpuLimitPercent}
              onChange={(e) => setConfig((p) => ({ ...p, sandboxCpuLimitPercent: Number(e.target.value) }))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-[#788071]">
              <span>20%</span>
              <span>80% (Safe Cap)</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* GLOBAL BROADCAST ANNOUNCEMENT BANNER */}
      <div className="rounded-3xl border border-white/10 bg-[#161a14] p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <Megaphone className="h-5 w-5 text-amber-400" />
          <div>
            <h3 className="text-base font-bold text-white">Platform Broadcast Announcement</h3>
            <p className="text-xs text-[#aab1a1]">
              Global banner message rendered across all candidate problem solving and dashboard headers.
            </p>
          </div>
        </div>

        <div>
          <textarea
            rows={2}
            value={config.announcementBanner}
            onChange={(e) => setConfig((p) => ({ ...p, announcementBanner: e.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-white placeholder-[#788071] focus:border-[#c5ff55] focus:outline-none"
            placeholder="Type platform announcement..."
          />
        </div>

        {/* Live Preview */}
        {config.announcementBanner && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex items-center gap-3 text-xs text-amber-200">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-amber-300 shrink-0">
              Preview
            </span>
            <span>{config.announcementBanner}</span>
          </div>
        )}
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-[#aab1a1] hover:text-white hover:bg-white/10 transition"
        >
          <RotateCcw size={14} />
          Revert Unsaved Changes
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#c5ff55] px-6 py-2.5 text-xs font-black uppercase text-[#14170f] hover:bg-[#d5ff83] transition shadow-lg shadow-[#c5ff55]/20 disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? "Deploying Updates..." : "Save & Deploy Configuration"}
        </button>
      </div>

      {/* MAINTENANCE CONFIRMATION MODAL */}
      {showConfirmMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-[#161a14] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Activate Maintenance Freeze?</h3>
                <p className="text-xs text-rose-400">Action affects all connected contestants</p>
              </div>
            </div>

            <p className="text-xs text-[#aab1a1] leading-relaxed">
              Enabling Maintenance Mode will redirect public traffic and prevent ongoing contest submissions until you turn it back off. Are you sure you want to proceed?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmMaintenance(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmEnterMaintenance}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30"
              >
                Yes, Freeze Platform
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
