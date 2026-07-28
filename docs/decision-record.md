# DrawingPromptGenerator.net Decision Record

Date checked: July 28, 2026

## Target Task

Artists, hobbyists, students, teachers, writers, character designers, game designers, and AI image users in the United States need to turn a vague drawing idea into a specific, safe, usable drawing prompt or AI image prompt.

## Audience/Country/Language

English-first, United States. The site uses plain language suitable for beginner artists and classroom users while still giving enough structure for designers and AI image users.

## User-Provided Research

The two screenshots suggested "drawing prompt generator" as a tool-site keyword, showed historical volume/KD-style estimates, showed a SERP dominated by prompt tools and Reddit, noted the `.net` domain opportunity, and proposed login/payment/fingerprint controls. These screenshots are historical third-party clues, not current truth. I reused only the hypotheses and rechecked the market on July 28, 2026.

## Current SERP Intent And Evidence

Google US English checks on July 28, 2026:

- `drawing prompt generator`, `random drawing prompt generator`, `art prompt generator`, and `drawing ideas generator` are mostly online generator/tool results. Repeated competitors included The Pigeon Letters, ArtPrompts, Mimi's Drawing Idea Generator, Magatsu, Shayla Fish Studio, Practice Drawing This, Foundmyself, and Reddit discussions.
- `ai art prompt generator` mixes prompt-writing tools, AI art/image generators, and image-to-prompt tools. This supports an AI text prompt refiner, but the page must not imply that it generates images.
- `drawing prompts for kids` is mostly lists and classroom resources. It should be covered with a kids/classroom mode and guide section first, not a separate doorway page.
- `daily drawing prompts` is split between communities/apps/lists and one generator result. Keep it as a daily/challenge mode until GSC proves independent demand.
- `character drawing prompt generator` has enough distinct character-design intent, but it overlaps with the main generator. Keep it as a mode/module for v1 and revisit after launch data.

## Demand Evidence

Evidence is directional: current Google SERPs show tool intent and small/specialist sites ranking; Reddit results show real artist/blocker language; the historical screenshot shows third-party interest estimates. No GSC exists yet for this new domain. Build verdict is `test small` rather than a heavy paid platform.

## Current Competitors And Gaps

Observed competitors usually provide random combinations, fixed idea lists, or generic AI prompt tools. Gaps to target:

- A first-screen AI refiner that turns a rough sentence into a complete drawing prompt.
- Clear controls for medium, mood, difficulty, audience, genre, palette, composition, constraints, and AI-image formatting.
- Safety controls for kids/classroom use and avoidance of specific IP or living-artist style prompts.
- Copy, regenerate, lock fields, local favorites, recent history, and examples without creating an account.
- Honest privacy and cost limits.

## Product Decision

Verdict: `test small`.

Build an AI-backed drawing prompt generator with a browser-local fallback generator. It should accept a short rough idea, refine it through a Vercel serverless API using OpenAI's Responses API when `OPENAI_API_KEY` is configured, and fall back to local generated prompts when the key or API is unavailable.

## Monetization, Cost, And Payment Decision

V1 does not take payment and does not require login. The reason is not "zero cost" anymore; the reason is to keep launch friction low while the API is tightly capped:

- Inputs capped to 600 characters.
- Output capped by API token limit.
- Low-cost model configured by `OPENAI_MODEL`, defaulting to `gpt-5.6-luna` unless the deployment owner overrides it.
- Anonymous IP/session rate limit.
- Durable Upstash Redis limiting is required before the server calls OpenAI; without it the API fails closed to the local generator.
- A verified OpenAI project budget/usage cap must be set before public AI launch. Treat provider-side limits as a final backstop, not the primary abuse control.
- No image generation, uploads, database, or saved server history.

### Cost model checked July 28, 2026

OpenAI's official standard pricing lists `gpt-5.6-luna` at `$1.00` per million input tokens and `$6.00` per million output tokens for short-context requests. With this endpoint's 900-output-token ceiling, a conservative request using 800 input tokens and the full 900 output tokens costs about `$0.0062`; a more typical 800-input/400-output request costs about `$0.0032`. At the conservative ceiling, 1,000 successful AI prompts are about `$6.20`, excluding taxes and regional-processing uplifts.

