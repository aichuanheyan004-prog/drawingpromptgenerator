import { generatePromptResponse } from "../src/api/generatePrompt";

interface VercelLikeRequest {
  method?: string;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

export default async function handler(request: VercelLikeRequest, response: VercelLikeResponse): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, code: "method_not_allowed", message: "Use POST to generate a prompt." });
    return;
  }

  const result = await generatePromptResponse({
    body: request.body,
    headers: request.headers,
    deps: {
      env: process.env
    }
  });

  const status = result.ok
    ? 200
    : result.code === "rate_limited"
      ? 429
      : result.code === "unsafe_request" || result.code === "bad_request"
        ? 400
        : 502;

  if (!result.ok && result.retryAfterSeconds) {
    response.setHeader("Retry-After", String(result.retryAfterSeconds));
  }

  response.setHeader("Cache-Control", "no-store");
  response.status(status).json(result);
}
