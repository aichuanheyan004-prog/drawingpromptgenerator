import { describe, expect, it } from "vitest";
import { createLocalPrompt, formatPromptForCopy } from "../src/lib/promptGenerator";
import { pick, SeededRandom } from "../src/lib/prng";
import { checkRequestSafety, containsForbiddenTerm } from "../src/lib/safety";
import type { GeneratePromptRequest } from "../src/lib/types";
import { defaultControls } from "../src/lib/types";

const request = (overrides: Partial<GeneratePromptRequest> = {}): GeneratePromptRequest => ({
  idea: "a robot gardener repairing a tiny greenhouse",
  controls: {
    ...defaultControls,
    mode: "ai-image",
    audience: "general",
    medium: "watercolor",
    mood: "hopeful"
  },
  ...overrides
});

describe("local prompt generator", () => {
  it("creates stable seeded prompts with useful structure", () => {
    const first = createLocalPrompt({ request: request(), seed: "stable-seed", now: new Date("2026-07-28T00:00:00.000Z") });
    const second = createLocalPrompt({ request: request(), seed: "stable-seed", now: new Date("2026-07-28T00:00:00.000Z") });

    expect(second).toEqual(first);
    expect(first.drawingPrompt).toContain("Draw");
    expect(first.structured.subject).toContain("robot gardener");
    expect(first.practiceSteps).toHaveLength(4);
    expect(first.aiImagePrompt).toContain("no protected characters");
  });

  it("preserves locked fields when regenerating", () => {
    const locked = {
      subject: "a locked subject",
      medium: "ink wash",
      mood: "calm",
      palette: "three-color palette",
      composition: "overhead view",
      constraint: "hide a tiny clue in the scene"
    };
    const result = createLocalPrompt({ request: request({ lockedFields: locked }), seed: "locks" });

    expect(result.structured.subject).toBe(locked.subject);
    expect(result.structured.medium).toBe(locked.medium);
    expect(result.structured.constraint).toBe(locked.constraint);
  });

  it("changes output for kids and character modes without unsafe terms", () => {
    const kids = createLocalPrompt({
      request: request({ controls: { ...defaultControls, mode: "kids", audience: "kids", genre: "classroom warm-up" } }),
      seed: "kids"
    });
    const character = createLocalPrompt({
      request: request({ controls: { ...defaultControls, mode: "character", audience: "teens", genre: "character design" } }),
      seed: "character"
    });

    expect(kids.teacherNote).toContain("age-appropriate");
    expect(character.structured.genre).toBe("character design");
    expect(containsForbiddenTerm(kids.drawingPrompt)).toBe(false);
    expect(containsForbiddenTerm(character.drawingPrompt)).toBe(false);
  });

  it("rejects unsafe, IP, and living-artist style requests", () => {
    expect(checkRequestSafety(request({ idea: "draw gore in a school hallway" })).ok).toBe(false);
    expect(checkRequestSafety(request({ idea: "draw Mickey Mouse in the style of a living artist" })).ok).toBe(false);
    expect(checkRequestSafety(request({ idea: "a peaceful library at dusk" })).ok).toBe(true);
  });

  it("formats copy text with actual prompt content and steps", () => {
    const result = createLocalPrompt({ request: request(), seed: "copy" });
    const text = formatPromptForCopy(result);

    expect(text).toContain(result.title);
    expect(text).toContain(result.drawingPrompt);
    expect(text).toContain("Practice steps:");
    expect(text).toContain("1.");
  });

  it("handles long ideas, special characters, and empty pool errors", () => {
    const longIdea = `a tiny studio <script>alert(1)</script> ${"with mirrors ".repeat(80)}`;
    const result = createLocalPrompt({ request: request({ idea: longIdea }), seed: "long" });

    expect(result.structured.subject).not.toContain("<script>");
    expect(result.structured.subject.length).toBeLessThanOrEqual(93);
    expect(() => pick([], new SeededRandom("empty"))).toThrow("empty prompt pool");
  });
});
