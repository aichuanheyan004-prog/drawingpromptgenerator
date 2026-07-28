import {
  AlertTriangle,
  BookOpen,
  Check,
  Clipboard,
  Lock,
  RefreshCw,
  Save,
  Shuffle,
  Sparkles,
  Trash2,
  Unlock,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createLocalPrompt, exampleRequest, formatPromptForCopy } from "../lib/promptGenerator";
import { SeededRandom } from "../lib/prng";
import { checkRequestSafety } from "../lib/safety";
import { createStorageBucket } from "../lib/storage";
import type {
  GeneratePromptRequest,
  GeneratePromptResponse,
  LockedFields,
  PromptControls,
  PromptField,
  PromptMode,
  PromptResult
} from "../lib/types";
import { defaultControls } from "../lib/types";

const initialIdea = "a quiet city greenhouse glowing after rain";
const initialResult = createLocalPrompt({
  request: { idea: initialIdea, controls: { ...defaultControls, mode: "ai-image" } },
  seed: "initial-drawing-prompt",
  now: new Date("2026-07-28T00:00:00.000Z")
});

const modePresets: Array<{ mode: PromptMode; label: string; description: string }> = [
  { mode: "beginner", label: "Beginner", description: "Simple, drawable prompts" },
  { mode: "kids", label: "Kids", description: "Friendly classroom-safe ideas" },
  { mode: "challenge", label: "Challenge", description: "More constraints and depth" },
  { mode: "ai-image", label: "AI image", description: "Text prompt format only" },
  { mode: "character", label: "Character", description: "Design traits and story hooks" }
];

const fieldLabels: Array<{ field: PromptField; label: string }> = [
  { field: "subject", label: "Subject" },
  { field: "medium", label: "Medium" },
  { field: "mood", label: "Mood" },
  { field: "palette", label: "Palette" },
  { field: "composition", label: "Composition" },
  { field: "constraint", label: "Constraint" }
];

const selectOptions = {
  medium: ["graphite sketch", "colored pencil", "ink wash", "watercolor", "gouache study", "digital painting", "comic panel", "marker thumbnail"],
  mood: ["curious", "calm", "playful", "mysterious but friendly", "hopeful", "focused", "cozy", "quietly dramatic"],
  genre: ["everyday object", "fantasy scene", "creature design", "environment design", "character design", "classroom warm-up", "sketchbook study", "story illustration"],
  palette: [
    "limited warm and cool accents",
    "three-color palette",
    "soft pastels with one saturated accent",
    "earth tones with a bright focal color",
    "black and white with one color note",
    "analogous blues and greens"
  ],
  composition: ["clear focal point", "low-angle view", "overhead view", "rule-of-thirds layout", "foreground frame", "wide establishing shot"],
  constraint: [
    "include one unexpected texture",
    "use five simple shapes before adding detail",
    "make the background tell part of the story",
    "repeat one shape at three different sizes",
    "leave one area intentionally simple",
    "hide a tiny clue in the scene"
  ]
};

