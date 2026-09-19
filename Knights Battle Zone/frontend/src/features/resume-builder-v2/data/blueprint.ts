import type {
  AiModule,
  CompanyTrack,
  FunnelStep,
  GeneratedPlan,
  GeoFormat,
  GrowthLoop,
  InfraStackSection,
  KpiTarget,
  PricingTier,
  QuickQuizInput,
  ResumeFormat,
  RevenueStream,
  RoadmapItem,
  SecretSauceItem,
  TemplateCategory,
  TemplateDefinition,
} from "../types";

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const buildResumeDna = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `RDNA-${(hash >>> 0).toString(36).toUpperCase()}`;
};

const roleProgressionMap: Record<string, string[]> = {
  "software engineer": [
    "Senior Software Engineer (6-12 months focus on system ownership)",
    "Tech Lead / Staff Track (cross-team architecture influence)",
    "Engineering Manager or Principal IC (18-30 months)",
  ],
  "data analyst": [
    "Senior Analyst (build org-wide KPI ownership)",
    "Analytics Manager (stakeholder planning plus forecasting)",
    "Head of Analytics / Data Strategy (18-30 months)",
  ],
  "product manager": [
    "Senior PM (end-to-end metric ownership)",
    "Group PM (multi-squad product leadership)",
    "Director Product (strategy plus hiring ownership)",
  ],
  "ui ux designer": [
    "Senior Product Designer (design system authority)",
    "Design Lead (cross-platform design governance)",
    "Head of Design / Principal Designer",
  ],
  "marketing manager": [
    "Growth Lead (multi-channel revenue ownership)",
    "Marketing Head (team and budget ownership)",
    "VP Growth / CMO track",
  ],
};

const interviewQuestionBank: Record<string, string[]> = {
  "software engineer": [
    "Explain one production architecture decision and trade-offs.",
    "How did you reduce latency or improve reliability?",
    "Describe one failure and your rollback playbook.",
    "What metric proved your impact?",
  ],
  "data analyst": [
    "Which KPI changed after your analysis and by how much?",
    "Describe your data-quality validation method.",
    "How do you prioritize ad-hoc requests versus roadmap work?",
    "Show one dashboard that changed executive decisions.",
  ],
  "product manager": [
    "What user problem did you prioritize and why?",
    "How did you align engineering, design, and business teams?",
    "What experiment failed and what did you learn?",
    "Which product metric did you own and improve?",
  ],
};

const geoSalaryMultiplier: Record<GeoFormat, number> = {
  india: 1,
  us: 2.8,
  uk: 2.1,
  global: 2.2,
};

const trackBoost: Record<CompanyTrack, number> = {
  faang: 12,
  startup: 8,
  consulting: 7,
  finance: 9,
};

export const companyTrackOptions: { value: CompanyTrack; label: string }[] = [
  { value: "faang", label: "FAANG / Big Tech" },
  { value: "startup", label: "Startup / Product Company" },
  { value: "consulting", label: "Consulting / Corporate" },
  { value: "finance", label: "Finance / Fintech" },
];

export const geoFormatOptions: { value: GeoFormat; label: string }[] = [
  { value: "india", label: "India Format" },
  { value: "us", label: "US Format" },
  { value: "uk", label: "UK Format" },
  { value: "global", label: "Global Format" },
];

export const resumeFormats: ResumeFormat[] = [
  { id: "text", label: "Text Resume", description: "ATS-ready structured content", output: "DOCX/PDF/TXT" },
  { id: "video", label: "Video Resume", description: "Elevator pitch with QR linkage", output: "MP4 + QR" },
  { id: "web", label: "Interactive Web Resume", description: "Personal site style profile", output: "Hosted web page" },
  { id: "infographic", label: "Infographic Resume", description: "Visual storytelling with KPI blocks", output: "High-res PDF" },
  { id: "audio", label: "Audio Resume", description: "Podcast-style intro summary", output: "MP3 + transcript" },
  { id: "portfolio", label: "Portfolio Resume", description: "Project-first showcase profile", output: "Portfolio bundle" },
  { id: "linkedin", label: "LinkedIn Style Resume", description: "Social profile optimized format", output: "LinkedIn sync pack" },
  { id: "presentation", label: "Presentation Resume", description: "Slide deck for hiring panels", output: "PPTX/PDF deck" },
];

