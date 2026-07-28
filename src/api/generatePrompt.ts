import { createLocalPrompt } from "../lib/promptGenerator";
import { checkRequestSafety, enforceResultSafety, normalizeControls, sanitizeIdea } from "../lib/safety";
import type { GeneratePromptRequest, GeneratePromptResponse, LockedFields, PromptControls, PromptResult } from "../lib/types";

interface RequestHeaders {
  [key: string]: string | string[] | undefined;
}

export interface GenerateEnvironment {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  FREE_REQUESTS_PER_HOUR?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export interface GenerateDeps {
  env: GenerateEnvironment;
  fetcher?: typeof fetch;
  now?: () => Date;
  randomId?: () => string;
}

interface GenerateArgs {
  body: unknown;
  headers: RequestHeaders;
  deps: GenerateDeps;
}

interface RateDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

const memoryRateLimit = new Map<string, { count: number; resetAt: number }>();

const responseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "drawingPrompt", "structured", "practiceSteps", "aiImagePrompt", "negativePrompt", "teacherNote"],
  properties: {
    title: { type: "string" },
    drawingPrompt: { type: "string" },
    structured: {
      type: "object",
      additionalProperties: false,
      required: [
        "subject",
        "action",
        "setting",
        "medium",
        "mood",
        "palette",
        "composition",
        "constraint",
        "difficulty",
        "timeLimit",
        "audience",
        "genre"
      ],
      properties: {
        subject: { type: "string" },
        action: { type: "string" },
        setting: { type: "string" },
        medium: { type: "string" },
        mood: { type: "string" },
        palette: { type: "string" },
        composition: { type: "string" },
        constraint: { type: "string" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
        timeLimit: { type: "string", enum: ["10 min", "20 min", "45 min", "90 min", "open"] },
        audience: { type: "string", enum: ["general", "kids", "teens", "classroom", "professional"] },
        genre: { type: "string" }
      }
    },
    practiceSteps: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: { type: "string" }
    },
    aiImagePrompt: { type: "string" },
    negativePrompt: { type: "string" },
    teacherNote: { type: "string" }
  }
};

export const generatePromptResponse = async ({ body, headers, deps }: GenerateArgs): Promise<GeneratePromptResponse> => {
  const parsed = parseRequest(body);
  if (!parsed.ok) {
    return { ok: false, code: "bad_request", message: parsed.message };
  }

  const request = parsed.request;
  const safety = checkRequestSafety(request);
  if (!safety.ok) {
    return { ok: false, code: "unsafe_request", message: safety.reason ?? "This prompt is not safe to generate." };
  }

  const key = await clientKey(headers, request.sessionId);
  const rate = await checkRateLimit(key, deps.env, deps.fetcher ?? fetch, deps.now?.() ?? new Date());
  if (!rate.allowed) {
    return {
      ok: false,
      code: "rate_limited",
      message: "The free AI prompt limit has been reached. Try again later.",
      retryAfterSeconds: rate.retryAfterSeconds
    };
  }

  if (!deps.env.OPENAI_API_KEY || !hasDurableRateLimit(deps.env)) {
    const result = createLocalPrompt({ request, seed: `${key}:${request.idea}`, now: deps.now?.() ?? new Date() });
    return { ok: true, result, remaining: rate.remaining };
  }

  try {
    const result = await callOpenAi(request, key, deps);
    return { ok: true, result, remaining: rate.remaining };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The AI model is unavailable right now.";
    return { ok: false, code: "model_error", message };
  }
};

export const parseRequest = (
  body: unknown
): { ok: true; request: GeneratePromptRequest } | { ok: false; message: string } => {
  if (!isRecord(body)) {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const controls = isRecord(body.controls) ? normalizeControls(body.controls as unknown as PromptControls) : undefined;
  const idea = typeof body.idea === "string" ? sanitizeIdea(body.idea) : "";

  if (!controls) {
    return { ok: false, message: "Prompt controls are required." };
  }
  if (idea.length < 3) {
    return { ok: false, message: "Enter at least three characters for your drawing idea." };
  }
  if (typeof body.idea === "string" && body.idea.length > 600) {
    return { ok: false, message: "Keep the idea under 600 characters." };
  }

  return {
    ok: true,
    request: {
      idea,
      controls,
      lockedFields: sanitizeLockedFields(body.lockedFields),
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 80) : undefined
    }
  };
};

