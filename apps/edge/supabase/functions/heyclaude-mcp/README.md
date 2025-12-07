# HeyClaude MCP Server

Official MCP server for the Claude Pro Directory, exposing real-time access to prompts, agents, MCP servers, rules, commands, and more through the Model Context Protocol.

## Architecture

This Edge Function uses existing HeyClaude infrastructure:

- **Data Access:** `@heyclaude/data-layer` services (ContentService, TrendingService, SearchService)
- **HTTP Utilities:** `@heyclaude/edge-runtime` (jsonResponse, errorResponse, CORS, rate limiting)
- **Database:** Supabase RPCs via service role client
- **MCP Framework:** `mcp-lite@0.8.2` with Streamable HTTP transport

## Structure

```
heyclaude-mcp/
├── index.ts              # Main entry point with Hono routing
├── routes/               # Tool handler implementations
│   ├── categories.ts     # listCategories tool
│   ├── search.ts         # searchContent tool
│   ├── detail.ts         # getContentDetail tool
│   ├── trending.ts       # getTrending tool
│   ├── featured.ts       # getFeatured tool
│   └── templates.ts      # getTemplates tool
└── lib/                  # Shared utilities
    └── types.ts          # MCP tool type definitions
```

## Tools

### Core Tools (v1.0.0)

1. **listCategories** - List all directory categories with counts
2. **searchContent** - Search with filters, pagination, tag support  
3. **getContentDetail** - Get complete content metadata by slug
4. **getTrending** - Get trending content across categories
5. **getFeatured** - Get featured/highlighted content
6. **getTemplates** - Get submission templates by category

## Endpoints

- **Primary:** `https://mcp.claudepro.directory/mcp`
- **Direct:** `https://hgtjdifxfapoltfflowc.supabase.co/functions/v1/heyclaude-mcp/mcp`
- **Health:** `https://mcp.claudepro.directory/`

## Development

```bash
# Start local development
supabase functions serve --no-verify-jwt heyclaude-mcp

# Test with MCP Inspector
npx @modelcontextprotocol/inspector
# Add endpoint: http://localhost:54321/functions/v1/heyclaude-mcp/mcp

# Test with Claude Desktop
# Add to ~/.claude_desktop_config.json:
{
  "mcpServers": {
    "heyclaude-mcp-dev": {
      "url": "http://localhost:54321/functions/v1/heyclaude-mcp/mcp"
    }
  }
}
```

## Deployment

```bash
# Deploy to production
supabase functions deploy --no-verify-jwt heyclaude-mcp
```

## Version

- **MCP Server:** v1.0.0
- **Protocol:** 2025-06-18
- **Transport:** Streamable HTTP

## Links

- **Documentation:** https://claudepro.directory/mcp/heyclaude-mcp
- **MCP Spec:** https://spec.modelcontextprotocol.io/
- **mcp-lite:** https://github.com/wong2/mcp-lite
