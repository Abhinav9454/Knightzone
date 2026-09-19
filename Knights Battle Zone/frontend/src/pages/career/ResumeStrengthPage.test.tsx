import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ResumeStrengthPage from "./ResumeStrengthPage";
import type { ResumeStrength } from "@/lib/types";

const apiMocks = vi.hoisted(() => ({
  getStrength: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  resumeApi: {
    getStrength: (...args: unknown[]) => apiMocks.getStrength(...args),
    upload: (...args: unknown[]) => apiMocks.upload(...args),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ResumeStrengthPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders professional audit blocks with hard validation data", async () => {
    const payload: ResumeStrength = {
      overallScore: 82,
      grade: "A",
      verdict: "Strong for MNC shortlisting",
      benchmark: "Top 20% screening quality",
      checkedAt: "2026-03-13T08:15:00Z",
      deepAnalysis: true,
      breakdown: [
        { category: "Problem Solving", score: 88, suggestion: "Maintain hard problem consistency." },
        { category: "Contest Experience", score: 79, suggestion: "Participate in more rated contests." },
      ],
      hardChecks: [
        {
          id: "contact-presence",
          title: "Contact Presence",
          status: "PASS",
          severity: "CRITICAL",
          detail: "Email, phone, and profile links are present.",
          action: "Keep links updated and publicly accessible.",
        },
        {
          id: "impact-metrics",
          title: "Impact Metrics",
          status: "WARN",
          severity: "MAJOR",
          detail: "Partial quantification detected.",
          action: "Add metrics such as % improvement and business impact.",
        },
      ],
      priorityActions: [
        "Add metrics such as % improvement and business impact.",
        "Strengthen action verbs in project bullets.",
      ],
    };

    apiMocks.getStrength.mockResolvedValue({ data: payload });
    apiMocks.upload.mockResolvedValue({ data: payload });

    render(<ResumeStrengthPage />);

    await waitFor(() => expect(apiMocks.getStrength).toHaveBeenCalledTimes(1));

    expect(screen.getByText("Resume Strength Studio")).toBeInTheDocument();
    expect(screen.getByText("Hard Validation Results")).toBeInTheDocument();
    expect(screen.getByText("Contact Presence")).toBeInTheDocument();
    expect(screen.getByText("Priority Fixes")).toBeInTheDocument();
    expect(screen.getAllByText("Add metrics such as % improvement and business impact.").length).toBeGreaterThan(0);
  });
});
