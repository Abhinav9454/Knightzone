export type CompanyTrack = "faang" | "startup" | "consulting" | "finance";
export type GeoFormat = "india" | "us" | "uk" | "global";

export interface ResumeFormat {
  id: string;
  label: string;
  description: string;
  output: string;
}

export interface AiModule {
  id: string;
  title: string;
  summary: string;
  signals: string[];
}

export interface TemplateDefinition {
  name: string;
  industry: string[];
  roles: string[];
  experienceRange: [number, number];
  locations: string[];
  tracks: CompanyTrack[];
  features: string[];
  aiScore: number;
}

export interface TemplateCategory {
  category: string;
  subCategories: string;
  aiFeatures: string;
}

export interface FunnelStep {
  id: number;
  label: string;
}

export interface PricingTier {
  name: string;
  price: string;
  target: string;
  includes: string[];
}

export interface RevenueStream {
  title: string;
  description: string;
}

export interface InfraStackSection {
  section: string;
  stack: string[];
}

export interface GrowthLoop {
  title: string;
  flow: string;
}

export interface RoadmapItem {
  phase: string;
  timeline: string;
  goals: string[];
}

export interface KpiTarget {
  horizon: string;
  targets: string[];
}

export interface SecretSauceItem {
  title: string;
  value: string;
}

export interface QuickQuizInput {
  fullName: string;
  targetRole: string;
  yearsExperience: number;
  companyTrack: CompanyTrack;
  geoFormat: GeoFormat;
}

export interface GeneratedPlan {
  resumeDna: string;
  atsScore: number;
  roleMatch: number;
  interviewProbability: number;
  industryRankPercentile: number;
  nextMoves: string[];
  promotionTimeline: string;
  salaryProjection: string;
  recommendedTemplates: TemplateDefinition[];
  recommendedFormats: ResumeFormat[];
  interviewQuestions: string[];
  actionPlan: string[];
}
