# @heyclaude/mcp-server

HeyClaude MCP Server - Model Context Protocol server for Claude Pro Directory

## Overview

The HeyClaude MCP Server provides programmatic access to the Claude Pro Directory through the Model Context Protocol (MCP). It enables AI agents to search, browse, and interact with content from the directory using a standardized MCP interface.

## Features

* **20 MCP Tools**: Search, browse, filter, and interact with directory content
* **3 Resource Templates**: Access content in various formats (llms.txt, markdown, JSON, RSS, Atom)
* **OAuth 2.1 Authentication**: Secure authentication via Supabase Auth
* **Dual Deployment**: Hosted Cloudflare Worker or self-hosted NPM package
* **Request Deduplication**: Automatic caching to reduce redundant requests
* **Enhanced Metrics**: Detailed observability for tool usage and performance
* **Input Sanitization**: Comprehensive input validation and sanitization

## Installation

### Hosted (Recommended)

Use the hosted Cloudflare Worker endpoint:

```json
{
  "mcpServers": {
    "heyclaude": {
      "url": "https://mcp.claudepro.directory/mcp"
    }
  }
}
```

### Self-Hosted

Install and run locally:

```bash
npx @heyclaude/mcp-server@latest start
```

Or configure in `mcp.json`:

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

## Usage

### CLI Options

```bash
npx @heyclaude/mcp-server start [options]

Options:
  --port <number>        Server port (default: 3000)
  --api-base-url <url>   API base URL (default: https://claudepro.directory)
  --api-key <key>        Optional API key for authentication
```

### Examples

```bash
# Start on default port (3000)
npx @heyclaude/mcp-server start

# Start on custom port
npx @heyclaude/mcp-server start --port 8080

# Use custom API base URL
npx @heyclaude/mcp-server start --api-base-url https://api.example.com
```

## Available Tools

### Content Discovery

* `listCategories` - List all content categories
* `searchContent` - Search content with filters and pagination
* `getContentDetail` - Get complete content metadata
* `getTrending` - Get trending content
* `getFeatured` - Get featured/highlighted content
* `getPopular` - Get popular content
* `getRecent` - Get recently added content
* `getRelatedContent` - Get related content
* `getContentByTag` - Get content filtered by tags

### Search & Discovery

* `getSearchFacets` - Get available search facets (categories, tags, authors)
* `getSearchSuggestions` - Get search suggestions

### Configuration & Metadata

* `getCategoryConfigs` - Get category-specific configurations
* `getTemplates` - Get content submission templates
* `getMcpServers` - Get MCP servers from directory
* `getChangelog` - Get changelog in LLMs.txt format
* `getSocialProofStats` - Get community statistics

### Actions

* `downloadContentForPlatform` - Download content formatted for platform
* `submitContent` - Guide content submission
* `createAccount` - Create account via OAuth
* `subscribeNewsletter` - Subscribe to newsletter

## Resources

### Content Resource

```
claudepro://content/{category}/{slug}/{format}
```

Export individual content items in various formats:

* `llms.txt` - LLMs.txt format
* `markdown` - Markdown format
* `json` - JSON format
* `rss` - RSS feed
* `atom` - Atom feed

### Category Resource

```
claudepro://category/{category}/{format}
```

Export all content in a category in various formats.

### Sitewide Resource

```
claudepro://sitewide/{format}
```

Export all content across all categories in various formats.

## Authentication

The MCP server uses OAuth 2.1 authentication via Supabase Auth. To authenticate:

1. Get OAuth authorization URL from `/.well-known/oauth-authorization-server`
2. Complete OAuth flow with Supabase Auth
3. Exchange authorization code for access token
4. Use access token in `Authorization: Bearer <token>` header for MCP requests

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## Versioning & Release Management

### Version Format

