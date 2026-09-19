import type { InterviewQuestionBankItem } from "@/lib/types";

export type InterviewVaultFormat = "OPEN_ENDED" | "MCQ" | "CODING";
export type InterviewVaultType = "TECHNICAL" | "BEHAVIORAL" | "HR" | "CUSTOM";
export type InterviewVaultDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export const DEFAULT_INTERVIEW_VAULT_COUNT = 4200;

export interface InterviewVaultQuestion extends InterviewQuestionBankItem {
  questionFormat: InterviewVaultFormat;
  type: InterviewVaultType;
  difficulty: InterviewVaultDifficulty;
  options: string[];
  correctAnswer: string;
  explanation: string;
  expectedComplexity: string;
  companyTag: string;
  estimatedSeconds: number;
}

export interface InterviewVaultStats {
  total: number;
  companyCount: number;
  byFormat: Record<InterviewVaultFormat, number>;
  byType: Record<InterviewVaultType, number>;
  byDifficulty: Record<InterviewVaultDifficulty, number>;
}

const TYPES: InterviewVaultType[] = ["TECHNICAL", "BEHAVIORAL", "HR", "CUSTOM"];
const DIFFICULTY: InterviewVaultDifficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const FORMATS: InterviewVaultFormat[] = ["OPEN_ENDED", "MCQ", "CODING"];

const COMPANY_TAGS = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Atlassian",
  "Adobe",
  "Uber",
  "NVIDIA",
  "Salesforce",
  "LinkedIn",
  "Flipkart",
  "Walmart",
  "Oracle",
  "Goldman Sachs",
  "Paytm",
  "CRED",
  "Razorpay",
  "Arcesium",
  "Directi",
  "SAP",
];

const TECH_TOPICS = [
  "Arrays",
  "Strings",
  "Dynamic Programming",
  "Graphs",
  "Trees",
  "Hashing",
  "System Design",
  "Concurrency",
  "Databases",
  "Low-Level Design",
  "Microservices",
  "Caching",
  "Distributed Systems",
  "Observability",
  "API Design",
  "Concurrency Control",
];

const BEHAVIORAL_TOPICS = [
  "Leadership",
  "Conflict Resolution",
  "Ownership",
  "Stakeholder Management",
  "Team Collaboration",
  "Decision Making",
  "Failure Recovery",
  "Mentorship",
  "Cross-team Influence",
  "Ownership Under Pressure",
  "Ambiguous Problem Solving",
];

const HR_TOPICS = [
  "Career Goals",
  "Compensation Discussion",
  "Company Fit",
  "Role Alignment",
  "Relocation",
  "Work Style",
  "Notice Period",
  "Motivation",
  "Offer Negotiation",
  "Long-term Growth",
  "Team Culture Expectations",
];

const CUSTOM_TOPICS = [
  "Startup Adaptability",
  "Cross-functional Delivery",
  "Product Thinking",
  "Execution Planning",
  "Data Interpretation",
  "Optimization Mindset",
  "High-pressure Handling",
  "Communication Clarity",
  "Product Prioritization",
  "Execution Under Constraints",
  "Business Trade-off Thinking",
];

const SCENARIO_TAGS = [
  "high-traffic feature launch",
  "late production outage",
  "strict SLA migration",
  "security review gate",
  "cross-team roadmap dependency",
  "legacy module refactor",
  "tight deadline sprint",
  "global rollout planning",
  "incident retrospective",
  "performance regression fix",
];

const complexityByDifficulty: Record<InterviewVaultDifficulty, string> = {
  BEGINNER: "O(n)",
  INTERMEDIATE: "O(n log n)",
  ADVANCED: "O(log n) to O(n)",
};

const estimateSeconds = (format: InterviewVaultFormat, difficulty: InterviewVaultDifficulty) => {
  const base = format === "MCQ" ? 90 : format === "OPEN_ENDED" ? 240 : 600;
  if (difficulty === "BEGINNER") return base;
  if (difficulty === "INTERMEDIATE") return Math.round(base * 1.2);
  return Math.round(base * 1.45);
};

const rotateOptions = (options: string[], shift: number) =>
  options.slice(shift).concat(options.slice(0, shift));

const buildMcqOptions = (topic: string, companyTag: string) => [
  `Clarify constraints, then choose a scalable ${topic} strategy aligned with ${companyTag} standards.`,
  "Jump into coding immediately and revisit assumptions at the end.",
  "Ignore edge cases first and focus only on the happy path.",
  "Optimize blindly before validating correctness with sample cases.",
];