export const aiModules: AiModule[] = [
  {
    id: "career-prediction",
    title: "Career Prediction Engine",
    summary: "Predict next 5 career moves, switching confidence, and promotion windows.",
    signals: ["Career graph", "Market demand", "Role progression data"],
  },
  {
    id: "smart-content",
    title: "Smart Content Generator",
    summary: "Auto-tailor resume to job description and convert bullets into STAR format.",
    signals: ["JD keyword map", "Role benchmark library", "Writing quality checks"],
  },
  {
    id: "hyper-personalization",
    title: "Hyper Personalization",
    summary: "Tune tone, depth, and format by company culture, location, and experience level.",
    signals: ["Geo norms", "Industry keywords", "Seniority engine"],
  },
  {
    id: "interview-predictor",
    title: "Interview Question Predictor",
    summary: "Generate likely interview questions from every resume claim.",
    signals: ["Role bank", "Behavioral framework", "Project deep-dive prompts"],
  },
  {
    id: "salary-coach",
    title: "Salary Negotiation Coach",
    summary: "Create compensation range and role-specific negotiation scripts.",
    signals: ["Market salary trends", "Skill premium", "Offer confidence score"],
  },
];

export const templateCatalog: TemplateDefinition[] = [
  {
    name: "Quantum Dev",
    industry: ["tech", "software"],
    roles: ["software engineer", "backend engineer", "full stack engineer"],
    experienceRange: [0, 15],
    locations: ["global"],
    tracks: ["faang", "startup"],
    features: ["github", "system design", "leetcode", "impact metrics"],
    aiScore: 98,
  },
  {
    name: "Executive Pro",
    industry: ["tech", "corporate"],
    roles: ["engineering manager", "product manager", "program manager"],
    experienceRange: [6, 20],
    locations: ["global"],
    tracks: ["faang", "consulting"],
    features: ["strategy highlights", "team leadership", "budget ownership"],
    aiScore: 96,
  },
  {
    name: "DevMaster",
    industry: ["tech"],
    roles: ["software engineer", "platform engineer", "devops engineer"],
    experienceRange: [1, 12],
    locations: ["india", "us", "uk"],
    tracks: ["startup", "faang"],
    features: ["deployment metrics", "cloud stack", "incident response"],
    aiScore: 95,
  },
  {
    name: "Growth Hacker",
    industry: ["marketing", "product"],
    roles: ["growth marketer", "digital marketing specialist", "product marketer"],
    experienceRange: [0, 10],
    locations: ["global"],
    tracks: ["startup", "consulting"],
    features: ["campaign ROI", "funnel metrics", "experiment log"],
    aiScore: 94,
  },
  {
    name: "Consultant Pro",
    industry: ["consulting", "corporate"],
    roles: ["consultant", "business analyst", "strategy analyst"],
    experienceRange: [0, 12],
    locations: ["global"],
    tracks: ["consulting", "finance"],
    features: ["case studies", "stakeholder impact", "problem framing"],
    aiScore: 93,
  },
  {
    name: "Boardroom",
    industry: ["consulting", "finance"],
    roles: ["engagement manager", "senior consultant", "program lead"],
    experienceRange: [5, 18],
    locations: ["global"],
    tracks: ["consulting", "finance"],
    features: ["executive summary", "portfolio impact", "team leadership"],
    aiScore: 95,
  },
  {
    name: "Wall Street",
    industry: ["finance"],
    roles: ["financial analyst", "investment analyst", "risk analyst"],
    experienceRange: [0, 12],
    locations: ["us", "uk", "global"],
    tracks: ["finance"],
    features: ["valuation models", "forecast accuracy", "risk dashboard"],
    aiScore: 94,
  },
  {
    name: "Corporate Ladder",
    industry: ["finance", "operations"],
    roles: ["operations analyst", "finance manager", "business operations"],
    experienceRange: [2, 15],
    locations: ["global"],
    tracks: ["finance", "consulting"],
    features: ["process optimization", "cost savings", "SLA adherence"],
    aiScore: 92,
  },
  {
    name: "The Analyst",
    industry: ["data", "finance", "ops"],
    roles: ["data analyst", "business analyst", "operations analyst"],
    experienceRange: [0, 10],
    locations: ["global"],
    tracks: ["finance", "consulting", "startup"],
    features: ["dashboards", "kpi governance", "forecasting"],
    aiScore: 91,
  },
  {
    name: "Full Stack Pro",
    industry: ["tech"],
    roles: ["full stack engineer", "frontend engineer", "backend engineer"],
    experienceRange: [0, 10],
    locations: ["global"],
    tracks: ["startup", "faang"],
    features: ["frontend + backend coverage", "cloud deploy", "product impact"],
    aiScore: 93,
  },
  {
    name: "Tech Lead",
    industry: ["tech"],
    roles: ["tech lead", "staff engineer", "architect"],
    experienceRange: [7, 20],
    locations: ["global"],
    tracks: ["faang", "startup"],
    features: ["architecture diagrams", "mentoring impact", "cross-team execution"],
    aiScore: 96,
  },
  {
    name: "The Strategist",
    industry: ["consulting", "product", "operations"],
    roles: ["strategy manager", "operations manager", "product manager"],
    experienceRange: [4, 18],
    locations: ["global"],
    tracks: ["consulting", "startup", "finance"],
    features: ["north-star planning", "decision frameworks", "growth roadmap"],
    aiScore: 94,
  },
];

