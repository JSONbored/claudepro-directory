# Raycast Store Checklist

Status: read-only v1 release candidate.

## Metadata

- [x] `package.json` title, description, author, categories, license, and command metadata are present.
- [x] `assets/icon.png` exists for Raycast packaging.
- [x] `README.md` describes the read-only behavior, privacy model, and validation commands.
- [x] `CHANGELOG.md` exists for the initial release notes.
- [x] Store screenshots are available under `metadata/`.

## Release Gate

Run from `integrations/raycast`:

```bash
npm ci
npm run lint
npm run build
```

Run from the repository root:

```bash
pnpm validate:raycast-feed
```

## Scope Boundaries

- v1 may browse, search, favorite, copy, paste, and open links.
- v1 must not write project files, mutate local Claude configs, or apply assets automatically.
- Write/apply workflows stay deferred until registry contracts and the read-only store release are stable.
