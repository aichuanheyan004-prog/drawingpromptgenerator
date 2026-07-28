# Drawing Prompt Generator

AI-backed drawing prompt generator for `drawingpromptgenerator.net`.

## Local Development

```bash
npm install
npm run dev
```

The UI works without an API key by using the local fallback generator. The production AI endpoint needs:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5.6-luna
FREE_REQUESTS_PER_HOUR=12
```

Optional durable rate limiting:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

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