export const smartMatching: Record<CompanyTrack, string[]> = {
  faang: ["Quantum Dev", "Executive Pro", "Tech Lead", "DevMaster"],
  startup: ["Growth Hacker", "Full Stack Pro", "DevMaster", "The Strategist"],
  consulting: ["Consultant Pro", "Boardroom", "The Strategist", "Executive Pro"],
  finance: ["Wall Street", "Corporate Ladder", "The Analyst", "Consultant Pro"],
};

export const templateCategories: TemplateCategory[] = [
  { category: "Tech", subCategories: "Dev, Data, Cloud, Security, AI/ML, DevOps", aiFeatures: "Code integration, stack depth, Git metrics" },
  { category: "Corporate", subCategories: "Finance, Consulting, HR, Operations", aiFeatures: "KPI charts, ROI points, budget impact mapping" },
  { category: "Creative", subCategories: "Design, Video, Writing, Animation", aiFeatures: "Portfolio blocks, storytelling score, visual fit" },
  { category: "Medical", subCategories: "Doctor, Nurse, Research, Pharma", aiFeatures: "Publication structuring, compliance language checks" },
  { category: "Sales", subCategories: "B2B, B2C, Retail, Insurance", aiFeatures: "Revenue graph cards, conversion narratives, account scale" },
  { category: "Education", subCategories: "Teacher, Professor, Trainer, Coach", aiFeatures: "Learning outcomes, research impact, grants coverage" },
  { category: "Engineering", subCategories: "Civil, Mechanical, Electrical, Chemical", aiFeatures: "Project blueprint summaries, safety metrics, quality score" },
  { category: "Freshers", subCategories: "Intern, Graduate, Trainee, Apprentice", aiFeatures: "Potential scoring, project-first visibility, learning roadmap" },
];

export const funnelSteps: FunnelStep[] = [
  { id: 1, label: "Landing hook: Get 3x More Interviews" },
  { id: 2, label: "30-second quick quiz" },
  { id: 3, label: "Instant AI draft generation" },
  { id: 4, label: "Score preview with percentile benchmark" },
  { id: 5, label: "Email sign-up for downloads" },
  { id: 6, label: "Free dashboard with limited AI" },
  { id: 7, label: "Personalized recommendations and nudges" },
  { id: 8, label: "7-day premium trial" },
  { id: 9, label: "Paid conversion on value unlock" },
  { id: 10, label: "Retention with continuous growth tools" },
];

export const pricingTiers: PricingTier[] = [
  { name: "Free", price: "$0", target: "Students and first-time users", includes: ["Basic templates", "1 download/month", "Basic AI suggestions"] },
  { name: "Pro", price: "$19/month", target: "Active job seekers", includes: ["All templates", "Unlimited downloads", "Advanced ATS and AI tools"] },
  { name: "Business", price: "$49/month", target: "Career teams and bootcamps", includes: ["Team seats", "Analytics dashboard", "API access"] },
  { name: "Enterprise", price: "Custom", target: "Institutions and large orgs", includes: ["White-label", "Custom templates", "Dedicated support"] },
];