export const callOpenAi = async (
  request: GeneratePromptRequest,
  clientHash: string,
  deps: GenerateDeps
): Promise<PromptResult> => {
  const fetcher = deps.fetcher ?? fetch;
  const model = deps.env.OPENAI_MODEL || "gpt-5.6-luna";
  const now = deps.now?.() ?? new Date();
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deps.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You are a careful drawing prompt editor. Turn rough ideas into original, age-appropriate drawing prompts. Avoid NSFW, graphic violence, hate, illegal instructions, self-harm, protected characters, brand logos, and living-artist style requests. Use broad visual traits instead of named IP or artist imitation. Return only JSON matching the schema."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                idea: request.idea,
                controls: request.controls,
                lockedFields: request.lockedFields ?? {},
                requirements: [
                  "Make the drawing prompt specific enough to draw.",
                  "Keep locked fields unchanged when provided.",
                  "Include practical practice steps.",
                  "If mode is ai-image, provide text prompt formatting only; do not claim to generate images.",
                  "If audience or mode is kids/classroom, keep it safe for children and teachers."
                ]
              })
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "drawing_prompt_response",
          strict: true,
          schema: responseSchema
        }
      },
      max_output_tokens: 900,
      safety_identifier: `dpg_${clientHash.slice(0, 32)}`
    })
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("The AI model is busy or rate limited. Please try again soon.");
    }
    throw new Error("The AI model could not generate a prompt right now.");
  }

  const data = (await response.json()) as unknown;
  const text = extractOutputText(data);
  const parsed = JSON.parse(text) as Omit<PromptResult, "id" | "source" | "createdAt" | "safetyNote"> & {
    safetyNote?: string;
  };

  return enforceResultSafety({
    id: deps.randomId?.() ?? `ai_${cryptoSafeId()}`,
    title: parsed.title,
    drawingPrompt: parsed.drawingPrompt,
    structured: parsed.structured,
    practiceSteps: parsed.practiceSteps,
    aiImagePrompt: request.controls.mode === "ai-image" ? parsed.aiImagePrompt : undefined,
    negativePrompt: request.controls.mode === "ai-image" ? parsed.negativePrompt : undefined,
    teacherNote: parsed.teacherNote || undefined,
    safetyNote: parsed.safetyNote ?? "",
    source: "ai",
    createdAt: now.toISOString()
  });
};

export const extractOutputText = (data: unknown): string => {
  if (isRecord(data) && typeof data.output_text === "string") {
    return data.output_text;
  }

  if (isRecord(data) && Array.isArray(data.output)) {
    const chunks: string[] = [];
    for (const item of data.output) {
      if (!isRecord(item) || !Array.isArray(item.content)) {
        continue;
      }
      for (const content of item.content) {
        if (isRecord(content) && typeof content.text === "string") {
          chunks.push(content.text);
        }
      }
    }
    if (chunks.length > 0) {
      return chunks.join("");
    }
  }

  throw new Error("The AI response was empty.");
};

const checkRateLimit = async (
  key: string,
  env: GenerateEnvironment,
  fetcher: typeof fetch,
  now: Date
): Promise<RateDecision> => {
  const limit = Math.max(1, Number.parseInt(env.FREE_REQUESTS_PER_HOUR ?? "12", 10) || 12);
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return checkUpstashRateLimit(key, limit, env, fetcher);
  }

  const windowMs = 60 * 60 * 1000;
  const existing = memoryRateLimit.get(key);
  if (!existing || existing.resetAt <= now.getTime()) {
    memoryRateLimit.set(key, { count: 1, resetAt: now.getTime() + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now.getTime()) / 1000))
    };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count) };
};

const hasDurableRateLimit = (env: GenerateEnvironment): boolean =>
  Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);

const checkUpstashRateLimit = async (
  key: string,
  limit: number,
  env: GenerateEnvironment,
  fetcher: typeof fetch
): Promise<RateDecision> => {
  const redisKey = `dpg:rate:${key}`;
  const url = `${env.UPSTASH_REDIS_REST_URL}/incr/${encodeURIComponent(redisKey)}`;
  const response = await fetcher(url, {
    headers: {
      Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
    }
  });
  const data = (await response.json()) as { result?: number };
  const count = data.result ?? 1;
  if (count === 1) {
    await fetcher(`${env.UPSTASH_REDIS_REST_URL}/expire/${encodeURIComponent(redisKey)}/3600`, {
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN}`
      }
    });
  }
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), retryAfterSeconds: count > limit ? 3600 : undefined };
};

const sanitizeLockedFields = (value: unknown): LockedFields | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }
  const next: LockedFields = {};
  for (const key of ["subject", "action", "setting", "medium", "mood", "palette", "composition", "constraint"] as const) {
    const field = value[key];
    if (typeof field === "string" && field.trim()) {
      next[key] = sanitizeIdea(field).slice(0, 120);
    }
  }
  return next;
};

const clientKey = async (headers: RequestHeaders, sessionId?: string): Promise<string> => {
  const forwarded = firstHeader(headers["x-forwarded-for"])?.split(",")[0]?.trim();
  const realIp = firstHeader(headers["x-real-ip"]);
  const userAgent = firstHeader(headers["user-agent"]);
  const raw = `${forwarded ?? realIp ?? "unknown"}|${userAgent ?? "ua"}|${sessionId ?? "session"}`;
  return sha256(raw);
};

const firstHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const sha256 = async (value: string): Promise<string> => {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `plain_${value.length}_${value.slice(0, 20).replace(/[^a-z0-9]/gi, "")}`;
};

const cryptoSafeId = (): string => {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint32Array(2);
    globalThis.crypto.getRandomValues(bytes);
    return `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  }
  return Math.random().toString(36).slice(2);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
