# Web Deployment Notes (OpenNext Cloudflare)

## Runtime model

- This project deploys as OpenNext Cloudflare Workers.
- Production worker: `heyclaude-prod`
- Development worker: `heyclaude-dev`
- Next.js pages and API routes (for example `/api/votes/*` and `/api/newsletter/*`) run inside each Worker.

## Required bindings

Configured in [`wrangler.jsonc`](./wrangler.jsonc):

- `SITE_DB` (D1) for durable upvotes, private jobs listings, listing leads, commercial placements, and future dynamic site state.
- Shared between `prod` and `dev` environments in the current setup.

## D1 setup

1. Create database:

```bash
pnpm --filter web exec wrangler d1 create heyclaude-votes
```

2. Set `database_id` returned by Cloudflare in [`wrangler.jsonc`](./wrangler.jsonc) for `SITE_DB`.

3. Apply migrations:

```bash
pnpm --filter web db:migrate:remote
```

Local migration:

```bash
pnpm --filter web db:migrate:local
```

Current migrations include:

- `0001_votes.sql` for upvotes
- `0002_jobs.sql` for private jobs listing records
- `0003_commercial_leads.sql` for job/tool listing leads and commercial placement windows
- `0004_intent_events.sql` for privacy-light copy/open/install/download/vote intent counters

## OpenNext build/deploy commands

These are the project-standard commands:

```bash
pnpm --filter web deploy
```

That command runs:

1. registry artifact generation
2. `opennextjs-cloudflare build`
3. `opennextjs-cloudflare deploy`

For local Worker-runtime preview:

```bash
pnpm --filter web preview
```

## Newsletter (Resend)

Set secrets/vars in Cloudflare:

```bash
pnpm --filter web exec wrangler secret put RESEND_API_KEY
pnpm --filter web exec wrangler secret put RESEND_SEGMENT_ID
pnpm --filter web exec wrangler secret put RESEND_WEBHOOK_SECRET
pnpm --filter web exec wrangler secret put DISCORD_WEBHOOK_URL
```

Public vars (non-secret), set in Cloudflare dashboard for each worker environment:

- `NEXT_PUBLIC_DISCORD_URL`
- `NEXT_PUBLIC_TWITTER_URL`
- `NEXT_PUBLIC_POLAR_SPONSORED_JOB_URL`
- `NEXT_PUBLIC_POLAR_FEATURED_JOB_URL`
- `NEXT_PUBLIC_POLAR_JOB_BOARD_URL`

For local development, copy `.dev.vars.example` to `.dev.vars` and fill values.

## OpenNext Cloudflare notes used in this project

- `next.config.mjs` initializes Cloudflare local development via `initOpenNextCloudflareForDev()`.
- Route handlers avoid `export const runtime = "edge"` for OpenNext Cloudflare compatibility.
- Static asset cache headers are set in `public/_headers`.

## Git-integrated Cloudflare worker settings

If configuring deployments from the Cloudflare dashboard (Workers + Git):

- Build command: `pnpm --filter web deploy`
- Root directory: repository root
- Build system Node.js version: `22`
- Package manager: `pnpm`
- Production branch: `main` (for `heyclaude-prod`)
- Dev worker (`heyclaude-dev`): map to dedicated development branch
- Environment vars/secrets: configure per worker environment in Cloudflare dashboard
