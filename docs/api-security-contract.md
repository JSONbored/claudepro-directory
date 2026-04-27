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
- `/data/skill-adapters/...` generated adapters

## Limited Dynamic Surfaces

- `/api/votes/query`
- `/api/votes/toggle`
- `/api/community-signals`
- `/api/intent-events`
- `/api/newsletter/subscribe`
- `/api/newsletter/webhook`
- `/api/listing-leads`
- `/api/admin/listing-leads`

## Controls

- Public browser-facing endpoints keep origin checks and route-level rate limits.
- JSON writes require content-type validation and payload size limits.
- Admin review endpoints require bearer or admin-token headers.
- Webhooks require provider signatures when configured.
- Cloudflare should enforce coarse per-IP limits for dynamic endpoints before
  requests reach the Worker; in-process limits remain a local fallback.
- No endpoint may import content into the registry, create pull requests, or
  publish submissions without maintainer review.
