# HeyClaude Tasks

This is the active execution tracker for HeyClaude. Do not trust task status until it is checked against the live code, generated artifacts, and current validation output.

Rules:

- Completed items require command evidence in the PR description or commit notes.
- Do not commit competitor names, internal benchmark site names, or private comparison notes.
- Use `- [ ]` for pending work, `- [~]` for partial work, and `- [x]` for verified work.
- Prefix each task with an owner surface such as `[registry]`, `[seo]`, `[raycast]`, `[ci]`, `[api]`, `[content]`, `[ugc]`, or `[commercial]`.

## Current Gate

Gate: `pnpm validate:clean`, `pnpm validate:tasks`, `pnpm validate:content:strict`, `pnpm validate:category-spec`, `pnpm validate:packages`, `pnpm validate:raycast-feed`, `pnpm test`, `pnpm test:e2e`, `pnpm type-check`, `pnpm build`, Raycast `npm ci && npm run lint && npm run build`, and `trunk check --show-existing --all --no-progress`.

- [x] [repo] Confirm pnpm monorepo shape for `apps/*` and `packages/*`. Evidence: `cat pnpm-workspace.yaml`.
- [x] [raycast] Keep `integrations/raycast` as a separate Raycast npm project. Evidence: `cat integrations/raycast/package.json`.
- [x] [ci] Keep generated registry data out of generic formatter and secret-scanner loops while preserving registry artifact tests. Evidence: `trunk check --show-existing --all --no-progress`.
- [x] [ci] Add a freshness check that fails when completed tracker items lack command evidence in the PR body or commit notes. Evidence: `pnpm validate:tasks`.
- [x] [ci] Add a scheduled gate that runs the current validation suite against the default branch and stores JUnit history. Evidence: `cat .github/workflows/content-validation.yml`.

## V2.1 Hardening

Gate: `pnpm validate:clean && pnpm test && pnpm build`.

- [x] [registry] Retire the public full-corpus `content-index.json` artifact. Evidence: `pnpm test:registry-artifacts`.
- [x] [registry] Remove app wrapper shims for registry presentation and LLMS helpers. Evidence: `pnpm validate:clean`.
- [x] [db] Require `SITE_DB` for votes, jobs, leads, placements, and future dynamic state. Evidence: `pnpm validate:clean`.
- [x] [deps] Verify vulnerable dependency overrides and package-lock state. Evidence: `pnpm audit --audit-level moderate`.
- [x] [refactor] Split remaining large UI hotspots into focused hooks and stateless components after the V2.1 gate remains stable. Evidence: `pnpm type-check`.
- [x] [refactor] Move any remaining artifact IO policy from root scripts into registry-owned builders. Evidence: `pnpm test:registry-artifacts`.

## Registry/API

Gate: `pnpm test:registry-artifacts`, `pnpm test`, and `pnpm build`.

- [x] [api] Publish envelope-versioned registry routes for manifest, categories, search, entry detail, and per-entry LLMS text. Evidence: `pnpm test`.
- [x] [api] Document registry, search, listing lead, and admin lead routes in OpenAPI. Evidence: `pnpm validate:clean`.
- [x] [api] Add a public API documentation page with examples for manifest, category browse, search, entry detail, and LLMS export. Evidence: `pnpm test:e2e`.
- [x] [api] Add response hash or ETag headers for static registry API responses. Evidence: `pnpm test:e2e`.
- [x] [api] Package an optional read-only MCP or feed surface after the registry API contract has held stable. Evidence: `pnpm test`.

## SEO + Content Quality

Gate: `pnpm test:seo-jsonld`, `pnpm validate:content:strict`, and `pnpm audit:content`.

- [x] [seo] Keep JSON-LD builders strict for WebSite, WebPage, CollectionPage, ItemList, breadcrumbs, entries, jobs, and tools. Evidence: `pnpm test:seo-jsonld`.
- [x] [content] Keep the quality report generated and test-covered. Evidence: `pnpm test:registry-artifacts`.
- [x] [seo] Add rendered page JSON-LD parity snapshots from built pages, not only builder-level snapshots. Evidence: `pnpm test:e2e`.
- [x] [seo] Add sitemap/canonical parity tests for every public route class. Evidence: `pnpm test:e2e`.
- [x] [content] Turn quality gaps into periodic content prompts for maintainers and contributors. Evidence: `pnpm test:registry-artifacts`.
- [x] [content] Add provenance badges and quality badges to detail pages once the quality scoring contract is stable. Evidence: `pnpm type-check`.

