import React from "react";
import { Trash2, X, ShieldAlert, Loader2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Permanently Delete Item?",
  itemName = "",
  itemType = "Item",
  itemId = null,
  warningMessage = "This action is permanent and cannot be undone. All associated telemetry, logs, and student records will be permanently purged.",
  loading = false,
}) {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Click outside backdrop to dismiss */}
      <div className="absolute inset-0" onClick={loading ? undefined : onClose} />

      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border border-t-4 border-t-rose-500 p-6 shadow-2xl text-left space-y-5 ${
          isNight
            ? "border-rose-500/40 bg-[#121610] text-slate-100 shadow-rose-950/50"
            : "border-rose-200 bg-white text-slate-900 shadow-xl"
        }`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top header with close button */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-lg ${
              isNight
                ? "bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-rose-500/20"
                : "bg-rose-50 border-rose-200 text-rose-600 shadow-rose-500/10"
            }`}>
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                isNight
                  ? "bg-rose-500/20 border-rose-500/30 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-700"
              }`}>
                Irreversible Action
              </span>
              <h3 className={`text-lg font-black tracking-tight mt-1 ${
                isNight ? "text-white" : "text-slate-900"
              }`}>
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`rounded-xl border p-1.5 transition ${
              isNight
                ? "border-white/10 bg-white/5 text-[#aab1a1] hover:text-white hover:bg-white/10"
                : "border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content & Warning details */}
        <div className={`rounded-2xl border p-4 space-y-2 text-xs ${
          isNight ? "bg-black/50 border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          <div className={isNight ? "text-[#aab1a1]" : "text-slate-600"}>
            Are you sure you want to permanently delete this {itemType}?
          </div>
          <div className={`font-bold text-sm rounded-xl p-3 flex items-center justify-between border ${
            isNight
              ? "text-white bg-rose-950/40 border-rose-500/30"
              : "text-rose-950 bg-rose-50 border-rose-200"
          }`}>
            <span className="truncate pr-2">{itemName || `${itemType} #${itemId}`}</span>
            {itemId && (
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded ml-2 shrink-0 border ${
                isNight
                  ? "text-[#c5ff55] bg-black/70 border-white/10"
                  : "text-emerald-800 bg-white border-slate-200"
              }`}>
                #{itemId}
              </span>
            )}
          </div>
          <p className={`text-[11px] leading-relaxed pt-1 ${isNight ? "text-rose-300/90" : "text-rose-700 font-semibold"}`}>
            ⚠️ {warningMessage}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex items-center justify-end gap-3 pt-2 border-t ${
          isNight ? "border-white/10" : "border-slate-100"
        }`}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
              isNight
                ? "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            Cancel, Keep {itemType}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Permanently Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
