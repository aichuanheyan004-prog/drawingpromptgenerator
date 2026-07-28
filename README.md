# Drawing Prompt Generator

AI-backed drawing prompt generator for `drawingpromptgenerator.net`.

## Local Development

```bash
npm install
npm run dev
```

The UI works without an API key by using the local fallback generator. The production AI endpoint only calls OpenAI when the API key and a durable cost guard are configured. This deployment uses a Vercel Firewall fixed-window rule on `/api/generate/` keyed by IP:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
FREE_REQUESTS_PER_HOUR=12
VERCEL_FIREWALL_RATE_LIMIT=true
```

Upstash REST rate limiting remains an alternative when the Vercel Firewall rule is not used:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

If neither the verified Vercel Firewall flag nor both Upstash variables are present, requests automatically use the local generator and do not call the paid model.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run audit:static
```

The site is designed for static Vercel deployment plus a `/api/generate` serverless function.