## UGC Growth

Gate: `pnpm test:submission-intake` and `pnpm validate:content:strict`.

- [x] [ugc] Keep generated submission field models and issue-template parity under test. Evidence: `pnpm test:submission-intake`.
- [x] [ugc] Add a dry-run MDX preview and quality score preview to the submit flow. Evidence: `pnpm type-check`.
- [x] [ugc] Add source/provenance warnings before a contributor opens a GitHub issue. Evidence: `pnpm type-check`.
- [x] [ugc] Add contributor attribution pages that aggregate accepted submissions and source links. Evidence: `pnpm test:e2e`.
- [x] [ugc] Add claim/update listing intake with maintainer review before any public profile change. Evidence: `pnpm test:e2e`.

## Raycast

Gate: from `integrations/raycast`, run `npm ci && npm run lint && npm run build`.

- [x] [raycast] Keep the Raycast extension as a read-only browse, detail, copy, favorite, and open-link channel. Evidence: `npm run build`.
- [x] [raycast] Keep full copy fetches backed by per-entry Raycast detail payloads. Evidence: `pnpm validate:raycast-feed`.
- [x] [raycast] Finalize store screenshots, release checklist, and metadata review before submission. Evidence: `cat integrations/raycast/STORE_CHECKLIST.md`.
- [x] [raycast] Add documented cold fetch, stale cache, malformed feed, favorites, and full-copy manual smoke steps. Evidence: `cat integrations/raycast/SMOKE_TESTS.md`.
- [x] [raycast] Defer write/apply workflows until registry contracts and read-only store release are stable. Evidence: `cat integrations/raycast/STORE_CHECKLIST.md`.

## Commercial Surfaces

Gate: `pnpm test:commercial-intake`, `pnpm test`, and local lead route smoke with `SITE_DB`.

- [x] [commercial] Keep tools/apps/services intake-only until real listings exist. Evidence: `pnpm test:commercial-intake`.
- [x] [commercial] Keep jobs hiring-only and placeholder cards out of `JobPosting` structured data. Evidence: `pnpm test:seo-jsonld`.
- [x] [commercial] Store tool and job leads in `listing_leads` for manual review. Evidence: `pnpm test:commercial-intake`.
- [x] [commercial] Improve lead-admin export ergonomics with CSV download and status filters. Evidence: `pnpm test`.
- [x] [commercial] Add sponsored placement expiry reporting and renewal reminders. Evidence: `pnpm test:commercial-intake`.
- [x] [commercial] Add public sponsored/affiliate disclosure examples to the commercial docs surface. Evidence: `pnpm type-check`.

## Testing/CI/Trunk

Gate: `pnpm test`, `pnpm test:e2e`, and `trunk check --show-existing --all --no-progress`.

- [x] [test] Use Vitest as the canonical unit and contract runner with JUnit output. Evidence: `pnpm test`.
- [x] [test] Use Playwright smoke across desktop and mobile for core public routes and registry exports. Evidence: `pnpm test:e2e`.
- [x] [ci] Upload JUnit reports from the job that actually runs tests when Trunk secrets are configured. Evidence: `cat .github/workflows/content-validation.yml`.
- [x] [trunk] Keep Trunk no-fix check passing without enabling quarantine. Evidence: `trunk check --show-existing --all --no-progress`.
- [x] [ci] Add branch protection documentation for required validation checks. Evidence: `cat docs/branch-protection.md`.
- [x] [test] Add D1 integration smoke for lead transitions and vote fallback against local migrations. Evidence: `pnpm test`.

## Future Moat

Gate: ship only after the V2.1 gate and commercial intake gate stay green on the default branch.

- [x] [growth] Add popular, trending, recently updated, and newly added surfaces based on trustworthy internal signals. Evidence: `pnpm test:e2e`.
- [x] [growth] Add install/copy/open intent metrics without exposing misleading popularity claims. Evidence: `pnpm test:e2e`.
- [x] [growth] Add an ecosystem board for news, releases, events, and community posts. Evidence: `pnpm test:e2e`.
- [x] [growth] Improve plugin/tool categorization for infrastructure, data, productivity, payments, agent orchestration, and documentation workflows. Evidence: `pnpm type-check`.
- [x] [growth] Add richer detail-page conversion patterns: install path, trust panel, related assets, claim/update CTA, and API links. Evidence: `pnpm type-check`.
- [x] [growth] Add public API examples and API changelog entries for downstream builders. Evidence: `cat docs/api-changelog.md`.
