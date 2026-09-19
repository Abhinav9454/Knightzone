import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type ExamType = "quiz" | "contest";

type UseExamSecurityOptions = {
  enabled: boolean;
  examType: ExamType;
  examId: number;
  maxViolations: number;
  requireFullscreen?: boolean;
  onViolation?: (nextCount: number, reason: string) => void;
  onLock?: () => void;
};

type UseExamSecurityResult = {
  enabled: boolean;
  isFullscreen: boolean;
  violationCount: number;
  locked: boolean;
  lockReason: string | null;
  requestFullscreen: () => Promise<boolean>;
};

const DEDUPE_MS = 1200;

const getFullscreenElement = () =>
  document.fullscreenElement
  || (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement
  || (document as Document & { msFullscreenElement?: Element | null }).msFullscreenElement
  || null;

const isRestrictedShortcut = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  if (event.key === "Escape") return true;
  if (event.key === "F12") return true;
  if (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key)) return true;
  if (event.ctrlKey && ["u", "s", "p", "r", "l"].includes(key)) return true;
  if (event.metaKey && ["s", "p", "r", "l"].includes(key)) return true;
  if (event.altKey && key === "tab") return true;
  return false;
};

export function useExamSecurity(options: UseExamSecurityOptions): UseExamSecurityResult {
  const {
    enabled,
    examType,
    examId,
    maxViolations,
    requireFullscreen = true,
    onViolation,
    onLock,
  } = options;

  const [violationCount, setViolationCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(Boolean(getFullscreenElement()));
  const [lockReason, setLockReason] = useState<string | null>(null);
  const lockRef = useRef(false);
  const lastViolationAtRef = useRef(0);

  const requestFullscreen = useCallback(async () => {
    if (getFullscreenElement()) {
      setIsFullscreen(true);
      return true;
    }

    const target = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };

    const requestMethod =
      target.requestFullscreen
      || target.webkitRequestFullscreen
      || target.msRequestFullscreen;

    if (!requestMethod) {
      toast.error("Fullscreen is not supported in this browser.");
      return false;
    }

    try {
      await Promise.resolve(requestMethod.call(target));
      const full = Boolean(getFullscreenElement());
      setIsFullscreen(full);
      if (!full) {
        toast.error("Unable to enable fullscreen. Please allow fullscreen permission.");
      }
      return full;
    } catch {
      toast.error("Please allow fullscreen to continue the assessment.");
      return false;
    }
  }, []);

  const recordViolation = useCallback(
    (reason: string) => {
      if (!enabled || lockRef.current) return;
      const now = Date.now();
      if (now - lastViolationAtRef.current < DEDUPE_MS) return;
      lastViolationAtRef.current = now;

      setViolationCount((current) => {
        const next = current + 1;
        onViolation?.(next, reason);
        toast.warning(`${reason} (${next}/${maxViolations})`);

        if (next >= maxViolations && !lockRef.current) {
          lockRef.current = true;
          setLockReason(reason);
          toast.error("Security threshold exceeded. Session locked.");
          onLock?.();
        }
        return next;
      });
    },
    [enabled, maxViolations, onLock, onViolation],
  );

  useEffect(() => {
    lockRef.current = false;
    setViolationCount(0);
    setLockReason(null);
    setIsFullscreen(Boolean(getFullscreenElement()));
  }, [enabled, examId, examType]);

  useEffect(() => {
    if (!enabled) return undefined;

    const onFullscreenChange = () => {
      const full = Boolean(getFullscreenElement());
      setIsFullscreen(full);
      if (requireFullscreen && !full) {
        recordViolation("Fullscreen exited");
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        recordViolation("Tab switch detected");
      }
    };

    const onWindowBlur = () => {
      recordViolation("Window focus lost");
    };

    const onCopyCutPaste = (event: Event) => {
      event.preventDefault();
      recordViolation("Copy/paste is disabled");
    };

    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
      recordViolation("Right click is disabled");
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isRestrictedShortcut(event)) return;
      event.preventDefault();
      recordViolation("Restricted shortcut blocked");
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onPageHide = () => {
      recordViolation("Page visibility changed");
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
    document.addEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("copy", onCopyCutPaste);
    document.addEventListener("cut", onCopyCutPaste);
    document.addEventListener("paste", onCopyCutPaste);
    document.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange as EventListener);
      document.removeEventListener("MSFullscreenChange", onFullscreenChange as EventListener);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("copy", onCopyCutPaste);
      document.removeEventListener("cut", onCopyCutPaste);
      document.removeEventListener("paste", onCopyCutPaste);
      document.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [enabled, recordViolation, requireFullscreen]);

  return {
    enabled,
    isFullscreen,
    violationCount,
    locked: violationCount >= maxViolations,
    lockReason,
    requestFullscreen,
  };
}
