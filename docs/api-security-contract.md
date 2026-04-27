# API Security Contract

HeyClaude exposes a public read-only registry API plus a small set of limited
dynamic endpoints. Registry publishing is not exposed over the public API.

## Public Read-Only Surfaces

- `/api/registry/manifest`
- `/api/registry/categories`
- `/api/registry/search`
- `/api/registry/feed`
- `/api/registry/diff`
- `/api/registry/entries/{category}/{slug}`
- `/api/registry/entries/{category}/{slug}/llms`
- `/data/*.json` registry artifacts
- `/data/feeds/index.json`
- `/data/feeds/categories/{category}.json`
- `/data/feeds/platforms/{platform}.json`
- `/data/skill-adapters/...` generated adapters

## Limited Dynamic Surfaces

- `/api/votes/query`
- `/api/votes/toggle`
- `/api/community-signals`
- `/api/intent-events`
- `/api/newsletter/subscribe`
- `/api/newsletter/webhook`
- `/api/og`
- `/api/submissions`
- `/api/listing-leads`
- `/api/admin/listing-leads`

## Controls

- Public browser-facing endpoints keep origin checks and route-level rate limits.
- JSON writes require content-type validation and payload size limits.
- Admin review endpoints require bearer or admin-token headers.
- Webhooks require provider signatures when configured.
- Website submissions require origin checks, payload limits, schema validation,
  honeypot discard logging, existing-content duplicate checks, pending
  GitHub-issue duplicate checks, and GitHub issue creation only.
- Production submissions should set `SUBMISSIONS_REQUIRE_TURNSTILE=1` and
  `TURNSTILE_SECRET_KEY`; if the requirement is enabled without a secret, the
  endpoint fails closed instead of accepting direct website submissions.
- Cloudflare should enforce coarse per-IP limits for dynamic endpoints before
  requests reach the Worker; in-process limits remain a local fallback.
- No endpoint may import content into the registry, create pull requests, or
  publish submissions without maintainer review.
