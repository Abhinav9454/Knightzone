export type DuelVaultQuestionType = "MCQ" | "CODING" | "RAPID_FIRE";
export type DuelVaultMode = "QUIZ" | "CODING" | "TYPING";
export type DuelVaultDifficulty = "EASY" | "MEDIUM" | "HARD" | "EXTREME";

export interface DuelVaultQuestion {
  id: number;
  title: string;
  prompt: string;
  type: DuelVaultQuestionType;
  mode: DuelVaultMode;
  difficulty: DuelVaultDifficulty;
  topic: string;
  companyTag: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  estimatedSeconds: number;
  points: number;
  tags: string[];
}

const TOPICS = [
  "Arrays",
  "Strings",
  "Linked List",
  "Stacks",
  "Queues",
  "Trees",
  "Graphs",
  "Greedy",
  "Dynamic Programming",
  "Binary Search",
  "Bit Manipulation",
  "Math",
  "Recursion",
  "Backtracking",
  "Sliding Window",
  "Two Pointers",
  "Heaps",
  "Hashing",
  "Tries",
  "System Thinking",
];

const COMPANIES = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Adobe",
  "Uber",
  "Atlassian",
  "NVIDIA",
  "Salesforce",
  "LinkedIn",
  "Flipkart",
  "Walmart",
];

const DIFFICULTIES: DuelVaultDifficulty[] = ["EASY", "MEDIUM", "HARD", "EXTREME"];

const MCQ_TEMPLATES = [
  "Which approach gives the best time-complexity to solve this duel under pressure?",
  "What is the strongest invariant to track for correctness in this topic?",
  "Which edge case is most likely to fail a first draft solution?",
  "Which data structure gives the safest implementation speed/accuracy tradeoff?",
  "Which optimization gives the highest impact without harming readability?",
  "Which bug pattern appears most in this category during interviews?",
];

const CODING_TEMPLATES = [
  "Implement an optimized solution and explain why it beats the brute force baseline.",
  "Write a production-ready function with clear invariants and robust edge-case handling.",
  "Design the algorithm, add complexity analysis, and justify data structure choices.",
  "Solve with strict constraints and provide one alternate approach.",
  "Build a fast solution plus test strategy for hidden corner cases.",
  "Implement with clean modular structure and discuss scaling behavior.",
];

const RAPID_FIRE_TEMPLATES = [
  "Give a short strategy in 3 bullets for solving this category quickly.",
  "List common traps and how to avoid them in a duel environment.",
  "Share your 90-second plan before writing code.",
  "Explain a reusable template that works for most problems in this topic.",
  "Describe what to check in the first dry run to avoid wrong answers.",
  "State a fail-fast approach when your initial idea does not work.",
];

const MCQ_OPTION_SETS = [
  [
    "Linear scan with strong invariant",
    "Nested brute-force loops",
    "Randomized trial approach",
    "Over-optimized micro-tuning first",
  ],
  [
    "Hash map with single-pass update",
    "Sort repeatedly after each operation",
    "Backtracking without pruning",
    "Manual table simulation only",
  ],
  [
    "Prefix/suffix precomputation",
    "Rebuilding state every iteration",
    "Greedy without proof",
    "Ignoring corner constraints",
  ],
  [
    "Monotonic data structure pattern",
    "Queue + full recomputation",
    "DFS without visited checks",
    "Use recursion blindly",
  ],
];

const typingOptionsFor = (topic: string) => [
  `Use concise explanation focused on ${topic}`,
  `Write long narrative before solving ${topic}`,
  `Skip validation cases in ${topic}`,
  `Ignore complexity in ${topic}`,
];

const hashText = (value: string) =>
  Array.from(value).reduce((sum, char) => (sum + char.charCodeAt(0)) % 997, 0);

const toEstimatedSeconds = (type: DuelVaultQuestionType, difficulty: DuelVaultDifficulty) => {
  const base = type === "MCQ" ? 90 : type === "RAPID_FIRE" ? 150 : 420;
  if (difficulty === "EASY") return base;
  if (difficulty === "MEDIUM") return Math.round(base * 1.2);
  if (difficulty === "HARD") return Math.round(base * 1.45);
  return Math.round(base * 1.8);
};

const toPoints = (type: DuelVaultQuestionType, difficulty: DuelVaultDifficulty) => {
  const base = type === "MCQ" ? 30 : type === "RAPID_FIRE" ? 40 : 80;
  if (difficulty === "EASY") return base;
  if (difficulty === "MEDIUM") return base + 15;
  if (difficulty === "HARD") return base + 35;
  return base + 55;
};

const getTypeByIndex = (index: number): DuelVaultQuestionType => {
  const slot = index % 10;
  if (slot <= 3) return "MCQ";
  if (slot <= 7) return "CODING";
  return "RAPID_FIRE";
};

const getModeByType = (type: DuelVaultQuestionType): DuelVaultMode => {
  if (type === "CODING") return "CODING";
  if (type === "RAPID_FIRE") return "TYPING";
  return "QUIZ";
};

export const buildDuelQuestionVault = (count = 3600): DuelVaultQuestion[] =>
  Array.from({ length: Math.max(1, count) }, (_, index) => {
    const id = index + 1;
    const topic = TOPICS[index % TOPICS.length];
    const companyTag = COMPANIES[(index * 7) % COMPANIES.length];
    const difficulty = DIFFICULTIES[(index + Math.floor(index / 9)) % DIFFICULTIES.length];
    const type = getTypeByIndex(index);
    const mode = getModeByType(type);

    const templateIdx = (index + hashText(topic)) % MCQ_TEMPLATES.length;
    const optionIdx = (index + hashText(companyTag)) % MCQ_OPTION_SETS.length;
    const defaultOptions = MCQ_OPTION_SETS[optionIdx];
    const options = type === "RAPID_FIRE" ? typingOptionsFor(topic) : defaultOptions;

    const titlePrefix = type === "MCQ" ? "MCQ" : type === "CODING" ? "Coding" : "Rapid";
    const title = `${titlePrefix} Duel Set ${id}: ${topic}`;

    let prompt: string;
    if (type === "MCQ") {
      prompt = `${MCQ_TEMPLATES[templateIdx]} (${topic} | ${companyTag})`;
    } else if (type === "CODING") {
      prompt = `${CODING_TEMPLATES[templateIdx]} Focus area: ${topic}.`;
    } else {
      prompt = `${RAPID_FIRE_TEMPLATES[templateIdx]} Topic: ${topic}.`;
    }

    const correctAnswer = options[(index + 1) % options.length];
    const explanation = `High-quality duel answers in ${topic} must prioritize correctness first, then complexity, then clarity for ${companyTag}-style interviews.`;

    return {
      id,
      title,
      prompt,
      type,
      mode,
      difficulty,
      topic,
      companyTag,
      options,
      correctAnswer,
      explanation,
      estimatedSeconds: toEstimatedSeconds(type, difficulty),
      points: toPoints(type, difficulty),
      tags: [topic, difficulty, type, companyTag],
    };
  });

