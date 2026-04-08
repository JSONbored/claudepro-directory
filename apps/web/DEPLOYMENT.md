# Web Deployment Notes (OpenNext Cloudflare)

## Runtime model

- This project deploys as OpenNext Cloudflare Workers.
- Production worker: `heyclaude-prod`
- Development worker: `heyclaude-dev`
- Next.js pages and API routes (for example `/api/votes/*` and `/api/newsletter/*`) run inside each Worker.

## Required bindings

Configured in [`wrangler.jsonc`](./wrangler.jsonc):

- `VOTES_DB` (D1) for durable upvotes.
- Shared between `prod` and `dev` environments in the current setup.

## D1 setup

1. Create database:

```bash
pnpm --filter web exec wrangler d1 create heyclaude-votes
```

2. Set `database_id` returned by Cloudflare in [`wrangler.jsonc`](./wrangler.jsonc) under `d1_databases[0]`.

3. Apply migrations:

```bash
pnpm --filter web db:migrate:remote
```

Local migration:

```bash
pnpm --filter web db:migrate:local
```

## Newsletter (Resend)

Set secrets/vars in Cloudflare:

```bash
pnpm --filter web exec wrangler secret put RESEND_API_KEY
pnpm --filter web exec wrangler secret put RESEND_SEGMENT_ID
pnpm --filter web exec wrangler secret put RESEND_WEBHOOK_SECRET
pnpm --filter web exec wrangler secret put DISCORD_WEBHOOK_URL
```

Optional backward-compatible fallback:

```bash
pnpm --filter web exec wrangler secret put RESEND_AUDIENCE_ID
```

Public variable (non-secret) for social link:

```bash
pnpm --filter web exec wrangler secret put NEXT_PUBLIC_DISCORD_URL
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill values.

## OpenNext Cloudflare notes used in this project

- `next.config.mjs` initializes Cloudflare local development via `initOpenNextCloudflareForDev()`.
- Route handlers avoid `export const runtime = "edge"` for OpenNext Cloudflare compatibility.
- Static asset cache headers are set in `public/_headers`.
