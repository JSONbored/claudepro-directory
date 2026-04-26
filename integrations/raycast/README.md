# HeyClaude Raycast Extension

Search HeyClaude from Raycast, inspect category-aware details, and copy or paste usable Claude assets without opening the browser first.

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

The extension reads `https://heyclau.de/data/raycast-index.json` and caches the latest successful response locally. It is read-only by design: it copies or pastes text and opens links, but it does not write project files.
