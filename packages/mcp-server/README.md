# @heyclaude/mcp-server

**Model Context Protocol server for [Claude Pro Directory](https://claudepro.directory)**

Access the Claude Pro Directory's comprehensive collection of prompts, agents, MCP servers, rules, and commands through a standardized MCP interface. Perfect for AI agents, Claude Desktop, and custom integrations.

---

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Resources](#resources)
- [Authentication](#authentication)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Advanced Usage](#advanced-usage)
- [Links & Resources](#links--resources)
- [License](#license)

---

## Overview

The **HeyClaude MCP Server** provides programmatic access to the [Claude Pro Directory](https://claudepro.directory) through the Model Context Protocol (MCP). It enables AI agents, Claude Desktop, and custom applications to search, browse, and interact with directory content using a standardized interface.

### What is Claude Pro Directory?

[Claude Pro Directory](https://claudepro.directory) is a comprehensive, community-driven directory of:
- **Prompts** - High-quality prompts for Claude and other AI models
- **Agents** - Pre-built AI agents and workflows
- **MCP Servers** - Model Context Protocol server configurations
- **Rules** - Best practices and guidelines
- **Commands** - Reusable command templates

### Why Use This Server?

- ✅ **20 MCP Tools** - Search, browse, filter, and interact with directory content
- ✅ **3 Resource Templates** - Access content in various formats (llms.txt, markdown, JSON, RSS, Atom)
- ✅ **OAuth 2.1 Authentication** - Secure authentication via Supabase Auth
- ✅ **Dual Deployment** - Use hosted Cloudflare Worker or self-hosted NPM package
- ✅ **Request Deduplication** - Automatic caching to reduce redundant requests
- ✅ **Enhanced Metrics** - Detailed observability for tool usage and performance
- ✅ **Input Sanitization** - Comprehensive input validation and sanitization

---

## Quick Start

### 5-Minute Setup

1. **Choose your deployment method** (hosted recommended):

   **Option A: Hosted (Recommended)**
   ```json
   {
     "mcpServers": {
       "heyclaude": {
         "url": "https://mcp.claudepro.directory/mcp"
       }
     }
   }
   ```

   **Option B: Self-Hosted**
   ```json
   {
     "mcpServers": {
       "heyclaude": {
         "command": "npx",
         "args": ["-y", "@heyclaude/mcp-server@latest", "start"]
       }
     }
   }
   ```

2. **Add to your MCP configuration** (`mcp.json` for Claude Desktop or your MCP client)

3. **Restart your MCP client** (Claude Desktop or your application)

4. **Start using tools**:
   - `listCategories` - See all available categories
   - `searchContent` - Search for content
   - `getContentDetail` - Get detailed content information

That's it! You're ready to use the Claude Pro Directory through MCP.

---

## Installation

### Hosted (Recommended)

Use the hosted Cloudflare Worker endpoint - no installation required:

```json
{
  "mcpServers": {
    "heyclaude": {
      "url": "https://mcp.claudepro.directory/mcp"
    }
  }
}
```

**Benefits:**
- ✅ No installation or setup required
- ✅ Always up-to-date
- ✅ High availability and performance
- ✅ Automatic updates

### Self-Hosted

Install and run locally for full control:

```bash
# Run directly
npx @heyclaude/mcp-server@latest start

# Or install globally
npm install -g @heyclaude/mcp-server
heyclaude-mcp start
```

**Configuration in `mcp.json`:**

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": ["-y", "@heyclaude/mcp-server@latest", "start"]
    }
  }
}
```

**Benefits:**
- ✅ Full control over configuration
- ✅ Custom API base URL support
- ✅ Works offline (with cached data)
- ✅ No external dependencies

---

## Configuration

### CLI Options

```bash
npx @heyclaude/mcp-server start [options]

Options:
  --port <number>        Server port (default: 3000)
  --api-base-url <url>   API base URL (default: https://claudepro.directory)
  --api-key <key>        Optional API key for authentication
```

### Environment Variables

For self-hosted deployments, you can configure via environment variables:

```bash
# Server port
PORT=3000

# API base URL (for API proxy mode)
API_BASE_URL=https://claudepro.directory

# Optional API key
API_KEY=your-api-key-here
```

### Complete `mcp.json` Example

```json
{
  "mcpServers": {
    "heyclaude": {
      "url": "https://mcp.claudepro.directory/mcp",
      "alwaysAllow": [
        "listCategories",
        "searchContent",
        "getContentDetail"
      ]
    }
  }
}
```

**For self-hosted with custom port:**

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": [
        "-y",
        "@heyclaude/mcp-server@latest",
        "start",
        "--port",
        "8080",
        "--api-base-url",
        "https://claudepro.directory"
      ]
    }
  }
}
```

---

## Available Tools

### Content Discovery

**`listCategories`** - List all content categories with counts
```json
{
  "tool": "listCategories",
  "arguments": {}
}
```

**`searchContent`** - Search content with filters and pagination
```json
{
  "tool": "searchContent",
  "arguments": {
    "query": "MCP server",
    "category": "mcp",
    "limit": 10,
    "offset": 0
  }
}
```

**`getContentDetail`** - Get complete content metadata
```json
{
  "tool": "getContentDetail",
  "arguments": {
    "category": "mcp",
    "slug": "my-mcp-server"
  }
}
```

**`getTrending`** - Get trending content
```json
{
  "tool": "getTrending",
  "arguments": {
    "category": "agents",
    "limit": 5
  }
}
```

**`getFeatured`** - Get featured/highlighted content
```json
{
  "tool": "getFeatured",
  "arguments": {
    "category": "prompts",
    "limit": 5
  }
}
```

**`getPopular`** - Get popular content (by views/bookmarks)
```json
{
  "tool": "getPopular",
  "arguments": {
    "category": "rules",
    "limit": 10
  }
}
```

**`getRecent`** - Get recently added content
```json
{
  "tool": "getRecent",
  "arguments": {
    "category": "commands",
    "limit": 10
  }
}
```

**`getRelatedContent`** - Get related content
```json
{
  "tool": "getRelatedContent",
  "arguments": {
    "category": "mcp",
    "slug": "my-mcp-server",
    "limit": 5
  }
}
```

**`getContentByTag`** - Get content filtered by tags
```json
{
  "tool": "getContentByTag",
  "arguments": {
    "tag": "automation",
    "category": "agents",
    "limit": 10
  }
}
```

### Search & Discovery

**`getSearchFacets`** - Get available search facets (categories, tags, authors)
```json
{
  "tool": "getSearchFacets",
  "arguments": {}
}
```

**`getSearchSuggestions`** - Get search suggestions
```json
{
  "tool": "getSearchSuggestions",
  "arguments": {
    "query": "MCP"
  }
}
```

### Configuration & Metadata

**`getCategoryConfigs`** - Get category-specific configurations
```json
{
  "tool": "getCategoryConfigs",
  "arguments": {}
}
```

**`getTemplates`** - Get content submission templates
```json
{
  "tool": "getTemplates",
  "arguments": {
    "category": "mcp"
  }
}
```

**`getMcpServers`** - Get MCP servers from directory
```json
{
  "tool": "getMcpServers",
  "arguments": {
    "limit": 20
  }
}
```

**`getChangelog`** - Get changelog in LLMs.txt format
```json
{
  "tool": "getChangelog",
  "arguments": {}
}
```

**`getSocialProofStats`** - Get community statistics
```json
{
  "tool": "getSocialProofStats",
  "arguments": {}
}
```

### Actions

**`downloadContentForPlatform`** - Download content formatted for platform
```json
{
  "tool": "downloadContentForPlatform",
  "arguments": {
    "category": "mcp",
    "slug": "my-mcp-server",
    "platform": "cursor"
  }
}
```

**`submitContent`** - Guide content submission
```json
{
  "tool": "submitContent",
  "arguments": {
    "category": "prompts",
    "title": "My Prompt",
    "description": "A great prompt for..."
  }
}
```

**`createAccount`** - Create account via OAuth
```json
{
  "tool": "createAccount",
  "arguments": {}
}
```

**`subscribeNewsletter`** - Subscribe to newsletter
```json
{
  "tool": "subscribeNewsletter",
  "arguments": {
    "email": "user@example.com"
  }
}
```

---

## Resources

Resources provide access to content in various export formats. Use resources when you need formatted exports, bulk data, or specific formats.

### Content Resource

Access individual content items in various formats:

**URI Format:**
```
claudepro://content/{category}/{slug}/{format}
```

**Examples:**
- `claudepro://content/mcp/my-mcp-server/llms.txt` - LLMs.txt format
- `claudepro://content/agents/my-agent/markdown` - Markdown format
- `claudepro://content/prompts/my-prompt/json` - JSON format
- `claudepro://content/rules/my-rule/rss` - RSS feed
- `claudepro://content/commands/my-command/atom` - Atom feed

**Supported Formats:**
- `llms.txt` or `llms` - LLMs.txt format (plain text)
- `markdown` or `md` - Markdown format
- `json` - JSON format
- `rss` - RSS feed
- `atom` - Atom feed

### Category Resource

Access all content in a category:

**URI Format:**
```
claudepro://category/{category}/{format}
```

**Examples:**
- `claudepro://category/agents/llms.txt` - All agents in LLMs.txt format
- `claudepro://category/mcp/markdown` - All MCP servers in Markdown format
- `claudepro://category/prompts/json` - All prompts in JSON format
- `claudepro://category/rules/rss` - All rules in RSS feed

**Supported Categories:**
- `agents` - AI agents and workflows
- `mcp` - MCP servers
- `prompts` - Prompts for AI models
- `rules` - Best practices and guidelines
- `commands` - Command templates

### Sitewide Resource

Access all content across all categories:

**URI Format:**
```
claudepro://sitewide/{format}
```

**Examples:**
- `claudepro://sitewide/llms.txt` - All content in LLMs.txt format
- `claudepro://sitewide/markdown` - All content in Markdown format
- `claudepro://sitewide/json` - All content in JSON format
- `claudepro://sitewide/rss` - All content in RSS feed

**Note:** Sitewide exports can be large. Consider using category resources for better performance.

---

## Authentication

The MCP server uses **OAuth 2.1 authentication** via Supabase Auth for secure access to protected endpoints.

### OAuth Flow

1. **Get OAuth metadata** from `/.well-known/oauth-authorization-server`
2. **Redirect user** to authorization endpoint
3. **User authenticates** via Supabase Auth
4. **Exchange authorization code** for access token
5. **Use access token** in `Authorization: Bearer <token>` header for MCP requests

### Public vs Protected Endpoints

**Public Endpoints** (no authentication required):
- `listCategories`
- `searchContent` (limited results)
- `getContentDetail`
- `getTrending`
- `getFeatured`
- `getPopular`
- `getRecent`
- `getRelatedContent`
- `getContentByTag`
- `getSearchFacets`
- `getSearchSuggestions`
- `getCategoryConfigs`
- `getTemplates`
- `getMcpServers`
- `getChangelog`
- `getSocialProofStats`
- All resource URIs

**Protected Endpoints** (authentication required):
- `submitContent`
- `createAccount`
- `subscribeNewsletter`
- Enhanced search results (with authentication)

### OAuth Endpoints

- **Authorization Server Metadata**: `/.well-known/oauth-authorization-server`
- **Protected Resource Metadata**: `/.well-known/oauth-protected-resource`
- **Authorization**: `/oauth/authorize`
- **Token Exchange**: `/oauth/token`
- **Token Revocation**: `/oauth/revoke`
- **Token Introspection**: `/oauth/introspect`
- **Dynamic Client Registration**: `/oauth/register`

---

## Examples

### Example 1: Search for MCP Servers

```json
{
  "tool": "searchContent",
  "arguments": {
    "query": "MCP server",
    "category": "mcp",
    "limit": 5
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 5 MCP servers matching 'MCP server':\n\n1. My MCP Server\n2. Another Server\n..."
    }
  ],
  "_meta": {
    "items": [...],
    "total": 5,
    "pagination": {...}
  }
}
```

### Example 2: Get Content Detail

```json
{
  "tool": "getContentDetail",
  "arguments": {
    "category": "mcp",
    "slug": "my-mcp-server"
  }
}
```

**Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "My MCP Server\n\nDescription: A great MCP server...\n\nAuthor: John Doe\nTags: automation, mcp\n..."
    }
  ],
  "_meta": {
    "content": {...},
    "related": [...]
  }
}
```

### Example 3: Access Resource (LLMs.txt Format)

**Resource URI:**
```
claudepro://content/mcp/my-mcp-server/llms.txt
```

**Response:**
```
# My MCP Server

Description: A great MCP server for...

Author: John Doe
Tags: automation, mcp
...
```

### Example 4: Access Category Resource (RSS Feed)

**Resource URI:**
```
claudepro://category/agents/rss
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Claude Pro Directory - Agents</title>
    <description>All agents from Claude Pro Directory</description>
    ...
  </channel>
</rss>
```

### Example 5: Get Trending Content

```json
{
  "tool": "getTrending",
  "arguments": {
    "category": "prompts",
    "limit": 10
  }
}
```

### Example 6: Complete MCP Configuration

**For Claude Desktop (`mcp.json`):**

```json
{
  "mcpServers": {
    "heyclaude": {
      "url": "https://mcp.claudepro.directory/mcp",
      "alwaysAllow": [
        "listCategories",
        "searchContent",
        "getContentDetail",
        "getTrending",
        "getFeatured"
      ]
    }
  }
}
```

**For Self-Hosted:**

```json
{
  "mcpServers": {
    "heyclaude": {
      "command": "npx",
      "args": [
        "-y",
        "@heyclaude/mcp-server@latest",
        "start",
        "--port",
        "3000"
      ]
    }
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Connection Failed / Server Not Responding

**Symptoms:**
- MCP client can't connect to server
- Timeout errors
- Connection refused

**Solutions:**
- ✅ Verify the server URL is correct: `https://mcp.claudepro.directory/mcp`
- ✅ Check your internet connection
- ✅ Verify the server is running (if self-hosted)
- ✅ Check firewall settings
- ✅ Try the hosted endpoint instead of self-hosted

#### 2. Authentication Errors

**Symptoms:**
- `401 Unauthorized` errors
- `Authentication required` messages
- OAuth flow fails

**Solutions:**
- ✅ Complete OAuth flow (get authorization URL, authenticate, exchange code)
- ✅ Verify access token is valid (not expired)
- ✅ Check token is included in `Authorization: Bearer <token>` header
- ✅ Re-authenticate if token expired

#### 3. Tool Not Found / Invalid Tool

**Symptoms:**
- `Tool not found` errors
- `Invalid tool name` messages

**Solutions:**
- ✅ Verify tool name is correct (case-sensitive)
- ✅ Check tool is available (use `listTools` if available)
- ✅ Ensure server is up-to-date
- ✅ Check tool documentation for correct name

#### 4. Resource Not Found

**Symptoms:**
- `Resource not found` errors
- `404 Not Found` for resource URIs

**Solutions:**
- ✅ Verify resource URI format: `claudepro://content/{category}/{slug}/{format}`
- ✅ Check category is valid: `agents`, `mcp`, `prompts`, `rules`, `commands`
- ✅ Verify slug exists (use `getContentDetail` to check)
- ✅ Check format is supported: `llms.txt`, `markdown`, `json`, `rss`, `atom`

#### 5. Self-Hosted Server Won't Start

**Symptoms:**
- Server fails to start
- Port already in use
- Permission errors

**Solutions:**
- ✅ Check if port is already in use: `lsof -i :3000`
- ✅ Use a different port: `--port 8080`
- ✅ Verify Node.js version: `node --version` (requires >=18.0.0)
- ✅ Check file permissions
- ✅ Verify dependencies are installed: `npm install`

#### 6. Slow Performance

**Symptoms:**
- Slow tool responses
- Timeout errors
- High latency

**Solutions:**
- ✅ Use hosted endpoint (better performance)
- ✅ Check network connection
- ✅ Use caching (resources support ETag/Last-Modified)
- ✅ Reduce result limits (use smaller `limit` values)
- ✅ Use category resources instead of sitewide for large exports

#### 7. Invalid Input / Validation Errors

**Symptoms:**
- `Invalid input` errors
- `Validation failed` messages
- Parameter errors

**Solutions:**
- ✅ Check tool documentation for required parameters
- ✅ Verify parameter types (string, number, boolean)
- ✅ Check parameter values are within allowed ranges
- ✅ Ensure required parameters are provided

### Getting Help

If you encounter issues not covered here:

1. **Check the [Claude Pro Directory](https://claudepro.directory)** for updates and announcements
2. **Review the [GitHub repository](https://github.com/JSONbored/claudepro-directory)** for issues and discussions
3. **Check server status** at the health endpoint: `https://mcp.claudepro.directory/`
4. **Verify your configuration** matches the examples in this README

---

## Advanced Usage

### Custom API Base URL

For self-hosted deployments, you can use a custom API base URL:

```bash
npx @heyclaude/mcp-server start --api-base-url https://api.example.com
```

This is useful for:
- Using a custom API endpoint
- Testing against a development environment
- Using a proxy or CDN

### API Proxy Mode

When using `--api-base-url`, the server operates in **API proxy mode**:
- All tool calls are proxied to the specified API base URL
- No database connection required
- Works with any compatible API endpoint

### Environment Variables

Configure the server via environment variables:

```bash
# Server configuration
PORT=3000
API_BASE_URL=https://claudepro.directory
API_KEY=your-api-key

# Start server
npx @heyclaude/mcp-server start
```

### Resource Caching

Resources support HTTP caching via `ETag` and `Last-Modified` headers:

- **ETag**: Use `If-None-Match` header for conditional requests
- **Last-Modified**: Use `If-Modified-Since` header for conditional requests
- **Cache-Control**: Resources include appropriate cache headers

**Example conditional request:**
```http
GET /resource/claudepro://content/mcp/my-server/llms.txt
If-None-Match: "abc123"
```

If content hasn't changed, server returns `304 Not Modified`.

### Rate Limiting

The hosted endpoint has rate limiting:
- **Development**: 200 requests per minute
- **Production**: 100 requests per minute

If you exceed the limit, you'll receive a `429 Too Many Requests` response with retry information.

### Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

**Common Error Codes:**
- `INVALID_INPUT` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Server error

---

## Deployment

### Cloudflare Workers Deployment

The MCP server can be deployed to Cloudflare Workers for high-performance, globally distributed hosting.

#### Prerequisites

- Cloudflare account with Workers access
- Hyperdrive configuration pointing to Supabase PostgreSQL
- Rate Limiting namespace configured
- Infisical configured for secrets management

#### Deployment Process

**Deploy to Dev Environment:**
```bash
cd apps/workers/heyclaude-mcp
./deploy.sh dev
```

**Deploy to Production:**
```bash
cd apps/workers/heyclaude-mcp
./deploy.sh production
```

#### Environment Configuration

**Dev Environment:**
- **URL**: `https://dev.claudepro.directory`
- **Routes**: `dev.claudepro.directory/mcp*`, `dev.claudepro.directory/.well-known/oauth*`, `dev.claudepro.directory/oauth/*`
- **Rate Limit**: 200 requests per minute
- **Hyperdrive**: Configured with dev database connection

**Production Environment:**
- **URL**: `https://mcp.claudepro.directory`
- **Routes**: `mcp.claudepro.directory/*`
- **Rate Limit**: 100 requests per minute
- **Hyperdrive**: Configured with production database connection

#### Configuration Files

- **`wrangler.jsonc`**: Cloudflare Workers configuration (routes, Hyperdrive, KV, rate limiting)
- **`deploy.sh`**: Deployment script that extracts secrets from Infisical and runs wrangler

#### Secrets Management

Secrets are managed via Infisical:
- `CLI_TOKEN` - Cloudflare API token (stored in `cloudflare/` subdirectory)
- Other secrets are injected via Cloudflare Workers secrets store

#### Post-Deployment Testing

After deployment, verify:
- Health endpoint: `GET https://dev.claudepro.directory/`
- OAuth metadata: `GET https://dev.claudepro.directory/.well-known/oauth-authorization-server`
- MCP endpoint: `POST https://dev.claudepro.directory/mcp`

See [DEPLOYMENT_TESTING.md](DEPLOYMENT_TESTING.md) for comprehensive testing checklist.

#### Worker App Documentation

For detailed Cloudflare Workers deployment documentation, see:
- **`apps/workers/heyclaude-mcp/README.md`** - Complete deployment guide
- **`apps/workers/heyclaude-mcp/wrangler.jsonc`** - Configuration reference

---

## Links & Resources

- **[Claude Pro Directory](https://claudepro.directory)** - Main website and directory
- **[GitHub Repository](https://github.com/JSONbored/claudepro-directory)** - Source code and issues
- **[MCP Protocol Documentation](https://modelcontextprotocol.io)** - Official MCP documentation
- **[Claude Desktop Documentation](https://claude.ai/desktop)** - Claude Desktop setup guide
- **[Package on npm](https://www.npmjs.com/package/@heyclaude/mcp-server)** - npm package page

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Repository

Source code: https://github.com/JSONbored/claudepro-directory/tree/main/packages/mcp-server

---

## Versioning & Release Management

This package follows [Semantic Versioning](https://semver.org/) (SemVer):
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features (backward compatible)
- **PATCH** (0.0.X): Bug fixes (backward compatible)

**Starting Version**: `1.0.0` (initial release)

### Standalone Package

This package is **100% standalone** and can be used independently:
- ✅ All internal dependencies are **bundled** into the package
- ✅ No `workspace:*` dependencies in published package
- ✅ Can be installed and used in any Node.js project
- ✅ Fully self-contained with all required code included

### Release Process

Releases are automated via GitHub Actions when namespaced tags are pushed:
- **Tag Format**: `mcp-server-vX.Y.Z` (e.g., `mcp-server-v1.0.0`)
- **Workflow**: `packages/mcp-server/.github/workflows/release.yml`
- **Automatic**: Builds, tests, publishes to npm, creates GitHub Release

See [CHANGELOG.md](CHANGELOG.md) for version history.
