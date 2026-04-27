# Web Deployment Notes (OpenNext Cloudflare)

## Runtime model

- This project deploys as OpenNext Cloudflare Workers.
- Production worker: `heyclaude-prod`
- Development worker: `heyclaude-dev`
- Next.js pages and API routes (for example `/api/votes/*` and `/api/newsletter/*`) run inside each Worker.

## Required bindings

Configured in [`wrangler.jsonc`](./wrangler.jsonc):

- `SITE_DB` (D1) for durable upvotes, reviewed jobs listings, listing leads, commercial placements, community signals, and future dynamic site state.
- Shared between `prod` and `dev` environments in the current setup.

## D1 setup

1. Create database:

```bash
pnpm --filter web exec wrangler d1 create heyclaude-site-state
```

2. Set `database_name` and `database_id` returned by Cloudflare in [`wrangler.jsonc`](./wrangler.jsonc) for `SITE_DB`.

Existing environments may still point at the historical `heyclaude-votes`
database name for continuity. The binding is the source of truth; new
environments should use a site-state name because the same D1 database now
stores votes, jobs, leads, placements, intents, and community signals.

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
- `0002_jobs.sql` for reviewed jobs listing records
- `0003_commercial_leads.sql` for job/tool listing leads and commercial placement windows
- `0004_intent_events.sql` for privacy-light copy/open/install/download/vote intent counters
- `0005_community_signals.sql` for used-this, works-for-me, and reported-broken listing signals

The jobs board only renders active rows from `jobs_listings`. A missing,
unmigrated, or empty `SITE_DB` produces an explicit empty state instead of fake
listing rows.

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

After production is deployed and the new sitemap is live, IndexNow can be
submitted with:

```bash
INDEXNOW_SUBMIT=1 pnpm indexnow:submit
```

The public key file is committed under `apps/web/public/` and served from the
site root. See [`docs/indexnow.md`](../../docs/indexnow.md) for dry-run and CI
guard details.

Preview deployments must pass artifact validation before merge:

```bash
pnpm validate:deployment-artifacts -- --base-url https://<preview-host>
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

React Email source templates live in `emails/src/`. Render static Resend
Broadcast artifacts with:

```bash
pnpm email:render
pnpm validate:emails
```

To sync rendered templates into the Resend Templates dashboard for visual review
and manual Broadcast use:

```bash
pnpm resend:sync-templates -- --dry-run
RESEND_API_KEY=... pnpm resend:sync-templates -- --apply
```

If a template already exists, set the matching ignored local env var before
running `--apply`: `RESEND_TEMPLATE_CURATED_DROP_ID`,
`RESEND_TEMPLATE_RELEASE_NOTES_ID`, or `RESEND_TEMPLATE_MAINTAINER_CALL_ID`.
The sync command creates or updates draft templates only. It does not publish
templates, create Broadcasts, schedule campaigns, or send email. Keep those
steps manual inside Resend.

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