export const revenueStreams: RevenueStream[] = [
  { title: "Template Marketplace", description: "Creators publish templates with platform revenue share." },
  { title: "Career Coaching", description: "Book verified coaches and interview experts in-app." },
  { title: "Recruiter Access", description: "Recruiters unlock qualified candidate discovery pipeline." },
  { title: "Add-on Services", description: "LinkedIn optimization, interview prep, and premium reviews." },
];

export const infraStack: InfraStackSection[] = [
  { section: "Frontend", stack: ["Next.js 14", "React", "Tailwind CSS", "Framer Motion", "PWA + Offline", "Realtime WebSockets"] },
  { section: "Backend", stack: ["Node.js", "Express", "GraphQL", "Python FastAPI", "Redis", "RabbitMQ"] },
  { section: "Data + Search", stack: ["PostgreSQL", "MongoDB", "ClickHouse", "Elasticsearch", "S3 + CDN"] },
  { section: "DevOps", stack: ["Docker", "Kubernetes", "GitHub Actions", "Prometheus + Grafana", "ELK"] },
];

export const growthLoops: GrowthLoop[] = [
  { title: "Referral Loop", flow: "User shares resume -> friend signs up -> both unlock premium credits" },
  { title: "Social Loop", flow: "Resume publish -> LinkedIn visibility -> inbound sign-ups" },
  { title: "Content Loop", flow: "SEO template pages -> free tools -> email capture -> paid funnel" },
  { title: "University Loop", flow: "Campus partnerships -> student adoption -> alumni paid transition" },
  { title: "Recruiter Loop", flow: "Recruiter demand -> candidate pipeline -> repeat platform usage" },
];

export const roadmap: RoadmapItem[] = [
  { phase: "MVP Foundation", timeline: "Month 1-2", goals: ["50 production templates", "Core builder and exports", "Auth and baseline AI hints"] },
  { phase: "AI Expansion", timeline: "Month 3-4", goals: ["JD tailoring engine", "ATS scoring", "LinkedIn import"] },
  { phase: "Marketplace + Community", timeline: "Month 5-6", goals: ["Template creator portal", "Profile sharing", "Peer feedback loops"] },
  { phase: "Enterprise Layer", timeline: "Month 7-8", goals: ["Team management", "Org analytics", "API and white-label support"] },
  { phase: "Mobile Rollout", timeline: "Month 9-10", goals: ["iOS and Android apps", "Offline editing", "Push reminders"] },
  { phase: "Global Expansion", timeline: "Month 11-12", goals: ["20+ languages", "Regional formatting", "Compliance rollout"] },
];

export const kpiTargets: KpiTarget[] = [
  {
    horizon: "Year 1",
    targets: [
      "5M users",
      "15% paid conversion",
      "70% 6-month retention",
      "$10M ARR",
      "1000+ templates",
      "50+ countries",
    ],
  },
  {
    horizon: "Year 3",
    targets: [
      "50M users",
      "Default global resume platform positioning",
      "90% hiring-trend prediction confidence",
      "Full major job-board integrations",
      "Mobile-first growth channel dominance",
    ],
  },
];

export const secretSauce: SecretSauceItem[] = [
  { title: "Resume DNA", value: "Generates a unique candidate signature for ATS optimization strategy." },
  { title: "Emotional Intelligence Score", value: "Measures confidence, ownership, and collaboration tone in content." },
  { title: "Culture Match Predictor", value: "Maps user profile style with company culture fit likelihood." },
  { title: "Salary Negotiation Coach", value: "Provides personalized negotiation scripts with confidence score." },
  { title: "Interview Question Predictor", value: "Generates likely interview questions from each resume claim." },
];

const roleBaseBandMap: Record<string, [number, number]> = {
  "software engineer": [1200000, 2200000],
  "data analyst": [800000, 1600000],
  "product manager": [1500000, 2800000],
  "ui ux designer": [900000, 1700000],
  "marketing manager": [900000, 1800000],
};

