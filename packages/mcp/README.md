# HeyClaude MCP

Read-only MCP server for the generated HeyClaude registry artifacts.

## Run

```bash
pnpm --filter @heyclaude/mcp start
```

By default the server reads from `apps/web/public/data`. Set
`HEYCLAUDE_DATA_DIR=/absolute/path/to/data` to point at another generated data
directory.

## Tools

- `search_registry`
- `get_entry_detail`
- `get_compatibility`
- `get_install_guidance`
- `get_platform_adapter`
- `list_distribution_feeds`

The server does not create issues, open PRs, write local project files, publish
content, or manage accounts.
