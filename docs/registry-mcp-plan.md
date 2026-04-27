# Read-Only Registry MCP

The MCP surface is implemented as `@heyclaude/mcp` under `packages/mcp`. It
reads generated registry artifacts and exposes read-only tools over stdio.

Run locally:

```bash
pnpm --filter @heyclaude/mcp start
```

Set `HEYCLAUDE_DATA_DIR=/absolute/path/to/data` to read from another generated
artifact directory.

## V1 Tools

- `search_registry`
- `get_entry_detail`
- `get_compatibility`
- `get_install_guidance`
- `get_platform_adapter`
- `list_distribution_feeds`

## Exclusions

- No content publishing.
- No issue creation.
- No pull request creation.
- No local project-file writes.
- No account, token, or GitHub OAuth handling.

Submissions remain issue-first and maintainer-reviewed through the website and
GitHub issue templates.
