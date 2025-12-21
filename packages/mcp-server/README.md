# @heyclaude/mcp-server

HeyClaude MCP Server - Model Context Protocol server for Claude Pro Directory

## Overview

The HeyClaude MCP Server provides programmatic access to the Claude Pro Directory through the Model Context Protocol (MCP). It enables AI agents to search, browse, and interact with content from the directory using a standardized MCP interface.

## Features

- **20 MCP Tools**: Search, browse, filter, and interact with directory content
- **3 Resource Templates**: Access content in various formats (llms.txt, markdown, JSON, RSS, Atom)
- **OAuth 2.1 Authentication**: Secure authentication via Supabase Auth
- **Dual Deployment**: Hosted Cloudflare Worker or self-hosted NPM package
- **Request Deduplication**: Automatic caching to reduce redundant requests
- **Enhanced Metrics**: Detailed observability for tool usage and performance
- **Input Sanitization**: Comprehensive input validation and sanitization

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
- `listCategories` - List all content categories
- `searchContent` - Search content with filters and pagination
- `getContentDetail` - Get complete content metadata
- `getTrending` - Get trending content
- `getFeatured` - Get featured/highlighted content
- `getPopular` - Get popular content
- `getRecent` - Get recently added content
- `getRelatedContent` - Get related content
- `getContentByTag` - Get content filtered by tags

### Search & Discovery
- `getSearchFacets` - Get available search facets (categories, tags, authors)
- `getSearchSuggestions` - Get search suggestions

### Configuration & Metadata
- `getCategoryConfigs` - Get category-specific configurations
- `getTemplates` - Get content submission templates
- `getMcpServers` - Get MCP servers from directory
- `getChangelog` - Get changelog in LLMs.txt format
- `getSocialProofStats` - Get community statistics

### Actions
- `downloadContentForPlatform` - Download content formatted for platform
- `submitContent` - Guide content submission
- `createAccount` - Create account via OAuth
- `subscribeNewsletter` - Subscribe to newsletter

## Resources

### Content Resource
```
claudepro://content/{category}/{slug}/{format}
```

Export individual content items in various formats:
- `llms.txt` - LLMs.txt format
- `markdown` - Markdown format
- `json` - JSON format
- `rss` - RSS feed
- `atom` - Atom feed

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
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features (backward compatible)
- **PATCH** (0.0.X): Bug fixes (backward compatible)

**Starting Version**: `1.0.0` (initial release)

### Version Bumps

Version bumps are managed via GitHub Actions workflows:

#### Automatic Version Bumps (Recommended)

**Workflow**: `.github/workflows/auto-release.yml`

**Trigger**: PR merged to `main` branch

**Process**:
1. Analyzes commits since last tag to determine bump type (major/minor/patch)
2. Auto-bumps version in `package.json`
3. Auto-generates changelog entry
4. Commits version + changelog changes
5. Creates and pushes tag (`vX.Y.Z`)
6. Creates GitHub Release

**Commit Message Conventions**:
- `feat:` → Minor bump (new features)
- `fix:` → Patch bump (bug fixes)
- `BREAKING CHANGE:` → Major bump (breaking changes)

#### Manual Version Bumps

**Workflow**: `.github/workflows/release.yml`

**Trigger**: Manual tag push or workflow dispatch

**Process**:
1. Developer bumps version: `pnpm bump:minor` (or `bump:major`, `bump:patch`)
2. Developer generates changelog: `pnpm changelog:generate`
3. Developer commits: `git commit -m "chore: bump version to X.Y.Z"`
4. Developer tags: `git tag vX.Y.Z && git push origin main --tags`
5. Workflow creates GitHub Release

**Version Bump Commands**:
```bash
# Bump major version (1.0.0 → 2.0.0)
pnpm bump:major

# Bump minor version (1.0.0 → 1.1.0)
pnpm bump:minor

# Bump patch version (1.0.0 → 1.0.1)
pnpm bump:patch

# Auto-detect bump type from commits
pnpm bump:auto
```

**Script Location**: `packages/generators/src/commands/bump-version.ts`

### GitHub Release Management

**Automatic Releases**:
- Created automatically when PR is merged to `main` (via `auto-release.yml`)
- Created automatically when tag is pushed (via `release.yml`)

**Release Notes**:
- Generated from `CHANGELOG.md` entries
- Merged with auto-generated release notes from GitHub

**Release Tags**:
- Format: `vX.Y.Z` (e.g., `v1.0.0`)
- Created automatically by workflows

### NPM Package Publishing

**IMPORTANT**: Publishing is **NOT** automated. Manual steps required:

#### Pre-Publishing Checklist

1. **Version Bump**: Ensure version is bumped in `package.json`
2. **Changelog**: Ensure `CHANGELOG.md` is updated
3. **Git Tag**: Ensure tag exists (`vX.Y.Z`)
4. **GitHub Release**: Ensure GitHub Release exists
5. **Build**: Ensure package builds successfully (`pnpm build`)
6. **Tests**: Ensure all tests pass (if applicable)

#### Publishing Process

1. **Build the package**:
   ```bash
   cd packages/mcp-server
   pnpm build
   ```

2. **Verify package contents**:
   ```bash
   # Check what will be published
   pnpm pack --dry-run
   ```

3. **Publish to NPM**:
   ```bash
   # Dry run first (recommended)
   pnpm publish --dry-run

   # Actual publish
   pnpm publish
   ```

4. **Verify publication**:
   ```bash
   # Check NPM registry
   npm view @heyclaude/mcp-server
   ```

#### NPM Package Configuration

**Package Name**: `@heyclaude/mcp-server`

**Registry**: `https://registry.npmjs.org/` (public)

**Access**: Public (`"publishConfig": { "access": "public" }`)

**Version Sync**: 
- NPM package version should match GitHub Release tag version
- Example: GitHub Release `v1.0.0` → NPM package `1.0.0`

#### Post-Publishing

1. **Verify Installation**:
   ```bash
   npx @heyclaude/mcp-server@latest --version
   ```

2. **Update Documentation**: Update any version references in docs

3. **Announce Release**: Announce new version (if applicable)

### Version Bump Workflow Integration

The package integrates with existing GitHub Actions workflows:

**Workflows Used**:
- `.github/workflows/auto-release.yml` - Auto-release on PR merge
- `.github/workflows/release.yml` - Manual release via tag

**Scripts Used**:
- `packages/generators/src/commands/bump-version.ts` - Version bumping
- `packages/generators/src/commands/changelog.ts` - Changelog generation

**Integration Points**:
1. Version is bumped in `packages/mcp-server/package.json`
2. Changelog is updated in `CHANGELOG.md` (root or package-specific)
3. GitHub Release is created with version tag
4. NPM package can be published manually (version matches GitHub Release)

### Version History

- `1.0.0` - Initial release (standalone package with dual deployment support)

## License

MIT

## Repository

https://github.com/JSONbored/claudepro-directory/tree/main/packages/mcp-server

