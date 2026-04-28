# Raycast Manual Release QA

Run these after the automated Raycast helper tests, lint, feed validation, and
distribution build pass.

## Cold Fetch

1. Clear Raycast extension cache or install into a clean Raycast profile.
2. Run `Search HeyClaude`.
3. Confirm entries load from `https://heyclau.de/data/raycast-index.json`.
4. Open a detail view and confirm title, description, links, and actions render.

## Dev Feed Override

1. Run `npm run dev` from `integrations/raycast`.
2. Open command preferences and set `Developer Feed URL Override` to
   `https://heyclaude-dev.zeronode.workers.dev/data/raycast-index.json`.
3. Run `Search HeyClaude`.
4. Confirm entries, category filters, details, and copy actions use the dev
   Worker feed and `/data/raycast/...` detail payloads.
5. Clear the override and confirm the production feed is used again.

## Stale Cache

1. Load the extension successfully once.
2. Disconnect the network or block the feed URL.
3. Reopen `Search HeyClaude`.
4. Confirm cached entries still appear with a non-fatal error toast or fallback state.

## Malformed Feed

1. Point development feed configuration at malformed JSON.
2. Run the command.
3. Confirm the extension does not crash and keeps the last successful cache when available.

## Favorites

1. Favorite an entry.
2. Switch to the favorites filter.
3. Restart Raycast and confirm the favorite persists.

## Full Copy Detail

1. Pick an entry with a long asset.
2. Run `Copy Full Asset`.
3. Confirm the action fetches the per-entry detail payload under `/data/raycast/...` and copies the complete text.

## Link Actions

1. Open the HeyClaude page for an entry.
2. Open docs or source when available.
3. Confirm no action writes to local project files.

## Contribution Actions

1. Run `Contribute Entry`.
2. Confirm Raycast opens `https://heyclau.de/submit` with category/name/slug prefilled.
3. Run `Suggest Change`.
4. Confirm Raycast opens a GitHub issue URL with the category issue template and existing entry fields prefilled.
5. Confirm no GitHub token, OAuth flow, fork, branch, PR, or local project file write is requested.

## Dated Evidence

### 2026-04-28 Dev Feed Readiness

- Helper tests: `npm run test:junit` passed with 13 tests and wrote
  `reports/junit/raycast.xml`.
- Feed coverage: `pnpm validate:raycast-feed` passed with 379 entries, zero
  missing directory keys, and zero missing detail payloads.
- Distribution build: `npm run build` passed from `integrations/raycast`.
- Dev startup: `npm run dev` compiled the extension and entered development
  mode cleanly.
- Raycast app QA target:
  `https://heyclaude-dev.zeronode.workers.dev/data/raycast-index.json`.
- In-app Raycast dev QA: pending manual run in Raycast with the dev feed
  override set.
- Scope: registry assets only; D1 jobs stay out of v1.
