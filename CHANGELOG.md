# Changelog

All notable changes to Claude Pro Directory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Quick Navigation

**Latest Features:**

- [Automated Submission System](#2025-10-06---automated-submission-tracking-and-analytics) - Database-backed submission tracking with analytics
- [User Authentication](#2025-10-06---user-authentication-and-account-management) - Complete auth system with profiles and settings
- [Sponsorship Analytics](#2025-10-06---sponsorship-analytics-dashboard) - Detailed metrics for sponsored content
- [Submit Page Enhancements](#2025-10-06---submit-page-sidebar-and-statistics) - Stats, tips, and templates for contributors
- [Newsletter Integration](#2025-10-05---resend-newsletter-integration-with-sticky-footer-bar) - Email newsletter signups via Resend
- [Infinite Scroll Fix](#2025-10-05---homepage-infinite-scroll-bug-fix) - Fixed 60-item limit on homepage

**Platform Improvements:**

- [Email Templates](#2025-10-06---email-templates-infrastructure) - React Email templates for transactional emails
- [LLMs.txt AI Optimization](#2025-10-04---llmstxt-complete-content-generation-for-ai-discovery) - Complete page content for AI/LLM consumption
- [SEO Title Optimization](#2025-10-04---seo-title-optimization-system-with-automated-enhancement) - Automated title enhancement for 168+ pages
- [Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations) - Real-time growth velocity tracking
- [Trending Page Fix](#2025-10-04---trending-page-infinite-loading-fix-with-isr) - ISR configuration fixes
- [Submit Form](#2025-10-04---submit-form-github-api-elimination) - Zero-API GitHub integration
- [CI Optimization](#2025-10-04---github-actions-ci-optimization-for-community-contributors) - Faster community PRs

**Community:**

- [Reddit MCP Server](#2025-10-04---reddit-mcp-server-community-contribution) - Browse Reddit from Claude

[View All Updates ↓](#2025-10-06---automated-submission-tracking-and-analytics)

---

## 2025-10-06 - Automated Submission Tracking and Analytics

**TL;DR:** Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management.

### What Changed

Added comprehensive submission tracking infrastructure using Supabase database with server actions for statistics, recent submissions display, and top contributors leaderboard.

### Added

- **Submission Tracking Database** (`submissions` table in Supabase)
  - Tracks all community submissions with status (pending, merged, rejected)
  - Stores submission metadata (content type, slug, GitHub URL, submitter info)
  - Indexes on user_id, status, and created_at for performant queries
  - Foreign key relationships with users table

- **Submission Statistics Actions** (`src/lib/actions/submission-stats-actions.ts`)
  - `getSubmissionStats()` - Overall statistics (total, merged, pending, rejection rate)
  - `getRecentMergedSubmissions()` - Latest 5 merged submissions with user info
  - `getTopContributors()` - Leaderboard of top 5 contributors by merged count
  - Type-safe server actions with Zod validation
  - Rate-limited to prevent abuse

- **Sidebar Components** for submit page
  - **SubmitStatsCard** - Real-time submission statistics dashboard
  - **RecentSubmissionsCard** - Recent merged submissions with avatars
  - **TopContributorsCard** - Contributor leaderboard with badges
  - **TipsCard** - Submission guidelines and best practices
  - **TemplateSelector** - Quick-start templates for common content types
  - **DuplicateWarning** - Real-time duplicate name detection

### Changed

- Submit page layout now includes comprehensive sidebar with statistics and tips
- Submission form accepts plaintext input instead of manual JSON formatting
- Improved content formatting logic for GitHub submissions
- Enhanced user experience with template selection and duplicate warnings

### Technical Details

**Database Schema:**
- `submissions.user_id` → Foreign key to `users.id`
- `submissions.status` → ENUM ('pending', 'merged', 'rejected')
- `submissions.content_type` → Submission category (agents, mcp, rules, etc.)
- Composite index on (status, created_at DESC) for efficient filtering

**Files Added:**
- `src/components/submit/sidebar/*.tsx` - 6 new sidebar components
- `src/lib/actions/submission-stats-actions.ts` - Statistics server actions
- `src/components/submit/template-selector.tsx` - Template selection UI
- `src/components/submit/duplicate-warning.tsx` - Duplicate detection

---

## 2025-10-06 - User Authentication and Account Management

**TL;DR:** Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks).

### What Changed

Implemented full-featured authentication system enabling users to create accounts, manage profiles, bookmark content, and follow other users.

### Added

- **Supabase Authentication Integration**
  - Email/password authentication via Supabase Auth
  - Server-side and client-side auth helpers
  - Protected routes with middleware
  - Session management with cookie-based tokens

- **User Profile System** (`/u/[slug]` routes)
  - Public user profiles with customizable slugs
  - Profile fields: name, bio, work, website, social links
  - Avatar and hero image support
  - Privacy controls (public/private profiles)
  - Follow/unfollow functionality

- **Account Management Pages**
  - `/account` - Account dashboard and navigation
  - `/account/settings` - Profile settings and preferences
  - `/account/bookmarks` - Saved content collections
  - `/account/following` - Users you follow
  - `/account/sponsorships` - Sponsorship management (for sponsors)

- **Social Features**
  - Followers table with bidirectional relationships
  - Bookmarks with notes and organization by content type
  - Follow notifications (configurable)
  - User activity tracking

### Changed

- Navigation includes login/logout and account links
- Content pages show bookmark and follow actions when authenticated
- Submit forms associate submissions with authenticated users
- Profile slugs auto-generated from usernames

### Security

- Row Level Security (RLS) policies on all user tables
- Users can only edit their own profiles
- Public profiles visible to everyone, private profiles owner-only
- Server-side auth validation on all protected routes

---

## 2025-10-06 - Sponsorship Analytics Dashboard

**TL;DR:** Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time.

### What Changed

Implemented comprehensive analytics page for sponsors to track the performance of their sponsored content with detailed metrics and insights.

### Added

- **Sponsorship Analytics Page** (`/account/sponsorships/[id]/analytics`)
  - Real-time view and click tracking
  - Click-through rate (CTR) calculation
  - Days active and performance trends
  - Sponsorship tier display (featured, promoted, spotlight)
  - Start/end date tracking
  - Active/inactive status indicators

- **Performance Metrics**
  - Total views count with trend indicators
  - Total clicks with CTR percentage
  - Days active calculation
  - Cost-per-click (CPC) insights
  - View-to-click conversion tracking

### UI Components

- Metric cards with icon badges (Eye, MousePointer, TrendingUp)
- Sponsored badges with tier-specific styling
- Grid layout for sponsorship details
- Responsive design for mobile and desktop

### Technical Implementation

**Data Structure:**
- Tracks content_type, content_id, tier, dates, and status
- Links to users table for sponsor identification
- Integration with view tracking (Redis) for real-time metrics

---

## 2025-10-06 - Submit Page Sidebar and Statistics

**TL;DR:** Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips.

### What Changed

Transformed the submit page into a community hub by adding sidebar components that display submission statistics, guide contributors, and showcase community activity.

### Added

- **Stats Dashboard** - Live submission metrics
  - Total submissions count
  - Merged submissions (approval rate)
  - Pending submissions
  - Rejection rate percentage

- **Recent Submissions** - Latest 5 merged contributions
  - Submitter avatars and names
  - Submission titles and content types
  - Time ago formatting
  - Links to contributor profiles

- **Top Contributors** - Leaderboard of top 5 submitters
  - Ranked by merged submission count
  - User avatars and profile links
  - Badge indicators for top performers

- **Tips & Guidelines** - Best practices for submissions
  - Clear naming conventions
  - Comprehensive descriptions
  - Testing requirements
  - Documentation expectations

- **Template Selector** - Quick-start templates
  - Pre-filled forms for common content types
  - Reduces errors and saves time
  - Ensures consistent formatting

### UI/UX Improvements

- Two-column layout (form + sidebar)
- Responsive design (sidebar moves below form on mobile)
- Loading states for async data
  - Skeleton loaders for statistics
  - Shimmer effects for contributor cards
- Empty states when no data available

---

## 2025-10-06 - Email Templates Infrastructure

**TL;DR:** Integrated React Email for type-safe, production-ready transactional email templates with development preview server.

### What Changed

Added email template infrastructure using React Email, enabling the platform to send beautifully designed transactional emails with a development preview environment.

### Added

- **React Email Integration**
  - `@react-email/components` for email component primitives
  - `@react-email/render` for server-side email generation
  - Development server: `npm run email:dev` (port 3001)
  - Email templates directory: `src/emails/`

- **Email Templates** (Foundation for future features)
  - Base layout with branding and styling
  - Responsive design optimized for all email clients
  - Plain text fallbacks for accessibility
  - Consistent typography and color scheme

### Development Workflow

- **Preview Server** - Live preview of email templates
  - Hot-reload on template changes
  - Test rendering across different email clients
  - Access at `http://localhost:3001`

- **Type Safety**
  - TypeScript support for all email components
  - Props validation with JSX type checking
  - Compile-time error detection

### Technical Details

**Files Added:**
- `src/emails/` - Email templates directory
- Email development dependencies in package.json
- npm script: `email:dev` for preview server

**Use Cases:**
- Welcome emails for new users
- Submission notifications
- Newsletter digests
- Sponsorship confirmations
- Follow notifications

---

## 2025-10-05 - Resend Newsletter Integration with Sticky Footer Bar

**TL;DR:** Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage.

### What Changed

Added complete newsletter subscription infrastructure with Resend integration, featuring a non-intrusive sticky footer bar that appears after 3 seconds, rate-limited signup actions (5 requests per 5 minutes), and fixed homepage infinite scroll bug that was capping at 60 items.

### Added

- **Resend Email Service** (`src/lib/services/resend.service.ts`)
  - Type-safe Resend API integration with `resend` npm package
  - Graceful degradation when API keys missing (logs warnings)
  - Idempotent operations (duplicate signups return success)
  - Production error handling with structured logging
  - Environment validation for `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`

- **Newsletter Server Action** (`src/lib/actions/newsletter-signup.ts`)
  - Rate limited: 5 signups per 5 minutes per IP (prevents spam)
  - Zod schema validation with RFC 5322 email format
  - Source tracking (footer, homepage, modal, content_page, inline)
  - Referrer tracking for analytics
  - Built on `next-safe-action` with centralized error handling

- **Newsletter Form Component** (`src/components/shared/newsletter-form.tsx`)
  - Reusable form with React 19 useTransition for pending states
  - Sonner toast notifications for success/error feedback
  - Accessible with ARIA labels
  - Email validation and error handling
  - Progressive enhancement (works without JS)

- **Sticky Footer Newsletter Bar** (`src/components/shared/footer-newsletter-bar.tsx`)
  - Appears after 3-second delay (non-intrusive UX)
  - localStorage persistence for dismissal state
  - Glassmorphism design: `bg-black/80 backdrop-blur-xl`
  - Responsive layouts (desktop/mobile optimized)
  - Slide-up animation on mount
  - Fully accessible with keyboard navigation

- **Newsletter Schema** (`src/lib/schemas/newsletter.schema.ts`)
  - RFC 5322 compliant email validation
  - Source tracking enum (5 sources)
  - Referrer URL validation (max 500 chars)
  - Auto-lowercase and trim transformation

### Fixed

- **Homepage Infinite Scroll Bug**
  - Fixed 60-item cap caused by dual state management in `InfiniteScrollContainer`
  - Removed local `allItems` state - component now fully controlled by parent
  - Fixed useEffect dependency array causing pagination resets
  - Now properly loads all content items with automatic infinite scroll
  - Removed "Load More" button in favor of seamless scroll loading

### Changed

- **Environment Configuration**
  - Added `RESEND_API_KEY` to server env schema
  - Added `RESEND_AUDIENCE_ID` to server env schema
  - Both optional in development, required in production for newsletter features

- **Infinite Scroll Container** (`src/components/shared/infinite-scroll-container.tsx`)
  - Removed stateful `allItems` - now pure presentational component
  - Fixed race condition between `loadMore` and `useEffect`
  - Improved performance by eliminating unnecessary state updates
  - Better separation of concerns (parent manages state)

- **Homepage Component** (`src/components/features/home/index.tsx`)
  - Fixed useEffect to only reset pagination on tab/search changes
  - Added biome-ignore for intentional dependency optimization
  - Prevents pagination reset on every render (performance improvement)

### Technical Details

**Email Infrastructure:**

- **Domain:** `mail.claudepro.directory` (subdomain for deliverability)
- **Integration:** Resend <> Vercel Marketplace direct integration
- **DNS:** Managed via Resend <> Cloudflare integration
- **From Address:** `hello@mail.claudepro.directory`

**Rate Limiting:**

- Newsletter signups: 5 requests per 300 seconds (5 minutes) per IP
- Stricter than default (100 req/60s) to prevent newsletter spam
- Allows legitimate retries while blocking abuse

**Dependencies Added:**

- `resend` - Official Resend SDK for email API
- `@react-email/render` - Email template rendering (Resend dependency)

**Files Modified:**

- `src/app/layout.tsx` - Added FooterNewsletterBar component
- `src/components/features/home/tabs-section.tsx` - Set `showLoadMoreButton={false}`
- `src/components/shared/infinite-scroll-container.tsx` - Removed dual state management
- `src/components/features/home/index.tsx` - Fixed useEffect dependencies
- `src/lib/schemas/env.schema.ts` - Added Resend env vars

**Files Created:**

- `src/lib/schemas/newsletter.schema.ts`
- `src/lib/services/resend.service.ts`
- `src/lib/actions/newsletter-signup.ts`
- `src/components/shared/newsletter-form.tsx`
- `src/components/shared/footer-newsletter-bar.tsx`

---

## 2025-10-05 - Homepage Infinite Scroll Bug Fix

**TL;DR:** Fixed critical bug where homepage "All" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component.

### Fixed

- **60-Item Pagination Cap**
  - Root cause: Dual state management creating race condition
  - InfiniteScrollContainer maintained local `allItems` state
  - Parent's useEffect was resetting state on every `filteredResults` reference change
  - Solution: Made InfiniteScrollContainer fully controlled (stateless)

- **State Synchronization**
  - Removed `allItems` state from InfiniteScrollContainer
  - Component now uses `items` prop directly (single source of truth)
  - Eliminated useEffect that was overwriting accumulated items
  - Fixed race condition between `loadMore` and `useEffect`

- **Pagination Reset Loop**
  - Changed useEffect dependency from `filteredResults` to `[activeTab, isSearching]`
  - Prevents reset when same data is re-filtered (array reference changes)
  - Only resets pagination when user actually changes tabs or search state
  - Added biome-ignore with detailed explanation for linter

### Changed

- **InfiniteScrollContainer Architecture**
  - Converted from stateful to fully controlled component
  - Parent component (`home/index.tsx`) now manages all state
  - Infinite scroll container just renders + triggers loading
  - Better separation of concerns and predictable behavior

- **Load More Button**
  - Set `showLoadMoreButton={false}` for seamless infinite scroll
  - Users now get automatic loading as they scroll
  - More modern UX (no manual clicking required)

**Files Modified:**

- `src/components/shared/infinite-scroll-container.tsx`
- `src/components/features/home/index.tsx`
- `src/components/features/home/tabs-section.tsx`

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

- **Markdown Export Features** (`src/lib/actions/markdown-actions.ts`)
  - Copy as Markdown: One-click clipboard copy with YAML frontmatter
  - Download Markdown: File download with full metadata and attribution
  - Rate limiting: 50 req/min (copy), 30 req/min (download)
  - Redis caching with 1-hour TTL for performance
  - Type-safe server actions with Zod validation

- **Analytics Integration** (`src/lib/analytics/events.config.ts`)
  - `COPY_MARKDOWN` event tracking with content metadata
  - `DOWNLOAD_MARKDOWN` event tracking with file size metrics
  - Integrated into CopyMarkdownButton and DownloadMarkdownButton components
  - Umami analytics for user interaction insights

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
export type ContentItem =
  | McpContent
  | AgentContent
  | HookContent
  | CommandContent
  | RuleContent
  | StatuslineContent;

export function buildRichContent(item: ContentItem): string {
  const sections: string[] = [];

  // 1. Features, 2. Use Cases, 3. Installation
  // 4. Requirements, 5. Configuration, 6. Security
  // 7. Troubleshooting, 8. Examples, 9. Technical Details, 10. Preview

  return sections.filter((s) => s.length > 0).join("\n\n");
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

**Validation & Quality Assurance**:

- Automated validation script (`scripts/validate-llmstxt.ts`) checks all 26+ llms.txt routes
- Validates markdown headers (`# Title`), metadata fields (`Title:`, `URL:`), category markers
- Cache versioning (v2) for breaking changes to ensure fresh content delivery
- All routes passing with 0 errors, 0 warnings

### Impact

- **AI Tool Discovery**: Claude Code, AI search engines, and LLM tools can now discover and understand ALL content
- **SEO Enhancement**: Full-text indexing by AI search engines (Perplexity, ChatGPT Search, Google AI Overview)
- **Developer Experience**: Complete installation/configuration examples immediately accessible to AI assistants
- **Content Portability**: One-click markdown export (copy & download) for offline use and documentation
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
if (" for Claude".length <= availableSpace) {
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
const todayStr = nowUtc.toISOString().split("T")[0];

// Input validation (prevents negative/invalid values)
const todayCount = Math.max(0, Number(todayViews[key]) || 0);

// Atomic Redis operations (prevents race conditions)
pipeline.expire(dailyKey, 604800, "NX"); // Only set if key doesn't have TTL
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
<Badge
  variant="secondary"
  className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary"
>
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
if (!statsRedis.isEnabled()) {
  /* fallback */
}

// After: Correct check (only true when actually connected)
if (!statsRedis.isConnected()) {
  /* fallback */
}
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
url.searchParams.set("title", title);
url.searchParams.set("body", body);
window.open(url.toString(), "_blank");
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