This package follows [Semantic Versioning](https://semver.org/) (SemVer):

* **MAJOR** (X.0.0): Breaking changes
* **MINOR** (0.X.0): New features (backward compatible)
* **PATCH** (0.0.X): Bug fixes (backward compatible)

**Starting Version**: `1.0.0` (initial release)

### Standalone Package

This package is **100% standalone** and can be used independently:

* ✅ All internal dependencies (`@heyclaude/data-layer`, `@heyclaude/database-types`, `@heyclaude/shared-runtime`) are **bundled** into the package
* ✅ No `workspace:*` dependencies in published package
* ✅ Can be installed and used in any Node.js project
* ✅ Fully self-contained with all required code included

**Bundling**: The package uses `tsup` to bundle internal dependencies, ensuring it works as a standalone npm package.

### Release Process

#### Step 1: Bump Version

Use package-specific version bump commands:

```bash
# Bump major version (1.0.0 → 2.0.0)
pnpm bump:mcp-server:major

# Bump minor version (1.0.0 → 1.1.0)
pnpm bump:mcp-server:minor

# Bump patch version (1.0.0 → 1.0.1)
pnpm bump:mcp-server:patch
```

**What it does**:

* Updates `packages/mcp-server/package.json` version
* Provides next steps (commit, tag, push)

**Script**: `packages/generators/src/commands/bump-version-package.ts`

#### Step 2: Generate Changelog

Generate changelog entries for the package:

```bash
# Generate changelog (writes to packages/mcp-server/CHANGELOG.md)
pnpm changelog:generate:mcp-server

# Preview without writing (dry run)
pnpm changelog:generate:mcp-server:dry

# Generate from specific date
pnpm exec heyclaude-changelog-package mcp-server --since "2025-01-01"
```

**What it does**:

* Filters commits to only those affecting `packages/mcp-server/**`
* Generates changelog entry using `git-cliff`
* Prepends to `packages/mcp-server/CHANGELOG.md`

**Script**: `packages/generators/src/commands/changelog-package.ts`

#### Step 3: Commit Changes

```bash
git add packages/mcp-server/package.json packages/mcp-server/CHANGELOG.md
git commit -m "chore(mcp-server): bump version to X.Y.Z"
```

#### Step 4: Create and Push Tag

Use **namespaced tags** for monorepo packages:

```bash
# Create namespaced tag (format: mcp-server-vX.Y.Z)
git tag mcp-server-v1.0.0

# Push tag
git push origin main --tags
```

**Tag Format**: `mcp-server-vX.Y.Z` (e.g., `mcp-server-v1.0.0`)

**Why namespaced?**: In a monorepo, multiple packages can have version tags. Namespacing prevents conflicts (e.g., `mcp-server-v1.0.0` vs `prismocker-v1.0.0`).

#### Step 5: GitHub Release (Automatic)

When you push a namespaced tag (`mcp-server-v*.*.*`), the **Release workflow** automatically:

1. ✅ Verifies package version matches tag version
2. ✅ Builds the package (`pnpm build`)
3. ✅ Runs tests (`pnpm test`)
4. ✅ Publishes to npm (`npm publish`)
5. ✅ Creates GitHub Release with changelog notes

**Workflow**: `packages/mcp-server/.github/workflows/release.yml`

**Trigger**: Push tag matching `mcp-server-v*.*.*`

**Manual Trigger**: You can also trigger via GitHub Actions UI (workflow dispatch)

### CI Pipeline

**Workflow**: `packages/mcp-server/.github/workflows/ci.yml`

**Triggers**:

* Pull requests to `main`
* Pushes to `main`

**What it does**:

1. ✅ Type checks (`pnpm type-check`)
2. ✅ Builds package (`pnpm build`)
3. ✅ Runs tests (`pnpm test`)

**Purpose**: Ensures package health before merging PRs

### NPM Package Publishing

**Automatic**: Publishing is **automated** via the Release workflow when you push a namespaced tag.

**Manual Publishing** (if needed):

```bash
cd packages/mcp-server

# Build the package
pnpm build

# Verify package contents
pnpm pack --dry-run

# Publish (dry run first)
pnpm publish --dry-run

# Actual publish
pnpm publish
```

**Package Configuration**:

* **Name**: `@heyclaude/mcp-server`
* **Registry**: `https://registry.npmjs.org/` (public)
* **Access**: Public
* **Version**: Must match GitHub Release tag (without `mcp-server-v` prefix)

### Version History

See `packages/mcp-server/CHANGELOG.md` for detailed version history.

### Release Checklist

Before creating a release:

* \[ ] Version bumped in `packages/mcp-server/package.json`
* \[ ] Changelog generated and reviewed (`pnpm changelog:generate:mcp-server`)
* \[ ] Changes committed
* \[ ] Namespaced tag created (`mcp-server-vX.Y.Z`)
* \[ ] Tag pushed to trigger Release workflow
* \[ ] GitHub Release created automatically
* \[ ] NPM package published automatically
* \[ ] Verify installation: `npx @heyclaude/mcp-server@latest --version`

## License

MIT

## Repository

https://github.com/JSONbored/claudepro-directory/tree/main/packages/mcp-server
