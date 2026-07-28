import { actions, fallbackExamples, filterItems, settings, subjects } from "./promptData";
import { pick, randomId, type RandomSource, SeededRandom } from "./prng";
import { enforceResultSafety, normalizeControls, sanitizeIdea } from "./safety";
import type { GeneratePromptRequest, LockedFields, PromptControls, PromptResult, StructuredPrompt } from "./types";

export interface LocalPromptOptions {
  request: GeneratePromptRequest;
  seed?: string | number;
  now?: Date;
  random?: RandomSource;
}

export const createLocalPrompt = ({ request, seed, now = new Date(), random }: LocalPromptOptions): PromptResult => {
  const controls = normalizeControls(request.controls);
  const rng = random ?? new SeededRandom(seed ?? `${request.idea}|${JSON.stringify(controls)}|${Date.now()}`);
  const idea = sanitizeIdea(request.idea) || pick(fallbackExamples, rng);
  const locked = request.lockedFields ?? {};
  const structured = buildStructuredPrompt(idea, controls, locked, rng);
  const drawingPrompt = buildDrawingPrompt(structured);
  const result: PromptResult = {
    id: randomId(rng),
    title: titleFromStructured(structured),
    drawingPrompt,
    structured,
    practiceSteps: buildPracticeSteps(structured),
    aiImagePrompt: controls.mode === "ai-image" ? buildAiImagePrompt(structured) : undefined,
    negativePrompt: controls.mode === "ai-image" ? "no text artifacts, no brand logos, no protected characters, no graphic content" : undefined,
    teacherNote:
      controls.mode === "kids" || controls.mode === "classroom"
        ? "Keep the drawing age-appropriate, focus on observation, and let students simplify details when needed."
        : undefined,
    safetyNote:
      "Generated prompts avoid NSFW, graphic violence, protected characters, brand logos, and living-artist style requests.",
    source: "local",
    createdAt: now.toISOString()
  };
  return enforceResultSafety(result);
};

export const buildStructuredPrompt = (
  idea: string,
  controls: PromptControls,
  locked: LockedFields,
  random: RandomSource
): StructuredPrompt => {
  const subjectPool = filterItems(subjects, controls.mode, controls.audience, controls.difficulty);
  const actionPool = filterItems(actions, controls.mode, controls.audience, controls.difficulty);
  const settingPool = filterItems(settings, controls.mode, controls.audience, controls.difficulty);

  if (subjectPool.length === 0 || actionPool.length === 0 || settingPool.length === 0) {
    throw new Error("Prompt pool is empty for the selected filters.");
  }

  return {
    subject: locked.subject ?? subjectFromIdea(idea, pick(subjectPool, random)),
    action: locked.action ?? pick(actionPool, random),
    setting: locked.setting ?? pick(settingPool, random),
    medium: locked.medium ?? controls.medium,
    mood: locked.mood ?? controls.mood,
    palette: locked.palette ?? controls.palette,
    composition: locked.composition ?? controls.composition,
    constraint: locked.constraint ?? controls.constraint,
    difficulty: controls.difficulty,
    timeLimit: controls.timeLimit,
    audience: controls.audience,
    genre: controls.genre
  };
};

export const formatPromptForCopy = (result: PromptResult): string => {
  const parts = [
    result.title,
    "",
    result.drawingPrompt,
    "",
    `Medium: ${result.structured.medium}`,
    `Mood: ${result.structured.mood}`,
    `Palette: ${result.structured.palette}`,
    `Composition: ${result.structured.composition}`,
    `Constraint: ${result.structured.constraint}`,
    `Difficulty: ${result.structured.difficulty}`,
    `Time limit: ${result.structured.timeLimit}`,
    result.aiImagePrompt ? "" : undefined,
    result.aiImagePrompt ? `AI image prompt: ${result.aiImagePrompt}` : undefined,
    result.negativePrompt ? `Negative prompt: ${result.negativePrompt}` : undefined,
    "",
    "Practice steps:",
    ...result.practiceSteps.map((step, index) => `${index + 1}. ${step}`)
  ].filter((part): part is string => typeof part === "string");

  return parts.join("\n");
};

export const exampleRequest = (controls: PromptControls, random: RandomSource = new SeededRandom("example")): string => {
  if (controls.mode === "kids") {
    return "a friendly classroom helper finding a surprising art supply";
  }
  if (controls.mode === "character") {
    return "a traveler who repairs memories with a sketchbook";
  }
  if (controls.mode === "ai-image") {
    return "a quiet city greenhouse glowing after rain";
  }
  return pick(fallbackExamples, random);
};

const subjectFromIdea = (idea: string, fallback: string): string => {
  const cleaned = sanitizeIdea(idea).replace(/[.?!]+$/, "");
  if (cleaned.length < 3) {
    return fallback;
  }
  return cleaned.length > 90 ? `${cleaned.slice(0, 87).trim()}...` : cleaned;
};

const titleFromStructured = (structured: StructuredPrompt): string => {
  const core = structured.subject
    .split(" ")
    .slice(0, 8)
    .join(" ")
    .replace(/^a\s+/i, "")
    .replace(/^an\s+/i, "");
  return `${capitalize(core)} Drawing Prompt`;
};

const buildDrawingPrompt = (structured: StructuredPrompt): string =>
  `Draw ${structured.subject} ${structured.action} ${structured.setting}. Use ${structured.medium} with a ${structured.mood} mood, ${structured.palette}, and a ${structured.composition}. Add this constraint: ${structured.constraint}. Aim for ${structured.difficulty} difficulty in ${structured.timeLimit}.`;

const buildAiImagePrompt = (structured: StructuredPrompt): string =>
  `${structured.subject}, ${structured.action}, ${structured.setting}, ${structured.medium}, ${structured.mood} mood, ${structured.palette}, ${structured.composition}, original design, age-appropriate, no protected characters or brand logos`;

const buildPracticeSteps = (structured: StructuredPrompt): string[] => [
  `Block the ${structured.composition} with simple shapes before adding details.`,
  `Sketch the main subject and action, then place the setting around it.`,
  `Apply the ${structured.palette} and keep the ${structured.mood} mood consistent.`,
  `Check the constraint: ${structured.constraint}.`
];

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
