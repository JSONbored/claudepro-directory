# Package Security Policy (Skills + MCP)

This project distinguishes between:

- first-party packages maintained by the HeyClaude maintainer
- external/community packages linked from third-party sources

## Trust model

- Local `downloadUrl` paths under `/downloads/...` are maintainer-only.
- Community submissions should link to external canonical sources (for example, GitHub releases).
- Binary package hosting for community submissions is not allowed by default.

## Skills packages (`.zip`)

- First-party skills packages may be hosted locally at `/downloads/skills/<slug>.zip`.
- Source archives must exist in `content/skills/<slug>.zip`.
- Validation enforces:
  - `.zip` extension
  - maintainer-only local hosting
  - size limits
  - archive-path safety checks
  - expected skills archive shape

## MCP packages (`.mcpb`)

- First-party MCP packages may be hosted locally at `/downloads/mcp/<slug>.mcpb`.
- Source archives must exist in `content/mcp/<slug>.mcpb`.
- Validation enforces:
  - `.mcpb` extension
  - maintainer-only local hosting
  - size limits
  - archive-path safety checks
  - required files (`manifest.json`, `package.json`, `README.md`, `server/index.js`)

## User-facing disclosure

Detail pages display package trust context:

- `Maintainer-verified package` + SHA256 for first-party local downloads
- `External package (unverified)` warning for non-local links

## Liability posture

- The site does not guarantee security of external packages.
- Users should audit source and permissions before running downloadable artifacts.
