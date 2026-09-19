import type { TypingMode } from "./types";

export type TypingPracticeMode = "STANDARD" | "WEAK_KEYS" | "BLIND" | "ZEN" | "ENDLESS";
export type KeyboardLayoutType = "QWERTY" | "DVORAK" | "COLEMAK";

export interface TypingLesson {
  id: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  title: string;
  objective: string;
  mode: TypingMode;
  layout: KeyboardLayoutType;
  passage: string;
  tips: string[];
}

export interface ModeTutorial {
  mode: TypingMode;
  title: string;
  steps: string[];
}

export interface CommunityPassage {
  id: string;
  title: string;
  content: string;
  language: "plaintext" | "javascript" | "typescript" | "python" | "java" | "cpp";
  tags: string[];
  author: string;
  createdAt: string;
}

export interface TypingAiInput {
  wpm: number;
  accuracy: number;
  backspaceCount: number;
  keyMistakes: Record<string, number>;
}

export interface TypingAiSuggestion {
  headline: string;
  detail: string;
  action: "weak_keys" | "zen" | "endless" | "lesson";
}

export const PRACTICE_MODE_DESCRIPTIONS: Record<TypingPracticeMode, string> = {
  STANDARD: "Balanced session with full stats and normal test flow.",
  WEAK_KEYS: "Auto-generated drills for letters where mistakes are highest.",
  BLIND: "No text preview for hardcore memory and rhythm training.",
  ZEN: "No countdown pressure. Just flow and consistency.",
  ENDLESS: "Continuous session. Text keeps extending while you type.",
};

export const KEYBOARD_LAYOUTS: Record<KeyboardLayoutType, string[]> = {
  QWERTY: ["q w e r t y u i o p", "a s d f g h j k l ;", "z x c v b n m , . /"],
  DVORAK: ["' , . p y f g c r l", "a o e u i d h t n s", "; q j k x b m w v z"],
  COLEMAK: ["q w f p g j l u y ;", "a r s t d h n e i o", "z x c v b k m , . /"],
};

export const TYPING_LESSONS: TypingLesson[] = [
  {
    id: "lesson-home-row",
    level: "Beginner",
    title: "Home Row Control",
    objective: "Build finger placement muscle memory and steady rhythm.",
    mode: "WORD_COUNT",
    layout: "QWERTY",
    passage: "asdf jkl; asdf jkl; focus on smooth finger movement and minimal wrist motion.",
    tips: ["Keep wrists neutral", "Tap lightly", "Prioritize accuracy over speed"],
  },
  {
    id: "lesson-numbers-symbols",
    level: "Intermediate",
    title: "Numbers And Symbols",
    objective: "Improve confidence on mixed content passages.",
    mode: "TIMED",
    layout: "QWERTY",
    passage: "Type logs: server-01 status=ok latency=42ms retries=0 version=2.4.1 and keep your pace stable.",
    tips: ["Use pinky for symbols", "Do not rush punctuation", "Keep eyes on source text"],
  },
  {
    id: "lesson-dvorak-start",
    level: "Intermediate",
    title: "Dvorak Starter Flow",
    objective: "Learn Dvorak vowel-centered movement pattern.",
    mode: "CUSTOM",
    layout: "DVORAK",
    passage: "aoeui aoeui dhtns dhtns pyfgc pyfgc qjkxb qjkxb.",
    tips: ["Memorize row patterns", "Train short bursts", "Repeat daily for adaptation"],
  },
  {
    id: "lesson-colemak-drill",
    level: "Advanced",
    title: "Colemak Transition Drill",
    objective: "Practice Colemak rolls and alternate hand rhythm.",
    mode: "CUSTOM",
    layout: "COLEMAK",
    passage: "arst neio ars tne io qwfpg hjluy and colemak motions with controlled pace.",
    tips: ["Use metronome pace", "Avoid looking at keyboard", "Keep shoulders relaxed"],
  },
  {
    id: "lesson-advanced-code",
    level: "Advanced",
    title: "Code Snippet Precision",
    objective: "Maintain accuracy in real coding-like snippets.",
    mode: "QUOTE",
    layout: "QWERTY",
    passage: "const calcScore = (correct, total) => Math.round((correct / total) * 100); // precision matters",
    tips: ["Track bracket errors", "Use tiny pauses for symbols", "Aim for 97%+ accuracy"],
  },
];

