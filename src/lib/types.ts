export type PromptMode = "beginner" | "kids" | "challenge" | "ai-image" | "character" | "classroom";

export type Audience = "general" | "kids" | "teens" | "classroom" | "professional";

export type Difficulty = "easy" | "medium" | "hard";

export type TimeLimit = "10 min" | "20 min" | "45 min" | "90 min" | "open";

export type PromptField =
  | "subject"
  | "action"
  | "setting"
  | "medium"
  | "mood"
  | "palette"
  | "composition"
  | "constraint";

export interface PromptControls {
  mode: PromptMode;
  audience: Audience;
  difficulty: Difficulty;
  timeLimit: TimeLimit;
  medium: string;
  mood: string;
  genre: string;
  palette: string;
  composition: string;
  constraint: string;
}

export interface LockedFields {
  subject?: string;
  action?: string;
  setting?: string;
  medium?: string;
  mood?: string;
  palette?: string;
  composition?: string;
  constraint?: string;
}

export interface StructuredPrompt {
  subject: string;
  action: string;
  setting: string;
  medium: string;
  mood: string;
  palette: string;
  composition: string;
  constraint: string;
  difficulty: Difficulty;
  timeLimit: TimeLimit;
  audience: Audience;
  genre: string;
}

export interface PromptResult {
  id: string;
  title: string;
  drawingPrompt: string;
  structured: StructuredPrompt;
  practiceSteps: string[];
  aiImagePrompt?: string;
  negativePrompt?: string;
  teacherNote?: string;
  safetyNote: string;
  source: "ai" | "local" | "mock";
  createdAt: string;
}

export interface GeneratePromptRequest {
  idea: string;
  controls: PromptControls;
  lockedFields?: LockedFields;
  sessionId?: string;
}

export interface GeneratePromptSuccess {
  ok: true;
  result: PromptResult;
  remaining?: number;
}

export interface GeneratePromptFailure {
  ok: false;
  code:
    | "bad_request"
    | "unsafe_request"
    | "rate_limited"
    | "model_unavailable"
    | "model_error"
    | "method_not_allowed";
  message: string;
  retryAfterSeconds?: number;
}

export type GeneratePromptResponse = GeneratePromptSuccess | GeneratePromptFailure;

export const defaultControls: PromptControls = {
  mode: "beginner",
  audience: "general",
  difficulty: "easy",
  timeLimit: "20 min",
  medium: "graphite sketch",
  mood: "curious",
  genre: "everyday object",
  palette: "limited warm and cool accents",
  composition: "clear focal point",
  constraint: "include one unexpected texture"
};