export function PromptTool() {
  const [idea, setIdea] = useState(initialIdea);
  const [controls, setControls] = useState<PromptControls>({ ...defaultControls, mode: "ai-image" });
  const [result, setResult] = useState<PromptResult>(initialResult);
  const [lockedFields, setLockedFields] = useState<LockedFields>({});
  const [favorites, setFavorites] = useState<PromptResult[]>([]);
  const [recent, setRecent] = useState<PromptResult[]>([initialResult]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "copied" | "saved" | "error">("idle");
  const [message, setMessage] = useState("AI mode refines rough ideas; local prompts appear if the API is unavailable.");

  useEffect(() => {
    const favoriteBucket = createStorageBucket<PromptResult>("dpg_favorites");
    const recentBucket = createStorageBucket<PromptResult>("dpg_recent", [initialResult]);
    setFavorites(favoriteBucket.value.slice(0, 12));
    setRecent(recentBucket.value.slice(0, 8));
    setStorageAvailable(favoriteBucket.available && recentBucket.available);
  }, []);

  const lockedCount = useMemo(() => Object.keys(lockedFields).length, [lockedFields]);

  const updateControl = <K extends keyof PromptControls>(key: K, value: PromptControls[K]) => {
    setControls((current) => ({ ...current, [key]: value }));
  };

  const applyMode = (mode: PromptMode) => {
    setControls((current) => ({
      ...current,
      mode,
      audience: mode === "kids" ? "kids" : mode === "classroom" ? "classroom" : current.audience,
      difficulty: mode === "challenge" ? "hard" : mode === "kids" ? "easy" : current.difficulty,
      timeLimit: mode === "challenge" ? "45 min" : current.timeLimit,
      genre: mode === "character" ? "character design" : mode === "ai-image" ? "AI image prompt" : current.genre
    }));
  };

  const generate = async () => {
    const request: GeneratePromptRequest = {
      idea,
      controls,
      lockedFields,
      sessionId: getSessionId()
    };
    const safety = checkRequestSafety(request);
    if (!safety.ok) {
      setStatus("error");
      setMessage(safety.reason ?? "Try a safer drawing idea.");
      return;
    }

    setStatus("loading");
    setMessage("Refining your idea...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });
      const contentType = response.headers.get("Content-Type") ?? "";
      const data = contentType.includes("application/json")
        ? ((await response.json()) as GeneratePromptResponse)
        : undefined;
      if (!response.ok) {
        if (data && !data.ok) {
          throw new Error(data.message);
        }
        if (response.status === 429) {
          throw new Error("The free AI prompt limit has been reached. Try again later.");
        }
        throw new Error("The AI endpoint is unavailable right now.");
      }
      if (!data) {
        throw new Error("The AI endpoint returned an unreadable response.");
      }
      if (!data.ok) {
        throw new Error(data.message);
      }
      receiveResult(data.result, data.result.source === "ai" ? `AI prompt ready. ${data.remaining ?? 0} free tries left this hour.` : "Local draft ready because the AI key is not configured.");
    } catch (error) {
      const local = createLocalPrompt({ request, seed: `${idea}:${Date.now()}` });
      const reason = error instanceof Error ? error.message : "The AI endpoint is unavailable.";
      receiveResult(local, `${reason} Showing a local draft instead.`);
    }
  };

  const randomize = () => {
    const sample = exampleRequest(controls, new SeededRandom(`${controls.mode}-${Date.now()}`));
    setIdea(sample);
    setMessage("Example loaded. Generate to refine it.");
    setStatus("idle");
  };

  const regenerateLocal = () => {
    const request: GeneratePromptRequest = { idea, controls, lockedFields, sessionId: getSessionId() };
    const local = createLocalPrompt({ request, seed: `${idea}:${JSON.stringify(lockedFields)}:${Date.now()}` });
    receiveResult(local, "Regenerated locally with your locked fields.");
  };

  const copyPrompt = async () => {
    const text = formatPromptForCopy(result);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setMessage("Prompt copied.");
    } catch {
      setStatus("error");
      setMessage("Copy failed. Select the prompt text and copy it manually.");
    }
  };

  const saveFavorite = () => {
    const next = [result, ...favorites.filter((item) => item.id !== result.id)].slice(0, 12);
    setFavorites(next);
    const bucket = createStorageBucket<PromptResult>("dpg_favorites");
    const saved = bucket.save(next);
    setStorageAvailable(saved);
    setStatus("saved");
    setMessage(saved ? "Saved to this browser." : "Saved for this tab only because localStorage is unavailable.");
  };

  const clearSaved = () => {
    setFavorites([]);
    setRecent([]);
    createStorageBucket<PromptResult>("dpg_favorites").clear();
    createStorageBucket<PromptResult>("dpg_recent").clear();
    setMessage("Favorites and recent prompts cleared.");
    setStatus("idle");
  };

  const toggleLock = (field: PromptField) => {
    setLockedFields((current) => {
      const next = { ...current };
      if (next[field]) {
        delete next[field];
      } else {
        next[field] = result.structured[field];
      }
      return next;
    });
  };

  const receiveResult = (nextResult: PromptResult, nextMessage: string) => {
    setResult(nextResult);
    const nextRecent = [nextResult, ...recent.filter((item) => item.id !== nextResult.id)].slice(0, 8);
    setRecent(nextRecent);
    const recentBucket = createStorageBucket<PromptResult>("dpg_recent");
    setStorageAvailable(recentBucket.save(nextRecent));
    setStatus("idle");
    setMessage(nextMessage);
  };

  return (
    <section className="tool-band" aria-labelledby="tool-title">
      <div className="tool-layout">
        <div className="tool-panel input-panel">
          <p className="eyebrow">
            <Wand2 aria-hidden="true" size={16} />
            AI drawing prompt generator
          </p>
          <h1 id="tool-title">Turn a rough idea into a drawable prompt.</h1>
          <div className="mode-tabs" role="tablist" aria-label="Prompt mode">
            {modePresets.map((preset) => (
              <button
                className={controls.mode === preset.mode ? "mode-tab active" : "mode-tab"}
                type="button"
                key={preset.mode}
                onClick={() => applyMode(preset.mode)}
                title={preset.description}
                aria-pressed={controls.mode === preset.mode}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="field-group" htmlFor="idea">
            <span>Rough idea</span>
            <textarea
              id="idea"
              maxLength={600}
              value={idea}
              onChange={(event) => setIdea(event.target.value)}
              placeholder="Example: a lonely robot gardener in a rainy city"
            />
          </label>
          <div className="hint-row">
            <span>{idea.length}/600</span>
            <span>{lockedCount} locked fields</span>
          </div>

          <div className="control-grid" aria-label="Prompt controls">
            <SelectField label="Medium" value={controls.medium} options={selectOptions.medium} onChange={(value) => updateControl("medium", value)} />
            <SelectField label="Mood" value={controls.mood} options={selectOptions.mood} onChange={(value) => updateControl("mood", value)} />
            <SelectField label="Genre" value={controls.genre} options={selectOptions.genre} onChange={(value) => updateControl("genre", value)} />
            <SelectField label="Palette" value={controls.palette} options={selectOptions.palette} onChange={(value) => updateControl("palette", value)} />
            <SelectField label="Composition" value={controls.composition} options={selectOptions.composition} onChange={(value) => updateControl("composition", value)} />
            <SelectField label="Constraint" value={controls.constraint} options={selectOptions.constraint} onChange={(value) => updateControl("constraint", value)} />
            <SelectField label="Audience" value={controls.audience} options={["general", "kids", "teens", "classroom", "professional"]} onChange={(value) => updateControl("audience", value as PromptControls["audience"])} />
            <SelectField label="Difficulty" value={controls.difficulty} options={["easy", "medium", "hard"]} onChange={(value) => updateControl("difficulty", value as PromptControls["difficulty"])} />
            <SelectField label="Time" value={controls.timeLimit} options={["10 min", "20 min", "45 min", "90 min", "open"]} onChange={(value) => updateControl("timeLimit", value as PromptControls["timeLimit"])} />
          </div>

          <div className="button-row">
            <button className="primary-action" type="button" onClick={generate} disabled={status === "loading"}>
              {status === "loading" ? <RefreshCw aria-hidden="true" size={18} /> : <Sparkles aria-hidden="true" size={18} />}
              Generate prompt
            </button>
            <button className="icon-action" type="button" onClick={randomize} title="Load example idea" aria-label="Load example idea">
              <Shuffle aria-hidden="true" size={18} />
            </button>
            <button className="icon-action" type="button" onClick={regenerateLocal} title="Regenerate locally" aria-label="Regenerate locally">
              <RefreshCw aria-hidden="true" size={18} />
            </button>
          </div>

          <StatusLine status={status} message={message} storageAvailable={storageAvailable} />
        </div>

        <div className="tool-panel result-panel" aria-live="polite">
          <div className="result-head">
            <div>
              <p className="eyebrow">{result.source === "ai" ? "AI refined" : "Local draft"}</p>
              <h2>{result.title}</h2>
            </div>
            <div className="button-row compact">
              <button className="icon-action" type="button" onClick={copyPrompt} title="Copy prompt" aria-label="Copy prompt">
                <Clipboard aria-hidden="true" size={18} />
              </button>
              <button className="icon-action" type="button" onClick={saveFavorite} title="Save favorite" aria-label="Save favorite">
                <Save aria-hidden="true" size={18} />
              </button>
            </div>
          </div>

          <p className="prompt-output">{result.drawingPrompt}</p>

          {result.aiImagePrompt ? (
            <div className="ai-box">
              <h3>AI image prompt text</h3>
              <p>{result.aiImagePrompt}</p>
              {result.negativePrompt ? <p className="negative">Negative: {result.negativePrompt}</p> : null}
            </div>
          ) : null}

          <div className="field-locks" aria-label="Lock prompt fields">
            {fieldLabels.map(({ field, label }) => (
              <button key={field} type="button" onClick={() => toggleLock(field)} className={lockedFields[field] ? "lock-chip active" : "lock-chip"}>
                {lockedFields[field] ? <Lock aria-hidden="true" size={14} /> : <Unlock aria-hidden="true" size={14} />}
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="steps">
            <h3>Practice steps</h3>
            <ol>
              {result.practiceSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="history-grid">
            <SavedList title="Favorites" items={favorites} onPick={setResult} empty="No saved prompts yet." />
            <SavedList title="Recent" items={recent} onPick={setResult} empty="Recent prompts appear here." />
          </div>
          <button className="quiet-action" type="button" onClick={clearSaved}>
            <Trash2 aria-hidden="true" size={16} />
            Clear saved prompts
          </button>
        </div>
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const id = `select-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="select-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusLine({ status, message, storageAvailable }: { status: string; message: string; storageAvailable: boolean }) {
  const Icon = status === "error" ? AlertTriangle : status === "copied" || status === "saved" ? Check : BookOpen;
  return (
    <div className={status === "error" ? "status-line error" : "status-line"}>
      <Icon aria-hidden="true" size={17} />
      <span>{message}</span>
      {!storageAvailable ? <span className="storage-note">Local saves are limited in this browser.</span> : null}
    </div>
  );
}

function SavedList({
  title,
  items,
  onPick,
  empty
}: {
  title: string;
  items: PromptResult[];
  onPick: (result: PromptResult) => void;
  empty: string;
}) {
  return (
    <div className="saved-list">
      <h3>{title}</h3>
      {items.length === 0 ? <p>{empty}</p> : null}
      {items.slice(0, 4).map((item) => (
        <button type="button" key={`${title}-${item.id}`} onClick={() => onPick(item)}>
          {item.title}
        </button>
      ))}
    </div>
  );
}

const getSessionId = (): string => {
  const key = "dpg_session";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) {
      return existing;
    }
    const next = `session_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return `memory_${Date.now().toString(36)}`;
  }
};
