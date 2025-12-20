# HeyClaude MCP Server - Cloudflare Workers

**Version:** 1.1.0  
**Protocol:** MCP 2025-11-25  
**Endpoint:** `https://mcp.claudepro.directory/mcp`

---

## Overview

HeyClaude MCP Server provides Model Context Protocol (MCP) access to the Claude Pro Directory. It exposes 20 tools and 3 resource templates for accessing directory content, configurations, and metadata.

**Migrated from:** Supabase Edge Functions (Deno) → Cloudflare Workers

---

## Architecture

- **Runtime:** Cloudflare Workers (V8 Isolates)
- **MCP Framework:** `@modelcontextprotocol/sdk` + `createMcpHandler` from `agents/mcp`
- **HTTP Framework:** Hono (for non-MCP routes)
- **Database:** Prisma ORM with Hyperdrive (PostgreSQL connection pooling)
- **Authentication:** Supabase Auth (OAuth 2.1) with JWT validation
- **Rate Limiting:** Cloudflare Rate Limiting binding (native)

---

## Features

### Tools (20)
1. `listCategories` - List all content categories
2. `searchContent` - Search directory content
3. `getContentDetail` - Get content by slug and category
4. `getTrending` - Get trending content
5. `getFeatured` - Get featured content
6. `getTemplates` - Get content templates
7. `getMcpServers` - List MCP servers
8. `getRelatedContent` - Get related content
9. `getContentByTag` - Filter content by tags
10. `getPopular` - Get popular content
11. `getRecent` - Get recent content
12. `downloadContentForPlatform` - Download content for specific platform
13. `getCategoryConfigs` - Get category configurations
14. `getChangelog` - Get changelog entries
15. `getSearchFacets` - Get search facets
16. `getSearchSuggestions` - Get search suggestions
17. `getSocialProofStats` - Get social proof statistics
18. `submitContent` - Submit new content
19. `createAccount` - Create user account
20. `subscribeNewsletter` - Subscribe to newsletter

### Resources (3)
1. `claudepro://content/{category}/{slug}` - Content resource
2. `claudepro://category/{category}` - Category resource
3. `claudepro://sitewide` - Sitewide resource

---

## Development

### Prerequisites
- Node.js 22+
- pnpm 10+
- Cloudflare account with Workers access
- Hyperdrive configuration pointing to Supabase PostgreSQL
- Rate Limiting namespace configured

### Local Development

```bash
# Install dependencies
pnpm install

# Run locally
pnpm --filter @heyclaude/workers-heyclaude-mcp dev

# Type check
pnpm --filter @heyclaude/workers-heyclaude-mcp type-check
```

### Environment Variables

Set in `wrangler.jsonc` or via `wrangler secret put`:

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXT_PUBLIC_SITE_URL` - Site URL (default: https://claudepro.directory)
- `APP_URL` - App URL (default: https://claudepro.directory)

### Hyperdrive Configuration

1. Create Hyperdrive configuration in Cloudflare Dashboard
2. Point to Supabase PostgreSQL connection string
3. Update `wrangler.jsonc` with Hyperdrive config ID

### Rate Limiting Configuration

1. Create Rate Limiting namespace in Cloudflare Dashboard
2. Update `wrangler.jsonc` with namespace ID

---

## Deployment

```bash
# Deploy to Cloudflare Workers
pnpm --filter @heyclaude/workers-heyclaude-mcp deploy

# Set secrets
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

## Endpoints

- `GET /` - Health check
- `GET /.well-known/oauth-authorization-server` - OAuth authorization server metadata
- `GET /.well-known/oauth-protected-resource` - OAuth protected resource metadata
- `POST /mcp` - MCP protocol endpoint (requires authentication)

---

## Authentication

The MCP endpoint requires OAuth 2.1 authentication:

1. Client requests authorization from `/.well-known/oauth-authorization-server`
2. Client redirects user to authorization endpoint
3. User authenticates via Supabase Auth
4. Client exchanges authorization code for access token
5. Client includes `Authorization: Bearer <token>` header in MCP requests

---

## Rate Limiting

Rate limiting is enforced via Cloudflare Rate Limiting binding:
- **Limit:** 100 requests per minute per user
- **Namespace:** Configured in `wrangler.jsonc`
- **Response:** 429 with `Retry-After` header when limit exceeded

---

## Project Structure

```
apps/workers/heyclaude-mcp/
├── src/
│   ├── index.ts              # Main Worker entry point
│   ├── mcp/
│   │   ├── server.ts         # MCP server factory
│   │   ├── tools/            # Tool handlers (20 tools)
│   │   │   ├── index.ts
│   │   │   ├── register.ts
│   │   │   └── ... (tool handlers)
│   │   └── resources/        # Resource handlers (3 resources)
│   │       ├── index.ts
│   │       └── content.ts
│   ├── routes/               # Non-MCP routes
│   │   ├── health.ts
│   │   └── oauth-metadata.ts
│   └── lib/
│       └── types.ts          # Type definitions
├── wrangler.jsonc            # Cloudflare Workers configuration
├── package.json
└── tsconfig.json
```

---

## Migration Notes

This Worker replaces the previous Supabase Edge Function implementation:
- **Old:** `apps/edge/supabase/functions/heyclaude-mcp/` (Deno)
- **New:** `apps/workers/heyclaude-mcp/` (Cloudflare Workers)

**Key Changes:**
- Replaced `mcp-lite` with `@modelcontextprotocol/sdk` + `createMcpHandler`
- Replaced Deno runtime with Cloudflare Workers runtime
- Replaced in-memory rate limiting with Cloudflare Rate Limiting binding
- Added Hyperdrive for PostgreSQL connection pooling
- Fixed bug: Removed undefined `authenticatedSupabase` parameter

---

## References

- **Cloudflare MCP Docs:** `/agents/model-context-protocol/`
- **createMcpHandler API:** `/agents/model-context-protocol/mcp-handler-api/`
- **Prisma + Hyperdrive:** `/workers/tutorials/using-prisma-postgres-with-workers/`
- **Rate Limiting:** `/workers/runtime-apis/bindings/rate-limit/`
