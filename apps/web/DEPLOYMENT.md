# Web Deployment Notes (OpenNext Cloudflare)

## Runtime model

- This project deploys as a single OpenNext Cloudflare Worker.
- Next.js pages and API routes (for example `/api/votes/*` and `/api/newsletter/subscribe`) run inside that same Worker.

## Required bindings

Configured in [`wrangler.jsonc`](./wrangler.jsonc):

- `VOTES_DB` (D1) for durable upvotes.

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
pnpm --filter web exec wrangler secret put RESEND_AUDIENCE_ID
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill values.

## OpenNext Cloudflare notes used in this project

- `next.config.mjs` initializes Cloudflare local development via `initOpenNextCloudflareForDev()`.
- Route handlers avoid `export const runtime = "edge"` for OpenNext Cloudflare compatibility.
- Static asset cache headers are set in `public/_headers`.
