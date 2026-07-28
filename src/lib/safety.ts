import type { GeneratePromptRequest, PromptControls, PromptResult, StructuredPrompt } from "./types.js";

const unsafePatterns = [
  /\b(?:porn|porno|sex|sexual|nude|nudity|fetish|erotic)\b/i,
  /\b(?:gore|gory|decapitation|dismember|torture|massacre)\b/i,
  /\b(?:self[-\s]?harm|suicide|kill myself|cutting)\b/i,
  /\b(?:terrorist|bomb making|make a bomb|school shooting)\b/i,
  /\b(?:nazi|kkk|white supremacy|racial slur)\b/i
];

const protectedIpPatterns = [
  /\b(?:disney|pixar|marvel|dc comics|pokemon|mickey mouse|spider[-\s]?man|batman|harry potter|star wars|minecraft|sonic|naruto|studio ghibli)\b/i,
  /\b(?:in the style of|draw like|copy the style of|as painted by)\b/i
];

const livingArtistStylePattern =
  /\b(?:in the style of|draw like|copy the style of|as painted by)\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?/;

const kidUnsafeMoods = /\b(?:horror|terrifying|nightmare|grim|violent|bloody)\b/i;
const modelMetaComment = /\b(?:wait[,\s]+malformed|need(?:s)?\s+(?:a\s+)?fix(?:ing)?|editor(?:'s)?\s+note|model\s+note)\b/i;

export interface SafetyCheck {
  ok: boolean;
  reason?: string;
}

export const checkRequestSafety = (request: GeneratePromptRequest): SafetyCheck => {
  const text = [
    request.idea,
    request.controls.medium,
    request.controls.mood,
    request.controls.genre,
    request.controls.palette,
    request.controls.composition,
    request.controls.constraint,
    ...Object.values(request.lockedFields ?? {})
  ]
    .join(" ")
    .trim();

  if (!text) {
    return { ok: false, reason: "Add a short idea before generating a prompt." };
  }

  if (unsafePatterns.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      reason: "This request cannot be turned into a safe drawing prompt. Try a non-graphic, age-appropriate idea."
    };
  }

  if (protectedIpPatterns.some((pattern) => pattern.test(text)) || livingArtistStylePattern.test(text)) {
    return {
      ok: false,
      reason: "Use a general genre or visual trait instead of a protected character, brand, or living artist style."
    };
  }

  if ((request.controls.mode === "kids" || request.controls.audience === "kids") && kidUnsafeMoods.test(text)) {
    return { ok: false, reason: "Kids prompts must stay friendly, non-scary, and classroom-safe." };
  }

  return { ok: true };
};

export const sanitizeIdea = (idea: string): string =>
  idea
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 600);

export const normalizeControls = (controls: PromptControls): PromptControls => ({
  ...controls,
  medium: sanitizeField(controls.medium, "any drawing medium"),
  mood: sanitizeField(controls.mood, "thoughtful"),
  genre: sanitizeField(controls.genre, "imaginative scene"),
  palette: sanitizeField(controls.palette, "balanced palette"),
  composition: sanitizeField(controls.composition, "clear focal point"),
  constraint: sanitizeField(controls.constraint, "one visual constraint")
});

export const enforceResultSafety = (result: PromptResult): PromptResult => {
  const structured = mapStructured(result.structured, scrubUnsafeText);
  return {
    ...result,
    title: scrubUnsafeText(result.title),
    drawingPrompt: scrubUnsafeText(result.drawingPrompt),
    structured,
    practiceSteps: result.practiceSteps.map(scrubPracticeStep).filter(Boolean).slice(0, 4),
    aiImagePrompt: result.aiImagePrompt ? scrubUnsafeText(result.aiImagePrompt) : undefined,
    negativePrompt: result.negativePrompt ? scrubUnsafeText(result.negativePrompt) : undefined,
    teacherNote: result.teacherNote ? scrubUnsafeText(result.teacherNote) : undefined,
    safetyNote:
      "Generated prompts avoid NSFW, graphic violence, protected characters, brand logos, and living-artist style requests."
  };
};

const scrubPracticeStep = (value: string): string =>
  modelMetaComment.test(value)
    ? "Review the silhouette, focal point, and chosen constraint before adding final details."
    : scrubUnsafeText(value);

export const containsForbiddenTerm = (text: string): boolean =>
  [...unsafePatterns, ...protectedIpPatterns, livingArtistStylePattern].some((pattern) => pattern.test(text));

const sanitizeField = (value: string, fallback: string): string => {
  const cleaned = scrubUnsafeText(value).replace(/\s+/g, " ").trim();
  return cleaned.length > 0 ? cleaned.slice(0, 80) : fallback;
};

const scrubUnsafeText = (value: string): string =>
  value
    .replace(protectedIpPatterns[0], "a familiar but original fictional motif")
    .replace(/\b(?:in the style of|draw like|copy the style of|as painted by)\b/gi, "using broad visual traits from")
    .replace(unsafePatterns[0], "age-appropriate")
    .replace(unsafePatterns[1], "dramatic but non-graphic")
    .replace(unsafePatterns[2], "reflective")
    .replace(unsafePatterns[3], "high-stakes fictional")
    .replace(unsafePatterns[4], "historical cautionary")
    .replace(/\s+[\u0400-\u04ff][?!.]*$/u, "")
    .replace(/\s+/g, " ")
    .trim();

const mapStructured = (
  structured: StructuredPrompt,
  mapper: (value: string) => string
): StructuredPrompt => ({
  ...structured,
  subject: mapper(structured.subject),
  action: mapper(structured.action),
  setting: mapper(structured.setting),
  medium: mapper(structured.medium),
  mood: mapper(structured.mood),
  palette: mapper(structured.palette),
  composition: mapper(structured.composition),
  constraint: mapper(structured.constraint),
  genre: mapper(structured.genre)
});
