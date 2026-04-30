# HeyClaude MCP Server

Read-only Model Context Protocol server for the HeyClaude registry.

It exposes the same public registry surface used by the website and Raycast:
search, entry details, platform compatibility, install guidance, generated
adapters, and feed discovery. It does not create submissions, open pull
requests, write local files, publish content, or manage accounts.

## Tools

- `search_registry` - search public registry entries by query, category, and
  platform.
- `get_entry_detail` - fetch an entry detail payload by category and slug.
- `get_compatibility` - fetch skill platform compatibility metadata.
- `get_install_guidance` - fetch install commands, config, package, and platform
  guidance.
- `get_platform_adapter` - fetch generated adapter content, currently Cursor
  rule adapters for skill packages.
- `list_distribution_feeds` - discover public JSON, RSS, Atom, and platform
  feeds.

## Local Stdio

```bash
pnpm --filter @heyclaude/mcp start
```

By default the server reads from `apps/web/public/data`. Set
`HEYCLAUDE_DATA_DIR=/absolute/path/to/data` to point at another generated data
directory.

Example local MCP client config:

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "pnpm",
      "args": ["--filter", "@heyclaude/mcp", "start"]
    }
  }
}
```

After package publication, the stdio command can be:

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": ["-y", "@heyclaude/mcp"]
    }
  }
}
```

## Remote HTTP

The web app also exposes a Streamable HTTP endpoint:

- production: `https://heyclau.de/api/mcp`
- dev: `https://heyclaude-dev.zeronode.workers.dev/api/mcp`

Use a remote MCP adapter such as `mcp-remote` when a client only supports stdio:

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://heyclau.de/api/mcp"]
    }
  }
}
```

## Security Boundary

- Read-only registry artifacts only.
- No GitHub OAuth, tokens, issue creation, PR creation, or repo writes.
- No local project-file writes or config mutations.
- Remote endpoint uses route-level rate limits and Cloudflare rate-limit bindings
  when available.