Launch boundary: start with 12 successful AI requests per durable anonymous key per hour and an owner-selected monthly provider budget no higher than the amount the owner is comfortable losing in an abuse spike. Pause paid AI automatically by removing the Vercel key or Redis credentials if daily usage is abnormal, the budget reaches 80%, or durable limiting is unavailable. Do not rely on Vercel function memory for public cost control.

Payment is postponed until measured usage shows one of these triggers:

- API cost exceeds the owner's monthly stop threshold.
- Abuse traffic consumes the free quota despite rate limits.
- Users repeatedly ask for paid-value features such as saved project libraries, batch generation, export packs, team/classroom dashboards, private prompt history, API access, commercial prompt packs, or no-limit generations.

Future paid model, if needed: Stripe Checkout with clear pricing, refunds, taxes, support policy, per-account quotas, durable abuse tracking, and cost caps. Do not add payment before those operational costs are accepted.

## Risk Decision

Outcome: `allow with controls`.

Controls:

- No generated images or copyrighted media.
- No instruction to draw protected characters, brand logos, or "in the style of" living artists.
- Safety filter rejects NSFW, graphic violence, hate, illegal, and self-harm requests.
- Kids/classroom mode filters to age-appropriate prompts.
- No account, cookies, analytics, or database in v1.
- Favorites and recent history are localStorage-only.
- API requests are transient; users are told not to enter personal or sensitive information.
- Durable server-side limits reduce cost exposure. Provider budget alerts/limits and Redis credentials are launch checklist items.

## MVP Acceptance Criteria

- First screen contains a usable AI prompt refiner.
- Supports subject/idea, medium, mood, difficulty, time limit, audience, genre/theme, palette, composition, constraints, and AI image prompt formatting.
- Supports generate, regenerate, lock fields, random example, copy, local favorite, recent history, and clear.
- Handles empty input, long input, special characters, copy failure, localStorage failure, API failure, rate limits, and empty local pools.
- Mobile width 390px has no horizontal overflow and all controls remain usable.
- Tests verify generated content structure, seed stability, locks, modes, safety filters, forbidden IP/artist-style terms, copy formatting, storage fallback, empty pools, long prompt, and special characters.

## URL/Page Map

- `/` - core Drawing Prompt Generator tool and supporting modules.
- `/guide/` - How to use drawing prompts guide with examples and safety/IP/classroom notes.
- `/privacy/` - privacy behavior, localStorage, AI API request handling, no cookies/analytics.
- `/terms/` - terms, acceptable use, AI limits, IP safety.
- `/404.html` - real not-found page.

Deferred pages: `/kids-drawing-prompts/`, `/character-drawing-prompts/`, `/daily-drawing-prompts/`, `/ai-image-prompts/`, `/sketch-prompts/`, and `/drawing-challenge/` stay postponed until GSC queries and product usage prove independent demand and maintenance value.

## Launch Metrics

- Search: indexed pages, impressions, queries, CTR, selected canonical, crawl status.
- Product: tool starts, API successes/failures, rate-limit hits, copy actions, favorites, mode usage.
- Cost: OpenAI usage by day, errors, estimated cost per successful prompt, abuse spikes.
- Quality: user feedback, rejected prompt categories, mobile errors.

V1 has no analytics script. If analytics is added later, it must avoid prompt contents and follow consent requirements.

## Expansion And Stop Thresholds

Expand when GSC shows sustained impressions/clicks for distinct child intents and users complete the task. Stop or reduce the free quota when API costs exceed the budget, abuse grows, model output quality is not materially better than local generation, or moderation/support burden becomes disproportionate.

## Sources Checked

- Google US English SERP observations by browser on July 28, 2026 for the eight queries listed above.
- OpenAI API docs and pricing pages were checked through official OpenAI domains on July 28, 2026. Docs MCP installation was attempted but unavailable in this environment, so official-domain fallback was used:
  - https://developers.openai.com/api/docs/guides/text-generation
  - https://developers.openai.com/api/docs/guides/structured-outputs
  - https://developers.openai.com/api/docs/guides/safety-best-practices
  - https://developers.openai.com/api/docs/pricing
  - https://developers.openai.com/api/docs/guides/latest-model
- OpenAI usage policies were checked for safety constraints on July 28, 2026: https://openai.com/policies/usage-policies/

## Open Assumptions

- The owner will provide `OPENAI_API_KEY` and set OpenAI project hard spend limits before public AI launch.
- The default model should be kept configurable because current model names and prices can change.
- If Vercel/GitHub/GSC sessions require login, the owner will complete only the blocked login/authorization step in the browser.
