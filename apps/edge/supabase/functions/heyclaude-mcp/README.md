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
│   ├── templates.ts      # getTemplates tool
│   ├── mcp-servers.ts    # getMcpServers tool
│   ├── related.ts        # getRelatedContent tool
│   ├── tags.ts           # getContentByTag tool
│   ├── popular.ts        # getPopular tool
│   ├── recent.ts         # getRecent tool
│   ├── download-platform.ts # downloadContentForPlatform tool
│   ├── newsletter.ts     # subscribeNewsletter tool
│   ├── account.ts        # createAccount tool
│   ├── submit-content.ts # submitContent tool
│   ├── oauth-authorize.ts # OAuth authorization proxy
│   └── auth-metadata.ts  # OAuth metadata endpoints
├── resources/            # MCP resource handlers
│   └── content.ts        # Content resource handlers (LLMs.txt, Markdown, JSON, RSS/Atom)
└── lib/                  # Shared utilities
    ├── types.ts          # MCP tool type definitions
    └── platform-formatters.ts # Platform-specific formatting functions
```

## Tools

### Core Tools (v1.0.0)

1. **listCategories** - List all directory categories with counts
2. **searchContent** - Search with filters, pagination, tag support  
3. **getContentDetail** - Get complete content metadata by slug
4. **getTrending** - Get trending content across categories
5. **getFeatured** - Get featured/highlighted content
6. **getTemplates** - Get submission templates by category

### Advanced Tools (v1.0.0)

7. **getMcpServers** - List all MCP servers with download URLs
8. **getRelatedContent** - Find related/similar content
9. **getContentByTag** - Filter content by tags with AND/OR logic
10. **getPopular** - Get popular content by views and engagement
11. **getRecent** - Get recently added content

### Platform Formatting Tools (v1.0.0)

12. **downloadContentForPlatform** - Download content formatted for your platform (Claude Code, Cursor, etc.) with installation instructions

### Growth Tools (v1.0.0)

13. **subscribeNewsletter** - Subscribe an email address to the Claude Pro Directory newsletter via Inngest
14. **createAccount** - Create a new account using OAuth (GitHub, Google, Discord) with newsletter opt-in support
15. **submitContent** - Submit content (agents, rules, MCP servers, etc.) for review with step-by-step guidance

### Feature Enhancement Tools (v1.0.0)

16. **getSearchSuggestions** - Get search autocomplete suggestions based on query history
17. **getSearchFacets** - Get available search facets (categories, tags, authors) for filtering
18. **getChangelog** - Get changelog of content updates in LLMs.txt format
19. **getSocialProofStats** - Get community statistics (contributors, submissions, success rate)
20. **getCategoryConfigs** - Get category-specific configurations and features

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

## Environment Variables

The following environment variables are required or recommended:

- **INNGEST_EVENT_KEY** (Required for production): Inngest event key for sending events (newsletter tool)
- **INNGEST_URL** (Optional): Inngest API URL (defaults to Inngest Cloud or local dev server)
- **APP_URL** (Optional): Application URL (defaults to `https://claudepro.directory`)
- **MCP_SERVER_URL** (Optional): MCP server URL (defaults to `https://mcp.claudepro.directory`)
- **API_BASE_URL** (Optional): API base URL for resource handlers (defaults to `https://claudepro.directory`)

## Version

- **MCP Server:** v1.0.0
- **Protocol:** 2025-06-18
- **Transport:** Streamable HTTP

## Links

- **Documentation:** https://claudepro.directory/mcp/heyclaude-mcp
- **MCP Spec:** https://spec.modelcontextprotocol.io/
- **mcp-lite:** https://github.com/wong2/mcp-lite