export const MODE_TUTORIALS: ModeTutorial[] = [
  {
    mode: "TIMED",
    title: "Timed Mode Tutorial",
    steps: [
      "Pick 30s, 60s, or 120s duration.",
      "Timer starts on your first key press.",
      "Focus on rhythm and avoid panic corrections.",
      "Review WPM + accuracy after completion.",
    ],
  },
  {
    mode: "WORD_COUNT",
    title: "Word Count Mode Tutorial",
    steps: [
      "Choose a target like 25 or 50 words.",
      "Complete exactly the required amount with high precision.",
      "Use this mode for controlled skill building.",
      "Great for lessons and weak-key drills.",
    ],
  },
  {
    mode: "QUOTE",
    title: "Quote Mode Tutorial",
    steps: [
      "Select your quote category.",
      "Read once, then type in chunks.",
      "Treat punctuation as part of rhythm practice.",
      "Use for real-world text adaptability.",
    ],
  },
  {
    mode: "CUSTOM",
    title: "Custom Mode Tutorial",
    steps: [
      "Paste your own text or code snippet.",
      "Use this for interview, docs, or coding syntax practice.",
      "Pair with blind mode for intense training.",
      "Share good passages in community library.",
    ],
  },
];

export const TECHNIQUE_TIPS: string[] = [
  "Keep elbows relaxed and forearms parallel to the desk.",
  "Type in short bursts with micro-breaks every few minutes.",
  "Accuracy first, speed second; speed follows clean muscle memory.",
  "Use minimal backspace by slowing down on difficult words.",
  "In code snippets, pause briefly before brackets and operators.",
  "Practice weak keys daily for 5-10 minutes.",
];

export const DEFAULT_COMMUNITY_PASSAGES: CommunityPassage[] = [
  {
    id: "community-js-async",
    title: "Async JavaScript Flow",
    language: "javascript",
    tags: ["javascript", "async", "code"],
    author: "Knights Battle Zone",
    createdAt: new Date().toISOString(),
    content:
      "async function fetchProfile(id) { const response = await fetch(`/api/users/${id}`); if (!response.ok) throw new Error('Request failed'); return response.json(); }",
  },
  {
    id: "community-ts-types",
    title: "TypeScript Utility Types",
    language: "typescript",
    tags: ["typescript", "generics"],
    author: "Knights Battle Zone",
    createdAt: new Date().toISOString(),
    content:
      "type Nullable<T> = T | null; type ApiResult<T> = { ok: boolean; data?: T; error?: string };",
  },
];

export const buildWeakKeyPassage = (
  keyMistakes: Record<string, number>,
  fallback = "asdf jkl; qwerty practice line for balanced keyboard control",
) => {
  const ordered = Object.entries(keyMistakes)
    .filter(([key]) => key.length === 1 && /[a-z]/i.test(key))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key]) => key.toLowerCase());

  if (!ordered.length) return fallback;

  const drills = ordered
    .map((key) => `${key}${key}${key} ${key}${key}${key}`)
    .join(" ");
  const words = ordered
    .map((key) => `${key}rate ${key}flow ${key}track`)
    .join(" ");

  return `${drills} ${words} keep rhythm and accuracy while practicing weak keys ${ordered.join(" ")}.`;
};

export const getTypingAiSuggestions = ({
  wpm,
  accuracy,
  backspaceCount,
  keyMistakes,
}: TypingAiInput): TypingAiSuggestion[] => {
  const suggestions: TypingAiSuggestion[] = [];

  const topWeak = Object.entries(keyMistakes)
    .filter(([key]) => key.length === 1)
    .sort((a, b) => b[1] - a[1])[0];

  if (topWeak) {
    suggestions.push({
      headline: `You struggled with '${topWeak[0].toUpperCase()}'`,
      detail: "Switch to Weak Keys mode for a targeted 5-minute drill.",
      action: "weak_keys",
    });
  }

  if (accuracy < 94) {
    suggestions.push({
      headline: "Accuracy needs stabilization",
      detail: "Use Zen mode and reduce speed until you stay above 96% accuracy.",
      action: "zen",
    });
  }

  if (backspaceCount > 20) {
    suggestions.push({
      headline: "Too many corrections detected",
      detail: "Take one advanced lesson and type 10% slower for cleaner output.",
      action: "lesson",
    });
  }

  if (wpm >= 55 && accuracy >= 96) {
    suggestions.push({
      headline: "You are ready for longer sessions",
      detail: "Try Endless mode and maintain your form under fatigue.",
      action: "endless",
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      headline: "Routine recommendation",
      detail: "Do 1 lesson, 1 weak-key drill, and 1 timed test daily.",
      action: "lesson",
    });
  }

  return suggestions.slice(0, 3);
};

