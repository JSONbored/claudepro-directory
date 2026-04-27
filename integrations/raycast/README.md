# HeyClaude

Search HeyClaude from Raycast and copy practical Claude assets without opening a browser first.

![Search HeyClaude](./media/search.svg)

## What You Can Do

- Search agents, MCP servers, skills, rules, commands, hooks, guides, collections, and statuslines.
- Filter by category or local favorites.
- Inspect the native Raycast detail view before using an entry.
- Copy or paste the full usable asset.
- Copy install commands and Claude config snippets separately.
- Open the HeyClaude page, documentation, or source repository.
- Open issue-first contribution and change-request URLs in the browser.

## Read-Only by Design

This first release does not write to project files, `.claude/settings.json`, `.cursor/rules`, hooks, commands, or local skill folders. It only fetches the public HeyClaude feed, stores a local cache, stores local favorites, copies/pastes text, and opens links.

Contribution actions are also read-only in Raycast. They open HeyClaude submit or GitHub issue URLs in the browser and do not request GitHub OAuth, tokens, forks, branches, pull requests, or local project-file access.

## Data and Privacy

The extension reads:

- `https://heyclau.de/data/raycast-index.json`
- Per-entry detail JSON under `https://heyclau.de/data/raycast/...`

Raycast `Cache` stores the latest successful feed and entry details so search still works after a network failure. Raycast `LocalStorage` stores favorite entry keys. No analytics, accounts, tokens, or project-file access are used.

## Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

The site feed can be checked from the repository root:

```bash
pnpm validate:raycast-feed
```
