import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EligibilityBadge from "./EligibilityBadge";

describe("EligibilityBadge", () => {
  it("shows eligible state", () => {
    render(<EligibilityBadge eligible />);
    expect(screen.getByText("Eligible")).toBeInTheDocument();
  });

  it("shows not eligible state", () => {
    render(<EligibilityBadge eligible={false} />);
    expect(screen.getByText("Not eligible")).toBeInTheDocument();
  });
});

