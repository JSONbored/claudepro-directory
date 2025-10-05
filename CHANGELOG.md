# Changelog

All notable changes to Claude Pro Directory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Quick Navigation

**Latest Features:**
- [LLMs.txt AI Optimization](#2025-10-04---llmstxt-complete-content-generation-for-ai-discovery) - Complete page content for AI/LLM consumption
- [SEO Title Optimization](#2025-10-04---seo-title-optimization-system-with-automated-enhancement) - Automated title enhancement for 168+ pages
- [Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations) - Real-time growth velocity tracking
- [View Counters](#2025-10-04---view-counter-ui-redesign-with-prominent-badge-display) - Eye-catching badge display on all pages
- [Content Security Policy](#2025-10-04---content-security-policy-strict-dynamic-implementation) - Enhanced security with strict-dynamic

**Platform Improvements:**
- [Trending Page Fix](#2025-10-04---trending-page-infinite-loading-fix-with-isr) - ISR configuration fixes
- [Submit Form](#2025-10-04---submit-form-github-api-elimination) - Zero-API GitHub integration
- [CI Optimization](#2025-10-04---github-actions-ci-optimization-for-community-contributors) - Faster community PRs

**Community:**
- [Reddit MCP Server](#2025-10-04---reddit-mcp-server-community-contribution) - Browse Reddit from Claude

[View All Updates ↓](#2025-10-04---llmstxt-complete-content-generation-for-ai-discovery)

---

## 2025-10-04 - LLMs.txt Complete Content Generation for AI Discovery

**TL;DR:** All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption.

### What Changed

Implemented production-grade llms.txt generation system following the [llmstxt.org specification](https://llmstxt.org) (Oct 2025 standards). Each content item now exports ALL structured fields to AI-friendly plain text format with zero truncation, PII sanitization, and type-safe content building.

### Added

- **Type-Safe Rich Content Builder** (`src/lib/llms-txt/content-builder.ts`)
  - Extracts ALL fields from 6 content schemas (MCP, Agent, Hook, Command, Rule, Statusline)
  - Formats installation instructions (Claude Desktop + Claude Code)
  - Formats configurations (MCP servers, hook scripts, statusline settings)
  - Includes security best practices, troubleshooting guides, and usage examples
  - No `any` types - fully type-safe with proper narrowing

- **llms.txt Routes** with ISR (600s revalidation)
  - `/[category]/[slug]/llms.txt` - Individual item details (168 pages)
  - `/[category]/llms.txt` - Category listings (6 categories)
  - `/collections/[slug]/llms.txt` - Collection details
  - `/guides/[...slug]/llms.txt` - Guide content
  - `/llms.txt` - Site-wide index

- **PII Protection** (`src/lib/llms-txt/content-sanitizer.ts`)
  - Removes emails, phone numbers, IP addresses, API keys, SSNs, credit cards
  - Whitelists example domains (example.com, localhost, 127.0.0.1)
  - Fixed regex global flag bug causing alternating detection results

### Changed

- **Removed ALL truncation** from llms.txt schema and routes
  - `llmsTxtItemSchema`: Removed artificial 200/1000 char limits on title/description
  - Collections route: Uses `content` field (unlimited) instead of `description` (1000 chars)
  - Item detail route: Includes full rich content via `buildRichContent()`

- **Content Coverage**
  - BEFORE: ~5% of page content (1-sentence description only)
  - AFTER: 100% of page content (15x improvement)
  - MCP servers now include full configuration examples, environment variables, installation steps
  - Hooks include complete script content (up to 1MB)
  - All items include features, use cases, requirements, troubleshooting, examples

### Technical Implementation

**Type-Safe Content Extraction**:
```typescript
export type ContentItem = McpContent | AgentContent | HookContent |
                          CommandContent | RuleContent | StatuslineContent;

export function buildRichContent(item: ContentItem): string {
  const sections: string[] = [];

  // 1. Features, 2. Use Cases, 3. Installation
  // 4. Requirements, 5. Configuration, 6. Security
  // 7. Troubleshooting, 8. Examples, 9. Technical Details, 10. Preview

  return sections.filter(s => s.length > 0).join('\n\n');
}
```

**Category-Specific Formatting**:
- MCP: Server configs, transport settings (HTTP/SSE), authentication requirements
- Hooks: Hook configuration + actual script content (critical for implementation)
- Statuslines: Format, refresh interval, position, color scheme
- Agents/Commands/Rules: Temperature, max tokens, system prompts

**Static Generation**:
- All 168 item pages pre-rendered at build time via `generateStaticParams()`
- ISR revalidation every 600 seconds for content updates
- Production-optimized with Next.js 15.5.4 App Router

### Impact

- **AI Tool Discovery**: Claude Code, AI search engines, and LLM tools can now discover and understand ALL content
- **SEO Enhancement**: Full-text indexing by AI search engines (Perplexity, ChatGPT Search, Google AI Overview)
- **Developer Experience**: Complete installation/configuration examples immediately accessible to AI assistants
- **Citation Quality**: AI tools can cite specific features, troubleshooting steps, and usage examples
- **Production-Ready**: Type-safe, PII-protected, properly formatted for LLM consumption

### For Contributors

All content automatically generates llms.txt routes. No special configuration needed. The system extracts ALL available fields from your content schemas.

**Example URLs**:
- Item: `/mcp/airtable-mcp-server/llms.txt`
- Category: `/mcp/llms.txt`
- Collection: `/collections/essential-mcp-servers/llms.txt`
- Site Index: `/llms.txt`

### Compliance

Follows llmstxt.org specification (Oct 2025 standards):
- Plain text format (UTF-8)
- Structured sections with clear headers
- No artificial length limits (AI consumption priority)
- Canonical URLs included
- PII sanitization applied
- Proper cache headers (`max-age=600, s-maxage=600, stale-while-revalidate=3600`)

---

## 2025-10-04 - SEO Title Optimization System with Automated Enhancement

**TL;DR:** Optimized 59 page titles with automated "for Claude" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management.

### What Changed

Implemented dual-title metadata system allowing separate SEO-optimized titles (`seoTitle`) and user-facing headings (`title`). Created automated enhancement utilities that intelligently add "for Claude" branding while respecting category-specific character budgets (23-31 available chars depending on suffix length).

### Added

- `seoTitle` optional field to all content schemas (agents, mcp, rules, commands, hooks, statuslines, collections, guides)
- Build pipeline support: `seoTitle` flows from source files → static API → page metadata
- Developer utilities:
  - `npm run validate:titles` - Check all page titles against 60-char limit
  - `npm run optimize:titles:dry` - Preview automated enhancements
  - `npm run optimize:titles` - Apply enhancements to source files
- `src/lib/seo/title-enhancer.ts` - Smart slug-to-title conversion with acronym/brand handling
- `src/lib/config/seo-config.ts` - Centralized SEO constants and character budgets

### Changed

- Enhanced 59 content files (35.1% of catalog) with optimized `seoTitle` fields:
  - MCP servers: 34/40 (85%) - "GitHub MCP Server for Claude"
  - Commands: 12/12 (100%) - "Debug Command for Claude"
  - Rules: 6/11 (54.5%)
  - Hooks: 6/60 (10%)
  - Agents: 1/10 (10%)
- Updated `scripts/verify-all-titles.ts` to single-line compact output format
- Added `seoTitle` to metadata extraction in `build-category-config.ts`

### Technical Implementation

**Character Budget per Category**:
- Agents: 28 chars | MCP: 31 chars (most space) | Rules: 29 chars
- Commands: 26 chars | Hooks: 29 chars | Statuslines: 23 chars | Collections: 23 chars

**Enhancement Logic**:
```typescript
// Automated "for Claude" suffix with slug fallback
const baseTitle = item.title || item.name || slugToTitle(item.slug);
if (' for Claude'.length <= availableSpace) {
  return `${baseTitle} for Claude`;
}
```

**Slug Normalization** - Handles acronyms (API, MCP, AWS, SQL) and brand names (GitHub, PostgreSQL, MongoDB)

### Impact

- **Search Visibility**: 59 pages now have keyword-rich titles optimized for Google/AI search
- **Brand Consistency**: Unified "for Claude" pattern across MCP servers and commands
- **Developer Experience**: On-demand validation and enhancement tools reduce manual work
- **Quality Assurance**: All 168 pages verified under 60-character limit

### For Contributors

When adding new content, optionally include `seoTitle` for SEO optimization:

```json
{
  "slug": "example-server",
  "title": "Example Server - Long Descriptive Name",
  "seoTitle": "Example Server for Claude"
}
```

Run `npm run validate:titles` before submitting to verify character limits.

---

## 2025-10-04 - Production-Hardened Trending Algorithm with Security & Performance Optimizations

**TL;DR:** Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations.

### What Changed

The trending tab uses a production-grade growth rate algorithm with security hardening and performance optimizations. Content gaining momentum fast (high percentage growth) ranks higher than content with simply more total views.

### Security Improvements

- **UTC normalization**: All date calculations use UTC to prevent timezone-based data corruption across Vercel edge regions
- **Input validation**: Redis responses validated with `Math.max(0, Number(value))` to prevent negative/invalid values
- **Atomic operations**: Redis pipeline with `EXPIRE NX` flag prevents race conditions on daily key TTL
- **Type safety**: Zod schemas with `.describe()` for JSON Schema compatibility and runtime validation

### Performance Optimizations

- **Batch MGET**: 3 parallel queries (today/yesterday/total) ~10-20% faster than pipeline
- **Smart TTL**: `EXPIRE NX` only sets TTL on first increment, preventing daily TTL refresh
- **UTC calculations**: Eliminates cross-timezone edge function inconsistencies

### Technical Implementation

- **Daily snapshots**: `views:daily:${category}:${slug}:YYYY-MM-DD` Redis keys (UTC dates)
- **Growth formula**: `(today_views - yesterday_views) / yesterday_views * 100`
- **Cold start boost**: New content with first views gets 100% growth rate
- **Smart tie-breakers**: Growth rate → Total views → Static popularity
- **Auto-expiry**: 7-day TTL with `NX` flag prevents unbounded storage

```typescript
// UTC-normalized date calculation (prevents timezone bugs)
const nowUtc = new Date();
const todayStr = nowUtc.toISOString().split('T')[0];

// Input validation (prevents negative/invalid values)
const todayCount = Math.max(0, Number(todayViews[key]) || 0);

// Atomic Redis operations (prevents race conditions)
pipeline.expire(dailyKey, 604800, 'NX'); // Only set if key doesn't have TTL
```

### Documentation

- **TSDoc**: Comprehensive documentation with `@param`, `@returns`, `@example`, `@remarks`
- **Zod schemas**: `trendingContentItemSchema` and `trendingOptionsSchema` with `.describe()` metadata
- **Type annotations**: All interfaces properly documented for IDE intellisense

### Impact

- **Security**: No timezone-based data corruption across global edge deployments
- **Reliability**: Input validation prevents invalid Redis data from breaking calculations
- **Performance**: <100ms Redis queries for 200+ items with atomic operations
- **Users**: Discover new popular content on [trending page](https://claudepro.directory/trending) within 24 hours with accurate growth metrics

### Added

- Redis `getDailyViewCounts()` batch method with MGET optimization
- Daily view tracking in `incrementView()` with UTC timestamps
- Growth rate calculation in `getTrendingContent()` with input validation
- Zod schemas for runtime type safety
- Comprehensive TSDoc documentation

### Changed

- **Trending tab**: Now shows highest 24h growth rate (velocity-based) with UTC normalization
- **Popular tab**: Continues showing all-time view counts (cumulative-based)
- View tracking uses Redis pipeline for atomic operations
- All date calculations use UTC instead of local timezone

### Fixed

- **Timezone bug**: Date calculations now use UTC to prevent inconsistencies across regions
- **Race condition**: Daily key TTL only set once using `EXPIRE NX` flag
- **Invalid data**: All Redis responses validated before calculations

### Site-Wide Implementation

- **Homepage enrichment**: All 7 content categories (agents, mcp, rules, commands, hooks, statuslines, collections) enriched with Redis view counts
- **Category pages**: Dynamic `[category]` route enriches items before rendering
- **Guides pages**: MDX-based guides (/guides/tutorials, etc.) now display view counters with compound slug handling
- **ISR revalidation**: 5-minute cache (`revalidate = 300`) for fresh view counts across all pages
- **Helper function**: `statsRedis.enrichWithViewCounts()` for reusable batch view count merging
- **Performance**: 7 parallel MGET calls on homepage (~15-25ms), 1 MGET per category page (~10-15ms)

### Guides Integration

- Extended view counters to all guides pages (/guides, /guides/tutorials, detail pages)
- Handles compound slugs (`tutorials/desktop-mcp-setup`) with prefix stripping for Redis compatibility
- Components updated: EnhancedGuidesPage, CategoryGuidesPage with Eye icon badges
- Schema: Added `viewCount` to guideItemWithCategorySchema

### Related Changes

- [View Counter UI Redesign](#2025-10-04---view-counter-ui-redesign-with-prominent-badge-display)
- [Trending Page ISR & Redis Fixes](#2025-10-04---trending-page-infinite-loading-fix-with-isr)

---

## 2025-10-04 - View Counter UI Redesign with Prominent Badge Display

**TL;DR:** View counts now appear as eye-catching badges on config cards instead of plain text.

### What Changed

Redesigned the view counter display to be more prominent and visually appealing. View counts now appear as primary-colored badges positioned on the bottom-right of config cards with an Eye icon.

### Visual Design

- **Color scheme**: Primary accent (`bg-primary/10 text-primary border-primary/20`)
- **Position**: Bottom-right corner, aligned with action buttons
- **Icon**: Eye icon (3.5x3.5) for instant recognition
- **Hover effect**: Subtle background color change (`hover:bg-primary/15`)
- **Typography**: Medium weight for emphasis

### Implementation

```tsx
<Badge variant="secondary" className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary">
  <Eye className="h-3.5 w-3.5" />
  <span className="text-xs">{formatViewCount(viewCount)}</span>
</Badge>
```

### Added

- `formatViewCount()` utility with K/M notation (1234 → "1.2K", 1500000 → "1.5M")
- `viewCount` prop to UnifiedDetailPage and DetailMetadata components
- View count fetching in detail page routes

### Changed

- Moved view counter from inline text to standalone badge component
- Falls back to "X% popular" text when Redis data unavailable

### For Users

See view counts displayed prominently on all config cards across [AI Agents](https://claudepro.directory/agents), [MCP Servers](https://claudepro.directory/mcp), and other category pages.

### Related Changes

- [Production-Hardened Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations)

---

## 2025-10-04 - Trending Page Infinite Loading Fix with ISR

**TL;DR:** Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation.

### What Was Broken

The trending page used `export const dynamic = 'force-static'` which froze data at build time when Redis was empty. Since Redis only accumulates views after deployment, build-time static generation captured zero data, causing infinite loading states.

### Root Cause Analysis

1. **Static generation**: Page rendered once at build time with empty Redis
2. **No revalidation**: `force-static` prevented refreshing with new data
3. **Wrong Redis check**: `isEnabled()` returned true in fallback mode, blocking fallback logic
4. **Duplicate fetching**: Content fetched twice (trending data + total count separately)

### Solution

- **ISR configuration**: Changed to `export const revalidate = 300` (5-minute refresh)
- **Redis check fix**: Created `isConnected()` method, use instead of `isEnabled()`
- **Performance**: Consolidated duplicate fetching to single Promise.all()

### Fixed

- Infinite loading state on trending page
- Empty tabs due to `isEnabled()` returning true in fallback mode
- Duplicate content fetching (now single consolidated fetch)

### Added

- `statsRedis.isConnected()` method for accurate Redis availability check
- `/trending/loading.tsx` using CategoryLoading factory pattern

### Changed

- Trending page now uses ISR (5-minute revalidation) instead of force-static
- Redis availability check properly detects fallback mode

### Technical Details

```typescript
// Before: Incorrect check (returns true in fallback mode)
if (!statsRedis.isEnabled()) { /* fallback */ }

// After: Correct check (only true when actually connected)
if (!statsRedis.isConnected()) { /* fallback */ }
```

### For Users

The [trending page](https://claudepro.directory/trending) now loads instantly with accurate data refreshed every 5 minutes.

### Related Changes

- [Production-Hardened Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations)

---

## 2025-10-04 - Content Security Policy Strict-Dynamic Implementation

**TL;DR:** Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers.

### What Changed

Added `'strict-dynamic'` directive to Content Security Policy configuration. This allows nonce-based scripts to dynamically load additional scripts (required for React hydration and third-party analytics).

### Fixed

- **Analytics**: Umami analytics script now loads correctly with CSP nonce
- **View tracking**: `trackView()` server actions no longer blocked by CSP
- **React hydration**: Client-side JavaScript execution now works properly
- **Font loading**: Fixed CSP restrictions blocking web fonts
- **Next.js chunks**: Dynamic chunk loading no longer causes `unsafe-eval` errors

### Added

- `'strict-dynamic'` directive to CSP configuration
- Nonce extraction and application in UmamiScript component
- CSP nonces to all JSON-LD structured data components

### Changed

- Umami script loading strategy: `lazyOnload` → `afterInteractive` (better nonce compatibility)
- Fixed misleading comments claiming Nosecone includes `strict-dynamic` by default

### Technical Details

```typescript
// CSP now allows nonce-based scripts to load additional scripts
Content-Security-Policy: script-src 'nonce-xyz123' 'strict-dynamic'
```

**Impact**: View tracking analytics now work correctly across the site. See live stats on the [trending page](https://claudepro.directory/trending).

---

## 2025-10-04 - Reddit MCP Server Community Contribution

**TL;DR:** Added reddit-mcp-buddy server for browsing Reddit directly from Claude.

### Added

- **MCP Server**: reddit-mcp-buddy
  - Browse Reddit posts and comments
  - Search posts by keyword
  - Analyze user activity
  - Zero API keys required
  - Thanks to @karanb192 for the contribution!

### Fixed

- Updated troubleshooting field to match MCP schema (object array with issue/solution properties)

### For Users

Browse and discover [MCP Servers](https://claudepro.directory/mcp) including the new Reddit integration for Claude Desktop.

---

## 2025-10-04 - Submit Form GitHub API Elimination

**TL;DR:** Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets).

### What Changed

Completely refactored the [submission flow](https://claudepro.directory/submit) to eliminate all GitHub API dependencies. Users now fill the form and get redirected to GitHub with a pre-filled issue they can review before submitting.

### Architecture Improvements

- **Zero secrets**: No GitHub tokens, no environment variables
- **Zero rate limits**: Direct URL navigation instead of API calls
- **Better UX**: Users can review/edit before submission
- **More secure**: Hardcoded repository configuration prevents tampering

### Implementation

New flow: Form → Pre-fill GitHub URL → Redirect → User reviews → Submit

```typescript
// Production-grade GitHub issue URL generator
const url = new URL(`https://github.com/${owner}/${repo}/issues/new`);
url.searchParams.set('title', title);
url.searchParams.set('body', body);
window.open(url.toString(), '_blank');
```

### Added

- `/src/lib/utils/github-issue-url.ts` - URL generator for GitHub issues
- Client-side form validation with Zod schemas
- Popup blocker detection with manual fallback link

### Removed

- **416 lines of dead code**:
  - `/src/lib/services/github.service.ts` (275 lines)
  - `/src/app/actions/submit-config.ts` (66 lines)
  - 5 unused GitHub API schemas (~60 lines)
  - GitHub environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
  - `githubConfig` export and `hasGitHubConfig()` function

### Changed

- Form content types now exclude 'guides': `agents | mcp | rules | commands | hooks | statuslines`

### For Users

[Submit your configurations](https://claudepro.directory/submit) faster with simplified GitHub integration - no account required until final submission.

---

## 2025-10-04 - GitHub Actions CI Optimization for Community Contributors

**TL;DR:** Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR.

### What Changed

Optimized GitHub Actions workflows to skip intensive jobs (CI, security scans, Lighthouse, bundle analysis) for community content contributions. Only essential workflows (labeling, validation) run for `content/**/*.json` changes.

### Performance Impact

- **Before**: 10 workflow jobs (~15-20 minutes)
- **After**: 2 workflow jobs (~3-5 minutes)
- **Savings**: ~10-15 minutes per community PR

### Added

- **Automation**: Bundle Analysis workflow (HashiCorp's nextjs-bundle-analysis)
- **Automation**: Lighthouse CI workflow (Core Web Vitals monitoring)
- **Automation**: PR Labeler workflow (19 intelligent labels)
- **Community labels**: 7 contribution types (`community-mcp`, `community-hooks`, etc.)
- **Thresholds**: Lighthouse 90+ performance, 95+ accessibility/SEO

### Changed

- CI, Security, Lighthouse, Bundle Analysis now skip on `content/**/*.json` changes
- Moved `.lighthouserc.json` to `config/tools/lighthouserc.json`

### Fixed

- "Can't find action.yml" errors: Added explicit `actions/checkout@v5` before composite actions
- CI and Security workflows now properly check out repository

---

## 2025-10-03 - Nosecone CSP Migration & Navigation Menu Fixes

**TL;DR:** Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering.

### Added

- Enhanced error boundary logging with error digest tracking
- Comprehensive error context in Vercel logs (user agent, URL, timestamp)

### Changed

- **Security**: Implemented Nosecone nonce-based CSP with `strict-dynamic`
- **Performance**: Migrated from manual CSP to Nosecone defaults extension
- **UI**: Fixed navigation menu centering on xl/2xl screens (reduced excessive gap)

### Fixed

- CSP violations blocking Next.js chunk loading (`unsafe-eval` errors)
- Font loading errors caused by CSP restrictions
- Navigation menu appearing off-center on large screens

### Removed

- Dead code: Inactive ISR `revalidate` exports from 16 files (superseded by dynamic rendering)

---

## Earlier Updates

Previous changes were tracked in git commit history. This changelog starts from October 2025.
