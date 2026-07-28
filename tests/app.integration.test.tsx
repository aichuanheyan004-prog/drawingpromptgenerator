import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../src/App";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("PromptTool integration", () => {
  it("generates, locks, copies, saves, and clears prompts", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            ok: true,
            remaining: 11,
            result: {
              id: "ai_1",
              title: "Robot Gardener Drawing Prompt",
              drawingPrompt: "Draw a robot gardener repairing a tiny greenhouse in watercolor.",
              structured: {
                subject: "a robot gardener",
                action: "repairing a tiny greenhouse",
                setting: "inside a rainy city",
                medium: "watercolor",
                mood: "hopeful",
                palette: "limited warm and cool accents",
                composition: "clear focal point",
                constraint: "include one unexpected texture",
                difficulty: "easy",
                timeLimit: "20 min",
                audience: "general",
                genre: "AI image prompt"
              },
              practiceSteps: ["Block the shape.", "Place the subject.", "Add color.", "Review the constraint."],
              aiImagePrompt: "original robot gardener, watercolor, no logos",
              negativePrompt: "no logos",
              teacherNote: "",
              safetyNote: "Generated prompts avoid protected characters.",
              source: "ai",
              createdAt: "2026-07-28T00:00:00.000Z"
            }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<App path="/" />);
    await user.clear(screen.getByLabelText("Rough idea"));
    await user.type(screen.getByLabelText("Rough idea"), "a robot gardener");
    await user.click(screen.getByRole("button", { name: "Generate prompt" }));

    expect(await screen.findByRole("heading", { name: "Robot Gardener Drawing Prompt", level: 2 })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Subject" }));
    expect(screen.getByText("1 locked fields")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy prompt" }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Robot Gardener Drawing Prompt"));

    await user.click(screen.getByRole("button", { name: "Save favorite" }));
    expect(screen.getAllByText("Robot Gardener Drawing Prompt").length).toBeGreaterThan(1);

    await user.click(screen.getByRole("button", { name: "Clear saved prompts" }));
    await waitFor(() => expect(screen.getByText("Favorites and recent prompts cleared.")).toBeInTheDocument());
  });

  it("shows validation errors and copy failure", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => {
      throw new Error("blocked");
    });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    render(<App path="/" />);
    await user.clear(screen.getByLabelText("Rough idea"));
    await user.type(screen.getByLabelText("Rough idea"), "Disney logo");
    await user.click(screen.getByRole("button", { name: "Generate prompt" }));
    expect(
      screen.getByText("Use a general genre or visual trait instead of a protected character, brand, or living artist style.", {
        selector: ".status-line span"
      })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy prompt" }));
    expect(screen.getByText(/Copy failed/i)).toBeInTheDocument();
  });

  it("explains an edge rate limit and falls back to a local draft", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { code: "429", message: "Too Many Requests" } }), {
          status: 429,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    render(<App path="/" />);
    await user.clear(screen.getByLabelText("Rough idea"));
    await user.type(screen.getByLabelText("Rough idea"), "a clockmaker training fireflies");
    await user.click(screen.getByRole("button", { name: "Generate prompt" }));

    expect(await screen.findByText(/free AI prompt limit has been reached/i)).toBeInTheDocument();
    expect(screen.getByText("Local draft")).toBeInTheDocument();
  });
});
