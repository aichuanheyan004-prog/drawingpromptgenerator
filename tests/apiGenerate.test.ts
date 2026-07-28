import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractOutputText, generatePromptResponse, parseRequest } from "../src/api/generatePrompt";
import { defaultControls, type GeneratePromptRequest } from "../src/lib/types";

const baseRequest: GeneratePromptRequest = {
  idea: "a quiet greenhouse over a rainy city",
  controls: {
    ...defaultControls,
    mode: "ai-image",
    audience: "general",
    medium: "watercolor"
  },
  sessionId: "session-test"
};

const headers = {
  "x-forwarded-for": "203.0.113.10",
  "user-agent": "vitest"
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("API request validation", () => {
  it("validates shape, length, and safety", async () => {
    expect(parseRequest({ controls: baseRequest.controls, idea: "ab" }).ok).toBe(false);
    expect(parseRequest({ controls: baseRequest.controls, idea: "x".repeat(601) }).ok).toBe(false);

    const unsafe = await generatePromptResponse({
      body: { ...baseRequest, idea: "draw a Disney logo" },
      headers,
      deps: { env: {}, now: () => new Date("2026-07-28T00:00:00.000Z") }
    });
    expect(unsafe.ok).toBe(false);
    if (!unsafe.ok) {
      expect(unsafe.code).toBe("unsafe_request");
    }
  });

  it("returns local prompts when the API key is missing", async () => {
    const result = await generatePromptResponse({
      body: baseRequest,
      headers,
      deps: { env: {}, now: () => new Date("2026-07-28T00:00:00.000Z") }
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.source).toBe("local");
      expect(result.result.drawingPrompt).toContain("Draw");
    }
  });

  it("enforces anonymous hourly limits", async () => {
    const deps = { env: { FREE_REQUESTS_PER_HOUR: "1" }, now: () => new Date("2026-07-28T01:00:00.000Z") };
    const first = await generatePromptResponse({ body: { ...baseRequest, sessionId: "limited" }, headers, deps });
    const second = await generatePromptResponse({ body: { ...baseRequest, sessionId: "limited" }, headers, deps });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.code).toBe("rate_limited");
      expect(second.retryAfterSeconds).toBeGreaterThan(0);
    }
  });
});

describe("OpenAI response integration", () => {
  it("sends structured Responses API requests and normalizes AI output", async () => {
    const fetcher = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe("test-model");
      expect(body.text.format.type).toBe("json_schema");
      expect(body.max_output_tokens).toBe(900);
      expect(body.safety_identifier).toContain("dpg_");
      return new Response(
        JSON.stringify({
          output_text: JSON.stringify({
            title: "Greenhouse Drawing Prompt",
            drawingPrompt: "Draw an original greenhouse above a rainy city using watercolor.",
            structured: {
              subject: "an original greenhouse above a rainy city",
              action: "glowing softly",
              setting: "above a quiet street",
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
            practiceSteps: ["Block the focal point.", "Sketch the subject.", "Add palette.", "Review the constraint."],
            aiImagePrompt: "original greenhouse, watercolor, no brand logos",
            negativePrompt: "no logos",
            teacherNote: ""
          })
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const response = await generatePromptResponse({
      body: baseRequest,
      headers: { ...headers, "x-forwarded-for": "203.0.113.12" },
      deps: {
        env: { OPENAI_API_KEY: "test-key", OPENAI_MODEL: "test-model" },
        fetcher: fetcher as unknown as typeof fetch,
        now: () => new Date("2026-07-28T02:00:00.000Z"),
        randomId: () => "ai_test"
      }
    });

    expect(response.ok).toBe(true);
    if (response.ok) {
      expect(response.result.id).toBe("ai_test");
      expect(response.result.source).toBe("ai");
      expect(response.result.aiImagePrompt).toContain("no brand logos");
      expect(response.result.safetyNote).toContain("protected characters");
    }
  });

  it("extracts nested output text from Responses API payloads", () => {
    const text = extractOutputText({
      output: [{ content: [{ text: "{\"title\":\"Nested\"}" }] }]
    });
    expect(text).toBe("{\"title\":\"Nested\"}");
  });
});
