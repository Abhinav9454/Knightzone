import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PassageEditor } from "./PassageEditor";

vi.mock("@monaco-editor/react", () => ({
  default: (props: { value?: string; onChange?: (value: string) => void }) => (
    <textarea
      data-testid="mock-monaco"
      value={props.value ?? ""}
      onChange={(event) => props.onChange?.(event.target.value)}
    />
  ),
}));

describe("PassageEditor", () => {
  it("submits sanitized payload and resets form", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PassageEditor onSubmit={onSubmit} />);

    fireEvent.change(screen.getByPlaceholderText("Passage title"), { target: { value: "  DSA Sheet  " } });
    fireEvent.change(screen.getByPlaceholderText("Paste text passage..."), {
      target: { value: "  Arrays and strings daily practice.  " },
    });
    fireEvent.change(screen.getByPlaceholderText("algorithms, interview, javascript"), {
      target: { value: " Arrays, Interview, JavaScript " },
    });

    fireEvent.click(screen.getByRole("button", { name: /Publish Passage/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: "DSA Sheet",
        content: "Arrays and strings daily practice.",
        tags: ["arrays", "interview", "javascript"],
        syntaxMode: "PLAIN",
      }),
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Passage title")).toHaveValue("");
      expect(screen.getByPlaceholderText("Paste text passage...")).toHaveValue("");
      expect(screen.getByPlaceholderText("algorithms, interview, javascript")).toHaveValue("");
    });
  });

  it("uses syntax-friendly editor in code mode", () => {
    render(<PassageEditor onSubmit={vi.fn().mockResolvedValue(undefined)} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "TYPESCRIPT" } });
    expect(screen.getByTestId("mock-monaco")).toBeInTheDocument();
  });

  it("toggles preview panel", () => {
    render(<PassageEditor onSubmit={vi.fn().mockResolvedValue(undefined)} />);

    expect(screen.getByText("Preview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hide Preview/i }));
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
  });
});

