# Content Schema Reference

Canonical validator logic lives in [`packages/registry`](../../packages/registry).

## Global required fields

Every entry should include:

- `title`
- `slug`
- `description`
- `cardDescription`

## Category-specific recommended fields

- `agents`: `usageSnippet`, `copySnippet`
- `collections`: `items`
- `commands`: `commandSyntax`, `usageSnippet`, `copySnippet`
- `guides`: `usageSnippet`
- `hooks`: `trigger`, `usageSnippet`, `copySnippet`, `configSnippet`, `scriptBody`
- `mcp`: `installCommand`, `usageSnippet`, `copySnippet`, `configSnippet`
- `rules`: `copySnippet`
- `skills`: `installCommand`, `usageSnippet`, `copySnippet`, `downloadUrl`, `skillType`, `skillLevel`, `verificationStatus`, `verifiedAt`, `retrievalSources`, `testedPlatforms`
- `statuslines`: `scriptLanguage`, `usageSnippet`, `copySnippet`, `configSnippet`, `scriptBody`
- `tools`: `pricingModel`, `websiteUrl`, `disclosure`

## Forbidden fields

Do not include these in content files:

- `viewCount`
- `copyCount`
- `popularityScore`

Upvotes are now owned by D1 (`votes_entries`) and not contributor metadata.

## Downloadable package policy

- Local package URLs (`/downloads/...`) must include `packageVerified: true`.
- Community submissions should provide external source/release URLs.
- Skills local packages must be `.zip` under `/downloads/skills/...`.
- MCP local packages must be `.mcpb` under `/downloads/mcp/...`.

## Skills capability metadata

Skills support two operating modes:

- `skillType: general`
- `skillType: capability-pack`

Capability packs are deep, version-aware skills and must include:

- `skillLevel: expert`
- `verificationStatus` (`validated` or `production`)
- `verifiedAt` (ISO date `YYYY-MM-DD`)
- `retrievalSources` (array of official docs/reference URLs)
- `testedPlatforms` (array, e.g. Claude, Codex, OpenClaw, Cursor, Windsurf, Gemini)
- Required sections in markdown body:
  - `## Knowledge Freshness`
  - `## Retrieval Sources`
  - `## Core Workflow`
  - `## Capability Scope`
  - `## Production Rules`

## Validation workflow

Run before merging content changes:

```bash
pnpm validate:content
pnpm validate:issue-templates
pnpm validate:clean
pnpm audit:content
pnpm build
```

## Submission workflow

- Use issues first for free Claude resources. The issue validator checks category fields, required copyable assets, slug shape, local package requests, and affiliate/referral URLs.
- Use pull requests only when you are comfortable adding MDX directly and running the full gate.
- Maintainers manually import or merge accepted submissions. GitHub issue validation does not auto-publish content.
- Tool/app/service promotions, listing claims, and jobs use the D1-backed website lead forms, not the free resource issue templates.

For vote-state sync checks:

```bash
node scripts/sync-votes-to-d1.mjs --mode=both
node scripts/verify-d1-votes.mjs --mode=both
```