const toSalaryProjection = (role: string, yearsExperience: number, geoFormat: GeoFormat) => {
  const key = role.toLowerCase().trim();
  const baseBand = roleBaseBandMap[key] ?? [900000, 1800000];
  const growth = 1 + Math.min(0.9, Math.max(0, yearsExperience) * 0.08);
  const geo = geoSalaryMultiplier[geoFormat];
  const min = Math.round(baseBand[0] * growth * geo);
  const max = Math.round(baseBand[1] * growth * geo);
  return `${min.toLocaleString()} - ${max.toLocaleString()} annual`;
};

const toRecommendedFormats = (track: CompanyTrack): ResumeFormat[] => {
  if (track === "faang") {
    return resumeFormats.filter((item) => ["text", "web", "portfolio", "presentation"].includes(item.id));
  }
  if (track === "startup") {
    return resumeFormats.filter((item) => ["web", "portfolio", "video", "text"].includes(item.id));
  }
  if (track === "consulting") {
    return resumeFormats.filter((item) => ["text", "presentation", "linkedin", "infographic"].includes(item.id));
  }
  return resumeFormats.filter((item) => ["text", "linkedin", "presentation", "audio"].includes(item.id));
};

export const computeGeneratedPlan = (input: QuickQuizInput): GeneratedPlan => {
  const years = Math.max(0, input.yearsExperience || 0);
  const normalizedRole = input.targetRole.toLowerCase().trim();
  const templateNameSet = smartMatching[input.companyTrack];

  const recommendedTemplates = templateNameSet
    .map((name) => templateCatalog.find((item) => item.name === name))
    .filter((item): item is TemplateDefinition => Boolean(item))
    .filter((item) => years >= item.experienceRange[0] && years <= item.experienceRange[1]);

  const selectedTemplates = recommendedTemplates.length > 0
    ? recommendedTemplates
    : templateCatalog.slice(0, 4);

  const profileNameSignal = input.fullName.trim().length > 0 ? 6 : 0;
  const roleDepthSignal = Math.min(16, Math.round(years * 2));
  const trackSignal = trackBoost[input.companyTrack];
  const geoSignal = input.geoFormat === "global" ? 8 : 5;

  const atsScore = clamp(58 + profileNameSignal + roleDepthSignal + trackSignal + geoSignal);
  const roleMatch = clamp(60 + Math.round(trackSignal * 1.5) + Math.round(Math.min(12, years * 1.3)));
  const interviewProbability = clamp(Math.round(atsScore * 0.68 + roleMatch * 0.32 - 4));
  const industryRankPercentile = clamp(Math.round(52 + (atsScore - 55) * 0.9 + years * 1.4));

  const progression = roleProgressionMap[normalizedRole]
    ?? roleProgressionMap["software engineer"];

  const interviewQuestions = (
    interviewQuestionBank[normalizedRole] ?? interviewQuestionBank["software engineer"]
  ).slice(0, 4);

  const promotionTimeline = years < 2
    ? "Next promotion target: 12-18 months with ownership and impact proof."
    : years < 6
      ? "Next promotion target: 9-15 months by driving cross-functional initiatives."
      : "Leadership promotion track: 12-24 months with org-level outcomes.";

  const salaryProjection = toSalaryProjection(normalizedRole, years, input.geoFormat);

  const recommendedFormats = toRecommendedFormats(input.companyTrack);

  const resumeDna = buildResumeDna(
    `${input.fullName}|${normalizedRole}|${input.companyTrack}|${input.geoFormat}|${years}`,
  );

  const actionPlan = [
    "Complete one role-specific template and one company-specific variant.",
    "Inject STAR bullets for top 5 impact statements.",
    "Run ATS optimization and remove keyword gaps.",
    "Generate interview question pack and mock answers.",
    "Publish web resume and sync LinkedIn format.",
  ];

  return {
    resumeDna,
    atsScore,
    roleMatch,
    interviewProbability,
    industryRankPercentile,
    nextMoves: progression,
    promotionTimeline,
    salaryProjection,
    recommendedTemplates: selectedTemplates.slice(0, 4),
    recommendedFormats,
    interviewQuestions,
    actionPlan,
  };
};