const questionText = (
  type: InterviewVaultType,
  format: InterviewVaultFormat,
  topic: string,
  companyTag: string,
  scenario: string,
) => {
  if (format === "MCQ") {
    return `[${type}] In a ${companyTag}-style round for ${scenario}, what is the best approach for ${topic}?`;
  }
  if (format === "CODING") {
    return `[${type}] Solve a coding prompt on ${topic} for ${scenario} with optimization and trade-offs as expected in ${companyTag} interviews.`;
  }
  return `[${type}] Explain your approach for ${topic} in the context of ${scenario}, using measurable impact and structured communication.`;
};

const categoryFromType = (type: InterviewVaultType) => {
  if (type === "TECHNICAL") return "technical";
  if (type === "BEHAVIORAL") return "behavioral";
  if (type === "HR") return "hr";
  return "custom";
};

const topicByType = (type: InterviewVaultType, index: number) => {
  if (type === "TECHNICAL") return TECH_TOPICS[index % TECH_TOPICS.length];
  if (type === "BEHAVIORAL") return BEHAVIORAL_TOPICS[index % BEHAVIORAL_TOPICS.length];
  if (type === "HR") return HR_TOPICS[index % HR_TOPICS.length];
  return CUSTOM_TOPICS[index % CUSTOM_TOPICS.length];
};

export const buildMockInterviewVault = (count = DEFAULT_INTERVIEW_VAULT_COUNT): InterviewVaultQuestion[] =>
  Array.from({ length: Math.max(1, count) }, (_, index) => {
    const id = index + 1;
    const type = TYPES[index % TYPES.length];
    const difficulty = DIFFICULTY[(index + Math.floor(index / 7)) % DIFFICULTY.length];
    const format = FORMATS[(index + Math.floor(index / 11)) % FORMATS.length];
    const topic = topicByType(type, index);
    const companyTag = COMPANY_TAGS[(index * 5) % COMPANY_TAGS.length];
    const scenario = SCENARIO_TAGS[(index + Math.floor(index / 9)) % SCENARIO_TAGS.length];
    const baselineOptions = buildMcqOptions(topic, companyTag);
    const options = rotateOptions(baselineOptions, index % baselineOptions.length);
    const correctAnswer = baselineOptions[0];
    const expectedComplexity = complexityByDifficulty[difficulty];

    return {
      id,
      type,
      difficulty,
      category: categoryFromType(type),
      questionFormat: format,
      question: questionText(type, format, topic, companyTag, scenario),
      options,
      correctAnswer,
      explanation: `High-quality answer in ${topic} should prioritize clarity, constraints, edge cases, and measurable impact for ${scenario}.`,
      expectedComplexity,
      companyTag,
      estimatedSeconds: estimateSeconds(format, difficulty),
      expectedPoints: `Clarity, structured reasoning, edge-case depth, and role-fit for ${companyTag}`,
      aiEvaluationCriteria: "clarity, problem solving, optimization, communication",
      tags: `${topic},${companyTag},${format.toLowerCase()},${scenario.replace(/\s+/g, "-")}`,
      isActive: true,
    };
  });

let cachedVault: { count: number; questions: InterviewVaultQuestion[] } | null = null;

export const getMockInterviewVaultSnapshot = (
  count = DEFAULT_INTERVIEW_VAULT_COUNT,
): InterviewVaultQuestion[] => {
  const safeCount = Math.max(DEFAULT_INTERVIEW_VAULT_COUNT, count);
  if (!cachedVault || cachedVault.count < safeCount) {
    cachedVault = {
      count: safeCount,
      questions: buildMockInterviewVault(safeCount),
    };
  }
  return cachedVault.questions;
};

export const getMockInterviewVaultStats = (questions: InterviewVaultQuestion[]): InterviewVaultStats => {
  const byFormat: InterviewVaultStats["byFormat"] = {
    OPEN_ENDED: 0,
    MCQ: 0,
    CODING: 0,
  };
  const byType: InterviewVaultStats["byType"] = {
    TECHNICAL: 0,
    BEHAVIORAL: 0,
    HR: 0,
    CUSTOM: 0,
  };
  const byDifficulty: InterviewVaultStats["byDifficulty"] = {
    BEGINNER: 0,
    INTERMEDIATE: 0,
    ADVANCED: 0,
  };
  const companies = new Set<string>();

  questions.forEach((question) => {
    byFormat[question.questionFormat] += 1;
    byType[question.type] += 1;
    byDifficulty[question.difficulty] += 1;
    companies.add(question.companyTag);
  });

  return {
    total: questions.length,
    companyCount: companies.size,
    byFormat,
    byType,
    byDifficulty,
  };
};
