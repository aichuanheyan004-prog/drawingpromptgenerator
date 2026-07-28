import type { Audience, Difficulty, PromptMode } from "./types.js";

interface PromptItem {
  value: string;
  modes?: PromptMode[];
  audiences?: Audience[];
  difficulties?: Difficulty[];
}

export const subjects: PromptItem[] = [
  { value: "a wind-up lantern keeper", modes: ["beginner", "character", "challenge"] },
  { value: "a tiny greenhouse on a kitchen table", modes: ["beginner", "kids", "classroom"] },
  { value: "a courier carrying maps through a rainy station", modes: ["character", "challenge"] },
  { value: "three mismatched mugs waiting for tea", modes: ["beginner", "classroom"] },
  { value: "a friendly moon festival parade", modes: ["kids", "classroom"] },
  { value: "an old robot learning to garden", modes: ["character", "ai-image", "challenge"] },
  { value: "a floating library above a quiet street", modes: ["ai-image", "challenge"] },
  { value: "a pair of shoes with different personalities", modes: ["kids", "beginner"] },
  { value: "a market stall selling invented fruits", modes: ["ai-image", "challenge", "classroom"] },
  { value: "a student inventor testing a pocket-sized weather machine", modes: ["kids", "character"] },
  { value: "a canyon bridge made from woven rope and light", modes: ["ai-image", "challenge"] },
  { value: "a calm portrait of a gardener after rain", modes: ["character", "beginner"] }
];

export const actions: PromptItem[] = [
  { value: "discovering a small clue" },
  { value: "balancing something fragile" },
  { value: "preparing for a gentle journey", audiences: ["general", "kids", "teens", "classroom"] },
  { value: "repairing a beloved object" },
  { value: "sharing a secret with the viewer" },
  { value: "making a careful choice", difficulties: ["medium", "hard"] },
  { value: "turning an ordinary tool into a surprise", modes: ["challenge", "ai-image"] },
  { value: "teaching a friend how to notice details", audiences: ["kids", "classroom"] }
];

export const settings: PromptItem[] = [
  { value: "inside a sunlit studio corner" },
  { value: "on a quiet rooftop after a storm" },
  { value: "beside a classroom window" },
  { value: "at the edge of a glowing forest path", modes: ["ai-image", "challenge", "kids"] },
  { value: "in a crowded train station drawn from memory", difficulties: ["medium", "hard"] },
  { value: "on a desk covered with sketches and labels" },
  { value: "under paper lanterns at dusk" },
  { value: "in a small town plaza with oversized shadows", modes: ["challenge", "ai-image"] }
];

export const mediums = [
  "graphite sketch",
  "colored pencil",
  "ink wash",
  "watercolor",
  "gouache study",
  "digital painting",
  "comic panel",
  "marker thumbnail",
  "charcoal value study",
  "soft pastel"
];

export const moods = [
  "curious",
  "calm",
  "playful",
  "mysterious but friendly",
  "hopeful",
  "focused",
  "cozy",
  "quietly dramatic",
  "dreamy",
  "determined"
];

export const genres = [
  "everyday object",
  "fantasy scene",
  "creature design",
  "environment design",
  "character design",
  "classroom warm-up",
  "sketchbook study",
  "story illustration",
  "still life twist",
  "AI image prompt"
];

export const palettes = [
  "limited warm and cool accents",
  "three-color palette",
  "soft pastels with one saturated accent",
  "earth tones with a bright focal color",
  "black and white with one color note",
  "analogous blues and greens",
  "warm sunset colors",
  "muted neutrals with clean highlights"
];

export const compositions = [
  "clear focal point",
  "low-angle view",
  "overhead view",
  "rule-of-thirds layout",
  "foreground frame",
  "wide establishing shot",
  "close crop on hands or tools",
  "strong silhouette first"
];

export const constraints = [
  "include one unexpected texture",
  "use five simple shapes before adding detail",
  "make the background tell part of the story",
  "repeat one shape at three different sizes",
  "leave one area intentionally simple",
  "show motion without using speed lines",
  "make one object transparent",
  "hide a tiny clue in the scene"
];

export const fallbackExamples = [
  "a tiny boat made from a teacup",
  "a nervous inventor and their first flying umbrella",
  "a cozy reading corner in a future city",
  "a classroom mascot choosing a new hat",
  "a character who collects impossible keys",
  "an abandoned garden gate that still glows"
];

export const filterItems = (
  items: PromptItem[],
  mode: PromptMode,
  audience: Audience,
  difficulty: Difficulty
): string[] =>
  items
    .filter((item) => !item.modes || item.modes.includes(mode))
    .filter((item) => !item.audiences || item.audiences.includes(audience))
    .filter((item) => !item.difficulties || item.difficulties.includes(difficulty))
    .map((item) => item.value);
