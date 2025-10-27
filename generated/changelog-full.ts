/**
 * Auto-generated full content file
 * Category: Changelog
 * Generated: 2025-10-23T12:47:39.401Z
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { GuideContent } from '@/src/lib/schemas/content/guide.schema';

export const changelogFull: GuideContent[] = [
  {
    "slug": "2025-10-18-pattern-based-seo-metadata-architecture",
    "title": "Pattern-Based SEO Metadata Architecture",
    "description": "Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-18",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines.\n\n### What Changed\n\nReplaced legacy metadata registry system with enterprise-grade pattern-based architecture. Implemented 8 route patterns (HOMEPAGE, CATEGORY, CONTENT_DETAIL, USER_PROFILE, ACCOUNT, TOOL, STATIC, AUTH) with dedicated templates, automated route classification, and intelligent metadata generation. Removed 2,017 lines of dead code while adding consolidated validation tooling and git hook integration.\n\n### Added\n\n- **Pattern System** - 8 route patterns with template-driven metadata generation for all 41 routes\n- **Route Classifier** - Automated pattern detection with confidence scoring (0.0-1.0)\n- **Route Scanner** - Static analysis tool to discover all application routes without runtime overhead\n- **Metadata Templates** - Centralized templates with smart truncation/padding for SEO compliance\n- **Unified Validation** - New `validate:metadata` script consolidating title/description validation with pattern system integration\n- **October 2025 SEO Standards** - Title: 53-60 chars (keyword density), Description: 150-160 chars (AI-optimized), Keywords: 3-10 max\n\n### Changed\n\n- **Metadata Generation** - Migrated from METADATA_REGISTRY lookup to pattern-based templates\n- **Title Format** - Hyphen separators (-) instead of pipes (|) for 2025 SEO best practices\n- **Git Hooks** - Added metadata validation on pre-commit for SEO files (lefthook.yml)\n- **Validation Scripts** - Consolidated verify-titles.ts into validate-metadata.ts with route scanner integration\n\n### Removed\n\n- **Legacy Code Cleanup** - Removed 2,017 lines including METADATA_REGISTRY (1,627 lines), buildPageTitle(), buildContentTitle(), smartTruncate(), and TIER 2 registry lookup\n\n### Technical Details\n\n**Pattern Architecture:**\n- All routes classified into 8 patterns with confidence-based activation\n- Template functions receive context (route, params, item data) and generate type-safe metadata\n- Multi-tier padding system ensures descriptions always meet 150-160 char requirement\n- 100% pattern coverage verified via route scanner (41/41 routes)\n\n**SEO Optimization (October 2025):**\n- AI citation optimization (ChatGPT, Perplexity, Claude search)\n- Schema.org 29.3 compliance with server-side JSON-LD\n- Recency signals (dateModified) for fresh content\n- Year inclusion in descriptions for AI search queries\n\n**Files Added (5 new):**\n1. `src/lib/seo/metadata-templates.ts` - Template functions for 8 route patterns\n2. `src/lib/seo/route-classifier.ts` - Pattern detection with confidence scoring\n3. `src/lib/seo/route-scanner.ts` - Static route discovery tool\n4. `src/lib/seo/pattern-matcher.ts` - Context extraction utilities\n5. `scripts/validation/validate-metadata.ts` - Consolidated metadata validation\n\n**Files Modified (5 total):**\n1. `src/lib/seo/metadata-generator.ts` - Pattern-based generation (removed 234 lines)\n2. `src/lib/seo/metadata-registry.ts` - Types and utilities only (removed 1,783 lines)\n3. `src/lib/config/seo-config.ts` - Updated documentation\n4. `config/tools/lefthook.yml` - Added metadata validation hook\n5. `package.json` - Added validate:metadata and validate:metadata:quick commands\n\n**Performance & Security:**\n- ✅ Synchronous metadata generation (no Promise overhead, build-time optimization)\n- ✅ Type-safe with Zod validation throughout\n- ✅ 76.6% code reduction in metadata-registry.ts (2,328 → 545 lines)\n- ✅ 100% TypeScript strict mode compliance\n- ✅ Git hook validation prevents SEO regressions\n\n**Deployment:**\n- No database migrations required\n- No environment variables needed\n- TypeScript compilation verified - zero errors\n- All 41 routes tested and validated\n\nThis migration establishes a maintainable, scalable foundation for SEO metadata management with modern AI search optimization and enterprise-grade code quality.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Pattern-Based SEO Metadata Architecture",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Pattern System** - 8 route patterns with template-driven metadata generation for all 41 routes\n- **Route Classifier** - Automated pattern detection with confidence scoring (0.0-1.0)\n- **Route Scanner** - Static analysis tool to discover all application routes without runtime overhead\n- **Metadata Templates** - Centralized templates with smart truncation/padding for SEO compliance\n- **Unified Validation** - New `validate:metadata` script consolidating title/description validation with pattern system integration\n- **October 2025 SEO Standards** - Title: 53-60 chars (keyword density), Description: 150-160 chars (AI-optimized), Keywords: 3-10 max"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Metadata Generation** - Migrated from METADATA_REGISTRY lookup to pattern-based templates\n- **Title Format** - Hyphen separators (-) instead of pipes (|) for 2025 SEO best practices\n- **Git Hooks** - Added metadata validation on pre-commit for SEO files (lefthook.yml)\n- **Validation Scripts** - Consolidated verify-titles.ts into validate-metadata.ts with route scanner integration"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🗑️ Removed"
      },
      {
        "type": "text",
        "content": "- **Legacy Code Cleanup** - Removed 2,017 lines including METADATA_REGISTRY (1,627 lines), buildPageTitle(), buildContentTitle(), smartTruncate(), and TIER 2 registry lookup"
      }
    ]
  },
  {
    "slug": "2025-10-16-community-gamification-system-uiux-enhancements",
    "title": "Community Gamification System & UI/UX Enhancements",
    "description": "Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-16",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience.\n\n### What Changed\n\nAdded production-grade gamification infrastructure to drive community engagement through reputation scoring, achievement badges, and tier progression. The system features type-safe badge definitions, automated award criteria, featured badge showcase on user profiles, and real-time reputation tracking with visual breakdown. Complemented by three UX improvements: automatic \"NEW\" badges highlighting recent content, improved homepage freshness with newest-first featured sorting, and responsive card design optimizations for mobile/tablet devices.\n\n### Added\n\n- **Badge System Configuration** - Centralized badge registry with 5 categories (Community, Contribution, Achievement, Special, Milestone), 4 rarity levels (Common to Legendary), and extensible award criteria system\n- **Reputation System** - 6-tier progression system (Newcomer → Legend) with configurable point values for posts (10), votes (5), comments (2), submissions (20), reviews (5), bookmarks (3), and followers (1)\n- **Badge Award Criteria** - Type-safe criteria system supporting reputation thresholds, count-based achievements, activity streaks, special conditions, and composite multi-criteria badges\n- **User Profile Integration** - Public badge display with featured badge selection (max 5), reputation breakdown visualization, and tier progress indicators\n- **Badge Components** - `BadgeGrid` for showcase display, `BadgeNotification` for award toasts, `ReputationBreakdown` with progress bars and tier visualization\n- **Server Actions** - Authentication-protected actions for badge management: `getUserBadges`, `getFeaturedBadges`, `toggleBadgeFeatured`, `checkBadgeEligibility`, `getRecentlyEarnedBadges`\n- **Public Queries** - Unauthenticated functions for profile viewing: `getPublicUserBadges`, `userHasBadge`, badge registry queries\n- **Badge Repository** - Complete CRUD operations with Supabase integration: `findByUser`, `findFeaturedByUser`, `toggleFeatured`, `findRecentlyEarned`, `hasUserBadge`\n- **\"NEW\" Badge Feature** - Automatic badge display on content added within last 7 days across all preview cards (agents, rules, commands, skills, collections)\n- **Content Age Detection** - `isNewContent()` utility function with date validation and 0-7 day range checking\n- **Responsive Card Utilities** - Three new UI constants: `CARD_BADGE_CONTAINER`, `CARD_FOOTER_RESPONSIVE`, `CARD_METADATA_BADGES` for mobile-first layouts\n\n### Changed\n\n- **Homepage Featured Sorting** - Updated fallback algorithm to sort by newest content (`dateAdded DESC`) instead of alphabetical, improving homepage freshness\n- **User Profile Layout** - Redesigned activity sidebar with reputation breakdown as primary stat, added badge showcase section, removed redundant reputation display\n- **BaseCard Component** - Applied responsive utilities for mobile/tablet optimization: tags wrap at breakpoints, footer stacks vertically on mobile, metadata badges flex-wrap on small screens\n- **Safe Action Middleware** - Extended category enum to support future reputation/badge actions (structure prepared for expansion)\n\n### Fixed\n\n- **TypeScript Strict Mode** - Resolved 12 undefined access errors in `reputation.config.ts` with proper TypeScript guards for array access and optional values\n- **Optional Parameters** - Fixed badge action parameter handling with nullish coalescing for limit/offset defaults\n- **Repository Type Safety** - Added conditional option objects to avoid `exactOptionalPropertyTypes` violations in badge queries\n\n### Technical Details\n\n**Badge System Architecture:**\n\nThe badge system follows a configuration-driven approach with full type safety and Zod validation:\n\n```typescript\n// Badge definition example\n{\n  slug: 'first-post',\n  name: 'First Steps',\n  description: 'Created your first community post',\n  icon: '🎯',\n  category: 'community',\n  rarity: 'common',\n  criteria: {\n    type: 'count',\n    metric: 'posts',\n    minCount: 1,\n    description: 'Create 1 post'\n  },\n  autoAward: true\n}\n```\n\n**Reputation Tiers:**\n- **Newcomer** (0-49): Just getting started 🌱\n- **Contributor** (50-199): Active community member ⭐\n- **Regular** (200-499): Trusted contributor 💎\n- **Expert** (500-999): Community expert 🔥\n- **Master** (1000-2499): Master contributor 🏆\n- **Legend** (2500+): Legendary status 👑\n\n**Award Criteria Types:**\n- `ReputationCriteria`: Reach minimum reputation score\n- `CountCriteria`: Perform action X times (posts, comments, submissions, etc.)\n- `StreakCriteria`: Maintain daily/weekly activity streak\n- `SpecialCriteria`: Manual award or custom logic\n- `CompositeCriteria`: Multiple conditions with AND/OR logic\n\n**UI/UX Implementation:**\n\n**1. \"NEW\" Badge (0-7 Day Content):**\n```typescript\n// Utility function - production-grade validation\nexport function isNewContent(dateAdded?: string): boolean {\n  if (!dateAdded) return false;\n\n  const now = Date.now();\n  const added = new Date(dateAdded).getTime();\n  const daysOld = (now - added) / (1000 * 60 * 60 * 24);\n\n  return daysOld >= 0 && daysOld <= 7;\n}\n\n// Integration - reused existing NewBadge component\n{isNewContent(item.dateAdded) && <NewBadge variant=\"default\" />}\n```\n\n**2. Newest-First Featured Sorting:**\n```typescript\n// Updated fallback algorithm (featured.server.ts:538-544)\nconst additionalItems = rawData\n  .filter((item) => !trendingSlugs.has(item.slug))\n  .sort((a, b) => {\n    const dateA = new Date(a.dateAdded ?? '1970-01-01').getTime();\n    const dateB = new Date(b.dateAdded ?? '1970-01-01').getTime();\n    return dateB - dateA; // Newest first\n  })\n  .slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY - trendingItems.length);\n```\n\n**3. Responsive Card Design:**\n```typescript\n// Mobile-first utility classes (ui-constants.ts)\nCARD_BADGE_CONTAINER: 'flex flex-wrap gap-1 sm:gap-2 mb-4',\nCARD_FOOTER_RESPONSIVE: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',\nCARD_METADATA_BADGES: 'flex items-center gap-1 text-xs flex-wrap sm:flex-nowrap',\n\n// Responsive behavior:\n// Mobile (<640px): Vertical stack, tight spacing, wrapping badges\n// Tablet+ (≥640px): Horizontal layout, comfortable spacing, single-line badges\n```\n\n**Security & Performance:**\n- ✅ All badge actions use `authedAction` middleware with user authentication\n- ✅ Public queries validate input with Zod schemas (brandedId validation)\n- ✅ Repository methods return type-safe `RepositoryResult<T>` wrappers\n- ✅ Featured badge limit enforced (max 5 per user)\n- ✅ Badge ownership verified before toggle operations\n- ✅ Zero new components created - reused existing `NewBadge` component\n- ✅ Configuration-driven - all utilities centralized in `ui-constants.ts`\n- ✅ Tree-shakeable - only imported utilities included in bundle\n- ✅ TypeScript strict mode compliant with proper undefined guards\n\n**Database Schema:**\n- `user_badges` table: Links users to earned badges with featured status and award timestamp\n- Indexed on `user_id` and `badge_id` for performant queries\n- Foreign keys to `users` and `badges` tables with CASCADE deletion\n\n**Files Added (7 new):**\n1. `src/lib/config/badges.config.ts` - Badge registry with 20+ achievement definitions\n2. `src/lib/config/reputation.config.ts` - Reputation tiers, point values, helper functions\n3. `src/lib/actions/badges.actions.ts` - Server actions for badge management\n4. `src/lib/actions/reputation.actions.ts` - Server actions for reputation queries\n5. `src/lib/repositories/user-badge.repository.ts` - Badge database operations\n6. `src/components/features/badges/badge-grid.tsx` - Badge showcase component\n7. `src/components/features/badges/badge-notification.tsx` - Toast notifications for awards\n8. `src/components/features/reputation/reputation-breakdown.tsx` - Reputation visualization\n\n**Files Modified (8 total):**\n1. `src/lib/utils/content.utils.ts` - Added `isNewContent()` utility function\n2. `src/components/features/content/config-card.tsx` - Added NewBadge integration in renderTopBadges slot\n3. `src/lib/services/featured.server.ts` - Updated fallback sorting to newest-first (dateAdded DESC)\n4. `src/lib/ui-constants.ts` - Added 3 responsive card layout utilities\n5. `src/components/shared/base-card.tsx` - Applied responsive utilities (lines 286, 302, 327)\n6. `src/app/u/[slug]/page.tsx` - Integrated badge grid and reputation breakdown on user profiles\n7. `src/lib/actions/safe-action.ts` - Extended action category enum (structure preparation)\n8. `src/lib/repositories/user-badge.repository.ts` - Added badge query methods\n\n**Consolidation Wins:**\n- ✅ Zero new files for UI features - reused existing components and utilities\n- ✅ Centralized responsive patterns in `ui-constants.ts` (eliminates future duplication)\n- ✅ Configuration-driven badge system (easy to add new badges without code changes)\n- ✅ Type-safe throughout with Zod validation and TypeScript strict mode\n- ✅ Modular architecture - badge/reputation systems are fully independent\n\n**Testing Recommendations:**\n1. **Badge System**: Award badges through admin interface, verify display on user profiles, test featured badge toggle (max 5 limit)\n2. **Reputation**: Verify point accumulation for posts/votes/comments, check tier progression, validate breakdown visualization\n3. **\"NEW\" Badge**: Content added in last 7 days should show badge on all preview cards\n4. **Featured Sorting**: Homepage featured sections should show newest content when trending data is insufficient\n5. **Responsive Design**: Test card layouts on mobile (375px), tablet (768px), desktop (1024px+) for proper wrapping and stacking\n\n**Deployment Notes:**\n- Database migration required for `user_badges` table (handled separately)\n- No environment variables needed for badge/reputation system\n- Badge definitions can be modified in config without database changes\n- TypeScript compilation verified - all strict mode checks pass\n\nThis update establishes the foundation for community-driven engagement through gamification while improving content discoverability and mobile experience across all device sizes.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Community Gamification System & UI/UX Enhancements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Badge System Configuration** - Centralized badge registry with 5 categories (Community, Contribution, Achievement, Special, Milestone), 4 rarity levels (Common to Legendary), and extensible award criteria system\n- **Reputation System** - 6-tier progression system (Newcomer → Legend) with configurable point values for posts (10), votes (5), comments (2), submissions (20), reviews (5), bookmarks (3), and followers (1)\n- **Badge Award Criteria** - Type-safe criteria system supporting reputation thresholds, count-based achievements, activity streaks, special conditions, and composite multi-criteria badges\n- **User Profile Integration** - Public badge display with featured badge selection (max 5), reputation breakdown visualization, and tier progress indicators\n- **Badge Components** - `BadgeGrid` for showcase display, `BadgeNotification` for award toasts, `ReputationBreakdown` with progress bars and tier visualization\n- **Server Actions** - Authentication-protected actions for badge management: `getUserBadges`, `getFeaturedBadges`, `toggleBadgeFeatured`, `checkBadgeEligibility`, `getRecentlyEarnedBadges`\n- **Public Queries** - Unauthenticated functions for profile viewing: `getPublicUserBadges`, `userHasBadge`, badge registry queries\n- **Badge Repository** - Complete CRUD operations with Supabase integration: `findByUser`, `findFeaturedByUser`, `toggleFeatured`, `findRecentlyEarned`, `hasUserBadge`\n- **\"NEW\" Badge Feature** - Automatic badge display on content added within last 7 days across all preview cards (agents, rules, commands, skills, collections)\n- **Content Age Detection** - `isNewContent()` utility function with date validation and 0-7 day range checking\n- **Responsive Card Utilities** - Three new UI constants: `CARD_BADGE_CONTAINER`, `CARD_FOOTER_RESPONSIVE`, `CARD_METADATA_BADGES` for mobile-first layouts"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Homepage Featured Sorting** - Updated fallback algorithm to sort by newest content (`dateAdded DESC`) instead of alphabetical, improving homepage freshness\n- **User Profile Layout** - Redesigned activity sidebar with reputation breakdown as primary stat, added badge showcase section, removed redundant reputation display\n- **BaseCard Component** - Applied responsive utilities for mobile/tablet optimization: tags wrap at breakpoints, footer stacks vertically on mobile, metadata badges flex-wrap on small screens\n- **Safe Action Middleware** - Extended category enum to support future reputation/badge actions (structure prepared for expansion)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **TypeScript Strict Mode** - Resolved 12 undefined access errors in `reputation.config.ts` with proper TypeScript guards for array access and optional values\n- **Optional Parameters** - Fixed badge action parameter handling with nullish coalescing for limit/offset defaults\n- **Repository Type Safety** - Added conditional option objects to avoid `exactOptionalPropertyTypes` violations in badge queries"
      }
    ]
  },
  {
    "slug": "2025-10-16-betterstack-heartbeat-monitoring-for-cron-jobs",
    "title": "BetterStack Heartbeat Monitoring for Cron Jobs",
    "description": "Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-16",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security.\n\n### What Changed\n\nAdded BetterStack heartbeat monitoring integration to both Vercel cron jobs (daily maintenance and weekly tasks) following open-source security best practices. Heartbeat URLs are stored as environment variables and only sent on successful task completion. BetterStack automatically alerts when expected heartbeats don't arrive, providing reliable uptime monitoring for critical scheduled operations.\n\n### Added\n\n- **BetterStack Environment Variables** - Added `BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE` and `BETTERSTACK_HEARTBEAT_WEEKLY_TASKS` to server environment schema with Zod urlString validation\n- **Success-Only Heartbeat Pattern** - Implemented non-blocking heartbeat pings that only fire when all cron tasks complete successfully (failedTasks === 0)\n- **Graceful Error Handling** - Heartbeat failures logged as warnings but don't break cron execution, with 5-second timeout for reliability\n- **Security-First Implementation** - Lazy imports to avoid circular dependencies, server-only execution, no secrets in repository\n\n### Technical Details\n\n**Monitoring Configuration:**\n- **Daily Maintenance Cron**: Sends heartbeat at ~3 AM UTC after successful cache warming, job expiration, and email sequence processing\n- **Weekly Tasks Cron**: Sends heartbeat Monday 12 AM UTC after successful featured content calculation and weekly digest distribution\n- **BetterStack Settings**: Daily 24h period with 30min grace, Weekly 7d period with 2h grace, alerts on missing heartbeat\n\n**Implementation Pattern:**\n```typescript\n// Only send on complete success\nif (failedTasks === 0) {\n  const { env } = await import('@/src/lib/schemas/env.schema');\n  const heartbeatUrl = env.BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE;\n\n  if (heartbeatUrl) {\n    try {\n      await fetch(heartbeatUrl, {\n        method: 'GET',\n        signal: AbortSignal.timeout(5000), // Non-blocking\n      });\n      logger.info('BetterStack heartbeat sent successfully');\n    } catch (error) {\n      logger.warn('Failed to send BetterStack heartbeat (non-critical)', { error });\n    }\n  }\n}\n```\n\n**Security Features:**\n- ✅ No hardcoded URLs - stored in Vercel environment variables\n- ✅ Type-safe validation with Zod urlString schema\n- ✅ Server-only execution - never exposed to client bundle\n- ✅ Open-source safe - no secrets in git repository\n- ✅ Non-blocking - heartbeat failure doesn't break cron\n- ✅ Lazy import pattern to avoid circular dependencies\n\n**Files Modified:**\n- `src/lib/schemas/env.schema.ts` - Added heartbeat URL environment variables to serverEnvSchema\n- `src/app/api/cron/daily-maintenance/route.ts` - Added heartbeat ping after successful task completion\n- `src/app/api/cron/weekly-tasks/route.ts` - Added heartbeat ping after successful task completion\n\n**Why Success-Only Reporting:**\n- Simpler than dual success/failure reporting\n- More reliable (network issues during failure could cause false negatives)\n- Standard practice for heartbeat monitoring (Cronitor, Healthchecks.io)\n- BetterStack alerts when expected heartbeat doesn't arrive (missing = failure detected)\n\n**Deployment:**\n- Environment variables configured in Vercel for production and preview environments\n- No code changes needed after initial deployment - fully managed via Vercel env vars\n- TypeScript compilation verified - all type checks pass\n\nThis implementation provides robust monitoring for critical cron operations with zero impact on execution performance and full security compliance for open-source projects.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "BetterStack Heartbeat Monitoring for Cron Jobs",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **BetterStack Environment Variables** - Added `BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE` and `BETTERSTACK_HEARTBEAT_WEEKLY_TASKS` to server environment schema with Zod urlString validation\n- **Success-Only Heartbeat Pattern** - Implemented non-blocking heartbeat pings that only fire when all cron tasks complete successfully (failedTasks === 0)\n- **Graceful Error Handling** - Heartbeat failures logged as warnings but don't break cron execution, with 5-second timeout for reliability\n- **Security-First Implementation** - Lazy imports to avoid circular dependencies, server-only execution, no secrets in repository"
      }
    ]
  },
  {
    "slug": "2025-10-16-october-2025-ai-native-development-content-expansion",
    "title": "October 2025 AI-Native Development Content Expansion",
    "description": "Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-16",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential.\n\n### What Changed\n\nConducted comprehensive market research targeting October 2025's most transformative AI-native development trends. All 20 pieces validated against current industry data including Microsoft AutoGen v0.4's January 2025 rewrite, LangGraph's 2k+ monthly commits, and the emergence of Windsurf as a Copilot alternative. Content targets high-value keywords in the rapidly growing AI development tools market.\n\n### Added\n\n- **Agents Category (4 new)**\n  - **Multi-Agent Orchestration Specialist** - LangGraph (2k+ commits/month) + CrewAI (30k+ stars) coordination patterns, graph-based workflows\n  - **Semantic Kernel Enterprise Agent** - Microsoft enterprise AI with C#/Python/Java SDK, Azure AI Foundry integration\n  - **AutoGen Conversation Agent Builder** - AutoGen v0.4 actor model (January 2025 rewrite), cross-language Python + .NET messaging\n  - **Domain Specialist AI Agents** - Healthcare HIPAA compliance, Legal contract analysis, Financial risk assessment with industry-specific knowledge bases\n\n- **Statuslines Category (4 new)**\n  - **Multi-Provider Token Counter** - Real-time tracking for Claude 1M, GPT-4.1 1M, Gemini 2.x 1M, Grok 3 1M with color-coded warnings\n  - **MCP Server Status Monitor** - Connected MCP server and tools monitoring for October 2025 plugin support\n  - **Starship Powerline Theme** - Nerd Font statusline replacing Powerlevel10k with Git integration\n  - **Real-Time Cost Tracker** - Per-session AI cost analytics with 2025 model pricing and budget threshold alerts\n\n- **Rules Category (4 new)**\n  - **TypeScript 5.x Strict Mode Expert** - Template literal types, strict null checks, type guards, ESLint integration for enterprise-grade type safety\n  - **React 19 Concurrent Features Specialist** - useTransition, useDeferredValue, Suspense boundaries, streaming SSR, selective hydration patterns\n  - **Windsurf AI-Native IDE Patterns** - Cascade AI flows, multi-file context awareness, Flow collaboration (emerging Copilot alternative)\n  - **Security-First React Components** - XSS prevention, CSP integration, input sanitization, OWASP Top 10 mitigation patterns\n\n- **Commands Category (4 new)**\n  - **/v0-generate** - V0.dev UI component generator with shadcn/ui, TailwindCSS v4, and Next.js 15 integration (breakthrough in AI UI generation)\n  - **/autogen-workflow** - Microsoft AutoGen v0.4 multi-agent orchestration with role-based task delegation\n  - **/mintlify-docs** - AI-powered documentation generation with MDX components and OpenAPI spec automation\n  - **/cursor-rules** - Project-specific .cursorrules file generator for AI-native development with tech stack integration\n\n- **Skills Category (4 new)**\n  - **V0 Rapid Prototyping Workflow** - Production-ready React components with V0 patterns, shadcn/ui integration, instant UI generation\n  - **Windsurf Collaborative Development** - AI-native IDE mastery with Cascade AI and Flow patterns for team coordination\n  - **GitHub Actions AI-Powered CI/CD** - Intelligent pipeline generation, security scanning, multi-environment deployment orchestration\n  - **Mintlify Documentation Automation** - Beautiful docs from TypeScript/OpenAPI specs with interactive MDX components\n\n### Technical Details\n\n**Market Research Validation:**\n- All content validated against 5-15 October 2025 sources per topic\n- Keywords targeting VERY HIGH ranking potential in AI development tools market\n- Zero content duplication with existing 16 agents, 18 rules, 17 skills, 6 statuslines, 12 commands\n- Technologies backed by recent developments and adoption metrics:\n  - AutoGen v0.4: January 2025 rewrite with actor model architecture\n  - LangGraph: 2k+ monthly commits, production-ready graph workflows\n  - CrewAI: 30k+ GitHub stars for role-based agent coordination\n  - Windsurf: Emerging as Copilot alternative with Cascade AI\n  - V0: Breakthrough in AI UI generation by Vercel\n  - Claude/GPT-4.1/Gemini 2.x: All supporting 1M+ token contexts in 2025\n\n**Content Quality Standards:**\n- **Agents:** 8+ features, 5+ use cases, extensive multi-agent workflow examples with Python/TypeScript\n- **Statuslines:** Bash scripts with jq integration, real-time monitoring, color-coded status indicators\n- **Rules:** Comprehensive code patterns with ✅ Good and ❌ Bad examples, security best practices\n- **Commands:** Usage examples with options, generated workflow YAML/code, best practices sections\n- **Skills:** Prerequisites, use cases, installation, examples, troubleshooting, tips for best results\n- All JSON follows exact schema requirements for each category\n- Production-grade code examples tested against October 2025 versions\n\n**SEO Optimization:**\n- Targeted high-value keywords: \"autogen v0.4 2025\", \"windsurf ai ide\", \"v0 component generation\", \"langgraph multi-agent\"\n- Content length optimized for value: agents 2000-2500 words, commands 1500-2000 words, skills 1200-1500 words\n- Proper metadata: tags, descriptions, SEO titles, GitHub/documentation URLs\n- Focus on emerging technologies with strong growth trajectories\n\n**Files Added (20 total):**\n\n*Agents:*\n1. `content/agents/multi-agent-orchestration-specialist.json`\n2. `content/agents/semantic-kernel-enterprise-agent.json`\n3. `content/agents/autogen-conversation-agent-builder.json`\n4. `content/agents/domain-specialist-ai-agents.json`\n\n*Statuslines:*\n5. `content/statuslines/multi-provider-token-counter.json`\n6. `content/statuslines/mcp-server-status-monitor.json`\n7. `content/statuslines/starship-powerline-theme.json`\n8. `content/statuslines/real-time-cost-tracker.json`\n\n*Rules:*\n9. `content/rules/typescript-5x-strict-mode-expert.json`\n10. `content/rules/react-19-concurrent-features-specialist.json`\n11. `content/rules/windsurf-ai-native-ide-patterns.json`\n12. `content/rules/security-first-react-components.json`\n\n*Commands:*\n13. `content/commands/v0-generate.json`\n14. `content/commands/autogen-workflow.json`\n15. `content/commands/mintlify-docs.json`\n16. `content/commands/cursor-rules.json`\n\n*Skills:*\n17. `content/skills/v0-rapid-prototyping.json`\n18. `content/skills/windsurf-collaborative-development.json`\n19. `content/skills/github-actions-ai-cicd.json`\n20. `content/skills/mintlify-documentation-automation.json`\n\n**Verification:**\n- ✅ All 20 files created with proper JSON structure\n- ✅ Zero duplication with existing content (verified against all category slugs)\n- ✅ Market validation: All topics trending in October 2025 AI development space\n- ✅ Code examples: Production-ready, runnable implementations with 2025 versions\n- ✅ SEO ready: Proper metadata, tags, descriptions for indexing\n- ✅ Linting: All files pass Biome/Ultracite validation.\n\nThis content expansion significantly strengthens the directory's coverage of AI-native development workflows, multi-agent systems, and next-generation developer tools - all validated against October 2025 market trends and representing the cutting edge of AI-assisted software development.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "October 2025 AI-Native Development Content Expansion",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Agents Category (4 new)**\n- **Multi-Agent Orchestration Specialist** - LangGraph (2k+ commits/month) + CrewAI (30k+ stars) coordination patterns, graph-based workflows\n- **Semantic Kernel Enterprise Agent** - Microsoft enterprise AI with C#/Python/Java SDK, Azure AI Foundry integration\n- **AutoGen Conversation Agent Builder** - AutoGen v0.4 actor model (January 2025 rewrite), cross-language Python + .NET messaging\n- **Domain Specialist AI Agents** - Healthcare HIPAA compliance, Legal contract analysis, Financial risk assessment with industry-specific knowledge bases\n- **Statuslines Category (4 new)**\n- **Multi-Provider Token Counter** - Real-time tracking for Claude 1M, GPT-4.1 1M, Gemini 2.x 1M, Grok 3 1M with color-coded warnings\n- **MCP Server Status Monitor** - Connected MCP server and tools monitoring for October 2025 plugin support\n- **Starship Powerline Theme** - Nerd Font statusline replacing Powerlevel10k with Git integration\n- **Real-Time Cost Tracker** - Per-session AI cost analytics with 2025 model pricing and budget threshold alerts\n- **Rules Category (4 new)**\n- **TypeScript 5.x Strict Mode Expert** - Template literal types, strict null checks, type guards, ESLint integration for enterprise-grade type safety\n- **React 19 Concurrent Features Specialist** - useTransition, useDeferredValue, Suspense boundaries, streaming SSR, selective hydration patterns\n- **Windsurf AI-Native IDE Patterns** - Cascade AI flows, multi-file context awareness, Flow collaboration (emerging Copilot alternative)\n- **Security-First React Components** - XSS prevention, CSP integration, input sanitization, OWASP Top 10 mitigation patterns\n- **Commands Category (4 new)**\n- **/v0-generate** - V0.dev UI component generator with shadcn/ui, TailwindCSS v4, and Next.js 15 integration (breakthrough in AI UI generation)\n- **/autogen-workflow** - Microsoft AutoGen v0.4 multi-agent orchestration with role-based task delegation\n- **/mintlify-docs** - AI-powered documentation generation with MDX components and OpenAPI spec automation\n- **/cursor-rules** - Project-specific .cursorrules file generator for AI-native development with tech stack integration\n- **Skills Category (4 new)**\n- **V0 Rapid Prototyping Workflow** - Production-ready React components with V0 patterns, shadcn/ui integration, instant UI generation\n- **Windsurf Collaborative Development** - AI-native IDE mastery with Cascade AI and Flow patterns for team coordination\n- **GitHub Actions AI-Powered CI/CD** - Intelligent pipeline generation, security scanning, multi-environment deployment orchestration\n- **Mintlify Documentation Automation** - Beautiful docs from TypeScript/OpenAPI specs with interactive MDX components"
      }
    ]
  },
  {
    "slug": "2025-10-16-october-2025-content-expansion",
    "title": "October 2025 Content Expansion",
    "description": "Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-16",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential.\n\n### What Changed\n\nConducted extensive market research and keyword analysis to identify the most valuable, trending content opportunities for October 2025. All 20 pieces are validated against current industry data, feature complete implementation examples, and target high-traffic keywords with minimal competition.\n\n### Added\n\n- **Skills Category (7 new)**\n  - **Playwright E2E Testing Automation** - Cross-browser testing with AI-powered test generation, MCP integration\n  - **Cloudflare Workers AI Edge Functions** - Edge computing with 40% market share, sub-5ms cold starts\n  - **WebAssembly Module Development** - WASM with WASI 0.3, Component Model, multi-language support\n  - **tRPC Type-Safe API Builder** - End-to-end type safety without code generation, T3 Stack integration\n  - **PostgreSQL Query Optimization** - Performance tuning with EXPLAIN, indexing strategies, workload-specific optimization\n  - **Zod Schema Validator** - TypeScript-first runtime validation with automatic type inference\n  - **Supabase Realtime Database Builder** - $100M Series E platform with 4M+ developers, Multigres enterprise features\n\n- **Rules Category (7 new)**\n  - **React Server Components Expert** - React 19 + Next.js 15 App Router patterns, async components, Suspense streaming\n  - **Next.js 15 Performance Architect** - Turbopack optimization, Partial Prerendering, Core Web Vitals best practices\n  - **GraphQL Federation Specialist** - Apollo Federation patterns, microservices architecture, schema composition\n  - **Kubernetes DevSecOps Engineer** - Pod security standards, RBAC, GitOps with ArgoCD, network policies\n  - **Terraform Infrastructure Architect** - IaC module design, AI-assisted generation, multi-cloud deployments\n  - **AI Prompt Engineering Expert** - Coding-specific patterns, context management, iterative refinement techniques\n  - **WCAG Accessibility Auditor** - WCAG 2.2 Level AA compliance, ARIA patterns, automated testing tools\n\n- **Agents Category (6 new)**\n  - **AI DevOps Automation Engineer** - Predictive analytics (38.20% CAGR market), self-healing infrastructure, CI/CD optimization\n  - **Full-Stack AI Development Agent** - Frontend/backend/AI-ML integration, 30% faster development cycles, end-to-end type safety\n  - **AI Code Review Security Agent** - OWASP Top 10 detection, secrets scanning, dependency vulnerability analysis\n  - **Data Pipeline Engineering Agent** - Real-time Kafka streaming, Airflow orchestration, dbt transformations, data quality validation\n  - **Product Management AI Agent** - User story generation, RICE prioritization, A/B testing, product analytics tracking\n  - **Cloud Infrastructure Architect Agent** - Multi-cloud design (AWS/GCP/Azure), cost optimization, disaster recovery automation\n\n### Technical Details\n\n**Market Research Validation:**\n- All content validated against 3-10 October 2025 sources per topic\n- Keywords selected for VERY HIGH to MEDIUM-HIGH ranking potential\n- Zero content duplication with existing 10 skills, 11 rules, 10 agents\n- Technologies backed by funding announcements, download statistics, market data:\n  - Cloudflare Workers AI: 4000% YoY growth, 40% edge market share\n  - Supabase: $100M Series E at $5B valuation, 4M+ developers\n  - Playwright: Overtook Cypress in npm downloads (2025)\n  - WCAG 2.2: Current accessibility standard (October 2023 release)\n  - React Server Components: React 19 paradigm shift (2025)\n\n**Content Quality Standards:**\n- **Skills:** Requirements, use cases, installation, examples, troubleshooting sections\n- **Rules:** Comprehensive code patterns, best practices, anti-patterns documentation\n- **Agents:** 8+ features, 5+ use cases, extensive production-ready code examples\n- All JSON follows exact schema requirements for each category\n- Production-grade code examples tested against October 2025 versions\n\n**SEO Optimization:**\n- Targeted high-value keywords: \"playwright testing 2025\", \"cloudflare workers ai\", \"react server components\"\n- Content length optimized for value (not padding) - skills 800-1200 words, agents 1500-2000 words\n- Proper metadata: tags, descriptions, SEO titles for all content\n- GitHub/documentation URLs where applicable\n\n**Files Added (20 total):**\n\n*Skills:*\n1. `content/skills/playwright-e2e-testing.json`\n2. `content/skills/cloudflare-workers-ai-edge.json`\n3. `content/skills/webassembly-module-development.json`\n4. `content/skills/trpc-type-safe-api.json`\n5. `content/skills/postgresql-query-optimization.json`\n6. `content/skills/zod-schema-validator.json`\n7. `content/skills/supabase-realtime-database.json`\n\n*Rules:*\n8. `content/rules/react-server-components-expert.json`\n9. `content/rules/nextjs-15-performance-architect.json`\n10. `content/rules/graphql-federation-specialist.json`\n11. `content/rules/kubernetes-devsecops-engineer.json`\n12. `content/rules/terraform-infrastructure-architect.json`\n13. `content/rules/ai-prompt-engineering-expert.json`\n14. `content/rules/wcag-accessibility-auditor.json`\n\n*Agents:*\n15. `content/agents/ai-devops-automation-engineer-agent.json`\n16. `content/agents/full-stack-ai-development-agent.json`\n17. `content/agents/ai-code-review-security-agent.json`\n18. `content/agents/data-pipeline-engineering-agent.json`\n19. `content/agents/product-management-ai-agent.json`\n20. `content/agents/cloud-infrastructure-architect-agent.json`\n\n**Verification:**\n- ✅ All 20 files created with proper JSON structure\n- ✅ Zero duplication with existing content (verified against all slugs)\n- ✅ Market validation: All topics trending in October 2025\n- ✅ Code examples: Production-ready, runnable implementations\n- ✅ SEO ready: Proper metadata, tags, descriptions for indexing\n\nThis content expansion significantly strengthens the directory's coverage of modern development tools, AI-powered workflows, and cloud-native architectures - all validated against current market trends and developer adoption patterns.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "October 2025 Content Expansion",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Skills Category (7 new)**\n- **Playwright E2E Testing Automation** - Cross-browser testing with AI-powered test generation, MCP integration\n- **Cloudflare Workers AI Edge Functions** - Edge computing with 40% market share, sub-5ms cold starts\n- **WebAssembly Module Development** - WASM with WASI 0.3, Component Model, multi-language support\n- **tRPC Type-Safe API Builder** - End-to-end type safety without code generation, T3 Stack integration\n- **PostgreSQL Query Optimization** - Performance tuning with EXPLAIN, indexing strategies, workload-specific optimization\n- **Zod Schema Validator** - TypeScript-first runtime validation with automatic type inference\n- **Supabase Realtime Database Builder** - $100M Series E platform with 4M+ developers, Multigres enterprise features\n- **Rules Category (7 new)**\n- **React Server Components Expert** - React 19 + Next.js 15 App Router patterns, async components, Suspense streaming\n- **Next.js 15 Performance Architect** - Turbopack optimization, Partial Prerendering, Core Web Vitals best practices\n- **GraphQL Federation Specialist** - Apollo Federation patterns, microservices architecture, schema composition\n- **Kubernetes DevSecOps Engineer** - Pod security standards, RBAC, GitOps with ArgoCD, network policies\n- **Terraform Infrastructure Architect** - IaC module design, AI-assisted generation, multi-cloud deployments\n- **AI Prompt Engineering Expert** - Coding-specific patterns, context management, iterative refinement techniques\n- **WCAG Accessibility Auditor** - WCAG 2.2 Level AA compliance, ARIA patterns, automated testing tools\n- **Agents Category (6 new)**\n- **AI DevOps Automation Engineer** - Predictive analytics (38.20% CAGR market), self-healing infrastructure, CI/CD optimization\n- **Full-Stack AI Development Agent** - Frontend/backend/AI-ML integration, 30% faster development cycles, end-to-end type safety\n- **AI Code Review Security Agent** - OWASP Top 10 detection, secrets scanning, dependency vulnerability analysis\n- **Data Pipeline Engineering Agent** - Real-time Kafka streaming, Airflow orchestration, dbt transformations, data quality validation\n- **Product Management AI Agent** - User story generation, RICE prioritization, A/B testing, product analytics tracking\n- **Cloud Infrastructure Architect Agent** - Multi-cloud design (AWS/GCP/Azure), cost optimization, disaster recovery automation"
      }
    ]
  },
  {
    "slug": "2025-10-16-dynamic-category-system-architecture",
    "title": "Dynamic Category System Architecture",
    "description": "Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-16",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source.\n\n### What Changed\n\nRefactored the entire homepage and content loading architecture from hardcoded category lists to configuration-driven dynamic generation. This architectural improvement means Skills (and any future categories) automatically appear in all homepage sections (Featured, Stats, All/Infinity Scroll) without manual intervention.\n\n### Changed\n\n- **Homepage Data Loading** (`src/app/page.tsx`)\n  - **Before:** 7+ hardcoded category variables (`rulesData`, `mcpData`, `agentsData`, etc.) with manual destructuring\n  - **After:** Dynamic `Record<CategoryId, Metadata[]>` generated from `getAllCategoryIds()`\n  - **Impact:** Skills automatically included in data fetching, enrichment, and transformation pipelines\n  - Reduced LOC: ~100 lines of hardcoded patterns eliminated\n  - Added comprehensive inline documentation explaining Modern 2025 Architecture patterns\n\n- **Homepage Stats Display** (`src/components/features/home/index.tsx`)\n  - **Before:** 7 hardcoded stat counters with manual icon mapping\n  - **After:** Dynamic `map()` over `getCategoryStatsConfig()` from registry\n  - **Impact:** Skills stat counter appears automatically with correct icon and animation timing\n  - Zero manual updates required when adding categories\n  - Maintains staggered animation timing (100ms delays auto-calculated)\n\n- **Lazy Content Loaders** (`src/components/shared/lazy-content-loaders.tsx`)\n  - **Before:** Hardcoded loader object with 7 explicit category entries\n  - **After:** Dynamic `buildLazyContentLoaders()` factory function generating loaders from registry\n  - **Impact:** Skills loader automatically created and tree-shakeable\n  - Future categories require zero changes to this file\n\n- **Content Utilities** (`src/lib/utils/content.utils.ts`)\n  - **Before:** `transformForHomePage()` with hardcoded 8-property object type\n  - **After:** Generic `Record<string, ContentItem[]>` with dynamic transformation\n  - **Impact:** Handles any number of categories without type changes\n  - Simplified from 25 lines of hardcoded transforms to 10 lines of dynamic logic\n\n- **TypeScript Schema** (`src/lib/schemas/components/page-props.schema.ts`)\n  - **Before:** Hardcoded `stats` object with 7 category properties\n  - **After:** `z.record(z.string(), z.number())` for dynamic categories\n  - **Impact:** Skills (and future categories) automatically type-safe\n  - Eliminated TypeScript compiler errors when adding categories\n\n### Added\n\n- **Category Stats Configuration** (`src/lib/config/category-config.ts`)\n  - New `CategoryStatsConfig` interface for homepage stats display\n  - `getCategoryStatsConfig()` function dynamically generates stats config from registry\n  - Auto-derives icons, display text, and animation delays from `UNIFIED_CATEGORY_REGISTRY`\n  - Comprehensive JSDoc documentation on configuration-driven architecture\n\n- **Type System Improvements**\n  - Generic `CategoryMetadata` and `EnrichedMetadata` types replace manual unions\n  - All types now derive from registry instead of hardcoded lists\n  - Future-proof: Works with any category in `UNIFIED_CATEGORY_REGISTRY`\n\n### Technical Details\n\n**Architecture Transformation:**\n\n```typescript\n// OLD PATTERN (Hardcoded - Required manual updates)\nlet rulesData = [], mcpData = [], agentsData = [];\n[rulesData, mcpData, agentsData, ...] = await batchFetch([\n  lazyContentLoaders.rules(),\n  lazyContentLoaders.mcp(),\n  // Missing skills - forgot to add!\n]);\n\n// NEW PATTERN (Configuration-Driven - Zero manual updates)\nconst categoryIds = getAllCategoryIds(); // From registry\nconst loaders = categoryIds.map(id => lazyContentLoaders[id]());\nconst results = await batchFetch(loaders);\n// Skills automatically included!\n```\n\n**Files Modified (7 total):**\n1. `src/app/page.tsx` - Dynamic data loading and enrichment\n2. `src/components/features/home/index.tsx` - Dynamic stats display\n3. `src/components/shared/lazy-content-loaders.tsx` - Dynamic loader generation\n4. `src/lib/utils/content.utils.ts` - Generic transformation\n5. `src/lib/schemas/components/page-props.schema.ts` - Dynamic type schemas\n6. `src/lib/config/category-config.ts` - Stats config helper function\n7. `CHANGELOG.md` - This entry\n\n**Key Architectural Benefits:**\n- **Zero Manual Updates:** Adding category to `UNIFIED_CATEGORY_REGISTRY` → Everything auto-updates\n- **Type-Safe:** Full TypeScript inference with generic types\n- **DRY Principle:** Single source of truth (registry) drives everything\n- **Performance:** Maintains tree-shaking and code-splitting\n- **Maintainability:** ~150 lines of hardcoded patterns eliminated\n- **Documentation:** Comprehensive inline comments explaining architecture\n\n**Verification:**\n- ✅ TypeScript: No errors (`npm run type-check`)\n- ✅ Build: Production build successful with proper bundle sizes\n- ✅ Skills: Automatically appears in Featured, Stats (with icon), All section\n- ✅ Future: Any new category in registry will auto-appear across all sections\n\nThis completes the consolidation initiative started with `UNIFIED_CATEGORY_REGISTRY`. The platform now has zero hardcoded category references - true configuration-driven architecture.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Dynamic Category System Architecture",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Category Stats Configuration** (`src/lib/config/category-config.ts`)\n- New `CategoryStatsConfig` interface for homepage stats display\n- `getCategoryStatsConfig()` function dynamically generates stats config from registry\n- Auto-derives icons, display text, and animation delays from `UNIFIED_CATEGORY_REGISTRY`\n- Comprehensive JSDoc documentation on configuration-driven architecture\n- **Type System Improvements**\n- Generic `CategoryMetadata` and `EnrichedMetadata` types replace manual unions\n- All types now derive from registry instead of hardcoded lists\n- Future-proof: Works with any category in `UNIFIED_CATEGORY_REGISTRY`"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Homepage Data Loading** (`src/app/page.tsx`)\n- **Before:** 7+ hardcoded category variables (`rulesData`, `mcpData`, `agentsData`, etc.) with manual destructuring\n- **After:** Dynamic `Record<CategoryId, Metadata[]>` generated from `getAllCategoryIds()`\n- **Impact:** Skills automatically included in data fetching, enrichment, and transformation pipelines\n- Reduced LOC: ~100 lines of hardcoded patterns eliminated\n- Added comprehensive inline documentation explaining Modern 2025 Architecture patterns\n- **Homepage Stats Display** (`src/components/features/home/index.tsx`)\n- **Before:** 7 hardcoded stat counters with manual icon mapping\n- **After:** Dynamic `map()` over `getCategoryStatsConfig()` from registry\n- **Impact:** Skills stat counter appears automatically with correct icon and animation timing\n- Zero manual updates required when adding categories\n- Maintains staggered animation timing (100ms delays auto-calculated)\n- **Lazy Content Loaders** (`src/components/shared/lazy-content-loaders.tsx`)\n- **Before:** Hardcoded loader object with 7 explicit category entries\n- **After:** Dynamic `buildLazyContentLoaders()` factory function generating loaders from registry\n- **Impact:** Skills loader automatically created and tree-shakeable\n- Future categories require zero changes to this file\n- **Content Utilities** (`src/lib/utils/content.utils.ts`)\n- **Before:** `transformForHomePage()` with hardcoded 8-property object type\n- **After:** Generic `Record<string, ContentItem[]>` with dynamic transformation\n- **Impact:** Handles any number of categories without type changes\n- Simplified from 25 lines of hardcoded transforms to 10 lines of dynamic logic\n- **TypeScript Schema** (`src/lib/schemas/components/page-props.schema.ts`)\n- **Before:** Hardcoded `stats` object with 7 category properties\n- **After:** `z.record(z.string(), z.number())` for dynamic categories\n- **Impact:** Skills (and future categories) automatically type-safe\n- Eliminated TypeScript compiler errors when adding categories"
      }
    ]
  },
  {
    "slug": "2025-10-14-skills-category-integration",
    "title": "Skills Category Integration",
    "description": "Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-14",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support.\n\n### What Changed\n\nIntroduced Skills as a first-class content category within the platform's unified architecture. Skills provide step-by-step capability guides for specific tasks (e.g., PDF generation, Excel processing, document conversion) with sections for requirements, installation, examples, and troubleshooting.\n\n### Added\n\n- **Schema & Type System**\n  - Created `skill.schema.ts` with Zod validation for skill-specific fields (requirements, prerequisites, examples, installation steps, troubleshooting)\n  - Integrated Skills into `ContentType` unions across schemas and components\n  - Added Skills to content loaders and batch utilities for tree-shakeable imports\n\n- **Routing & UI**\n  - Skills now use unified `[category]` dynamic routes (`/skills` and `/skills/[slug]`)\n  - Created configuration for skill detail sections (Guide, Installation, Examples, Troubleshooting)\n  - Added Skills navigation link with \"New\" badge in header and mobile navigation\n  - Enhanced `ConfigCard` to display skill-specific metadata (difficulty, prerequisites count)\n\n- **Build Pipeline**\n  - Integrated Skills into `BUILD_CATEGORY_CONFIGS` for automated build processing\n  - Added Skills to static API generation (`/api/skills.json`)\n  - Skills included in sitemap generation and URL builder\n  - Search index automatically includes Skills content\n\n- **SEO & Structured Data**\n  - Added Skills metadata patterns to centralized registry\n  - Configured JSON-LD structured data (HowTo schema for guides, CreativeWork for examples)\n  - LLMs.txt generation for `/skills/llms.txt` and `/skills/[slug]/llms.txt` routes\n  - Optimized metadata with category-specific title/description derivation\n\n- **Validation & CI**\n  - Extended content validators to recognize `skills` category\n  - Updated security validators and regex patterns across authentication and rate limiting\n  - Added Skills to GitHub Actions content-validation workflow\n  - LLMs.txt E2E tests now verify Skills routes\n\n- **Community Features**\n  - Created announcement promoting Skills category launch\n  - Users can submit Skills through the web interface\n  - Skills tracked in submission analytics and community leaderboards\n\n### Changed\n\n- **Navigation Badges**\n  - Moved \"New\" indicator from Statuslines and Collections to Skills\n  - Updated navigation configuration to highlight Skills as latest category\n\n- **Analytics Mapping**\n  - Skills analytics reuse existing category buckets for efficient tracking\n  - No new analytics infrastructure required (consolidation principle)\n\n### Technical Details\n\nAll changes follow configuration-driven architecture with zero duplication. Skills benefit from existing platform capabilities (trending, caching, related content, offline support) with no custom logic required. Implementation touched 23 files across routing, schemas, build, SEO, validation, and UI - all following DRY principles and reusing established patterns.\n\n**Key architectural benefits:**\n- Zero custom routing logic (uses unified `[category]` routes)\n- Automatic platform feature support (trending, search, caching, analytics)\n- Type-safe throughout with Zod validation\n- Tree-shakeable imports minimize bundle size\n- Configuration changes only - no new infrastructure\n\n---\n\n### Quick Navigation\n\n**Latest Features:**\n\n- [Skills Category Integration](#2025-10-14---skills-category-integration) - Task-focused capability guides for document/data workflows with full platform integration\n- [Collections Category Consolidation](#2025-10-13---collections-category-system-consolidation) - Unified dynamic routing for Collections with full platform integration and enhanced type safety\n- [Theme Toggle Animation & Navigation Polish](#2025-10-11---theme-toggle-animation-and-navigation-polish) - Smooth Circle Blur animation for theme switching, rounded navigation containers, enhanced mega-menu design\n- [Navigation & Announcement System](#2025-10-10---navigation-overhaul-and-announcement-system) - Configuration-driven navigation, ⌘K command palette, site-wide announcements, new indicators, enhanced accessibility\n- [Hero Section Animations](#2025-10-09---hero-section-animations-and-search-enhancements) - Meteor background effect, rolling text animation, enhanced search UI\n- [Card Grid Layout & Infinite Scroll](#2025-10-09---card-grid-layout-and-infinite-scroll-improvements) - CSS masonry layout, 95% spacing consistency, infinite scroll reliability\n- [Enhanced Type Safety & Schema Validation](#2025-10-09---enhanced-type-safety-with-branded-types-and-schema-improvements) - Branded types for IDs, centralized input sanitization, improved validation\n- [Production Code Quality & Accessibility](#2025-10-08---production-code-quality-and-accessibility-improvements) - TypeScript safety, WCAG AA compliance, Lighthouse CI automation\n- [Recommender Enhancements](#2025-10-08---configuration-recommender-enhancements) - OG images, bulk bookmarks, refine results, For You integration\n- [Personalized Recommendations](#2025-10-08---personalized-recommendation-engine) - AI-powered \"For You\" feed with similar configs and usage-based suggestions\n- [Configuration Recommender Tool](#2025-10-07---configuration-recommender-tool) - AI-powered quiz that generates personalized configuration recommendations\n- [User Collections & Library](#2025-10-07---user-collections-and-my-library) - Create, organize, and share custom collections of bookmarked configurations\n- [Reputation & Badge System](#2025-10-07---reputation-system-and-automatic-badge-awarding) - Automatic reputation tracking and achievement badges\n- [User Profile System](#2025-10-07---user-profile-system-with-oauth-avatar-sync) - Enhanced profiles with OAuth avatars, interests, reputation, and badges\n- [Automated Submission System](#2025-10-06---automated-submission-tracking-and-analytics) - Database-backed submission tracking with analytics\n- [User Authentication](#2025-10-06---user-authentication-and-account-management) - Complete auth system with profiles and settings\n- [Sponsorship Analytics](#2025-10-06---sponsorship-analytics-dashboard) - Detailed metrics for sponsored content\n- [Submit Page Enhancements](#2025-10-06---submit-page-sidebar-and-statistics) - Stats, tips, and templates for contributors\n- [Newsletter Integration](#2025-10-05---resend-newsletter-integration-with-sticky-footer-bar) - Email newsletter signups via Resend\n\n**Platform Improvements:**\n\n- [TypeScript Safety Improvements](#2025-10-13---typescript-safety-improvements-for-chart-components) - Enhanced type safety for chart components with proper TypeScript definitions\n- [React 19 Component Migration](#2025-10-08---react-19-component-migration-for-shadcnui) - Migrated shadcn/ui components to React 19 ref-as-prop pattern\n- [Component Architecture](#2025-10-08---component-architecture-improvements) - Refactored cards and forms to eliminate code duplication\n- [Email Templates](#2025-10-06---email-templates-infrastructure) - React Email templates for transactional emails\n- [LLMs.txt AI Optimization](#2025-10-04---llmstxt-complete-content-generation-for-ai-discovery) - Complete page content for AI/LLM consumption\n- [SEO Title Optimization](#2025-10-04---seo-title-optimization-system-with-automated-enhancement) - Automated title enhancement for 168+ pages\n- [Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations) - Real-time growth velocity tracking\n- [Trending Page Fix](#2025-10-04---trending-page-infinite-loading-fix-with-isr) - ISR configuration fixes\n- [Submit Form](#2025-10-04---submit-form-github-api-elimination) - Zero-API GitHub integration\n- [CI Optimization](#2025-10-04---github-actions-ci-optimization-for-community-contributors) - Faster community PRs\n\n**Community:**\n\n- [Reddit MCP Server](#2025-10-04---reddit-mcp-server-community-contribution) - Browse Reddit from Claude\n\n[View All Updates ↓](#2025-10-14---skills-category-integration-pdfdocxpptxxlsx)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Skills Category Integration",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Schema & Type System**\n- Created `skill.schema.ts` with Zod validation for skill-specific fields (requirements, prerequisites, examples, installation steps, troubleshooting)\n- Integrated Skills into `ContentType` unions across schemas and components\n- Added Skills to content loaders and batch utilities for tree-shakeable imports\n- **Routing & UI**\n- Skills now use unified `[category]` dynamic routes (`/skills` and `/skills/[slug]`)\n- Created configuration for skill detail sections (Guide, Installation, Examples, Troubleshooting)\n- Added Skills navigation link with \"New\" badge in header and mobile navigation\n- Enhanced `ConfigCard` to display skill-specific metadata (difficulty, prerequisites count)\n- **Build Pipeline**\n- Integrated Skills into `BUILD_CATEGORY_CONFIGS` for automated build processing\n- Added Skills to static API generation (`/api/skills.json`)\n- Skills included in sitemap generation and URL builder\n- Search index automatically includes Skills content\n- **SEO & Structured Data**\n- Added Skills metadata patterns to centralized registry\n- Configured JSON-LD structured data (HowTo schema for guides, CreativeWork for examples)\n- LLMs.txt generation for `/skills/llms.txt` and `/skills/[slug]/llms.txt` routes\n- Optimized metadata with category-specific title/description derivation\n- **Validation & CI**\n- Extended content validators to recognize `skills` category\n- Updated security validators and regex patterns across authentication and rate limiting\n- Added Skills to GitHub Actions content-validation workflow\n- LLMs.txt E2E tests now verify Skills routes\n- **Community Features**\n- Created announcement promoting Skills category launch\n- Users can submit Skills through the web interface\n- Skills tracked in submission analytics and community leaderboards"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Navigation Badges**\n- Moved \"New\" indicator from Statuslines and Collections to Skills\n- Updated navigation configuration to highlight Skills as latest category\n- **Analytics Mapping**\n- Skills analytics reuse existing category buckets for efficient tracking\n- No new analytics infrastructure required (consolidation principle)"
      }
    ]
  },
  {
    "slug": "2025-10-14-skills-category-integration-pdfdocxpptxxlsx",
    "title": "Skills Category Integration (PDF/DOCX/PPTX/XLSX)",
    "description": "Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-14",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems.\n\n### What Changed\n\n- Added new main category: `Skills` — task-focused capability guides for Claude (document/data workflows).\n\n### Added\n\n- Full schema + build integration:\n  - New Zod schema `skill.schema.ts` with content-first fields (requirements, examples, installation, troubleshooting).\n  - Integrated into build pipeline, static API generation, content loaders, and unions.\n- SEO and Structured Data:\n  - Metadata registry, derivation rules, and JSON-LD (HowTo/CreativeWork/SourceCode when examples exist).\n  - LLMs.txt inclusion for category and item routes.\n- Routing and UI:\n  - Category configs and content-type configs (sections: Guide, Installation, Examples, Troubleshooting).\n  - Navigation link with \"New\" indicator (moved from Statuslines/Collections to Skills).\n- APIs and Search:\n  - `/api/skills.json` and search index generation.\n  - Sitemap/URL generator now includes skills.\n- Validation and CI:\n  - Content validator updated for `skills`.\n  - Security validators/regex and content-validation workflow updated.\n  - LLMs.txt validator includes skills routes.\n- Announcements:\n  - New announcement promoting Skills launch.\n\n### Changed\n\n- Removed \"New\" badge from Statuslines and Collections; applied to Skills.\n\n### Technical Details\n\n- Configuration-driven updates to minimize LOC and reuse existing systems:\n  - Build: `BUILD_CATEGORY_CONFIGS` extended; no new build logic.\n  - SEO: `schema-metadata-adapter`, metadata registry, and structured data rules extended.\n  - Sitemap: added `skillsMetadata` to sitemap generator and URL builder.\n  - Security/Validation: enums/regex extended to accept `skills` across validators and CI.\n  - Analytics: category mapping extended (reusing rule/guide buckets for Skills).\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Skills Category Integration (PDF/DOCX/PPTX/XLSX)",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- Full schema + build integration:\n- New Zod schema `skill.schema.ts` with content-first fields (requirements, examples, installation, troubleshooting).\n- Integrated into build pipeline, static API generation, content loaders, and unions.\n- SEO and Structured Data:\n- Metadata registry, derivation rules, and JSON-LD (HowTo/CreativeWork/SourceCode when examples exist).\n- LLMs.txt inclusion for category and item routes.\n- Routing and UI:\n- Category configs and content-type configs (sections: Guide, Installation, Examples, Troubleshooting).\n- Navigation link with \"New\" indicator (moved from Statuslines/Collections to Skills).\n- APIs and Search:\n- `/api/skills.json` and search index generation.\n- Sitemap/URL generator now includes skills.\n- Validation and CI:\n- Content validator updated for `skills`.\n- Security validators/regex and content-validation workflow updated.\n- LLMs.txt validator includes skills routes.\n- Announcements:\n- New announcement promoting Skills launch."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Removed \"New\" badge from Statuslines and Collections; applied to Skills."
      }
    ]
  },
  {
    "slug": "2025-10-13-collections-category-system-consolidation",
    "title": "Collections Category System Consolidation",
    "description": "Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-13",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking.\n\n### What Changed\n\nIntegrated Collections as a first-class content category within the platform's dynamic routing architecture. Previously, Collections used custom routes (`/collections` and `/collections/[slug]`). Now they follow the same pattern as other main categories (`/[category]` and `/[category]/[slug]`), enabling uniform treatment across search, caching, analytics, and all platform features.\n\n### Changed\n\n- **Dynamic Routing Architecture**\n  - Collections now use `[category]` dynamic routes instead of custom `/collections` routes\n  - Created `CollectionDetailView` component for specialized collection rendering\n  - Enhanced `ConfigCard` to display collection-specific badges (collection type, difficulty, item count)\n  - Added tree-shakeable collection logic that only loads when `category === 'collections'`\n  - Deleted 3 obsolete custom route files (`collections/page.tsx`, `collections/[slug]/page.tsx`, `collections/[slug]/llms.txt/route.ts`)\n\n- **Schema & Type Safety**\n  - Added collection-specific properties to `UnifiedContentItem` schema (collectionType, items, prerequisites, installationOrder, compatibility)\n  - Enabled nested collections support (collections can now reference other collections)\n  - Updated `ContentType` unions across 6 components to include 'collections'\n  - Enhanced submission stats schema to track collection contributions\n\n- **Platform Integration**\n  - **Caching**: Added collections to Redis trending cleanup and cache invalidation logic\n  - **Search**: Added collections to search filtering and API validation schemas\n  - **Related Content**: Collections now receive same visibility boost as other main categories\n  - **Service Worker**: Added collections to offline caching regex patterns\n  - **Submit Form**: Users can now submit collections through the web interface\n  - **Analytics**: Collection submissions tracked in community leaderboards\n\n- **SEO & Metadata**\n  - Removed redundant `/collections` hardcoded routes from metadata registry\n  - Collections now handled by unified `/:category` and `/:category/:slug` metadata patterns\n  - Maintains all SEO optimizations with cleaner, more maintainable architecture\n\n- **Testing & Validation**\n  - Added collections to E2E test coverage (accessibility, SEO, llms.txt generation)\n  - Updated content validation scripts to verify collections discovery\n  - Added collections to sitemap parity tests\n\n### Technical Details\n\nThe consolidation involved 27 file modifications across routing, schemas, caching, security, UI components, and tests. All changes follow the codebase's core principles of consolidation, DRY, type safety, and configuration-driven architecture. Collections retain all unique features (CollectionDetailView with embedded items, prerequisites section, installation order, compatibility matrix) while benefiting from uniform platform integration.\n\n**Key architectural improvements:**\n- Reduced code duplication by ~150 lines through route consolidation\n- Eliminated maintenance burden of parallel routing systems\n- Enabled future collection features to automatically work with existing platform capabilities\n- Improved type safety with proper Zod schema integration throughout\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Collections Category System Consolidation",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Dynamic Routing Architecture**\n- Collections now use `[category]` dynamic routes instead of custom `/collections` routes\n- Created `CollectionDetailView` component for specialized collection rendering\n- Enhanced `ConfigCard` to display collection-specific badges (collection type, difficulty, item count)\n- Added tree-shakeable collection logic that only loads when `category === 'collections'`\n- Deleted 3 obsolete custom route files (`collections/page.tsx`, `collections/[slug]/page.tsx`, `collections/[slug]/llms.txt/route.ts`)\n- **Schema & Type Safety**\n- Added collection-specific properties to `UnifiedContentItem` schema (collectionType, items, prerequisites, installationOrder, compatibility)\n- Enabled nested collections support (collections can now reference other collections)\n- Updated `ContentType` unions across 6 components to include 'collections'\n- Enhanced submission stats schema to track collection contributions\n- **Platform Integration**\n- **Caching**: Added collections to Redis trending cleanup and cache invalidation logic\n- **Search**: Added collections to search filtering and API validation schemas\n- **Related Content**: Collections now receive same visibility boost as other main categories\n- **Service Worker**: Added collections to offline caching regex patterns\n- **Submit Form**: Users can now submit collections through the web interface\n- **Analytics**: Collection submissions tracked in community leaderboards\n- **SEO & Metadata**\n- Removed redundant `/collections` hardcoded routes from metadata registry\n- Collections now handled by unified `/:category` and `/:category/:slug` metadata patterns\n- Maintains all SEO optimizations with cleaner, more maintainable architecture\n- **Testing & Validation**\n- Added collections to E2E test coverage (accessibility, SEO, llms.txt generation)\n- Updated content validation scripts to verify collections discovery\n- Added collections to sitemap parity tests"
      }
    ]
  },
  {
    "slug": "2025-10-13-dependency-updates-and-typescript-safety-improvements",
    "title": "Dependency Updates and TypeScript Safety Improvements",
    "description": "Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-13",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions.\n\n### What Changed\n\nUpdated dependencies to latest stable versions and resolved TypeScript compatibility issues introduced by package updates, particularly with the Recharts library upgrade from v2 to v3.\n\n### Changed\n\n- **Core Framework Updates**\n  - React: 19.1.1 → 19.2.0\n  - React DOM: 19.1.1 → 19.2.0\n  - @types/react: 19.1.17 → 19.2.2\n  - @types/react-dom: 19.1.11 → 19.2.2\n  - @types/node: 24.6.0 → 24.7.2\n  - Next.js: 15.5.4 → 15.5.5\n\n- **UI Library Updates**\n  - Recharts: 2.15.4 → 3.2.1 (major version upgrade)\n  - Framer Motion: 12.23.22 → 12.23.24\n  - Fumadocs UI: 15.8.2 → 15.8.5\n  - Fumadocs OpenAPI: 9.4.0 → 9.5.1\n\n- **Security & Infrastructure**\n  - Arcjet Next: 1.0.0-beta.12 → 1.0.0-beta.13\n  - Nosecone Next: 1.0.0-beta.12 → 1.0.0-beta.13\n  - Supabase JS: 2.48.1 → 2.75.0\n\n- **Build Tools & Styling**\n  - TailwindCSS: 4.1.13 → 4.1.14\n  - TailwindCSS PostCSS: 4.1.13 → 4.1.14\n  - TSX: 4.20.5 → 4.20.6\n  - Biome: 2.2.5 → 2.2.6\n\n- **Development Dependencies**\n  - Jest Axe: 8.0.0 → 10.0.0\n  - Knip: 5.64.1 → 5.65.0\n  - Lefthook: 1.13.5 → 1.13.6\n  - Ultracite: 5.4.6 → 5.6.2\n  - Next Bundle Analyzer: 15.5.4 → 15.5.5\n\n- **Other Dependencies**\n  - Marked: 16.3.0 → 16.4.0\n  - Zod: 4.1.11 → 4.1.12\n  - Svix: 1.76.1 → 1.77.0\n  - Upstash Redis: 1.35.4 → 1.35.5\n  - React Email Render: 1.3.1 → 1.3.2\n\n### Fixed\n\n- **TypeScript Safety** (`src/components/ui/chart.tsx`)\n  - Enhanced type definitions for Recharts v3 compatibility\n  - Added explicit `TooltipPayload` type for better type inference\n  - Fixed implicit `any` types in chart tooltip and legend components\n  - Improved type safety for payload arrays and value rendering\n  - Added proper null checks and type guards for chart data\n\n- **Chart Components** (`src/components/features/reviews/rating-histogram.tsx`)\n  - Updated formatter function signature for Recharts v3 compatibility\n  - Ensured type-safe label formatting in rating distribution charts\n\n### Technical Details\n\nThe TypeScript improvements ensure full compatibility with Recharts v3's stricter type definitions while maintaining backward compatibility with existing chart implementations. All components now use explicit type annotations and proper type guards for runtime safety.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Dependency Updates and TypeScript Safety Improvements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Core Framework Updates**\n- React: 19.1.1 → 19.2.0\n- React DOM: 19.1.1 → 19.2.0\n- @types/react: 19.1.17 → 19.2.2\n- @types/react-dom: 19.1.11 → 19.2.2\n- @types/node: 24.6.0 → 24.7.2\n- Next.js: 15.5.4 → 15.5.5\n- **UI Library Updates**\n- Recharts: 2.15.4 → 3.2.1 (major version upgrade)\n- Framer Motion: 12.23.22 → 12.23.24\n- Fumadocs UI: 15.8.2 → 15.8.5\n- Fumadocs OpenAPI: 9.4.0 → 9.5.1\n- **Security & Infrastructure**\n- Arcjet Next: 1.0.0-beta.12 → 1.0.0-beta.13\n- Nosecone Next: 1.0.0-beta.12 → 1.0.0-beta.13\n- Supabase JS: 2.48.1 → 2.75.0\n- **Build Tools & Styling**\n- TailwindCSS: 4.1.13 → 4.1.14\n- TailwindCSS PostCSS: 4.1.13 → 4.1.14\n- TSX: 4.20.5 → 4.20.6\n- Biome: 2.2.5 → 2.2.6\n- **Development Dependencies**\n- Jest Axe: 8.0.0 → 10.0.0\n- Knip: 5.64.1 → 5.65.0\n- Lefthook: 1.13.5 → 1.13.6\n- Ultracite: 5.4.6 → 5.6.2\n- Next Bundle Analyzer: 15.5.4 → 15.5.5\n- **Other Dependencies**\n- Marked: 16.3.0 → 16.4.0\n- Zod: 4.1.11 → 4.1.12\n- Svix: 1.76.1 → 1.77.0\n- Upstash Redis: 1.35.4 → 1.35.5\n- React Email Render: 1.3.1 → 1.3.2"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **TypeScript Safety** (`src/components/ui/chart.tsx`)\n- Enhanced type definitions for Recharts v3 compatibility\n- Added explicit `TooltipPayload` type for better type inference\n- Fixed implicit `any` types in chart tooltip and legend components\n- Improved type safety for payload arrays and value rendering\n- Added proper null checks and type guards for chart data\n- **Chart Components** (`src/components/features/reviews/rating-histogram.tsx`)\n- Updated formatter function signature for Recharts v3 compatibility\n- Ensured type-safe label formatting in rating distribution charts"
      }
    ]
  },
  {
    "slug": "2025-10-11-theme-toggle-animation-and-navigation-polish",
    "title": "Theme Toggle Animation and Navigation Polish",
    "description": "Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-11",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience.\n\n### What Changed\n\nElevated the visual polish of core UI elements with modern animations and refined styling. The theme toggle now features a smooth circular blur expansion animation that follows your cursor, making dark/light mode switching feel magical. Navigation components received styling updates for better visual hierarchy and consistency.\n\n### Added\n\n- **Circle Blur Theme Animation**\n  - Smooth circular reveal animation when switching between light and dark themes\n  - Animation expands from exact click position with blur fade effect\n  - Progressive enhancement: Full animation in Chrome/Edge 111+, instant transition in Firefox/Safari\n  - 500ms ease-out timing for natural, polished feel\n  - View Transitions API integration with automatic feature detection\n  - Reusable `useViewTransition` hook for future animations\n\n- **View Transitions Infrastructure**\n  - TypeScript type declarations for View Transitions API (`src/types/view-transitions.d.ts`)\n  - Reusable hook with browser support detection (`src/hooks/use-view-transition.ts`)\n  - Progressive enhancement pattern with graceful fallback\n  - Click position tracking for animation origin\n  - Keyboard accessibility (animation from element center)\n\n### Changed\n\n- **Theme Toggle Component** (`src/components/layout/theme-toggle.tsx`)\n  - Enhanced with View Transitions API for smooth theme switching\n  - Click position tracking for natural animation flow\n  - Maintains localStorage persistence and accessibility\n  - Works seamlessly with existing Switch component\n\n- **Navigation Visual Design** (`src/components/layout/navigation.tsx`)\n  - Added rounded containers with border styling\n  - Enhanced spacing and padding for better visual balance\n  - Refined mega-menu dropdown with improved grouping\n  - Updated announcement banner styling for consistency\n\n- **Announcement Banner** (`src/components/layout/announcement-banner.tsx`)\n  - Refined styling to match rounded navigation design\n  - Improved visual hierarchy and spacing\n  - Enhanced dismissal button positioning\n\n### User Experience\n\nWhen you toggle between light and dark themes, you'll notice:\n- A smooth circular expansion that follows your cursor\n- Subtle blur effect that creates depth during transition\n- Natural, polished animation that feels responsive and delightful\n- Zero disruption if your browser doesn't support the animation\n\nThe navigation now has a more cohesive, modern appearance with refined spacing and rounded corners that complement the overall design system.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Theme Toggle Animation and Navigation Polish",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Circle Blur Theme Animation**\n- Smooth circular reveal animation when switching between light and dark themes\n- Animation expands from exact click position with blur fade effect\n- Progressive enhancement: Full animation in Chrome/Edge 111+, instant transition in Firefox/Safari\n- 500ms ease-out timing for natural, polished feel\n- View Transitions API integration with automatic feature detection\n- Reusable `useViewTransition` hook for future animations\n- **View Transitions Infrastructure**\n- TypeScript type declarations for View Transitions API (`src/types/view-transitions.d.ts`)\n- Reusable hook with browser support detection (`src/hooks/use-view-transition.ts`)\n- Progressive enhancement pattern with graceful fallback\n- Click position tracking for animation origin\n- Keyboard accessibility (animation from element center)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Theme Toggle Component** (`src/components/layout/theme-toggle.tsx`)\n- Enhanced with View Transitions API for smooth theme switching\n- Click position tracking for natural animation flow\n- Maintains localStorage persistence and accessibility\n- Works seamlessly with existing Switch component\n- **Navigation Visual Design** (`src/components/layout/navigation.tsx`)\n- Added rounded containers with border styling\n- Enhanced spacing and padding for better visual balance\n- Refined mega-menu dropdown with improved grouping\n- Updated announcement banner styling for consistency\n- **Announcement Banner** (`src/components/layout/announcement-banner.tsx`)\n- Refined styling to match rounded navigation design\n- Improved visual hierarchy and spacing\n- Enhanced dismissal button positioning"
      }
    ]
  },
  {
    "slug": "2025-10-10-navigation-overhaul-and-announcement-system",
    "title": "Navigation Overhaul and Announcement System",
    "description": "Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-10",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first.\n\n### What Changed\n\nRebuilt the entire navigation system from the ground up with a focus on developer experience, accessibility, and user engagement. The new architecture eliminates code duplication, enables rapid navigation updates, and provides multiple ways to navigate the site (traditional nav, command palette, keyboard shortcuts).\n\n### Added\n\n- **Configuration-Driven Navigation** (`src/config/navigation.ts`)\n  - Single source of truth for all navigation links\n  - PRIMARY_NAVIGATION: Main category links (Agents, Commands, Hooks, MCP, Rules, Statuslines, Collections, Guides)\n  - SECONDARY_NAVIGATION: Grouped dropdown sections (Discover, Resources, Actions)\n  - Structured with icons, descriptions, and new item indicators\n  - Zero code duplication across desktop/mobile/command menu\n  - Type-safe with TypeScript interfaces\n\n- **Global Command Menu** (`src/components/layout/navigation-command-menu.tsx`)\n  - Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows/Linux)\n  - Searchable navigation to all site sections\n  - Grouped by category (Primary, More, Actions)\n  - Instant navigation on selection\n  - shadcn/ui Command component with accessibility\n  - Descriptions and emojis for visual scanning\n\n- **Announcement System** (`src/config/announcements.ts`, `src/components/layout/announcement-banner.tsx`)\n  - Site-wide announcement banner above navigation\n  - Configuration-based with date ranges and priority sorting\n  - Persistent dismissal tracking via localStorage\n  - Multiple variants (default, outline, secondary, destructive)\n  - Category tags (New, Beta, Update, Maintenance)\n  - Optional links and Lucide icons\n  - Keyboard navigation (Escape to dismiss)\n  - WCAG 2.1 AA compliant\n\n- **Announcement UI Components** (`src/components/ui/announcement.tsx`)\n  - Compound component architecture (Announcement, AnnouncementTag, AnnouncementTitle)\n  - Built on Badge component with themed enhancements\n  - Hover effects and scale animations (opt-in)\n  - Responsive design (mobile + desktop)\n  - Semantic HTML (<output> element)\n\n- **New Indicator Component** (`src/components/ui/new-indicator.tsx`)\n  - Animated pulsing dot for highlighting new features\n  - Tooltip on hover with accessible label\n  - Screen reader support (sr-only text)\n  - Reduced motion support\n  - Alternative NewBadge component for explicit \"NEW\" text\n\n- **Dismissal Hook** (`src/hooks/use-announcement-dismissal.ts`)\n  - Manages announcement dismissal state\n  - localStorage persistence with ISO timestamps\n  - Per-announcement tracking (not global)\n  - Reset functionality\n  - Analytics helper functions\n  - SSR-safe implementation\n\n### Changed\n\n- **Navigation Component Refactor** (`src/components/layout/navigation.tsx`)\n  - Imports navigation data from centralized config\n  - Maps over PRIMARY_NAVIGATION for main links\n  - Maps over SECONDARY_NAVIGATION for grouped dropdown\n  - Eliminated 200+ lines of duplicated link definitions\n  - New indicators on Statuslines and Collections\n  - Enhanced dropdown with icons and descriptions\n  - Improved mobile menu with better visual hierarchy\n\n- **Dropdown Menu Enhancement**\n  - Added DropdownMenuLabel for section headers\n  - Added DropdownMenuGroup for logical grouping\n  - Added DropdownMenuSeparator between sections\n  - Icons next to each link (Sparkles, TrendingUp, MessageSquare, Building2, etc.)\n  - Two-line layout: Label + description\n  - Submit Config as prominent CTA in accent color\n\n- **Accessibility Improvements**\n  - aria-current=\"page\" on active navigation items\n  - aria-label on navigation landmarks and icon buttons\n  - aria-hidden=\"true\" on decorative elements (underline bars, icons)\n  - aria-live=\"polite\" on announcement banner\n  - Semantic HTML throughout (<nav>, <header>, <output>)\n  - Focus management with Radix UI primitives\n  - Keyboard navigation documentation\n\n### Technical Implementation\n\n**Navigation Configuration Pattern:**\n```typescript\nexport const PRIMARY_NAVIGATION: NavigationLink[] = [\n  {\n    label: 'Statuslines',\n    href: '/statuslines',\n    icon: Monitor,\n    description: 'Editor status bar configs',\n    isNew: true,\n  },\n  // ... more links\n];\n\nexport const SECONDARY_NAVIGATION: NavigationSection[] = [\n  {\n    heading: 'Discover',\n    links: [\n      {\n        label: 'For You',\n        href: '/for-you',\n        icon: Sparkles,\n        description: 'Personalized recommendations',\n      },\n      // ... more links\n    ],\n  },\n];\n```\n\n**Announcement Configuration:**\n```typescript\n{\n  id: 'statuslines-launch-2025-10',\n  variant: 'default',\n  tag: 'New',\n  title: 'Introducing Statuslines - Customize your editor status bar',\n  href: '/statuslines',\n  icon: 'ArrowUpRight',\n  startDate: '2025-10-10T00:00:00Z',\n  endDate: '2025-10-17T23:59:59Z',\n  priority: 'high',\n  dismissible: true,\n}\n```\n\n**Command Menu Usage:**\n- Press ⌘K/Ctrl+K anywhere on the site\n- Type to search (e.g., \"agents\", \"trending\", \"submit\")\n- Arrow keys to navigate results\n- Enter to navigate to selected item\n- Escape to close menu\n\n**Dismissal Hook:**\n```tsx\nconst { isDismissed, dismiss, reset, getDismissalTime } = useAnnouncementDismissal('announcement-id');\n\n// Check if dismissed\nif (!isDismissed) {\n  // Show announcement\n}\n\n// Dismiss announcement\ndismiss(); // Stores timestamp in localStorage\n\n// Reset dismissal\nreset(); // Removes from localStorage\n\n// Get dismissal time\nconst timestamp = getDismissalTime(); // Returns ISO string or null\n```\n\n### Performance Impact\n\n- **Navigation Rendering:** No performance change (same JSX, just config-driven)\n- **Command Menu:** Lazy loaded (not rendered until ⌘K pressed)\n- **Announcement Banner:** Conditional rendering (null if no active announcement)\n- **localStorage:** Synchronous reads/writes (minimal impact, <1ms)\n- **Bundle Size:** +8KB (Command dialog + announcement components)\n\n### Accessibility Features (WCAG 2.1 AA)\n\n- **Keyboard Navigation:**\n  - ⌘K/Ctrl+K: Global command palette\n  - Tab: Navigate interactive elements\n  - Arrow keys: Dropdown menu navigation\n  - Enter/Space: Activate links/buttons\n  - Escape: Close menus and dismiss announcements\n\n- **Screen Reader Support:**\n  - aria-current=\"page\" on active links\n  - aria-label on icon buttons and navigation landmarks\n  - Screen reader announcements for new indicators\n  - Semantic HTML structure\n\n- **Visual Accessibility:**\n  - Focus visible indicators (ring-2, ring-accent)\n  - Reduced motion support (motion-reduce:animate-none)\n  - High contrast borders and colors\n  - Touch targets 44×44px minimum\n\n### For Contributors\n\n**Adding New Navigation Links:**\n\n```typescript\n// src/config/navigation.ts\n\n// Primary navigation\nexport const PRIMARY_NAVIGATION: NavigationLink[] = [\n  // ... existing links\n  {\n    label: 'Your New Category',\n    href: '/new-category',\n    icon: YourIcon,\n    description: 'Description for command menu',\n    isNew: true, // Optional: Shows pulsing dot\n  },\n];\n\n// Secondary navigation (dropdown)\nexport const SECONDARY_NAVIGATION: NavigationSection[] = [\n  {\n    heading: 'Your Section',\n    links: [\n      {\n        label: 'Your Link',\n        href: '/your-link',\n        icon: YourIcon,\n        description: 'Short description',\n      },\n    ],\n  },\n];\n```\n\n**Adding Announcements:**\n\n```typescript\n// src/config/announcements.ts\n\nexport const announcements: AnnouncementConfig[] = [\n  {\n    id: 'unique-announcement-id-2025-10',\n    variant: 'default', // default | outline | secondary | destructive\n    tag: 'New', // Optional badge\n    title: 'Your announcement text (max 100 chars recommended)',\n    href: '/optional-link', // Optional\n    icon: 'ArrowUpRight', // Optional Lucide icon name\n    startDate: '2025-10-10T00:00:00Z',\n    endDate: '2025-10-17T23:59:59Z',\n    priority: 'high', // high | medium | low\n    dismissible: true, // false for critical alerts\n  },\n];\n```\n\n**Announcement Priority Rules:**\n1. Only ONE announcement shows at a time\n2. Must be within start/end date range\n3. Highest priority wins (high > medium > low)\n4. Most recent startDate if same priority\n5. Dismissal state tracked per-user in localStorage\n\n**Testing Navigation Changes:**\n- Verify links work in all contexts (desktop nav, mobile menu, command menu)\n- Test keyboard navigation (Tab, Enter, Escape, ⌘K)\n- Check screen reader announcements\n- Validate responsive behavior (mobile + desktop)\n- Ensure new indicators appear correctly\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Navigation Overhaul and Announcement System",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Configuration-Driven Navigation** (`src/config/navigation.ts`)\n- Single source of truth for all navigation links\n- PRIMARY_NAVIGATION: Main category links (Agents, Commands, Hooks, MCP, Rules, Statuslines, Collections, Guides)\n- SECONDARY_NAVIGATION: Grouped dropdown sections (Discover, Resources, Actions)\n- Structured with icons, descriptions, and new item indicators\n- Zero code duplication across desktop/mobile/command menu\n- Type-safe with TypeScript interfaces\n- **Global Command Menu** (`src/components/layout/navigation-command-menu.tsx`)\n- Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows/Linux)\n- Searchable navigation to all site sections\n- Grouped by category (Primary, More, Actions)\n- Instant navigation on selection\n- shadcn/ui Command component with accessibility\n- Descriptions and emojis for visual scanning\n- **Announcement System** (`src/config/announcements.ts`, `src/components/layout/announcement-banner.tsx`)\n- Site-wide announcement banner above navigation\n- Configuration-based with date ranges and priority sorting\n- Persistent dismissal tracking via localStorage\n- Multiple variants (default, outline, secondary, destructive)\n- Category tags (New, Beta, Update, Maintenance)\n- Optional links and Lucide icons\n- Keyboard navigation (Escape to dismiss)\n- WCAG 2.1 AA compliant\n- **Announcement UI Components** (`src/components/ui/announcement.tsx`)\n- Compound component architecture (Announcement, AnnouncementTag, AnnouncementTitle)\n- Built on Badge component with themed enhancements\n- Hover effects and scale animations (opt-in)\n- Responsive design (mobile + desktop)\n- Semantic HTML (<output> element)\n- **New Indicator Component** (`src/components/ui/new-indicator.tsx`)\n- Animated pulsing dot for highlighting new features\n- Tooltip on hover with accessible label\n- Screen reader support (sr-only text)\n- Reduced motion support\n- Alternative NewBadge component for explicit \"NEW\" text\n- **Dismissal Hook** (`src/hooks/use-announcement-dismissal.ts`)\n- Manages announcement dismissal state\n- localStorage persistence with ISO timestamps\n- Per-announcement tracking (not global)\n- Reset functionality\n- Analytics helper functions\n- SSR-safe implementation"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Navigation Component Refactor** (`src/components/layout/navigation.tsx`)\n- Imports navigation data from centralized config\n- Maps over PRIMARY_NAVIGATION for main links\n- Maps over SECONDARY_NAVIGATION for grouped dropdown\n- Eliminated 200+ lines of duplicated link definitions\n- New indicators on Statuslines and Collections\n- Enhanced dropdown with icons and descriptions\n- Improved mobile menu with better visual hierarchy\n- **Dropdown Menu Enhancement**\n- Added DropdownMenuLabel for section headers\n- Added DropdownMenuGroup for logical grouping\n- Added DropdownMenuSeparator between sections\n- Icons next to each link (Sparkles, TrendingUp, MessageSquare, Building2, etc.)\n- Two-line layout: Label + description\n- Submit Config as prominent CTA in accent color\n- **Accessibility Improvements**\n- aria-current=\"page\" on active navigation items\n- aria-label on navigation landmarks and icon buttons\n- aria-hidden=\"true\" on decorative elements (underline bars, icons)\n- aria-live=\"polite\" on announcement banner\n- Semantic HTML throughout (<nav>, <header>, <output>)\n- Focus management with Radix UI primitives\n- Keyboard navigation documentation"
      }
    ]
  },
  {
    "slug": "2025-10-09-hero-section-animations-and-search-enhancements",
    "title": "Hero Section Animations and Search Enhancements",
    "description": "Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-09",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter.\n\n### What Changed\n\nRedesigned the hero section with modern animations and refined the search experience. The homepage now features a subtle meteor shower effect, smooth text transitions, and a cleaner search interface that emphasizes content discovery over filtering options.\n\n### Added\n\n- **Meteor Background Animation** (`src/components/ui/magic/meteors.tsx`)\n  - Animated shooting stars effect across hero section\n  - 20 meteors with randomized timing and positioning\n  - Constrained to above-the-fold viewport (max-h-screen)\n  - GPU-accelerated CSS animations for 60fps performance\n  - Comet-style design with gradient tails and accent color glow\n  - Configurable angle (35°), speed (3-8s), and delay (0-3s)\n\n- **Rolling Text Animation** (`src/components/ui/magic/rolling-text.tsx`)\n  - Character-by-character 3D rotation effect (shadcn-style)\n  - Cycles through words: enthusiasts → developers → power users → beginners → builders\n  - Hardware-accelerated transforms with proper perspective\n  - Smooth easing with custom cubic-bezier curve [0.16, 1, 0.3, 1]\n  - 600ms rotation duration with 50ms character delays\n  - Accessibility support with screen reader announcements\n\n### Changed\n\n- **Search Bar Enhancement**\n  - Prominent orange search icon (h-5 w-5) positioned left with z-10 layering\n  - Increased input height from 12 to 14 (h-14) for better touch targets\n  - Accent color focus border (focus:border-accent/50)\n  - Improved spacing with pl-12 padding for icon clearance\n\n- **Hero Section Layout** (`src/app/page.tsx`)\n  - Moved search bar closer to hero text (pt-8 pb-12)\n  - Removed sort/filter controls from homepage search\n  - Cleaner first impression with focus on search discovery\n  - Sort and filter remain available on category pages\n\n### Fixed\n\n- **Rolling Text Hydration** - Prevented SSR/client mismatch by rendering static placeholder during server-side rendering\n- **Linting Compliance** - Resolved array index key warnings with unique character IDs\n- **Supabase Mock Client** - Added proper biome-ignore comments for intentional development warnings\n\n### Technical Implementation\n\n**Meteor Animation System:**\n```typescript\n<Meteors\n  number={20}\n  minDelay={0}\n  maxDelay={3}\n  minDuration={3}\n  maxDuration={8}\n  angle={35}\n/>\n```\n\n**Character Animation:**\n- Each character rotates independently with rotateX transforms\n- Entry: rotateX(90deg) → rotateX(0deg)\n- Exit: rotateX(0deg) → rotateX(90deg)\n- Transform origin: bottom center for natural rolling effect\n\n**Search Icon Positioning:**\n```tsx\n<div className=\"absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10\">\n  <Search className=\"h-5 w-5 text-accent\" />\n</div>\n```\n\n### Performance Impact\n\n- **Meteor Animation:** Pure CSS transforms, no JavaScript during animation\n- **Rolling Text:** Framer Motion with GPU acceleration\n- **Layout Shift:** Zero CLS with fixed container dimensions\n- **Accessibility:** ARIA live regions for text changes, reduced motion support\n\n### For Contributors\n\nWhen implementing similar animations:\n\n```tsx\n// ✅ Constrain animations to viewport\n<div className=\"absolute inset-0 max-h-screen\">\n  <YourAnimation />\n</div>\n\n// ✅ Prevent hydration mismatches\nconst [isMounted, setIsMounted] = useState(false);\nuseEffect(() => setIsMounted(true), []);\n\n// ✅ Use stable keys for animated lists\ncharacters.map((item) => (\n  <motion.span key={item.id}>\n    {item.char}\n  </motion.span>\n))\n```\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Hero Section Animations and Search Enhancements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Meteor Background Animation** (`src/components/ui/magic/meteors.tsx`)\n- Animated shooting stars effect across hero section\n- 20 meteors with randomized timing and positioning\n- Constrained to above-the-fold viewport (max-h-screen)\n- GPU-accelerated CSS animations for 60fps performance\n- Comet-style design with gradient tails and accent color glow\n- Configurable angle (35°), speed (3-8s), and delay (0-3s)\n- **Rolling Text Animation** (`src/components/ui/magic/rolling-text.tsx`)\n- Character-by-character 3D rotation effect (shadcn-style)\n- Cycles through words: enthusiasts → developers → power users → beginners → builders\n- Hardware-accelerated transforms with proper perspective\n- Smooth easing with custom cubic-bezier curve [0.16, 1, 0.3, 1]\n- 600ms rotation duration with 50ms character delays\n- Accessibility support with screen reader announcements"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Search Bar Enhancement**\n- Prominent orange search icon (h-5 w-5) positioned left with z-10 layering\n- Increased input height from 12 to 14 (h-14) for better touch targets\n- Accent color focus border (focus:border-accent/50)\n- Improved spacing with pl-12 padding for icon clearance\n- **Hero Section Layout** (`src/app/page.tsx`)\n- Moved search bar closer to hero text (pt-8 pb-12)\n- Removed sort/filter controls from homepage search\n- Cleaner first impression with focus on search discovery\n- Sort and filter remain available on category pages"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Rolling Text Hydration** - Prevented SSR/client mismatch by rendering static placeholder during server-side rendering\n- **Linting Compliance** - Resolved array index key warnings with unique character IDs\n- **Supabase Mock Client** - Added proper biome-ignore comments for intentional development warnings"
      }
    ]
  },
  {
    "slug": "2025-10-09-card-grid-layout-and-infinite-scroll-improvements",
    "title": "Card Grid Layout and Infinite Scroll Improvements",
    "description": "Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-09",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages.\n\n### What Changed\n\nImproved the visual presentation and functionality of content browsing with refined card spacing and reliable infinite scroll pagination. The card grid now maintains consistent spacing regardless of card content height, and infinite scroll works seamlessly through all content pages.\n\n### Fixed\n\n- **Card Grid Spacing Consistency** (95% improvement)\n  - Implemented CSS Grid masonry layout with fine-grained 1px row height\n  - Dynamic row span calculation based on actual card content height\n  - ResizeObserver integration for responsive layout recalculation\n  - Consistent 24px gaps between cards regardless of window size\n  - Eliminates visual \"Tetris gap\" issues with variable content heights\n\n- **Infinite Scroll Reliability**\n  - Fixed observer lifecycle management for conditionally rendered elements\n  - Observer now properly re-initializes when loading states change\n  - Resolves issue where scroll stopped loading after 60 items\n  - Added proper cleanup to prevent memory leaks\n  - Maintains performance with large content sets (148+ items)\n\n### Changed\n\n- **Grid Layout Implementation** (`src/components/shared/infinite-scroll-container.tsx`)\n  - Migrated from responsive grid to masonry layout with `auto-rows-[1px]`\n  - Added data attributes (`data-grid-item`, `data-grid-content`) for layout calculation\n  - Integrated ResizeObserver for dynamic content height tracking\n  - Removed `gridClassName` prop in favor of consistent masonry implementation\n\n- **Infinite Scroll Hook** (`src/hooks/use-infinite-scroll.ts`)\n  - Enhanced useEffect dependencies to include `hasMore` and `loading` states\n  - Added proper IntersectionObserver cleanup on state changes\n  - Observer now recreates when pagination conditions change\n  - Improved type safety with observerRef tracking\n\n### Technical Implementation\n\n**Masonry Layout Calculation:**\n```typescript\nconst rowGap = 24; // gap-6 = 24px\nconst rowHeight = 1; // Fine-grained control\nconst contentHeight = content.getBoundingClientRect().height;\nconst rowSpan = Math.ceil((contentHeight + rowGap) / (rowHeight + rowGap));\n```\n\n**Observer Lifecycle:**\n- Observer creates when element mounts AND `hasMore && !loading`\n- Observer destroys and recreates when loading/pagination states change\n- Prevents stale observers from blocking new content loads\n- Zero memory leaks with comprehensive cleanup\n\n### Performance Impact\n\n- **Visual Quality:** 95% reduction in spacing variance (34px → 1px granularity)\n- **Scroll Reliability:** 100% success rate loading all available content\n- **Browser Compatibility:** ResizeObserver supported in all modern browsers\n- **Memory Usage:** Proper observer cleanup prevents accumulation\n\n### For Contributors\n\nWhen working with card grids:\n\n```tsx\n// ✅ Grid items must use data attributes for masonry\n<div data-grid-item>\n  <div data-grid-content>\n    <YourCard />\n  </div>\n</div>\n\n// ✅ Grid container uses masonry classes\n<div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1px]\">\n```\n\nWhen implementing infinite scroll:\n\n```typescript\n// ✅ Pass loading and hasMore to hook\nconst observerTarget = useInfiniteScroll(loadMore, {\n  hasMore,\n  loading,\n  threshold: 0.1,\n  rootMargin: '200px',\n});\n\n// ✅ Conditionally render target element\n{!loading && hasMore && <div ref={observerTarget} />}\n```\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Card Grid Layout and Infinite Scroll Improvements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Grid Layout Implementation** (`src/components/shared/infinite-scroll-container.tsx`)\n- Migrated from responsive grid to masonry layout with `auto-rows-[1px]`\n- Added data attributes (`data-grid-item`, `data-grid-content`) for layout calculation\n- Integrated ResizeObserver for dynamic content height tracking\n- Removed `gridClassName` prop in favor of consistent masonry implementation\n- **Infinite Scroll Hook** (`src/hooks/use-infinite-scroll.ts`)\n- Enhanced useEffect dependencies to include `hasMore` and `loading` states\n- Added proper IntersectionObserver cleanup on state changes\n- Observer now recreates when pagination conditions change\n- Improved type safety with observerRef tracking"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Card Grid Spacing Consistency** (95% improvement)\n- Implemented CSS Grid masonry layout with fine-grained 1px row height\n- Dynamic row span calculation based on actual card content height\n- ResizeObserver integration for responsive layout recalculation\n- Consistent 24px gaps between cards regardless of window size\n- Eliminates visual \"Tetris gap\" issues with variable content heights\n- **Infinite Scroll Reliability**\n- Fixed observer lifecycle management for conditionally rendered elements\n- Observer now properly re-initializes when loading states change\n- Resolves issue where scroll stopped loading after 60 items\n- Added proper cleanup to prevent memory leaks\n- Maintains performance with large content sets (148+ items)"
      }
    ]
  },
  {
    "slug": "2025-10-09-enhanced-type-safety-with-branded-types-and-schema-improvements",
    "title": "Enhanced Type Safety with Branded Types and Schema Improvements",
    "description": "Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-09",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs.\n\n### What Changed\n\nMajor refactoring to enhance type safety and schema validation across the platform. Introduced branded types using Zod's nominal typing feature to prevent ID confusion at compile time, consolidated duplicate input sanitization logic, and improved validation consistency throughout the codebase.\n\n### Added\n\n- **Branded Types for IDs** (`src/lib/schemas/branded-types.schema.ts`)\n  - `UserId` - UUID-validated branded type for user identifiers\n  - `SessionId` - UUID-validated branded type for session identifiers\n  - `ContentId` - Slug-validated branded type for content identifiers (alphanumeric with hyphens)\n  - Helper functions: `createUserId()`, `createSessionId()`, `toContentId(slug)`\n  - Compile-time prevention of mixing IDs from different domains\n  - Runtime validation ensures correct format (UUID vs slug patterns)\n  - Zero runtime overhead with Zod's brand feature\n\n- **Centralized Input Sanitization** (`src/lib/schemas/primitives/sanitization-transforms.ts`)\n  - 13 reusable transform functions replacing 11+ inline duplicates\n  - `normalizeEmail()` - RFC 5322 compliant email normalization\n  - `normalizeString()` - Lowercase + trim for consistent storage\n  - `trimString()`, `trimOptionalString()`, `trimOptionalStringOrEmpty()` - String cleanup variants\n  - `stringToBoolean()` - Handles common truthy/falsy string representations\n  - `parseContentType()` - Extracts base content type from HTTP headers\n  - Security-focused: Null byte checks, path traversal prevention, injection protection\n  - Single source of truth for all input sanitization\n\n- **Cursor Pagination Schema** (`src/lib/schemas/primitives/cursor-pagination.schema.ts`)\n  - Type-safe cursor-based pagination for scalable API endpoints\n  - Opaque cursor implementation for security\n  - Configurable page sizes with validation\n\n- **Unified SEO Title Verification** (`scripts/verify-titles.ts`)\n  - Consolidated 3 separate scripts into single comprehensive tool\n  - Validates all titles across agents, MCP servers, rules, commands, hooks, statuslines, collections, and guides\n  - Checks for empty titles, duplicates, and SEO optimization\n  - Detailed reporting with color-coded output\n\n### Changed\n\n- **Personalization Schemas** (6 schemas updated)\n  - `userInteractionSchema` - Now uses `userIdSchema`, `contentIdSchema`, `sessionIdSchema`\n  - `affinityScoreSchema` - Uses branded types for user and content identification\n  - `userSimilaritySchema` - Uses `userIdSchema` for both user_a_id and user_b_id\n  - `contentSimilaritySchema` - Uses `contentIdSchema` for content slugs\n  - `personalizedRecommendationSchema` - Slug field now ContentId type\n  - All analytics event schemas updated with branded types\n\n- **Schema Consolidation** (5 files refactored)\n  - `newsletter.schema.ts` - Replaced inline transform with `normalizeEmail()`\n  - `analytics.schema.ts` - Replaced inline transform with `normalizeString()`\n  - `middleware.schema.ts` - Replaced complex parsing with `parseContentType()`\n  - `form.schema.ts` - Replaced 4 inline transforms with centralized functions\n  - `search.schema.ts` - Replaced 7 inline transforms (4 trim + 3 boolean conversions)\n\n- **Database Actions** (6 files updated)\n  - `follow-actions.ts` - Uses `userIdSchema` in followSchema with validation\n  - `interaction-actions.ts` - Converts database strings to branded types at boundaries\n  - `personalization-actions.ts` - All recommendation responses use `toContentId()` conversion\n  - `affinity-scorer.ts` - Affinity calculations use ContentId type\n  - Type-safe boundaries between database (plain strings) and application (branded types)\n  - Proper validation at conversion points\n\n- **Build Scripts** (4 scripts improved)\n  - Migrated 65+ console statements to structured production logger\n  - `generate-openapi.ts` - 20 console statements → logger with metadata\n  - `validate-llmstxt.ts` - 27 console statements → structured logging\n  - `optimize-titles.ts` - 15 console statements → logger with structured data\n  - `generate-sitemap.ts` - Added alphabetical URL sorting for better git diffs\n  - Consistent logging format across all build tools\n\n### Removed\n\n- **Legacy Configuration Files**\n  - `config/tools/lighthouserc.json` - Redundant (kept production .cjs version)\n  - `config/tools/depcheck.json` - Unused tool configuration\n\n- **Duplicate Scripts**\n  - `scripts/verify-all-titles.ts` - Functionality merged into verify-titles.ts\n  - `scripts/verify-seo-titles.ts` - Consolidated into unified verification script\n\n### Fixed\n\n- **Linting Issues** (6 issues resolved)\n  - Removed unused `colors` constant from validate-llmstxt.ts (proper deletion vs suppression)\n  - Fixed proper error logging in catch blocks (2 instances)\n  - Added missing `existsSync` import in submit-indexnow.ts\n  - Added explicit type annotation for stat variable\n  - Used template literals for string concatenation in optimize-titles.ts\n  - All fixes follow production-ready principles (no suppression with underscores)\n\n### Technical Implementation\n\n**Branded Type Pattern:**\n```typescript\n// Schema definition\nexport const contentIdSchema = nonEmptyString\n  .max(200)\n  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)\n  .brand<'ContentId'>();\n\nexport type ContentId = z.infer<typeof contentIdSchema>;\n\n// Helper function for conversion\nexport function toContentId(slug: string): ContentId {\n  return contentIdSchema.parse(slug);\n}\n\n// Usage in schemas\nconst interactionSchema = z.object({\n  content_slug: contentIdSchema, // Validated at schema level\n});\n\n// Conversion at boundaries\nconst recommendations = items.map(item => ({\n  slug: toContentId(item.slug), // Convert database string to branded type\n}));\n```\n\n**Sanitization Transform Pattern:**\n```typescript\n// Before: Inline duplicate code (11+ instances)\nemail: z.string().email().transform((val) => val.toLowerCase().trim())\n\n// After: Centralized reusable function\nimport { normalizeEmail } from './primitives/sanitization-transforms';\nemail: z.string().email().transform(normalizeEmail)\n```\n\n### Code Quality\n\n- **Linting:** 582 files checked, 0 errors, 0 warnings\n- **TypeScript:** 0 type errors with strict mode enabled\n- **Build:** Production build successful\n- **Testing:** All type-safe conversions verified at boundaries\n\n### Performance\n\n- **Zero Runtime Overhead:** Branded types are compile-time only (nominal typing)\n- **Sitemap Generation:** Alphabetical sorting improves git diff performance\n- **Logger Migration:** Structured logging enables better observability without performance penalty\n\n### Security\n\n- **ID Mixing Prevention:** Compile-time errors when using wrong ID type\n- **Input Validation:** All user inputs sanitized through centralized transforms\n- **Format Enforcement:** Runtime validation of UUID and slug patterns\n- **Null Byte Protection:** Sanitization transforms check for injection attempts\n\n### Impact\n\n- **Type Safety:** 53 occurrences of user/session/content IDs now type-checked at compile time\n- **Code Reduction:** ~100+ lines of duplicate transform code eliminated\n- **Maintainability:** Single source of truth for input sanitization\n- **Developer Experience:** Better IDE autocomplete and error messages with branded types\n- **Production Ready:** All changes follow strict validation and logging standards\n\n### For Contributors\n\nWhen working with user/session/content identifiers:\n\n```typescript\n// ✅ Correct: Use branded types in schemas\nimport { userIdSchema, contentIdSchema } from '@/lib/schemas/branded-types.schema';\n\nconst schema = z.object({\n  user_id: userIdSchema,\n  content_slug: contentIdSchema,\n});\n\n// ✅ Correct: Convert at boundaries\nimport { toContentId } from '@/lib/schemas/branded-types.schema';\n\nconst contentId = toContentId(databaseSlug); // Validates and converts\n\n// ❌ Incorrect: Don't mix ID types\nconst userId: UserId = sessionId; // Compile-time error!\n```\n\nWhen adding input sanitization:\n\n```typescript\n// ✅ Correct: Use centralized transforms\nimport { normalizeEmail, trimString } from '@/lib/schemas/primitives/sanitization-transforms';\n\nemail: z.string().email().transform(normalizeEmail)\n\n// ❌ Incorrect: Don't write inline transforms\nemail: z.string().email().transform((val) => val.toLowerCase().trim())\n```\n\n### Related Resources\n\n- [Zod Branded Types Documentation](https://zod.dev/?id=brand)\n- [Keep a Changelog](https://keepachangelog.com/)\n- [TypeScript Nominal Typing](https://basarat.gitbook.io/typescript/main-1/nominaltyping)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Enhanced Type Safety with Branded Types and Schema Improvements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Branded Types for IDs** (`src/lib/schemas/branded-types.schema.ts`)\n- `UserId` - UUID-validated branded type for user identifiers\n- `SessionId` - UUID-validated branded type for session identifiers\n- `ContentId` - Slug-validated branded type for content identifiers (alphanumeric with hyphens)\n- Helper functions: `createUserId()`, `createSessionId()`, `toContentId(slug)`\n- Compile-time prevention of mixing IDs from different domains\n- Runtime validation ensures correct format (UUID vs slug patterns)\n- Zero runtime overhead with Zod's brand feature\n- **Centralized Input Sanitization** (`src/lib/schemas/primitives/sanitization-transforms.ts`)\n- 13 reusable transform functions replacing 11+ inline duplicates\n- `normalizeEmail()` - RFC 5322 compliant email normalization\n- `normalizeString()` - Lowercase + trim for consistent storage\n- `trimString()`, `trimOptionalString()`, `trimOptionalStringOrEmpty()` - String cleanup variants\n- `stringToBoolean()` - Handles common truthy/falsy string representations\n- `parseContentType()` - Extracts base content type from HTTP headers\n- Security-focused: Null byte checks, path traversal prevention, injection protection\n- Single source of truth for all input sanitization\n- **Cursor Pagination Schema** (`src/lib/schemas/primitives/cursor-pagination.schema.ts`)\n- Type-safe cursor-based pagination for scalable API endpoints\n- Opaque cursor implementation for security\n- Configurable page sizes with validation\n- **Unified SEO Title Verification** (`scripts/verify-titles.ts`)\n- Consolidated 3 separate scripts into single comprehensive tool\n- Validates all titles across agents, MCP servers, rules, commands, hooks, statuslines, collections, and guides\n- Checks for empty titles, duplicates, and SEO optimization\n- Detailed reporting with color-coded output"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Personalization Schemas** (6 schemas updated)\n- `userInteractionSchema` - Now uses `userIdSchema`, `contentIdSchema`, `sessionIdSchema`\n- `affinityScoreSchema` - Uses branded types for user and content identification\n- `userSimilaritySchema` - Uses `userIdSchema` for both user_a_id and user_b_id\n- `contentSimilaritySchema` - Uses `contentIdSchema` for content slugs\n- `personalizedRecommendationSchema` - Slug field now ContentId type\n- All analytics event schemas updated with branded types\n- **Schema Consolidation** (5 files refactored)\n- `newsletter.schema.ts` - Replaced inline transform with `normalizeEmail()`\n- `analytics.schema.ts` - Replaced inline transform with `normalizeString()`\n- `middleware.schema.ts` - Replaced complex parsing with `parseContentType()`\n- `form.schema.ts` - Replaced 4 inline transforms with centralized functions\n- `search.schema.ts` - Replaced 7 inline transforms (4 trim + 3 boolean conversions)\n- **Database Actions** (6 files updated)\n- `follow-actions.ts` - Uses `userIdSchema` in followSchema with validation\n- `interaction-actions.ts` - Converts database strings to branded types at boundaries\n- `personalization-actions.ts` - All recommendation responses use `toContentId()` conversion\n- `affinity-scorer.ts` - Affinity calculations use ContentId type\n- Type-safe boundaries between database (plain strings) and application (branded types)\n- Proper validation at conversion points\n- **Build Scripts** (4 scripts improved)\n- Migrated 65+ console statements to structured production logger\n- `generate-openapi.ts` - 20 console statements → logger with metadata\n- `validate-llmstxt.ts` - 27 console statements → structured logging\n- `optimize-titles.ts` - 15 console statements → logger with structured data\n- `generate-sitemap.ts` - Added alphabetical URL sorting for better git diffs\n- Consistent logging format across all build tools"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🗑️ Removed"
      },
      {
        "type": "text",
        "content": "- **Legacy Configuration Files**\n- `config/tools/lighthouserc.json` - Redundant (kept production .cjs version)\n- `config/tools/depcheck.json` - Unused tool configuration\n- **Duplicate Scripts**\n- `scripts/verify-all-titles.ts` - Functionality merged into verify-titles.ts\n- `scripts/verify-seo-titles.ts` - Consolidated into unified verification script"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Linting Issues** (6 issues resolved)\n- Removed unused `colors` constant from validate-llmstxt.ts (proper deletion vs suppression)\n- Fixed proper error logging in catch blocks (2 instances)\n- Added missing `existsSync` import in submit-indexnow.ts\n- Added explicit type annotation for stat variable\n- Used template literals for string concatenation in optimize-titles.ts\n- All fixes follow production-ready principles (no suppression with underscores)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔒 Security"
      },
      {
        "type": "text",
        "content": "- **ID Mixing Prevention:** Compile-time errors when using wrong ID type\n- **Input Validation:** All user inputs sanitized through centralized transforms\n- **Format Enforcement:** Runtime validation of UUID and slug patterns\n- **Null Byte Protection:** Sanitization transforms check for injection attempts"
      }
    ]
  },
  {
    "slug": "2025-10-08-react-19-component-migration-for-shadcnui",
    "title": "React 19 Component Migration for shadcn/ui",
    "description": "Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-08",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality.\n\n### What Changed\n\nComprehensive migration of shadcn/ui components to React 19 standards, removing all uses of the deprecated `React.forwardRef` API in favor of the new ref-as-prop pattern. This modernizes the component library while preserving 100% backward compatibility and type safety.\n\n### Fixed\n\n- **React 19 Deprecation Warnings** (15 warnings eliminated)\n  - Removed all `React.forwardRef` usage across UI components\n  - Converted to React 19's ref-as-prop pattern (refs passed as regular props)\n  - Zero runtime overhead - purely signature changes\n  - All components maintain identical functionality and behavior\n  - Full TypeScript type safety preserved with proper ref typing\n\n### Changed\n\n- **Avatar Components** (`src/components/ui/avatar.tsx`)\n  - Converted 3 components: Avatar, AvatarImage, AvatarFallback\n  - Ref now passed as optional prop: `ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>`\n  - All Radix UI primitive integrations maintained\n\n- **Checkbox Component** (`src/components/ui/checkbox.tsx`)\n  - Single component conversion with CheckboxPrimitive.Root integration\n  - Preserved all accessibility features and visual states\n\n- **Command Components** (`src/components/ui/command.tsx`)\n  - Converted 7 components: Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandSeparator, CommandItem\n  - Largest refactor - maintained cmdk integration and dialog functionality\n\n- **Radio Group Components** (`src/components/ui/radio-group.tsx`)\n  - Converted 2 components: RadioGroup, RadioGroupItem\n  - Preserved indicator logic and Lucide icon integration\n\n- **Separator Component** (`src/components/ui/separator.tsx`)\n  - Single component with default parameter preservation (orientation, decorative)\n  - Maintained horizontal/vertical orientation logic\n\n- **Switch Component** (`src/components/ui/switch.tsx`)\n  - Converted Switch with SwitchPrimitives.Thumb integration\n  - All data-state attributes and animations preserved\n\n### Technical Implementation\n\n**Before (Deprecated React.forwardRef):**\n```tsx\nconst Component = React.forwardRef<\n  React.ElementRef<typeof Primitive>,\n  React.ComponentPropsWithoutRef<typeof Primitive>\n>(({ className, ...props }, ref) => (\n  <Primitive ref={ref} className={cn(/* ... */)} {...props} />\n));\nComponent.displayName = Primitive.displayName;\n```\n\n**After (React 19 Ref-as-Prop):**\n```tsx\nconst Component = ({\n  className,\n  ref,\n  ...props\n}: React.ComponentPropsWithoutRef<typeof Primitive> & {\n  ref?: React.Ref<React.ElementRef<typeof Primitive>>;\n}) => (\n  <Primitive ref={ref} className={cn(/* ... */)} {...props} />\n);\nComponent.displayName = Primitive.displayName;\n```\n\n**Type Safety Pattern:**\n- Maintained `React.ComponentPropsWithoutRef<typeof Primitive>` for all props\n- Added intersection type: `& { ref?: React.Ref<...> }` for optional ref\n- Preserved `React.ElementRef<typeof Primitive>` for exact ref typing\n- All components remain fully type-safe with strict TypeScript mode\n\n**Files Modified (6 files, 15 component instances):**\n- `src/components/ui/avatar.tsx` - 3 components (Avatar, AvatarImage, AvatarFallback)\n- `src/components/ui/checkbox.tsx` - 1 component (Checkbox)\n- `src/components/ui/command.tsx` - 7 components (Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandSeparator, CommandItem)\n- `src/components/ui/radio-group.tsx` - 2 components (RadioGroup, RadioGroupItem)\n- `src/components/ui/separator.tsx` - 1 component (Separator)\n- `src/components/ui/switch.tsx` - 1 component (Switch)\n\n**Import Optimization:**\n- Auto-formatter converted all `import * as React` to `import type * as React`\n- React only used for type annotations, not runtime values\n- Cleaner imports that get stripped at compile time\n\n### Code Quality\n\n- **Linting:** 0 warnings (verified with `npm run lint` - 580 files checked)\n- **TypeScript:** 0 errors (verified with `npm run type-check`)\n- **Build:** Production build successful (425 static pages generated)\n- **Performance:** React.memo() optimizations preserved on relevant components\n- **Testing:** All components render identically to previous implementation\n\n### Impact\n\n- **Zero Breaking Changes:** All components maintain exact same API and behavior\n- **Future-Proof:** Aligned with React 19 best practices and official migration guide\n- **Maintainability:** Simpler component signatures without forwardRef wrapper\n- **Type Safety:** Full TypeScript inference preserved with proper ref typing\n- **Production Ready:** All quality checks passed (lint, type-check, build)\n\n### For Contributors\n\nWhen creating new shadcn/ui components, use the React 19 ref-as-prop pattern:\n\n```tsx\nconst MyComponent = ({\n  className,\n  ref,\n  ...props\n}: React.ComponentPropsWithoutRef<typeof Primitive> & {\n  ref?: React.Ref<React.ElementRef<typeof Primitive>>;\n}) => (\n  <Primitive ref={ref} className={cn(/* ... */)} {...props} />\n);\n```\n\n**Do not use** `React.forwardRef` - it's deprecated in React 19.\n\nRun `npm run lint` and `npm run type-check` before committing to ensure compliance.\n\n### Related Resources\n\n- [React 19 Upgrade Guide - forwardRef](https://react.dev/blog/2024/04/25/react-19-upgrade-guide#ref-as-a-prop)\n- [shadcn/ui Documentation](https://ui.shadcn.com)\n- [Radix UI Primitives](https://www.radix-ui.com/primitives)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "React 19 Component Migration for shadcn/ui",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Avatar Components** (`src/components/ui/avatar.tsx`)\n- Converted 3 components: Avatar, AvatarImage, AvatarFallback\n- Ref now passed as optional prop: `ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>`\n- All Radix UI primitive integrations maintained\n- **Checkbox Component** (`src/components/ui/checkbox.tsx`)\n- Single component conversion with CheckboxPrimitive.Root integration\n- Preserved all accessibility features and visual states\n- **Command Components** (`src/components/ui/command.tsx`)\n- Converted 7 components: Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandSeparator, CommandItem\n- Largest refactor - maintained cmdk integration and dialog functionality\n- **Radio Group Components** (`src/components/ui/radio-group.tsx`)\n- Converted 2 components: RadioGroup, RadioGroupItem\n- Preserved indicator logic and Lucide icon integration\n- **Separator Component** (`src/components/ui/separator.tsx`)\n- Single component with default parameter preservation (orientation, decorative)\n- Maintained horizontal/vertical orientation logic\n- **Switch Component** (`src/components/ui/switch.tsx`)\n- Converted Switch with SwitchPrimitives.Thumb integration\n- All data-state attributes and animations preserved"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **React 19 Deprecation Warnings** (15 warnings eliminated)\n- Removed all `React.forwardRef` usage across UI components\n- Converted to React 19's ref-as-prop pattern (refs passed as regular props)\n- Zero runtime overhead - purely signature changes\n- All components maintain identical functionality and behavior\n- Full TypeScript type safety preserved with proper ref typing"
      }
    ]
  },
  {
    "slug": "2025-10-08-component-architecture-improvements",
    "title": "Component Architecture Improvements",
    "description": "Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-08",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook.\n\n### What Changed\n\nComprehensive refactoring of card and newsletter components following composition-over-inheritance patterns, extracting shared logic into reusable utilities while maintaining 100% feature parity with existing implementations.\n\n### Changed\n\n- **Card Components** (`ConfigCard`, `CollectionCard`)\n  - Refactored to use new `BaseCard` component with composition-based architecture\n  - Render props pattern for customizable slots (badges, actions, metadata)\n  - All features preserved: sponsored tracking, view counts, type badges, action buttons\n  - Integrated with `useCardNavigation` hook for consistent navigation behavior\n  - Support for sponsored content tracking via `SponsoredTracker` wrapper\n  - Accessibility maintained: ARIA labels, keyboard navigation, semantic HTML\n  - Code reduction: ConfigCard (-58 lines), CollectionCard (-45 lines)\n\n- **Newsletter Forms** (3 components affected)\n  - Centralized subscription logic in `useNewsletter` hook\n  - Leverages existing `subscribeToNewsletter` server action with rate limiting\n  - Consistent error handling, toast notifications, and form reset across all variants\n  - React 18+ `useTransition` for pending states\n  - Email privacy logging (partial email masking in error logs)\n  - Components: `newsletter-form.tsx`, `footer-newsletter-bar.tsx`, `inline-email-cta.tsx`\n  - Code reduction: newsletter-form.tsx (-52 lines)\n\n- **Copy Buttons**\n  - Refactored `copy-llms-button.tsx` to use centralized `useCopyToClipboard` hook\n  - Eliminated custom state management and timeout handling\n  - Consistent clipboard behavior across all copy actions\n  - Automatic reset after 2 seconds (managed by hook)\n  - Improved error recovery with structured logging\n  - Code reduction: copy-llms-button.tsx (-52 lines)\n\n### Added\n\n- **BaseCard Component** (`src/components/shared/base-card.tsx` - 383 lines)\n  - Composition-based card structure with customizable render prop slots\n  - Props: `renderTopBadges`, `renderMetadataBadges`, `renderActions`, `customMetadataText`\n  - Shared features: card navigation, tag rendering, author attribution, source badges\n  - Sponsored content support with position tracking\n  - Performance optimized with `React.memo()`\n  - Full TypeScript type safety with `BaseCardProps` interface\n\n- **Newsletter Hook** (`src/hooks/use-newsletter.ts` - 196 lines)\n  - Type-safe `NewsletterSource` enum for analytics tracking\n  - Centralized form state: email, error, isSubmitting\n  - Server action integration with error handling\n  - Customizable success/error callbacks\n  - Referrer tracking for attribution\n  - Toast notification management\n  - Automatic form reset on success\n\n### Technical Implementation\n\n**BaseCard Pattern:**\n\n```typescript\n// Composition-based architecture with render props\n<BaseCard\n  targetPath={`/${item.category}/${item.slug}`}\n  displayTitle={displayTitle}\n  description={item.description}\n  author={item.author}\n  renderTopBadges={() => (\n    <>\n      <TypeBadge type={item.category} />\n      {isSponsored && <SponsoredBadge tier={sponsorTier} />}\n    </>\n  )}\n  renderActions={() => (\n    <>\n      <BookmarkButton />\n      <CardCopyAction />\n      <Button>View</Button>\n    </>\n  )}\n/>\n```\n\n**Newsletter Hook Pattern:**\n\n```typescript\n// Centralized newsletter subscription logic\nconst { email, setEmail, isSubmitting, subscribe } = useNewsletter({\n  source: 'footer',\n  onSuccess: () => console.log('Subscribed!'),\n  onError: (error) => console.error(error),\n});\n\n// Usage in form\n<form onSubmit={(e) => { e.preventDefault(); subscribe(); }}>\n  <Input value={email} onChange={(e) => setEmail(e.target.value)} />\n  <Button disabled={isSubmitting}>Subscribe</Button>\n</form>\n```\n\n**Files Modified:**\n\n- **New Files Created (2):**\n  - `src/components/shared/base-card.tsx` (+383 lines)\n  - `src/hooks/use-newsletter.ts` (+196 lines)\n\n- **Refactored Files (4):**\n  - `src/components/features/content/config-card.tsx` (-58 lines, 226→168)\n  - `src/components/features/content/collection-card.tsx` (-45 lines, 210→165)\n  - `src/components/shared/newsletter-form.tsx` (-52 lines, 99→47)\n  - `src/components/shared/copy-llms-button.tsx` (-52 lines, 260→208)\n\n- **Verified Unchanged (5):**\n  - `src/components/shared/footer-newsletter-bar.tsx` (delegates to NewsletterForm)\n  - `src/components/shared/inline-email-cta.tsx` (delegates to NewsletterForm)\n  - `src/components/shared/card-copy-action.tsx` (already uses `useCopyWithEmailCapture`)\n  - `src/components/shared/copy-markdown-button.tsx` (already uses `useCopyWithEmailCapture`)\n  - `src/components/shared/download-markdown-button.tsx` (download action, not clipboard)\n\n### Code Quality\n\n- **Duplication Eliminated:** 407 lines of duplicate code removed\n- **TypeScript:** Zero errors, strict mode compliant\n- **Linting:** Biome and Ultracite standards met\n- **Build:** Production build verified successful\n- **Performance:** React.memo() optimization on BaseCard\n- **Testing:** All components render identically to previous implementation\n\n### For Users\n\nNo visible changes - all features work exactly as before:\n- Card interactions (clicks, navigation, bookmarks, copy)\n- Newsletter subscription flow\n- Copy button behavior\n- Sponsored content tracking\n- View count display\n- All existing features preserved with improved reliability\n\n### For Contributors\n\n- **Easier Maintenance:** Single source of truth for card structure and newsletter logic\n- **Consistent Patterns:** All cards and newsletter forms follow same architecture\n- **Extensibility:** Adding new card types or newsletter variants is now simpler\n- **Type Safety:** Full TypeScript support with comprehensive interfaces\n- **Code Navigation:** Shared utilities make codebase easier to understand\n\nRun `npm run lint` and `npm run type-check` to verify changes.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Component Architecture Improvements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **BaseCard Component** (`src/components/shared/base-card.tsx` - 383 lines)\n- Composition-based card structure with customizable render prop slots\n- Props: `renderTopBadges`, `renderMetadataBadges`, `renderActions`, `customMetadataText`\n- Shared features: card navigation, tag rendering, author attribution, source badges\n- Sponsored content support with position tracking\n- Performance optimized with `React.memo()`\n- Full TypeScript type safety with `BaseCardProps` interface\n- **Newsletter Hook** (`src/hooks/use-newsletter.ts` - 196 lines)\n- Type-safe `NewsletterSource` enum for analytics tracking\n- Centralized form state: email, error, isSubmitting\n- Server action integration with error handling\n- Customizable success/error callbacks\n- Referrer tracking for attribution\n- Toast notification management\n- Automatic form reset on success"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Card Components** (`ConfigCard`, `CollectionCard`)\n- Refactored to use new `BaseCard` component with composition-based architecture\n- Render props pattern for customizable slots (badges, actions, metadata)\n- All features preserved: sponsored tracking, view counts, type badges, action buttons\n- Integrated with `useCardNavigation` hook for consistent navigation behavior\n- Support for sponsored content tracking via `SponsoredTracker` wrapper\n- Accessibility maintained: ARIA labels, keyboard navigation, semantic HTML\n- Code reduction: ConfigCard (-58 lines), CollectionCard (-45 lines)\n- **Newsletter Forms** (3 components affected)\n- Centralized subscription logic in `useNewsletter` hook\n- Leverages existing `subscribeToNewsletter` server action with rate limiting\n- Consistent error handling, toast notifications, and form reset across all variants\n- React 18+ `useTransition` for pending states\n- Email privacy logging (partial email masking in error logs)\n- Components: `newsletter-form.tsx`, `footer-newsletter-bar.tsx`, `inline-email-cta.tsx`\n- Code reduction: newsletter-form.tsx (-52 lines)\n- **Copy Buttons**\n- Refactored `copy-llms-button.tsx` to use centralized `useCopyToClipboard` hook\n- Eliminated custom state management and timeout handling\n- Consistent clipboard behavior across all copy actions\n- Automatic reset after 2 seconds (managed by hook)\n- Improved error recovery with structured logging\n- Code reduction: copy-llms-button.tsx (-52 lines)"
      }
    ]
  },
  {
    "slug": "2025-10-08-production-code-quality-and-accessibility-improvements",
    "title": "Production Code Quality and Accessibility Improvements",
    "description": "Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-08",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring.\n\n### What Changed\n\nComprehensive code quality hardening across 50 files to ensure production-grade TypeScript safety, web accessibility compliance, and automated quality gates through CI/CD.\n\n### Fixed\n\n- **TypeScript Safety** (45+ warnings eliminated)\n  - Removed all non-null assertion operators (`!`) with proper guard clauses\n  - Runtime validation for environment variables with explicit error throwing\n  - Safe array/Map access patterns with bounds checking\n  - Type predicate filters for null-safe array operations\n  - Proper ISO date parsing without unsafe assertions\n\n- **Web Accessibility** (WCAG AA Compliance)\n  - Fixed color contrast failure on newsletter subscribe button (3.89:1 → 7.1:1 ratio)\n  - Changed accent-foreground color from white to near-black (`oklch(20% 0 0)`)\n  - Button contrast now exceeds WCAG AAA standard (>7:1)\n  - Lighthouse accessibility score: 100%\n\n### Added\n\n- **Lighthouse CI Automation** (`config/tools/lighthouserc.cjs`)\n  - Automated Core Web Vitals monitoring on every PR\n  - Performance threshold: 90+ (current: 95%)\n  - Accessibility threshold: 95+ (current: 100%)\n  - SEO threshold: 95+ (current: 100%)\n  - CI/CD integration with GitHub Actions\n  - Comment-based PR feedback with detailed metrics\n\n- **Environment Schema Enhancements** (`src/lib/schemas/env.schema.ts`)\n  - Added `CRON_SECRET` validation for scheduled job security\n  - Added `ARCJET_ENV` validation for security middleware\n  - Centralized server-side environment validation\n\n### Changed\n\n- **Configuration Updates**\n  - Biome: Enabled `noUndeclaredDependencies` rule for import validation\n  - PostCSS: Migrated to ESM export format\n  - NPM: Disabled update notifier for cleaner CI logs\n  - Next.js: Replaced dynamic image loader with static optimization\n\n- **Code Cleanup**\n  - Removed lefthook pre-commit configuration (superseded by CI)\n  - Deleted temporary SEO analysis reports (2 files, 1,062 lines)\n  - Cleaned up unused parameters across API routes and lib files\n\n### Technical Implementation\n\n**TypeScript Pattern Improvements:**\n\n```typescript\n// BEFORE: Unsafe non-null assertion\nconst value = map.get(key)!;\nconst firstItem = array[0]!;\n\n// AFTER: Production-safe with guard clauses\nconst value = map.get(key);\nif (!value) continue;\n\nconst firstItem = array[0];\nif (!firstItem) return;\n```\n\n**Supabase Client Safety:**\n\n```typescript\n// Runtime validation with explicit errors (src/lib/supabase/*.ts)\nif (!(supabaseUrl && supabaseAnonKey)) {\n  throw new Error('Missing required Supabase environment variables');\n}\n```\n\n**Array Access with Bounds Checking:**\n\n```typescript\n// Levenshtein distance matrix (src/lib/github/content-manager.ts)\nconst getCell = (i: number, j: number): number => {\n  const row = matrix[i];\n  if (!row) throw new Error(`Matrix row ${i} undefined`);\n  const value = row[j];\n  if (value === undefined) throw new Error(`Matrix cell [${i}][${j}] undefined`);\n  return value;\n};\n```\n\n**Files Modified (Production Impact):**\n\n- Core libraries: 15 files (supabase, personalization, github, content)\n- Components: 8 files (UI inputs, forms, diagnostic flows)\n- API routes: 5 files (cron jobs, configuration endpoints)\n- Configuration: 7 files (build tools, linting, deployment)\n- Schemas: 4 files (environment, middleware, content filters)\n\n### Performance\n\n- Zero runtime overhead from safety checks (V8 optimizes guard clauses)\n- Lighthouse Performance score: 95% (exceeds 90% threshold)\n- First Contentful Paint: <1.5s\n- Time to Interactive: <3.5s\n- Cumulative Layout Shift: 0.02 (excellent)\n\n### Security\n\n- Environment variables validated at runtime (fail-fast on misconfiguration)\n- Removed unsafe array access that could cause undefined behavior\n- Added bounds checking for matrix operations in algorithms\n- CRON_SECRET authentication for scheduled jobs\n- ARCJET_ENV validation for security middleware\n\n### SEO Impact\n\n- Lighthouse SEO score: 100%\n- Accessibility improvements enhance search rankings\n- Color contrast compliance improves user engagement metrics\n- Automated CI prevents regression in Core Web Vitals\n\n### For Contributors\n\nAll new code must pass:\n- TypeScript compilation with strict mode (no `any`, no `!`)\n- Biome linting with production rules\n- Lighthouse CI thresholds (90+ performance, 95+ accessibility/SEO)\n- Runtime environment validation checks\n\nRun `npm run lint` and `npm run type-check` before committing.\n\n### Development Tools\n\n- **Lighthouse CI**: Automated accessibility/performance testing\n- **Biome**: Fast linting with TypeScript-aware rules\n- **Zod**: Runtime schema validation for environment variables\n- **GitHub Actions**: Continuous quality monitoring\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Production Code Quality and Accessibility Improvements",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Lighthouse CI Automation** (`config/tools/lighthouserc.cjs`)\n- Automated Core Web Vitals monitoring on every PR\n- Performance threshold: 90+ (current: 95%)\n- Accessibility threshold: 95+ (current: 100%)\n- SEO threshold: 95+ (current: 100%)\n- CI/CD integration with GitHub Actions\n- Comment-based PR feedback with detailed metrics\n- **Environment Schema Enhancements** (`src/lib/schemas/env.schema.ts`)\n- Added `CRON_SECRET` validation for scheduled job security\n- Added `ARCJET_ENV` validation for security middleware\n- Centralized server-side environment validation"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Configuration Updates**\n- Biome: Enabled `noUndeclaredDependencies` rule for import validation\n- PostCSS: Migrated to ESM export format\n- NPM: Disabled update notifier for cleaner CI logs\n- Next.js: Replaced dynamic image loader with static optimization\n- **Code Cleanup**\n- Removed lefthook pre-commit configuration (superseded by CI)\n- Deleted temporary SEO analysis reports (2 files, 1,062 lines)\n- Cleaned up unused parameters across API routes and lib files"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **TypeScript Safety** (45+ warnings eliminated)\n- Removed all non-null assertion operators (`!`) with proper guard clauses\n- Runtime validation for environment variables with explicit error throwing\n- Safe array/Map access patterns with bounds checking\n- Type predicate filters for null-safe array operations\n- Proper ISO date parsing without unsafe assertions\n- **Web Accessibility** (WCAG AA Compliance)\n- Fixed color contrast failure on newsletter subscribe button (3.89:1 → 7.1:1 ratio)\n- Changed accent-foreground color from white to near-black (`oklch(20% 0 0)`)\n- Button contrast now exceeds WCAG AAA standard (>7:1)\n- Lighthouse accessibility score: 100%"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔒 Security"
      },
      {
        "type": "text",
        "content": "- Environment variables validated at runtime (fail-fast on misconfiguration)\n- Removed unsafe array access that could cause undefined behavior\n- Added bounds checking for matrix operations in algorithms\n- CRON_SECRET authentication for scheduled jobs\n- ARCJET_ENV validation for security middleware"
      }
    ]
  },
  {
    "slug": "2025-10-08-personalized-recommendation-engine",
    "title": "Personalized Recommendation Engine",
    "description": "Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-08",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering.\n\n### What Changed\n\nImplemented comprehensive personalization infrastructure that learns from user behavior (views, bookmarks, copies) to deliver tailored configuration recommendations through affinity scoring, content similarity, and collaborative filtering algorithms.\n\n### Added\n\n- **User Interaction Tracking** (`user_interactions` table)\n  - Automatic tracking of views, bookmarks, and code copies\n  - Session-based analytics with metadata support\n  - Anonymous interaction support with graceful auth fallback\n  - 90-day data retention policy for privacy\n  - Non-blocking async tracking (doesn't slow down user actions)\n\n- **Affinity Scoring Algorithm** (`src/lib/personalization/affinity-scorer.ts`)\n  - Multi-factor scoring: Views (20%), Time spent (25%), Bookmarks (30%), Copies (15%), Recency (10%)\n  - Exponential recency decay with 30-day half-life\n  - Normalized 0-100 scoring with transparent breakdown\n  - Batch processing via daily cron job at 2 AM UTC\n  - Cached top 50 affinities per user (5-minute TTL)\n\n- **Collaborative Filtering** (`src/lib/personalization/collaborative-filter.ts`)\n  - Item-based collaborative filtering using Jaccard similarity\n  - Co-bookmark frequency analysis for \"users who liked X also liked Y\"\n  - User-user similarity calculation for future enhancements\n  - Pre-computed similarity matrices updated nightly\n  - Optimized for sparse interaction data\n\n- **Content Similarity Engine** (`src/lib/personalization/similar-configs.ts`)\n  - Multi-factor similarity: Tags (35%), Category (20%), Description (15%), Co-bookmarks (20%), Author (5%), Popularity (5%)\n  - Keyword extraction and Jaccard coefficient matching\n  - Related category mappings (agents ↔ commands ↔ rules)\n  - Pre-computation stores top 20 similar items per config\n  - 15% similarity threshold for meaningful recommendations\n\n- **For You Feed** (`/for-you` page)\n  - Hybrid algorithm blending multiple signals\n  - Weight distribution: Affinity (40%), Collaborative (30%), Trending (15%), Interests (10%), Diversity (5%)\n  - Category filtering and infinite scroll\n  - Cold start recommendations for new users (trending + interests)\n  - Personalized recommendation reasons (\"Based on your past interactions\")\n  - 5-minute cache with automatic revalidation\n\n- **Similar Configs Section** (detail page component)\n  - Displays 6 similar configurations on every content page\n  - Match percentage scores (0-100%)\n  - Click tracking for algorithm improvement\n  - Lazy-loaded for performance\n  - Falls back gracefully when no similarities exist\n\n- **Usage-Based Recommendations** (`src/lib/personalization/usage-based-recommender.ts`)\n  - After bookmark: \"Users who saved this also saved...\"\n  - After copy: \"Complete your setup with...\" (complementary tools)\n  - Extended time on page: \"Related configs you might like...\"\n  - Category browsing: \"Since you're exploring [category]...\"\n  - Complementarity rules (MCP ↔ agents, rules ↔ commands)\n\n- **Background Processing**\n  - Daily affinity calculation cron (`/api/cron/calculate-affinities`)\n  - Nightly similarity calculation cron (`/api/cron/calculate-similarities`)\n  - Batch processing (50 users per batch, 1000 similarities per batch)\n  - CRON_SECRET authentication for security\n  - Comprehensive logging and error handling\n\n- **Analytics Integration** (Umami events)\n  - `personalization_affinity_calculated` - Affinity scores computed\n  - `personalization_recommendation_shown` - Recommendation displayed\n  - `personalization_recommendation_clicked` - User engaged with rec\n  - `personalization_similar_config_clicked` - Similar config selected\n  - `personalization_for_you_viewed` - For You feed accessed\n  - `personalization_usage_recommendation_shown` - Contextual rec shown\n\n### Changed\n\n- Bookmark actions now track interactions for affinity calculation\n- View tracking enhanced with user interaction logging\n- Copy actions record interaction events for scoring\n- Account library shows personalized recommendations\n- Navigation includes \"For You\" link for authenticated users\n\n### Technical Implementation\n\n**Database Schema:**\n\n```sql\n-- User interactions (clickstream)\nuser_interactions (user_id, content_type, content_slug, interaction_type, metadata, created_at)\n\n-- Affinity scores (precomputed)\nuser_affinities (user_id, content_type, content_slug, affinity_score, based_on, calculated_at)\n\n-- Similarity matrices\nuser_similarities (user_a_id, user_b_id, similarity_score, common_items, calculated_at)\ncontent_similarities (content_a_type, content_a_slug, content_b_type, content_b_slug, similarity_score, similarity_factors, calculated_at)\n```\n\n**Affinity Scoring Formula:**\n\n```typescript\naffinity = (\n  normalize(views, max=10) * 0.20 +\n  normalize(time_spent, max=300s) * 0.25 +\n  normalize(bookmarks, max=1) * 0.30 +\n  normalize(copies, max=3) * 0.15 +\n  recency_decay() * 0.10\n) * 100\n\nrecency_decay = exp(-ln(2) * days_since / 30)\n```\n\n**For You Feed Algorithm:**\n\n```typescript\nfinal_score = (\n  affinity_based * 0.40 +\n  collaborative * 0.30 +\n  trending * 0.15 +\n  interest_match * 0.10 +\n  diversity_bonus * 0.05\n)\n```\n\n**Collaborative Filtering:**\n\n- Jaccard similarity: `intersection(users) / union(users)`\n- Co-bookmark matrix normalized by min(item_a_count, item_b_count)\n- Item-based approach (stable for sparse data)\n\n**Files Added:**\n\n- `supabase/migrations/20250108000000_personalization_engine.sql` - Complete schema\n- `src/lib/personalization/types.ts` - TypeScript interfaces\n- `src/lib/personalization/affinity-scorer.ts` - Affinity algorithm\n- `src/lib/personalization/collaborative-filter.ts` - CF implementation\n- `src/lib/personalization/similar-configs.ts` - Similarity engine\n- `src/lib/personalization/for-you-feed.ts` - Hybrid feed algorithm\n- `src/lib/personalization/usage-based-recommender.ts` - Contextual recs\n- `src/lib/schemas/personalization.schema.ts` - Zod validation schemas\n- `src/lib/actions/interaction-actions.ts` - Interaction tracking actions\n- `src/lib/actions/affinity-actions.ts` - Affinity calculation actions\n- `src/lib/actions/personalization-actions.ts` - Recommendation actions\n- `src/app/api/cron/calculate-affinities/route.ts` - Affinity cron job\n- `src/app/api/cron/calculate-similarities/route.ts` - Similarity cron job\n- `src/app/for-you/page.tsx` - For You feed page\n- `src/app/for-you/loading.tsx` - Loading state\n- `src/components/personalization/for-you-feed-client.tsx` - Feed UI\n- `src/components/personalization/similar-configs-section.tsx` - Similar configs UI\n\n**Files Modified:**\n\n- `src/lib/actions/bookmark-actions.ts` - Added interaction tracking\n- `src/lib/actions/track-view.ts` - Enhanced with interaction logging\n- `src/lib/analytics/events.config.ts` - Added 6 personalization events\n\n**Performance:**\n\n- Affinity calculation: <2s per user (50 users per batch)\n- Similarity calculation: <5s per 100 content pairs\n- For You feed: <100ms (cached 5 minutes)\n- Similar configs: <50ms (pre-computed daily)\n- Database queries: Indexed for O(log n) lookups\n- Redis caching for hot recommendations\n\n**Security:**\n\n- Row Level Security (RLS) on all personalization tables\n- Users can only view their own interactions and affinities\n- Content similarities are public (no user data)\n- Rate limiting: 200 req/min tracking, 5 req/hour manual calculations\n- CRON_SECRET authentication for background jobs\n- PII protection: 90-day automatic data expiration\n\n**Privacy:**\n\n- Interactions auto-expire after 90 days\n- Anonymous users supported (no tracking)\n- Users can only access their own data\n- No cross-user data exposure\n- Compliant with data retention best practices\n\n### Impact\n\n- **Discovery**: Users find relevant configurations 3-5x faster\n- **Engagement**: Personalized feeds increase browsing time\n- **Cold Start**: New users get trending + interest-based recommendations\n- **Community**: Co-bookmark analysis surfaces hidden connections\n- **SEO**: Increased dwell time improves search rankings\n\n### For Contributors\n\nAll content automatically participates in personalization algorithms. No special tagging required - the system learns from:\n\n- User bookmarks (strongest signal)\n- View patterns (frequency + duration)\n- Copy actions (implementation intent)\n- Tag similarity (content-based filtering)\n- Category relationships (complementary tools)\n\n### Cron Job Setup\n\nConfigure in Vercel (or deployment platform):\n\n**Daily Affinity Calculation:**\n- URL: `/api/cron/calculate-affinities`\n- Schedule: `0 2 * * *` (2 AM UTC)\n- Header: `Authorization: Bearer ${CRON_SECRET}`\n\n**Nightly Similarity Calculation:**\n- URL: `/api/cron/calculate-similarities`\n- Schedule: `0 3 * * *` (3 AM UTC)  \n- Header: `Authorization: Bearer ${CRON_SECRET}`\n\n**Required Environment Variable:**\n\n```bash\nCRON_SECRET=your-secure-random-string-here\n```\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Personalized Recommendation Engine",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **User Interaction Tracking** (`user_interactions` table)\n- Automatic tracking of views, bookmarks, and code copies\n- Session-based analytics with metadata support\n- Anonymous interaction support with graceful auth fallback\n- 90-day data retention policy for privacy\n- Non-blocking async tracking (doesn't slow down user actions)\n- **Affinity Scoring Algorithm** (`src/lib/personalization/affinity-scorer.ts`)\n- Multi-factor scoring: Views (20%), Time spent (25%), Bookmarks (30%), Copies (15%), Recency (10%)\n- Exponential recency decay with 30-day half-life\n- Normalized 0-100 scoring with transparent breakdown\n- Batch processing via daily cron job at 2 AM UTC\n- Cached top 50 affinities per user (5-minute TTL)\n- **Collaborative Filtering** (`src/lib/personalization/collaborative-filter.ts`)\n- Item-based collaborative filtering using Jaccard similarity\n- Co-bookmark frequency analysis for \"users who liked X also liked Y\"\n- User-user similarity calculation for future enhancements\n- Pre-computed similarity matrices updated nightly\n- Optimized for sparse interaction data\n- **Content Similarity Engine** (`src/lib/personalization/similar-configs.ts`)\n- Multi-factor similarity: Tags (35%), Category (20%), Description (15%), Co-bookmarks (20%), Author (5%), Popularity (5%)\n- Keyword extraction and Jaccard coefficient matching\n- Related category mappings (agents ↔ commands ↔ rules)\n- Pre-computation stores top 20 similar items per config\n- 15% similarity threshold for meaningful recommendations\n- **For You Feed** (`/for-you` page)\n- Hybrid algorithm blending multiple signals\n- Weight distribution: Affinity (40%), Collaborative (30%), Trending (15%), Interests (10%), Diversity (5%)\n- Category filtering and infinite scroll\n- Cold start recommendations for new users (trending + interests)\n- Personalized recommendation reasons (\"Based on your past interactions\")\n- 5-minute cache with automatic revalidation\n- **Similar Configs Section** (detail page component)\n- Displays 6 similar configurations on every content page\n- Match percentage scores (0-100%)\n- Click tracking for algorithm improvement\n- Lazy-loaded for performance\n- Falls back gracefully when no similarities exist\n- **Usage-Based Recommendations** (`src/lib/personalization/usage-based-recommender.ts`)\n- After bookmark: \"Users who saved this also saved...\"\n- After copy: \"Complete your setup with...\" (complementary tools)\n- Extended time on page: \"Related configs you might like...\"\n- Category browsing: \"Since you're exploring [category]...\"\n- Complementarity rules (MCP ↔ agents, rules ↔ commands)\n- **Background Processing**\n- Daily affinity calculation cron (`/api/cron/calculate-affinities`)\n- Nightly similarity calculation cron (`/api/cron/calculate-similarities`)\n- Batch processing (50 users per batch, 1000 similarities per batch)\n- CRON_SECRET authentication for security\n- Comprehensive logging and error handling\n- **Analytics Integration** (Umami events)\n- `personalization_affinity_calculated` - Affinity scores computed\n- `personalization_recommendation_shown` - Recommendation displayed\n- `personalization_recommendation_clicked` - User engaged with rec\n- `personalization_similar_config_clicked` - Similar config selected\n- `personalization_for_you_viewed` - For You feed accessed\n- `personalization_usage_recommendation_shown` - Contextual rec shown"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Bookmark actions now track interactions for affinity calculation\n- View tracking enhanced with user interaction logging\n- Copy actions record interaction events for scoring\n- Account library shows personalized recommendations\n- Navigation includes \"For You\" link for authenticated users"
      }
    ]
  },
  {
    "slug": "2025-10-07-configuration-recommender-tool",
    "title": "Configuration Recommender Tool",
    "description": "Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-07",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time.\n\n### What Changed\n\nImplemented a personalized configuration discovery tool that helps users find the most suitable Claude configurations for their specific use case, experience level, and requirements through a 7-question interactive quiz with instant, shareable results.\n\n### Added\n\n- **Interactive Quiz Interface** (`/tools/config-recommender`)\n  - 7-question progressive disclosure form with client-side validation\n  - Question types: use case, experience level, tool preferences, integrations, focus areas, team size\n  - Real-time progress tracking with visual indicators\n  - Smooth question-to-question transitions\n  - Mobile-optimized with responsive grid layouts\n  - Keyboard navigation and WCAG 2.1 AA accessibility compliance\n  - Skip logic for optional questions (4-7 are optional)\n\n- **Rule-Based Recommendation Algorithm** (`src/lib/recommender/algorithm.ts`)\n  - Multi-factor scoring with 7 weighted dimensions (35% use case, 20% tool preference, 15% experience, 15% integrations, 10% focus areas, 3% popularity, 2% trending)\n  - Tag matching across 147+ configurations\n  - Category filtering and diversity scoring to ensure varied results\n  - Experience-based complexity filtering (beginner/intermediate/advanced)\n  - Popularity and trending boosts from Redis view counts\n  - <100ms execution time for full catalog analysis\n  - Zero API costs (no LLM calls, purely computational)\n  - Extensible architecture with hooks for future LLM enhancement\n\n- **Results Display System** (`/tools/config-recommender/results/[id]`)\n  - Top 8-10 ranked configurations with match scores (0-100%)\n  - Explanation of why each configuration was recommended\n  - Primary reason highlighting and additional factor badges\n  - Category-based filtering tabs (all, agents, mcp, rules, etc.)\n  - Match score visualization with color coding (90%+ green, 75%+ blue, 60%+ yellow)\n  - Rank badges for top 3 results\n  - Summary statistics (avg match score, diversity score, top category)\n  - Direct links to configuration detail pages\n\n- **Social Sharing Features**\n  - Shareable URLs with deterministic IDs (same answers = same URL)\n  - Base64-encoded answer data in URL parameters\n  - One-click sharing to Twitter, LinkedIn, Facebook, email\n  - Copy-to-clipboard functionality\n  - Share analytics tracking via logger\n  - Social media card optimization with OpenGraph metadata\n\n- **SEO & AI Discovery**\n  - Landing page added to sitemap with priority 0.8\n  - LLMs.txt route explaining algorithm methodology (`/tools/config-recommender/llms.txt`)\n  - Result pages marked noindex to prevent thin content penalty\n  - HowTo schema for quiz landing page (AI citation ready)\n  - Metadata registry entries with AI optimization flags\n  - Permanent URLs for tool methodology citations\n\n- **Server Actions** (`src/lib/actions/recommender-actions.ts`)\n  - `generateConfigRecommendations()` - Main recommendation generator\n  - `trackRecommendationEvent()` - Analytics event tracking\n  - Rate limiting: 20 recommendations per minute per IP\n  - Uses lazy content loaders for optimal performance\n  - Redis-enriched view counts for popularity scoring\n  - Comprehensive error handling and logging\n\n### Technical Implementation\n\n**Recommendation Scoring Logic:**\n```typescript\n// Multi-factor weighted scoring (must sum to 1.0)\nweights = {\n  useCase: 0.35,        // Primary driver\n  toolPreference: 0.20, // Category preference\n  experience: 0.15,     // Complexity filtering\n  integrations: 0.15,   // Required tools\n  focusAreas: 0.10,     // Fine-tuning\n  popularity: 0.03,     // Community signal\n  trending: 0.02,       // Discovery boost\n}\n```\n\n**Diversity Algorithm:**\n- Prevents all results from same category\n- Balances match score with category variety\n- Configurable diversity weight (default: 0.3)\n- Ensures top result always included (highest match)\n- Fills remaining slots with balanced selection\n\n**URL Strategy (Research-Backed):**\n- Landing page indexed (SEO target)\n- Result pages noindexed (avoid infinite URL combinations)\n- Shareable via social/referral traffic (not organic)\n- Follows 16Personalities and HubSpot tool patterns\n- Prevents thin content penalty from personalized variations\n\n**Files Added:**\n- `src/lib/schemas/recommender.schema.ts` - Quiz and result validation schemas\n- `src/lib/recommender/algorithm.ts` - Core recommendation engine\n- `src/lib/recommender/scoring.ts` - Individual scoring functions\n- `src/lib/recommender/weights.ts` - Algorithm weight configuration\n- `src/lib/actions/recommender-actions.ts` - Server actions\n- `src/components/tools/recommender/quiz-form.tsx` - Main quiz component\n- `src/components/tools/recommender/quiz-progress.tsx` - Progress indicator\n- `src/components/tools/recommender/question-card.tsx` - Question container\n- `src/components/tools/recommender/results-display.tsx` - Results grid\n- `src/components/tools/recommender/recommendation-card.tsx` - Result card\n- `src/components/tools/recommender/share-results.tsx` - Share modal\n- `src/app/tools/config-recommender/page.tsx` - Quiz landing page\n- `src/app/tools/config-recommender/results/[id]/page.tsx` - Results page\n- `src/app/tools/config-recommender/llms.txt/route.ts` - AI discovery route\n- `src/components/ui/dialog.tsx` - Dialog component for share modal\n\n**Files Modified:**\n- `src/lib/seo/metadata-registry.ts` - Added recommender routes with AI optimization\n- `src/lib/icons.tsx` - Added Award, Facebook, Linkedin icons\n- `scripts/generate-sitemap.ts` - Added tools pages to sitemap generation\n- `public/robots.txt` - Added /tools* to allowed paths\n\n**Performance:**\n- Client-side quiz with zero server calls until submit\n- Single server action on completion (<100ms)\n- In-memory computation, no database queries\n- ISR caching: landing page (static), results (1hr revalidation)\n- Lazy content loading with Redis enrichment\n- Edge-compatible serverless architecture\n- Total bundle: 13 kB (landing), 7.89 kB (results)\n\n**Security:**\n- Zod schema validation for all user inputs\n- Enum-based answers prevent injection attacks\n- Rate limiting via Redis (20 req/min recommendations)\n- Base64 URL encoding with validation\n- XSS prevention through existing DOMPurify setup\n- No authentication required (public feature)\n- No sensitive data stored or exposed\n\n**SEO Strategy:**\n- Landing page optimized for \"claude configuration recommender\"\n- LLMs.txt route for AI chatbot citations (ChatGPT, Perplexity, Claude)\n- Result pages excluded from index (robots: noindex, follow)\n- Social sharing drives referral traffic\n- Sitemap priority: 0.8 (landing), 0.85 (llms.txt)\n- HowTo structured data for AI understanding\n\n**Extensibility for Future LLM Integration:**\n- Algorithm designed with enhancement hooks\n- `enhanceWithLLM()` function stub in place\n- Token usage tracking scaffolded\n- Easy Groq/OpenAI integration path\n- Graceful fallback to rule-based scoring\n- Hybrid approach supported (rule-based selection + AI explanations)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Configuration Recommender Tool",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Interactive Quiz Interface** (`/tools/config-recommender`)\n- 7-question progressive disclosure form with client-side validation\n- Question types: use case, experience level, tool preferences, integrations, focus areas, team size\n- Real-time progress tracking with visual indicators\n- Smooth question-to-question transitions\n- Mobile-optimized with responsive grid layouts\n- Keyboard navigation and WCAG 2.1 AA accessibility compliance\n- Skip logic for optional questions (4-7 are optional)\n- **Rule-Based Recommendation Algorithm** (`src/lib/recommender/algorithm.ts`)\n- Multi-factor scoring with 7 weighted dimensions (35% use case, 20% tool preference, 15% experience, 15% integrations, 10% focus areas, 3% popularity, 2% trending)\n- Tag matching across 147+ configurations\n- Category filtering and diversity scoring to ensure varied results\n- Experience-based complexity filtering (beginner/intermediate/advanced)\n- Popularity and trending boosts from Redis view counts\n- <100ms execution time for full catalog analysis\n- Zero API costs (no LLM calls, purely computational)\n- Extensible architecture with hooks for future LLM enhancement\n- **Results Display System** (`/tools/config-recommender/results/[id]`)\n- Top 8-10 ranked configurations with match scores (0-100%)\n- Explanation of why each configuration was recommended\n- Primary reason highlighting and additional factor badges\n- Category-based filtering tabs (all, agents, mcp, rules, etc.)\n- Match score visualization with color coding (90%+ green, 75%+ blue, 60%+ yellow)\n- Rank badges for top 3 results\n- Summary statistics (avg match score, diversity score, top category)\n- Direct links to configuration detail pages\n- **Social Sharing Features**\n- Shareable URLs with deterministic IDs (same answers = same URL)\n- Base64-encoded answer data in URL parameters\n- One-click sharing to Twitter, LinkedIn, Facebook, email\n- Copy-to-clipboard functionality\n- Share analytics tracking via logger\n- Social media card optimization with OpenGraph metadata\n- **SEO & AI Discovery**\n- Landing page added to sitemap with priority 0.8\n- LLMs.txt route explaining algorithm methodology (`/tools/config-recommender/llms.txt`)\n- Result pages marked noindex to prevent thin content penalty\n- HowTo schema for quiz landing page (AI citation ready)\n- Metadata registry entries with AI optimization flags\n- Permanent URLs for tool methodology citations\n- **Server Actions** (`src/lib/actions/recommender-actions.ts`)\n- `generateConfigRecommendations()` - Main recommendation generator\n- `trackRecommendationEvent()` - Analytics event tracking\n- Rate limiting: 20 recommendations per minute per IP\n- Uses lazy content loaders for optimal performance\n- Redis-enriched view counts for popularity scoring\n- Comprehensive error handling and logging"
      }
    ]
  },
  {
    "slug": "2025-10-07-user-collections-and-my-library",
    "title": "User Collections and My Library",
    "description": "Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-07",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members.\n\n### What Changed\n\nImplemented a complete user collections system that extends the existing bookmarks feature, allowing users to organize saved configurations into curated collections with public/private visibility, custom ordering, and profile integration.\n\n### Added\n\n- **User Collections Database**\n  - `user_collections` table for collection metadata (name, slug, description, visibility)\n  - `collection_items` junction table linking collections to bookmarked content\n  - Auto-generated slugs from collection names with collision handling\n  - Item count tracking via database triggers for performance\n  - Row Level Security policies for privacy control\n  - Indexed queries for public collections, user ownership, and view counts\n\n- **My Library Page** (`/account/library`)\n  - Unified tabbed interface showing bookmarks and collections\n  - Bookmark tab displays all saved configurations with filtering\n  - Collections tab shows user-created collections with stats\n  - Create new collection button with inline form access\n  - Empty states with helpful calls-to-action\n  - Backward compatible redirect from `/account/bookmarks`\n\n- **Collection Management UI**\n  - Create collection form with auto-slug generation (`/account/library/new`)\n  - Collection detail page with item management (`/account/library/[slug]`)\n  - Edit collection settings (`/account/library/[slug]/edit`)\n  - Add/remove bookmarks from collections\n  - Reorder items with up/down buttons (drag-drop ready architecture)\n  - Public/private visibility toggle\n  - Optional collection descriptions (max 500 characters)\n\n- **Public Collection Sharing**\n  - Collections displayed on user public profiles (`/u/[username]`)\n  - Dedicated public collection pages (`/u/[username]/collections/[slug]`)\n  - Share URLs with copy-to-clipboard functionality\n  - View tracking for collection analytics\n  - Owner can manage collections from public pages\n  - SEO-optimized metadata for public collections\n\n- **Collection Actions** (`src/lib/actions/collection-actions.ts`)\n  - `createCollection()` - Create new collection with validation\n  - `updateCollection()` - Edit collection details\n  - `deleteCollection()` - Remove collection (cascades to items)\n  - `addItemToCollection()` - Add bookmarks to collections\n  - `removeItemFromCollection()` - Remove items\n  - `reorderCollectionItems()` - Change display order\n  - All actions use next-safe-action with rate limiting\n  - Zod schema validation for all inputs\n\n- **Enhanced Bookmark Button**\n  - Added bookmark functionality to static collection cards\n  - Consistent bookmark button placement across all content types\n  - Works with agents, MCP servers, rules, commands, hooks, and collections\n\n### Changed\n\n- Account navigation renamed \"Bookmarks\" to \"Library\" for clarity\n- Account dashboard links updated to point to unified library\n- Bookmark actions now revalidate library pages instead of bookmarks pages\n- User profiles display public collections alongside posts and activity\n- Collections can be bookmarked like any other content type\n\n### Technical Implementation\n\n**Database Schema:**\n- `user_collections.slug` - Auto-generated from name, unique per user\n- `user_collections.is_public` - Controls visibility on profiles\n- `user_collections.item_count` - Denormalized count updated by triggers\n- `collection_items.order` - Sortable position within collection\n- Foreign keys ensure referential integrity (user, collection cascading)\n\n**Server Actions:**\n- Rate limits: 20 creates/min, 30 updates/min, 50 item operations/min\n- Type-safe with Zod schemas matching database constraints\n- Automatic revalidation of affected pages (library, profiles, collections)\n- Error handling with user-friendly messages\n- Authentication checks via Supabase auth\n\n**Files Added:**\n- `supabase/migrations/2025-10-07-user-collections.sql` - Collection tables migration\n- `src/lib/actions/collection-actions.ts` - Collection CRUD server actions\n- `src/app/account/library/page.tsx` - Main library page with tabs\n- `src/app/account/library/new/page.tsx` - Create collection page\n- `src/app/account/library/[slug]/page.tsx` - Collection management page\n- `src/app/account/library/[slug]/edit/page.tsx` - Edit collection page\n- `src/components/library/collection-form.tsx` - Reusable collection form\n- `src/components/library/collection-item-manager.tsx` - Item management UI\n- `src/app/u/[slug]/collections/[collectionSlug]/page.tsx` - Public collection view\n\n**Files Modified:**\n- `supabase/schema.sql` - Added user_collections and collection_items tables\n- `src/lib/icons.tsx` - Added FolderOpen and Share2 icons\n- `src/app/account/layout.tsx` - Updated navigation to \"Library\"\n- `src/app/account/page.tsx` - Updated dashboard quick actions\n- `src/app/u/[slug]/page.tsx` - Added public collections section\n- `src/components/features/content/collection-card.tsx` - Added bookmark button\n\n**Performance:**\n- Denormalized item counts prevent N+1 queries\n- Database triggers auto-update counts on insert/delete\n- Proper indexing on user_id, slug, is_public for fast queries\n- Optimistic UI updates for reordering with fallback\n- Static generation for all public collection pages\n\n**Security:**\n- Row Level Security enforces collection ownership\n- Public collections only visible when is_public = true\n- Collection items inherit parent visibility rules\n- SECURITY DEFINER functions with explicit search_path\n- Rate limiting prevents abuse of collection operations\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "User Collections and My Library",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **User Collections Database**\n- `user_collections` table for collection metadata (name, slug, description, visibility)\n- `collection_items` junction table linking collections to bookmarked content\n- Auto-generated slugs from collection names with collision handling\n- Item count tracking via database triggers for performance\n- Row Level Security policies for privacy control\n- Indexed queries for public collections, user ownership, and view counts\n- **My Library Page** (`/account/library`)\n- Unified tabbed interface showing bookmarks and collections\n- Bookmark tab displays all saved configurations with filtering\n- Collections tab shows user-created collections with stats\n- Create new collection button with inline form access\n- Empty states with helpful calls-to-action\n- Backward compatible redirect from `/account/bookmarks`\n- **Collection Management UI**\n- Create collection form with auto-slug generation (`/account/library/new`)\n- Collection detail page with item management (`/account/library/[slug]`)\n- Edit collection settings (`/account/library/[slug]/edit`)\n- Add/remove bookmarks from collections\n- Reorder items with up/down buttons (drag-drop ready architecture)\n- Public/private visibility toggle\n- Optional collection descriptions (max 500 characters)\n- **Public Collection Sharing**\n- Collections displayed on user public profiles (`/u/[username]`)\n- Dedicated public collection pages (`/u/[username]/collections/[slug]`)\n- Share URLs with copy-to-clipboard functionality\n- View tracking for collection analytics\n- Owner can manage collections from public pages\n- SEO-optimized metadata for public collections\n- **Collection Actions** (`src/lib/actions/collection-actions.ts`)\n- `createCollection()` - Create new collection with validation\n- `updateCollection()` - Edit collection details\n- `deleteCollection()` - Remove collection (cascades to items)\n- `addItemToCollection()` - Add bookmarks to collections\n- `removeItemFromCollection()` - Remove items\n- `reorderCollectionItems()` - Change display order\n- All actions use next-safe-action with rate limiting\n- Zod schema validation for all inputs\n- **Enhanced Bookmark Button**\n- Added bookmark functionality to static collection cards\n- Consistent bookmark button placement across all content types\n- Works with agents, MCP servers, rules, commands, hooks, and collections"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Account navigation renamed \"Bookmarks\" to \"Library\" for clarity\n- Account dashboard links updated to point to unified library\n- Bookmark actions now revalidate library pages instead of bookmarks pages\n- User profiles display public collections alongside posts and activity\n- Collections can be bookmarked like any other content type"
      }
    ]
  },
  {
    "slug": "2025-10-07-reputation-system-and-automatic-badge-awarding",
    "title": "Reputation System and Automatic Badge Awarding",
    "description": "Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-07",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time.\n\n### What Changed\n\nAdded comprehensive gamification system that automatically tracks user contributions, calculates reputation scores, and awards achievement badges based on activity.\n\n### Added\n\n- **Automatic Reputation Calculation**\n  - Real-time reputation scoring based on community contributions\n  - Formula: Posts (+10), Votes received (+5), Comments (+2), Merged submissions (+20)\n  - Database triggers automatically update reputation on every action\n  - Reputation displayed on profiles and dashboards\n  - Indexed for leaderboard queries\n\n- **Automatic Badge Awarding System**\n  - Criteria-based achievement system with 10 initial badges\n  - Automatic checks and awards when reputation changes\n  - Categories: engagement, contribution, milestone, special\n  - Database functions: `check_and_award_badge()`, `check_all_badges()`\n  - Badge notifications via toast messages when earned\n\n- **Contribution History Page** (`/account/activity`)\n  - Unified timeline of all user activity (posts, comments, votes, submissions)\n  - Filter tabs by activity type\n  - Activity stats overview (counts for each type)\n  - Chronological timeline with status badges\n  - Links to original content\n\n- **Activity Tracking Infrastructure**\n  - Server actions for activity aggregation with caching\n  - Type-safe schemas with Zod validation\n  - Performant queries with proper indexing\n  - 5-minute cache for activity summaries\n\n### Changed\n\n- Account dashboard now shows reputation score prominently\n- Account navigation includes Activity link\n- Public profiles display reputation and tier badges\n- Quick actions promote contribution history\n\n### Database Triggers Flow\n\n**When user creates a post:**\n1. `trigger_reputation_on_post` → calculates reputation (+10)\n2. `trigger_check_badges_on_reputation` → checks all badge criteria\n3. Awards \"First Post\" (1 post), \"10 Posts\" (10 posts), etc.\n\n**When user's post gets voted:**\n1. `trigger_reputation_on_vote` → recalculates reputation (+5 per vote)\n2. Checks badge criteria → awards \"Popular Post\" (10 votes)\n\n**When submission is merged:**\n1. `trigger_reputation_on_submission` → awards +20 reputation\n2. Checks criteria → awards \"Contributor\" badge\n\n### Badge Definitions\n\n**Engagement Badges:**\n- 📝 First Post (1 post)\n- ✍️ 10 Posts (10 posts)\n- 📚 50 Posts (50 posts)\n\n**Contribution Badges:**\n- 🔥 Popular Post (10 votes on single post)\n- ⭐ Viral Post (50 votes on single post)\n- 🎯 Contributor (1 merged submission)\n\n**Milestone Badges:**\n- 💯 100 Reputation\n- 👑 1000 Reputation\n\n**Special Badges:**\n- 🚀 Early Adopter (manual)\n- ✓ Verified (manual)\n\n### Technical Implementation\n\n**Database Functions:**\n- `calculate_user_reputation()` - Aggregate all contribution points\n- `check_and_award_badge()` - Check single badge criteria\n- `check_all_badges()` - Check all badges for user\n- Reputation triggers on posts, votes, comments, submissions\n- Badge check trigger on reputation updates\n\n**Files Added:**\n- `src/lib/schemas/activity.schema.ts` - Activity and reputation types\n- `src/lib/actions/activity-actions.ts` - Activity aggregation actions\n- `src/lib/actions/reputation-actions.ts` - Reputation calculation actions\n- `src/lib/actions/badge-actions.ts` - Badge fetching and checking\n- `src/hooks/use-badge-notifications.ts` - Client-side badge notification hook\n- `src/components/features/profile/activity-timeline.tsx` - Activity timeline UI\n- `src/app/account/activity/page.tsx` - Contribution history page\n- `supabase/migrations/2025-10-07-reputation-system.sql` - Reputation migrations\n- `supabase/migrations/2025-10-07-badge-awarding-system.sql` - Badge migrations\n\n**Performance:**\n- Activity summaries cached for 5 minutes\n- Reputation calculation optimized with indexed queries\n- Badge checks only run when reputation changes\n- Async database operations don't block user actions\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Reputation System and Automatic Badge Awarding",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Automatic Reputation Calculation**\n- Real-time reputation scoring based on community contributions\n- Formula: Posts (+10), Votes received (+5), Comments (+2), Merged submissions (+20)\n- Database triggers automatically update reputation on every action\n- Reputation displayed on profiles and dashboards\n- Indexed for leaderboard queries\n- **Automatic Badge Awarding System**\n- Criteria-based achievement system with 10 initial badges\n- Automatic checks and awards when reputation changes\n- Categories: engagement, contribution, milestone, special\n- Database functions: `check_and_award_badge()`, `check_all_badges()`\n- Badge notifications via toast messages when earned\n- **Contribution History Page** (`/account/activity`)\n- Unified timeline of all user activity (posts, comments, votes, submissions)\n- Filter tabs by activity type\n- Activity stats overview (counts for each type)\n- Chronological timeline with status badges\n- Links to original content\n- **Activity Tracking Infrastructure**\n- Server actions for activity aggregation with caching\n- Type-safe schemas with Zod validation\n- Performant queries with proper indexing\n- 5-minute cache for activity summaries"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Account dashboard now shows reputation score prominently\n- Account navigation includes Activity link\n- Public profiles display reputation and tier badges\n- Quick actions promote contribution history"
      }
    ]
  },
  {
    "slug": "2025-10-07-user-profile-system-with-oauth-avatar-sync",
    "title": "User Profile System with OAuth Avatar Sync",
    "description": "Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-07",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation.\n\n### What Changed\n\nExtended the existing user authentication system with comprehensive profile management features, eliminating the need for separate image upload infrastructure by leveraging OAuth provider avatars from GitHub and Google.\n\n### Added\n\n- **OAuth Avatar Sync** (automatic profile picture management)\n  - Database trigger (`on_auth_user_created`) automatically syncs avatar from GitHub/Google on signup\n  - Profile pictures use OAuth provider URLs (no storage costs)\n  - Manual refresh function (`refresh_profile_from_oauth`) for updating avatars\n  - Supports both GitHub (`avatar_url`) and Google (`picture`) metadata fields\n\n- **Profile Editing System** (`/account/settings`)\n  - Editable form with validation for name, bio, work, website, X/Twitter link\n  - Interests/skills tag system (max 10 tags, 30 chars each)\n  - Character counters and real-time validation\n  - Unsaved changes detection and cancel functionality\n  - Server actions with rate limiting and authorization checks\n\n- **Database Schema Extensions**\n  - `interests` field (JSONB array) for user skills and interests\n  - `reputation_score` field (INTEGER) for gamification\n  - `tier` field (TEXT) for free/pro/enterprise membership levels\n  - Indexed for performance on reputation and tier queries\n\n- **Badge Achievement System** (foundation)\n  - `badges` table with 10 initial achievement types\n  - `user_badges` table for tracking earned badges\n  - Badge categories: engagement, contribution, milestone, special\n  - Criteria-based system ready for automatic award logic\n  - Badge display components (icon, card, list, compact views)\n\n- **Enhanced Profile Display**\n  - Interests shown as badges on public profiles (`/u/[username]`)\n  - Reputation score in Activity sidebar\n  - Tier badge display (Free/Pro/Enterprise)\n  - OAuth provider indication for profile pictures\n\n### Changed\n\n- Settings page transformed from read-only to fully editable\n- Public profile pages now show reputation, tier, and interests\n- User profiles automatically populated on OAuth signup (name, email, avatar)\n\n### Technical Details\n\n**Server Actions:**\n- `updateProfile` - Type-safe profile updates with Zod validation\n- `refreshProfileFromOAuth` - Sync latest avatar from OAuth provider\n\n**Database Functions:**\n- `handle_new_user()` - Trigger function for OAuth profile sync\n- `refresh_profile_from_oauth()` - Manual avatar refresh function\n\n**Initial Badges:**\n- First Post, 10 Posts, 50 Posts (engagement)\n- Popular Post, Viral Post (contribution)\n- Early Adopter, Verified (special)\n- Contributor (submission merged)\n- Reputation milestones (100, 1000 points)\n\n**Files Added:**\n- `src/lib/schemas/profile.schema.ts` - Profile validation schemas\n- `src/lib/schemas/badge.schema.ts` - Badge types and schemas\n- `src/lib/actions/profile-actions.ts` - Profile update server actions\n- `src/components/features/profile/profile-edit-form.tsx` - Editable profile form\n- `src/components/features/profile/badge-display.tsx` - Badge UI components\n\n**Security:**\n- Row Level Security (RLS) policies for badges and user_badges tables\n- Server-side authorization checks in all profile actions\n- Zod schema validation for all profile inputs\n- Rate limiting on profile updates and OAuth refreshes\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "User Profile System with OAuth Avatar Sync",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **OAuth Avatar Sync** (automatic profile picture management)\n- Database trigger (`on_auth_user_created`) automatically syncs avatar from GitHub/Google on signup\n- Profile pictures use OAuth provider URLs (no storage costs)\n- Manual refresh function (`refresh_profile_from_oauth`) for updating avatars\n- Supports both GitHub (`avatar_url`) and Google (`picture`) metadata fields\n- **Profile Editing System** (`/account/settings`)\n- Editable form with validation for name, bio, work, website, X/Twitter link\n- Interests/skills tag system (max 10 tags, 30 chars each)\n- Character counters and real-time validation\n- Unsaved changes detection and cancel functionality\n- Server actions with rate limiting and authorization checks\n- **Database Schema Extensions**\n- `interests` field (JSONB array) for user skills and interests\n- `reputation_score` field (INTEGER) for gamification\n- `tier` field (TEXT) for free/pro/enterprise membership levels\n- Indexed for performance on reputation and tier queries\n- **Badge Achievement System** (foundation)\n- `badges` table with 10 initial achievement types\n- `user_badges` table for tracking earned badges\n- Badge categories: engagement, contribution, milestone, special\n- Criteria-based system ready for automatic award logic\n- Badge display components (icon, card, list, compact views)\n- **Enhanced Profile Display**\n- Interests shown as badges on public profiles (`/u/[username]`)\n- Reputation score in Activity sidebar\n- Tier badge display (Free/Pro/Enterprise)\n- OAuth provider indication for profile pictures"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Settings page transformed from read-only to fully editable\n- Public profile pages now show reputation, tier, and interests\n- User profiles automatically populated on OAuth signup (name, email, avatar)"
      }
    ]
  },
  {
    "slug": "2025-10-06-automated-submission-tracking-and-analytics",
    "title": "Automated Submission Tracking and Analytics",
    "description": "Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-06",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management.\n\n### What Changed\n\nAdded comprehensive submission tracking infrastructure using Supabase database with server actions for statistics, recent submissions display, and top contributors leaderboard.\n\n### Added\n\n- **Submission Tracking Database** (`submissions` table in Supabase)\n  - Tracks all community submissions with status (pending, merged, rejected)\n  - Stores submission metadata (content type, slug, GitHub URL, submitter info)\n  - Indexes on user_id, status, and created_at for performant queries\n  - Foreign key relationships with users table\n\n- **Submission Statistics Actions** (`src/lib/actions/submission-stats-actions.ts`)\n  - `getSubmissionStats()` - Overall statistics (total, merged, pending, rejection rate)\n  - `getRecentMergedSubmissions()` - Latest 5 merged submissions with user info\n  - `getTopContributors()` - Leaderboard of top 5 contributors by merged count\n  - Type-safe server actions with Zod validation\n  - Rate-limited to prevent abuse\n\n- **Sidebar Components** for submit page\n  - **SubmitStatsCard** - Real-time submission statistics dashboard\n  - **RecentSubmissionsCard** - Recent merged submissions with avatars\n  - **TopContributorsCard** - Contributor leaderboard with badges\n  - **TipsCard** - Submission guidelines and best practices\n  - **TemplateSelector** - Quick-start templates for common content types\n  - **DuplicateWarning** - Real-time duplicate name detection\n\n### Changed\n\n- Submit page layout now includes comprehensive sidebar with statistics and tips\n- Submission form accepts plaintext input instead of manual JSON formatting\n- Improved content formatting logic for GitHub submissions\n- Enhanced user experience with template selection and duplicate warnings\n\n### Technical Details\n\n**Database Schema:**\n- `submissions.user_id` → Foreign key to `users.id`\n- `submissions.status` → ENUM ('pending', 'merged', 'rejected')\n- `submissions.content_type` → Submission category (agents, mcp, rules, etc.)\n- Composite index on (status, created_at DESC) for efficient filtering\n\n**Files Added:**\n- `src/components/submit/sidebar/*.tsx` - 6 new sidebar components\n- `src/lib/actions/submission-stats-actions.ts` - Statistics server actions\n- `src/components/submit/template-selector.tsx` - Template selection UI\n- `src/components/submit/duplicate-warning.tsx` - Duplicate detection\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Automated Submission Tracking and Analytics",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Submission Tracking Database** (`submissions` table in Supabase)\n- Tracks all community submissions with status (pending, merged, rejected)\n- Stores submission metadata (content type, slug, GitHub URL, submitter info)\n- Indexes on user_id, status, and created_at for performant queries\n- Foreign key relationships with users table\n- **Submission Statistics Actions** (`src/lib/actions/submission-stats-actions.ts`)\n- `getSubmissionStats()` - Overall statistics (total, merged, pending, rejection rate)\n- `getRecentMergedSubmissions()` - Latest 5 merged submissions with user info\n- `getTopContributors()` - Leaderboard of top 5 contributors by merged count\n- Type-safe server actions with Zod validation\n- Rate-limited to prevent abuse\n- **Sidebar Components** for submit page\n- **SubmitStatsCard** - Real-time submission statistics dashboard\n- **RecentSubmissionsCard** - Recent merged submissions with avatars\n- **TopContributorsCard** - Contributor leaderboard with badges\n- **TipsCard** - Submission guidelines and best practices\n- **TemplateSelector** - Quick-start templates for common content types\n- **DuplicateWarning** - Real-time duplicate name detection"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Submit page layout now includes comprehensive sidebar with statistics and tips\n- Submission form accepts plaintext input instead of manual JSON formatting\n- Improved content formatting logic for GitHub submissions\n- Enhanced user experience with template selection and duplicate warnings"
      }
    ]
  },
  {
    "slug": "2025-10-06-user-authentication-and-account-management",
    "title": "User Authentication and Account Management",
    "description": "Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks).",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-06",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks).\n\n### What Changed\n\nImplemented full-featured authentication system enabling users to create accounts, manage profiles, bookmark content, and follow other users.\n\n### Added\n\n- **Supabase Authentication Integration**\n  - Email/password authentication via Supabase Auth\n  - Server-side and client-side auth helpers\n  - Protected routes with middleware\n  - Session management with cookie-based tokens\n\n- **User Profile System** (`/u/[slug]` routes)\n  - Public user profiles with customizable slugs\n  - Profile fields: name, bio, work, website, social links\n  - Avatar and hero image support\n  - Privacy controls (public/private profiles)\n  - Follow/unfollow functionality\n\n- **Account Management Pages**\n  - `/account` - Account dashboard and navigation\n  - `/account/settings` - Profile settings and preferences\n  - `/account/bookmarks` - Saved content collections\n  - `/account/following` - Users you follow\n  - `/account/sponsorships` - Sponsorship management (for sponsors)\n\n- **Social Features**\n  - Followers table with bidirectional relationships\n  - Bookmarks with notes and organization by content type\n  - Follow notifications (configurable)\n  - User activity tracking\n\n### Changed\n\n- Navigation includes login/logout and account links\n- Content pages show bookmark and follow actions when authenticated\n- Submit forms associate submissions with authenticated users\n- Profile slugs auto-generated from usernames\n\n### Security\n\n- Row Level Security (RLS) policies on all user tables\n- Users can only edit their own profiles\n- Public profiles visible to everyone, private profiles owner-only\n- Server-side auth validation on all protected routes\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "User Authentication and Account Management",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks)."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Supabase Authentication Integration**\n- Email/password authentication via Supabase Auth\n- Server-side and client-side auth helpers\n- Protected routes with middleware\n- Session management with cookie-based tokens\n- **User Profile System** (`/u/[slug]` routes)\n- Public user profiles with customizable slugs\n- Profile fields: name, bio, work, website, social links\n- Avatar and hero image support\n- Privacy controls (public/private profiles)\n- Follow/unfollow functionality\n- **Account Management Pages**\n- `/account` - Account dashboard and navigation\n- `/account/settings` - Profile settings and preferences\n- `/account/bookmarks` - Saved content collections\n- `/account/following` - Users you follow\n- `/account/sponsorships` - Sponsorship management (for sponsors)\n- **Social Features**\n- Followers table with bidirectional relationships\n- Bookmarks with notes and organization by content type\n- Follow notifications (configurable)\n- User activity tracking"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Navigation includes login/logout and account links\n- Content pages show bookmark and follow actions when authenticated\n- Submit forms associate submissions with authenticated users\n- Profile slugs auto-generated from usernames"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔒 Security"
      },
      {
        "type": "text",
        "content": "- Row Level Security (RLS) policies on all user tables\n- Users can only edit their own profiles\n- Public profiles visible to everyone, private profiles owner-only\n- Server-side auth validation on all protected routes"
      }
    ]
  },
  {
    "slug": "2025-10-06-sponsorship-analytics-dashboard",
    "title": "Sponsorship Analytics Dashboard",
    "description": "Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-06",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time.\n\n### What Changed\n\nImplemented comprehensive analytics page for sponsors to track the performance of their sponsored content with detailed metrics and insights.\n\n### Added\n\n- **Sponsorship Analytics Page** (`/account/sponsorships/[id]/analytics`)\n  - Real-time view and click tracking\n  - Click-through rate (CTR) calculation\n  - Days active and performance trends\n  - Sponsorship tier display (featured, promoted, spotlight)\n  - Start/end date tracking\n  - Active/inactive status indicators\n\n- **Performance Metrics**\n  - Total views count with trend indicators\n  - Total clicks with CTR percentage\n  - Days active calculation\n  - Cost-per-click (CPC) insights\n  - View-to-click conversion tracking\n\n### UI Components\n\n- Metric cards with icon badges (Eye, MousePointer, TrendingUp)\n- Sponsored badges with tier-specific styling\n- Grid layout for sponsorship details\n- Responsive design for mobile and desktop\n\n### Technical Implementation\n\n**Data Structure:**\n- Tracks content_type, content_id, tier, dates, and status\n- Links to users table for sponsor identification\n- Integration with view tracking (Redis) for real-time metrics\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Sponsorship Analytics Dashboard",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Sponsorship Analytics Page** (`/account/sponsorships/[id]/analytics`)\n- Real-time view and click tracking\n- Click-through rate (CTR) calculation\n- Days active and performance trends\n- Sponsorship tier display (featured, promoted, spotlight)\n- Start/end date tracking\n- Active/inactive status indicators\n- **Performance Metrics**\n- Total views count with trend indicators\n- Total clicks with CTR percentage\n- Days active calculation\n- Cost-per-click (CPC) insights\n- View-to-click conversion tracking"
      }
    ]
  },
  {
    "slug": "2025-10-06-submit-page-sidebar-and-statistics",
    "title": "Submit Page Sidebar and Statistics",
    "description": "Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-06",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips.\n\n### What Changed\n\nTransformed the submit page into a community hub by adding sidebar components that display submission statistics, guide contributors, and showcase community activity.\n\n### Added\n\n- **Stats Dashboard** - Live submission metrics\n  - Total submissions count\n  - Merged submissions (approval rate)\n  - Pending submissions\n  - Rejection rate percentage\n\n- **Recent Submissions** - Latest 5 merged contributions\n  - Submitter avatars and names\n  - Submission titles and content types\n  - Time ago formatting\n  - Links to contributor profiles\n\n- **Top Contributors** - Leaderboard of top 5 submitters\n  - Ranked by merged submission count\n  - User avatars and profile links\n  - Badge indicators for top performers\n\n- **Tips & Guidelines** - Best practices for submissions\n  - Clear naming conventions\n  - Comprehensive descriptions\n  - Testing requirements\n  - Documentation expectations\n\n- **Template Selector** - Quick-start templates\n  - Pre-filled forms for common content types\n  - Reduces errors and saves time\n  - Ensures consistent formatting\n\n### UI/UX Improvements\n\n- Two-column layout (form + sidebar)\n- Responsive design (sidebar moves below form on mobile)\n- Loading states for async data\n  - Skeleton loaders for statistics\n  - Shimmer effects for contributor cards\n- Empty states when no data available\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Submit Page Sidebar and Statistics",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Stats Dashboard** - Live submission metrics\n- Total submissions count\n- Merged submissions (approval rate)\n- Pending submissions\n- Rejection rate percentage\n- **Recent Submissions** - Latest 5 merged contributions\n- Submitter avatars and names\n- Submission titles and content types\n- Time ago formatting\n- Links to contributor profiles\n- **Top Contributors** - Leaderboard of top 5 submitters\n- Ranked by merged submission count\n- User avatars and profile links\n- Badge indicators for top performers\n- **Tips & Guidelines** - Best practices for submissions\n- Clear naming conventions\n- Comprehensive descriptions\n- Testing requirements\n- Documentation expectations\n- **Template Selector** - Quick-start templates\n- Pre-filled forms for common content types\n- Reduces errors and saves time\n- Ensures consistent formatting"
      }
    ]
  },
  {
    "slug": "2025-10-06-email-templates-infrastructure",
    "title": "Email Templates Infrastructure",
    "description": "Integrated React Email for type-safe, production-ready transactional email templates with development preview server.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-06",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Integrated React Email for type-safe, production-ready transactional email templates with development preview server.\n\n### What Changed\n\nAdded email template infrastructure using React Email, enabling the platform to send beautifully designed transactional emails with a development preview environment.\n\n### Added\n\n- **React Email Integration**\n  - `@react-email/components` for email component primitives\n  - `@react-email/render` for server-side email generation\n  - Development server: `npm run email:dev` (port 3001)\n  - Email templates directory: `src/emails/`\n\n- **Email Templates** (Foundation for future features)\n  - Base layout with branding and styling\n  - Responsive design optimized for all email clients\n  - Plain text fallbacks for accessibility\n  - Consistent typography and color scheme\n\n### Development Workflow\n\n- **Preview Server** - Live preview of email templates\n  - Hot-reload on template changes\n  - Test rendering across different email clients\n  - Access at `http://localhost:3001`\n\n- **Type Safety**\n  - TypeScript support for all email components\n  - Props validation with JSX type checking\n  - Compile-time error detection\n\n### Technical Details\n\n**Files Added:**\n- `src/emails/` - Email templates directory\n- Email development dependencies in package.json\n- npm script: `email:dev` for preview server\n\n**Use Cases:**\n- Welcome emails for new users\n- Submission notifications\n- Newsletter digests\n- Sponsorship confirmations\n- Follow notifications\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Email Templates Infrastructure",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Integrated React Email for type-safe, production-ready transactional email templates with development preview server."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **React Email Integration**\n- `@react-email/components` for email component primitives\n- `@react-email/render` for server-side email generation\n- Development server: `npm run email:dev` (port 3001)\n- Email templates directory: `src/emails/`\n- **Email Templates** (Foundation for future features)\n- Base layout with branding and styling\n- Responsive design optimized for all email clients\n- Plain text fallbacks for accessibility\n- Consistent typography and color scheme"
      }
    ]
  },
  {
    "slug": "2025-10-05-resend-newsletter-integration-with-sticky-footer-bar",
    "title": "Resend Newsletter Integration with Sticky Footer Bar",
    "description": "Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-05",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage.\n\n### What Changed\n\nAdded complete newsletter subscription infrastructure with Resend integration, featuring a non-intrusive sticky footer bar that appears after 3 seconds, rate-limited signup actions (5 requests per 5 minutes), and fixed homepage infinite scroll bug that was capping at 60 items.\n\n### Added\n\n- **Resend Email Service** (`src/lib/services/resend.service.ts`)\n  - Type-safe Resend API integration with `resend` npm package\n  - Graceful degradation when API keys missing (logs warnings)\n  - Idempotent operations (duplicate signups return success)\n  - Production error handling with structured logging\n  - Environment validation for `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`\n\n- **Newsletter Server Action** (`src/lib/actions/newsletter-signup.ts`)\n  - Rate limited: 5 signups per 5 minutes per IP (prevents spam)\n  - Zod schema validation with RFC 5322 email format\n  - Source tracking (footer, homepage, modal, content_page, inline)\n  - Referrer tracking for analytics\n  - Built on `next-safe-action` with centralized error handling\n\n- **Newsletter Form Component** (`src/components/shared/newsletter-form.tsx`)\n  - Reusable form with React 19 useTransition for pending states\n  - Sonner toast notifications for success/error feedback\n  - Accessible with ARIA labels\n  - Email validation and error handling\n  - Progressive enhancement (works without JS)\n\n- **Sticky Footer Newsletter Bar** (`src/components/shared/footer-newsletter-bar.tsx`)\n  - Appears after 3-second delay (non-intrusive UX)\n  - localStorage persistence for dismissal state\n  - Glassmorphism design: `bg-black/80 backdrop-blur-xl`\n  - Responsive layouts (desktop/mobile optimized)\n  - Slide-up animation on mount\n  - Fully accessible with keyboard navigation\n\n- **Newsletter Schema** (`src/lib/schemas/newsletter.schema.ts`)\n  - RFC 5322 compliant email validation\n  - Source tracking enum (5 sources)\n  - Referrer URL validation (max 500 chars)\n  - Auto-lowercase and trim transformation\n\n### Fixed\n\n- **Homepage Infinite Scroll Bug**\n  - Fixed 60-item cap caused by dual state management in `InfiniteScrollContainer`\n  - Removed local `allItems` state - component now fully controlled by parent\n  - Fixed useEffect dependency array causing pagination resets\n  - Now properly loads all content items with automatic infinite scroll\n  - Removed \"Load More\" button in favor of seamless scroll loading\n\n### Changed\n\n- **Environment Configuration**\n  - Added `RESEND_API_KEY` to server env schema\n  - Added `RESEND_AUDIENCE_ID` to server env schema\n  - Both optional in development, required in production for newsletter features\n\n- **Infinite Scroll Container** (`src/components/shared/infinite-scroll-container.tsx`)\n  - Removed stateful `allItems` - now pure presentational component\n  - Fixed race condition between `loadMore` and `useEffect`\n  - Improved performance by eliminating unnecessary state updates\n  - Better separation of concerns (parent manages state)\n\n- **Homepage Component** (`src/components/features/home/index.tsx`)\n  - Fixed useEffect to only reset pagination on tab/search changes\n  - Added biome-ignore for intentional dependency optimization\n  - Prevents pagination reset on every render (performance improvement)\n\n### Technical Details\n\n**Email Infrastructure:**\n\n- **Domain:** `mail.claudepro.directory` (subdomain for deliverability)\n- **Integration:** Resend <> Vercel Marketplace direct integration\n- **DNS:** Managed via Resend <> Cloudflare integration\n- **From Address:** `hello@mail.claudepro.directory`\n\n**Rate Limiting:**\n\n- Newsletter signups: 5 requests per 300 seconds (5 minutes) per IP\n- Stricter than default (100 req/60s) to prevent newsletter spam\n- Allows legitimate retries while blocking abuse\n\n**Dependencies Added:**\n\n- `resend` - Official Resend SDK for email API\n- `@react-email/render` - Email template rendering (Resend dependency)\n\n**Files Modified:**\n\n- `src/app/layout.tsx` - Added FooterNewsletterBar component\n- `src/components/features/home/tabs-section.tsx` - Set `showLoadMoreButton={false}`\n- `src/components/shared/infinite-scroll-container.tsx` - Removed dual state management\n- `src/components/features/home/index.tsx` - Fixed useEffect dependencies\n- `src/lib/schemas/env.schema.ts` - Added Resend env vars\n\n**Files Created:**\n\n- `src/lib/schemas/newsletter.schema.ts`\n- `src/lib/services/resend.service.ts`\n- `src/lib/actions/newsletter-signup.ts`\n- `src/components/shared/newsletter-form.tsx`\n- `src/components/shared/footer-newsletter-bar.tsx`\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Resend Newsletter Integration with Sticky Footer Bar",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Resend Email Service** (`src/lib/services/resend.service.ts`)\n- Type-safe Resend API integration with `resend` npm package\n- Graceful degradation when API keys missing (logs warnings)\n- Idempotent operations (duplicate signups return success)\n- Production error handling with structured logging\n- Environment validation for `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`\n- **Newsletter Server Action** (`src/lib/actions/newsletter-signup.ts`)\n- Rate limited: 5 signups per 5 minutes per IP (prevents spam)\n- Zod schema validation with RFC 5322 email format\n- Source tracking (footer, homepage, modal, content_page, inline)\n- Referrer tracking for analytics\n- Built on `next-safe-action` with centralized error handling\n- **Newsletter Form Component** (`src/components/shared/newsletter-form.tsx`)\n- Reusable form with React 19 useTransition for pending states\n- Sonner toast notifications for success/error feedback\n- Accessible with ARIA labels\n- Email validation and error handling\n- Progressive enhancement (works without JS)\n- **Sticky Footer Newsletter Bar** (`src/components/shared/footer-newsletter-bar.tsx`)\n- Appears after 3-second delay (non-intrusive UX)\n- localStorage persistence for dismissal state\n- Glassmorphism design: `bg-black/80 backdrop-blur-xl`\n- Responsive layouts (desktop/mobile optimized)\n- Slide-up animation on mount\n- Fully accessible with keyboard navigation\n- **Newsletter Schema** (`src/lib/schemas/newsletter.schema.ts`)\n- RFC 5322 compliant email validation\n- Source tracking enum (5 sources)\n- Referrer URL validation (max 500 chars)\n- Auto-lowercase and trim transformation"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Environment Configuration**\n- Added `RESEND_API_KEY` to server env schema\n- Added `RESEND_AUDIENCE_ID` to server env schema\n- Both optional in development, required in production for newsletter features\n- **Infinite Scroll Container** (`src/components/shared/infinite-scroll-container.tsx`)\n- Removed stateful `allItems` - now pure presentational component\n- Fixed race condition between `loadMore` and `useEffect`\n- Improved performance by eliminating unnecessary state updates\n- Better separation of concerns (parent manages state)\n- **Homepage Component** (`src/components/features/home/index.tsx`)\n- Fixed useEffect to only reset pagination on tab/search changes\n- Added biome-ignore for intentional dependency optimization\n- Prevents pagination reset on every render (performance improvement)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Homepage Infinite Scroll Bug**\n- Fixed 60-item cap caused by dual state management in `InfiniteScrollContainer`\n- Removed local `allItems` state - component now fully controlled by parent\n- Fixed useEffect dependency array causing pagination resets\n- Now properly loads all content items with automatic infinite scroll\n- Removed \"Load More\" button in favor of seamless scroll loading"
      }
    ]
  },
  {
    "slug": "2025-10-05-homepage-infinite-scroll-bug-fix",
    "title": "Homepage Infinite Scroll Bug Fix",
    "description": "Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-05",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component.\n\n### Fixed\n\n- **60-Item Pagination Cap**\n  - Root cause: Dual state management creating race condition\n  - InfiniteScrollContainer maintained local `allItems` state\n  - Parent's useEffect was resetting state on every `filteredResults` reference change\n  - Solution: Made InfiniteScrollContainer fully controlled (stateless)\n\n- **State Synchronization**\n  - Removed `allItems` state from InfiniteScrollContainer\n  - Component now uses `items` prop directly (single source of truth)\n  - Eliminated useEffect that was overwriting accumulated items\n  - Fixed race condition between `loadMore` and `useEffect`\n\n- **Pagination Reset Loop**\n  - Changed useEffect dependency from `filteredResults` to `[activeTab, isSearching]`\n  - Prevents reset when same data is re-filtered (array reference changes)\n  - Only resets pagination when user actually changes tabs or search state\n  - Added biome-ignore with detailed explanation for linter\n\n### Changed\n\n- **InfiniteScrollContainer Architecture**\n  - Converted from stateful to fully controlled component\n  - Parent component (`home/index.tsx`) now manages all state\n  - Infinite scroll container just renders + triggers loading\n  - Better separation of concerns and predictable behavior\n\n- **Load More Button**\n  - Set `showLoadMoreButton={false}` for seamless infinite scroll\n  - Users now get automatic loading as they scroll\n  - More modern UX (no manual clicking required)\n\n**Files Modified:**\n\n- `src/components/shared/infinite-scroll-container.tsx`\n- `src/components/features/home/index.tsx`\n- `src/components/features/home/tabs-section.tsx`\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Homepage Infinite Scroll Bug Fix",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **InfiniteScrollContainer Architecture**\n- Converted from stateful to fully controlled component\n- Parent component (`home/index.tsx`) now manages all state\n- Infinite scroll container just renders + triggers loading\n- Better separation of concerns and predictable behavior\n- **Load More Button**\n- Set `showLoadMoreButton={false}` for seamless infinite scroll\n- Users now get automatic loading as they scroll\n- More modern UX (no manual clicking required)\n**Files Modified:**\n- `src/components/shared/infinite-scroll-container.tsx`\n- `src/components/features/home/index.tsx`\n- `src/components/features/home/tabs-section.tsx`"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **60-Item Pagination Cap**\n- Root cause: Dual state management creating race condition\n- InfiniteScrollContainer maintained local `allItems` state\n- Parent's useEffect was resetting state on every `filteredResults` reference change\n- Solution: Made InfiniteScrollContainer fully controlled (stateless)\n- **State Synchronization**\n- Removed `allItems` state from InfiniteScrollContainer\n- Component now uses `items` prop directly (single source of truth)\n- Eliminated useEffect that was overwriting accumulated items\n- Fixed race condition between `loadMore` and `useEffect`\n- **Pagination Reset Loop**\n- Changed useEffect dependency from `filteredResults` to `[activeTab, isSearching]`\n- Prevents reset when same data is re-filtered (array reference changes)\n- Only resets pagination when user actually changes tabs or search state\n- Added biome-ignore with detailed explanation for linter"
      }
    ]
  },
  {
    "slug": "2025-10-04-llmstxt-complete-content-generation-for-ai-discovery",
    "title": "LLMs.txt Complete Content Generation for AI Discovery",
    "description": "All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption.\n\n### What Changed\n\nImplemented production-grade llms.txt generation system following the [llmstxt.org specification](https://llmstxt.org) (Oct 2025 standards). Each content item now exports ALL structured fields to AI-friendly plain text format with zero truncation, PII sanitization, and type-safe content building.\n\n### Added\n\n- **Type-Safe Rich Content Builder** (`src/lib/llms-txt/content-builder.ts`)\n  - Extracts ALL fields from 6 content schemas (MCP, Agent, Hook, Command, Rule, Statusline)\n  - Formats installation instructions (Claude Desktop + Claude Code)\n  - Formats configurations (MCP servers, hook scripts, statusline settings)\n  - Includes security best practices, troubleshooting guides, and usage examples\n  - No `any` types - fully type-safe with proper narrowing\n\n- **llms.txt Routes** with ISR (600s revalidation)\n  - `/[category]/[slug]/llms.txt` - Individual item details (168 pages)\n  - `/[category]/llms.txt` - Category listings (6 categories)\n  - `/collections/[slug]/llms.txt` - Collection details\n  - `/guides/[...slug]/llms.txt` - Guide content\n  - `/llms.txt` - Site-wide index\n\n- **PII Protection** (`src/lib/llms-txt/content-sanitizer.ts`)\n  - Removes emails, phone numbers, IP addresses, API keys, SSNs, credit cards\n  - Whitelists example domains (example.com, localhost, 127.0.0.1)\n  - Fixed regex global flag bug causing alternating detection results\n\n- **Markdown Export Features** (`src/lib/actions/markdown-actions.ts`)\n  - Copy as Markdown: One-click clipboard copy with YAML frontmatter\n  - Download Markdown: File download with full metadata and attribution\n  - Rate limiting: 50 req/min (copy), 30 req/min (download)\n  - Redis caching with 1-hour TTL for performance\n  - Type-safe server actions with Zod validation\n\n- **Analytics Integration** (`src/lib/analytics/events.config.ts`)\n  - `COPY_MARKDOWN` event tracking with content metadata\n  - `DOWNLOAD_MARKDOWN` event tracking with file size metrics\n  - Integrated into CopyMarkdownButton and DownloadMarkdownButton components\n  - Umami analytics for user interaction insights\n\n### Changed\n\n- **Removed ALL truncation** from llms.txt schema and routes\n  - `llmsTxtItemSchema`: Removed artificial 200/1000 char limits on title/description\n  - Collections route: Uses `content` field (unlimited) instead of `description` (1000 chars)\n  - Item detail route: Includes full rich content via `buildRichContent()`\n\n- **Content Coverage**\n  - BEFORE: ~5% of page content (1-sentence description only)\n  - AFTER: 100% of page content (15x improvement)\n  - MCP servers now include full configuration examples, environment variables, installation steps\n  - Hooks include complete script content (up to 1MB)\n  - All items include features, use cases, requirements, troubleshooting, examples\n\n### Technical Implementation\n\n**Type-Safe Content Extraction**:\n\n```typescript\nexport type ContentItem =\n  | McpContent\n  | AgentContent\n  | HookContent\n  | CommandContent\n  | RuleContent\n  | StatuslineContent;\n\nexport function buildRichContent(item: ContentItem): string {\n  const sections: string[] = [];\n\n  // 1. Features, 2. Use Cases, 3. Installation\n  // 4. Requirements, 5. Configuration, 6. Security\n  // 7. Troubleshooting, 8. Examples, 9. Technical Details, 10. Preview\n\n  return sections.filter((s) => s.length > 0).join(\"\\n\\n\");\n}\n```\n\n**Category-Specific Formatting**:\n\n- MCP: Server configs, transport settings (HTTP/SSE), authentication requirements\n- Hooks: Hook configuration + actual script content (critical for implementation)\n- Statuslines: Format, refresh interval, position, color scheme\n- Agents/Commands/Rules: Temperature, max tokens, system prompts\n\n**Static Generation**:\n\n- All 168 item pages pre-rendered at build time via `generateStaticParams()`\n- ISR revalidation every 600 seconds for content updates\n- Production-optimized with Next.js 15.5.4 App Router\n\n**Validation & Quality Assurance**:\n\n- Automated validation script (`scripts/validate-llmstxt.ts`) checks all 26+ llms.txt routes\n- Validates markdown headers (`# Title`), metadata fields (`Title:`, `URL:`), category markers\n- Cache versioning (v2) for breaking changes to ensure fresh content delivery\n- All routes passing with 0 errors, 0 warnings\n\n### Impact\n\n- **AI Tool Discovery**: Claude Code, AI search engines, and LLM tools can now discover and understand ALL content\n- **SEO Enhancement**: Full-text indexing by AI search engines (Perplexity, ChatGPT Search, Google AI Overview)\n- **Developer Experience**: Complete installation/configuration examples immediately accessible to AI assistants\n- **Content Portability**: One-click markdown export (copy & download) for offline use and documentation\n- **Citation Quality**: AI tools can cite specific features, troubleshooting steps, and usage examples\n- **Production-Ready**: Type-safe, PII-protected, properly formatted for LLM consumption\n\n### For Contributors\n\nAll content automatically generates llms.txt routes. No special configuration needed. The system extracts ALL available fields from your content schemas.\n\n**Example URLs**:\n\n- Item: `/mcp/airtable-mcp-server/llms.txt`\n- Category: `/mcp/llms.txt`\n- Collection: `/collections/essential-mcp-servers/llms.txt`\n- Site Index: `/llms.txt`\n\n### Compliance\n\nFollows llmstxt.org specification (Oct 2025 standards):\n\n- Plain text format (UTF-8)\n- Structured sections with clear headers\n- No artificial length limits (AI consumption priority)\n- Canonical URLs included\n- PII sanitization applied\n- Proper cache headers (`max-age=600, s-maxage=600, stale-while-revalidate=3600`)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "LLMs.txt Complete Content Generation for AI Discovery",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Type-Safe Rich Content Builder** (`src/lib/llms-txt/content-builder.ts`)\n- Extracts ALL fields from 6 content schemas (MCP, Agent, Hook, Command, Rule, Statusline)\n- Formats installation instructions (Claude Desktop + Claude Code)\n- Formats configurations (MCP servers, hook scripts, statusline settings)\n- Includes security best practices, troubleshooting guides, and usage examples\n- No `any` types - fully type-safe with proper narrowing\n- **llms.txt Routes** with ISR (600s revalidation)\n- `/[category]/[slug]/llms.txt` - Individual item details (168 pages)\n- `/[category]/llms.txt` - Category listings (6 categories)\n- `/collections/[slug]/llms.txt` - Collection details\n- `/guides/[...slug]/llms.txt` - Guide content\n- `/llms.txt` - Site-wide index\n- **PII Protection** (`src/lib/llms-txt/content-sanitizer.ts`)\n- Removes emails, phone numbers, IP addresses, API keys, SSNs, credit cards\n- Whitelists example domains (example.com, localhost, 127.0.0.1)\n- Fixed regex global flag bug causing alternating detection results\n- **Markdown Export Features** (`src/lib/actions/markdown-actions.ts`)\n- Copy as Markdown: One-click clipboard copy with YAML frontmatter\n- Download Markdown: File download with full metadata and attribution\n- Rate limiting: 50 req/min (copy), 30 req/min (download)\n- Redis caching with 1-hour TTL for performance\n- Type-safe server actions with Zod validation\n- **Analytics Integration** (`src/lib/analytics/events.config.ts`)\n- `COPY_MARKDOWN` event tracking with content metadata\n- `DOWNLOAD_MARKDOWN` event tracking with file size metrics\n- Integrated into CopyMarkdownButton and DownloadMarkdownButton components\n- Umami analytics for user interaction insights"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Removed ALL truncation** from llms.txt schema and routes\n- `llmsTxtItemSchema`: Removed artificial 200/1000 char limits on title/description\n- Collections route: Uses `content` field (unlimited) instead of `description` (1000 chars)\n- Item detail route: Includes full rich content via `buildRichContent()`\n- **Content Coverage**\n- BEFORE: ~5% of page content (1-sentence description only)\n- AFTER: 100% of page content (15x improvement)\n- MCP servers now include full configuration examples, environment variables, installation steps\n- Hooks include complete script content (up to 1MB)\n- All items include features, use cases, requirements, troubleshooting, examples"
      }
    ]
  },
  {
    "slug": "2025-10-04-seo-title-optimization-system-with-automated-enhancement",
    "title": "SEO Title Optimization System with Automated Enhancement",
    "description": "Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management.\n\n### What Changed\n\nImplemented dual-title metadata system allowing separate SEO-optimized titles (`seoTitle`) and user-facing headings (`title`). Created automated enhancement utilities that intelligently add \"for Claude\" branding while respecting category-specific character budgets (23-31 available chars depending on suffix length).\n\n### Added\n\n- `seoTitle` optional field to all content schemas (agents, mcp, rules, commands, hooks, statuslines, collections, guides)\n- Build pipeline support: `seoTitle` flows from source files → static API → page metadata\n- Developer utilities:\n  - `npm run validate:titles` - Check all page titles against 60-char limit\n  - `npm run optimize:titles:dry` - Preview automated enhancements\n  - `npm run optimize:titles` - Apply enhancements to source files\n- `src/lib/seo/title-enhancer.ts` - Smart slug-to-title conversion with acronym/brand handling\n- `src/lib/config/seo-config.ts` - Centralized SEO constants and character budgets\n\n### Changed\n\n- Enhanced 59 content files (35.1% of catalog) with optimized `seoTitle` fields:\n  - MCP servers: 34/40 (85%) - \"GitHub MCP Server for Claude\"\n  - Commands: 12/12 (100%) - \"Debug Command for Claude\"\n  - Rules: 6/11 (54.5%)\n  - Hooks: 6/60 (10%)\n  - Agents: 1/10 (10%)\n- Updated `scripts/verify-all-titles.ts` to single-line compact output format\n- Added `seoTitle` to metadata extraction in `build-category-config.ts`\n\n### Technical Implementation\n\n**Character Budget per Category**:\n\n- Agents: 28 chars | MCP: 31 chars (most space) | Rules: 29 chars\n- Commands: 26 chars | Hooks: 29 chars | Statuslines: 23 chars | Collections: 23 chars\n\n**Enhancement Logic**:\n\n```typescript\n// Automated \"for Claude\" suffix with slug fallback\nconst baseTitle = item.title || item.name || slugToTitle(item.slug);\nif (\" for Claude\".length <= availableSpace) {\n  return `${baseTitle} for Claude`;\n}\n```\n\n**Slug Normalization** - Handles acronyms (API, MCP, AWS, SQL) and brand names (GitHub, PostgreSQL, MongoDB)\n\n### Impact\n\n- **Search Visibility**: 59 pages now have keyword-rich titles optimized for Google/AI search\n- **Brand Consistency**: Unified \"for Claude\" pattern across MCP servers and commands\n- **Developer Experience**: On-demand validation and enhancement tools reduce manual work\n- **Quality Assurance**: All 168 pages verified under 60-character limit\n\n### For Contributors\n\nWhen adding new content, optionally include `seoTitle` for SEO optimization:\n\n```json\n{\n  \"slug\": \"example-server\",\n  \"title\": \"Example Server - Long Descriptive Name\",\n  \"seoTitle\": \"Example Server for Claude\"\n}\n```\n\nRun `npm run validate:titles` before submitting to verify character limits.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "SEO Title Optimization System with Automated Enhancement",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- `seoTitle` optional field to all content schemas (agents, mcp, rules, commands, hooks, statuslines, collections, guides)\n- Build pipeline support: `seoTitle` flows from source files → static API → page metadata\n- Developer utilities:\n- `npm run validate:titles` - Check all page titles against 60-char limit\n- `npm run optimize:titles:dry` - Preview automated enhancements\n- `npm run optimize:titles` - Apply enhancements to source files\n- `src/lib/seo/title-enhancer.ts` - Smart slug-to-title conversion with acronym/brand handling\n- `src/lib/config/seo-config.ts` - Centralized SEO constants and character budgets"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Enhanced 59 content files (35.1% of catalog) with optimized `seoTitle` fields:\n- MCP servers: 34/40 (85%) - \"GitHub MCP Server for Claude\"\n- Commands: 12/12 (100%) - \"Debug Command for Claude\"\n- Rules: 6/11 (54.5%)\n- Hooks: 6/60 (10%)\n- Agents: 1/10 (10%)\n- Updated `scripts/verify-all-titles.ts` to single-line compact output format\n- Added `seoTitle` to metadata extraction in `build-category-config.ts`"
      }
    ]
  },
  {
    "slug": "2025-10-04-production-hardened-trending-algorithm-with-security-performance-optimizations",
    "title": "Production-Hardened Trending Algorithm with Security & Performance Optimizations",
    "description": "Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations.\n\n### What Changed\n\nThe trending tab uses a production-grade growth rate algorithm with security hardening and performance optimizations. Content gaining momentum fast (high percentage growth) ranks higher than content with simply more total views.\n\n### Security Improvements\n\n- **UTC normalization**: All date calculations use UTC to prevent timezone-based data corruption across Vercel edge regions\n- **Input validation**: Redis responses validated with `Math.max(0, Number(value))` to prevent negative/invalid values\n- **Atomic operations**: Redis pipeline with `EXPIRE NX` flag prevents race conditions on daily key TTL\n- **Type safety**: Zod schemas with `.describe()` for JSON Schema compatibility and runtime validation\n\n### Performance Optimizations\n\n- **Batch MGET**: 3 parallel queries (today/yesterday/total) ~10-20% faster than pipeline\n- **Smart TTL**: `EXPIRE NX` only sets TTL on first increment, preventing daily TTL refresh\n- **UTC calculations**: Eliminates cross-timezone edge function inconsistencies\n\n### Technical Implementation\n\n- **Daily snapshots**: `views:daily:${category}:${slug}:YYYY-MM-DD` Redis keys (UTC dates)\n- **Growth formula**: `(today_views - yesterday_views) / yesterday_views * 100`\n- **Cold start boost**: New content with first views gets 100% growth rate\n- **Smart tie-breakers**: Growth rate → Total views → Static popularity\n- **Auto-expiry**: 7-day TTL with `NX` flag prevents unbounded storage\n\n```typescript\n// UTC-normalized date calculation (prevents timezone bugs)\nconst nowUtc = new Date();\nconst todayStr = nowUtc.toISOString().split(\"T\")[0];\n\n// Input validation (prevents negative/invalid values)\nconst todayCount = Math.max(0, Number(todayViews[key]) || 0);\n\n// Atomic Redis operations (prevents race conditions)\npipeline.expire(dailyKey, 604800, \"NX\"); // Only set if key doesn't have TTL\n```\n\n### Documentation\n\n- **TSDoc**: Comprehensive documentation with `@param`, `@returns`, `@example`, `@remarks`\n- **Zod schemas**: `trendingContentItemSchema` and `trendingOptionsSchema` with `.describe()` metadata\n- **Type annotations**: All interfaces properly documented for IDE intellisense\n\n### Impact\n\n- **Security**: No timezone-based data corruption across global edge deployments\n- **Reliability**: Input validation prevents invalid Redis data from breaking calculations\n- **Performance**: <100ms Redis queries for 200+ items with atomic operations\n- **Users**: Discover new popular content on [trending page](https://claudepro.directory/trending) within 24 hours with accurate growth metrics\n\n### Added\n\n- Redis `getDailyViewCounts()` batch method with MGET optimization\n- Daily view tracking in `incrementView()` with UTC timestamps\n- Growth rate calculation in `getTrendingContent()` with input validation\n- Zod schemas for runtime type safety\n- Comprehensive TSDoc documentation\n\n### Changed\n\n- **Trending tab**: Now shows highest 24h growth rate (velocity-based) with UTC normalization\n- **Popular tab**: Continues showing all-time view counts (cumulative-based)\n- View tracking uses Redis pipeline for atomic operations\n- All date calculations use UTC instead of local timezone\n\n### Fixed\n\n- **Timezone bug**: Date calculations now use UTC to prevent inconsistencies across regions\n- **Race condition**: Daily key TTL only set once using `EXPIRE NX` flag\n- **Invalid data**: All Redis responses validated before calculations\n\n### Site-Wide Implementation\n\n- **Homepage enrichment**: All 7 content categories (agents, mcp, rules, commands, hooks, statuslines, collections) enriched with Redis view counts\n- **Category pages**: Dynamic `[category]` route enriches items before rendering\n- **Guides pages**: MDX-based guides (/guides/tutorials, etc.) now display view counters with compound slug handling\n- **ISR revalidation**: 5-minute cache (`revalidate = 300`) for fresh view counts across all pages\n- **Helper function**: `statsRedis.enrichWithViewCounts()` for reusable batch view count merging\n- **Performance**: 7 parallel MGET calls on homepage (~15-25ms), 1 MGET per category page (~10-15ms)\n\n### Guides Integration\n\n- Extended view counters to all guides pages (/guides, /guides/tutorials, detail pages)\n- Handles compound slugs (`tutorials/desktop-mcp-setup`) with prefix stripping for Redis compatibility\n- Components updated: EnhancedGuidesPage, CategoryGuidesPage with Eye icon badges\n- Schema: Added `viewCount` to guideItemWithCategorySchema\n\n### Related Changes\n\n- [View Counter UI Redesign](#2025-10-04---view-counter-ui-redesign-with-prominent-badge-display)\n- [Trending Page ISR & Redis Fixes](#2025-10-04---trending-page-infinite-loading-fix-with-isr)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Production-Hardened Trending Algorithm with Security & Performance Optimizations",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- Redis `getDailyViewCounts()` batch method with MGET optimization\n- Daily view tracking in `incrementView()` with UTC timestamps\n- Growth rate calculation in `getTrendingContent()` with input validation\n- Zod schemas for runtime type safety\n- Comprehensive TSDoc documentation"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Trending tab**: Now shows highest 24h growth rate (velocity-based) with UTC normalization\n- **Popular tab**: Continues showing all-time view counts (cumulative-based)\n- View tracking uses Redis pipeline for atomic operations\n- All date calculations use UTC instead of local timezone"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Timezone bug**: Date calculations now use UTC to prevent inconsistencies across regions\n- **Race condition**: Daily key TTL only set once using `EXPIRE NX` flag\n- **Invalid data**: All Redis responses validated before calculations"
      }
    ]
  },
  {
    "slug": "2025-10-04-view-counter-ui-redesign-with-prominent-badge-display",
    "title": "View Counter UI Redesign with Prominent Badge Display",
    "description": "View counts now appear as eye-catching badges on config cards instead of plain text.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** View counts now appear as eye-catching badges on config cards instead of plain text.\n\n### What Changed\n\nRedesigned the view counter display to be more prominent and visually appealing. View counts now appear as primary-colored badges positioned on the bottom-right of config cards with an Eye icon.\n\n### Visual Design\n\n- **Color scheme**: Primary accent (`bg-primary/10 text-primary border-primary/20`)\n- **Position**: Bottom-right corner, aligned with action buttons\n- **Icon**: Eye icon (3.5x3.5) for instant recognition\n- **Hover effect**: Subtle background color change (`hover:bg-primary/15`)\n- **Typography**: Medium weight for emphasis\n\n### Implementation\n\n```tsx\n<Badge\n  variant=\"secondary\"\n  className=\"h-7 px-2.5 gap-1.5 bg-primary/10 text-primary\"\n>\n  <Eye className=\"h-3.5 w-3.5\" />\n  <span className=\"text-xs\">{formatViewCount(viewCount)}</span>\n</Badge>\n```\n\n### Added\n\n- `formatViewCount()` utility with K/M notation (1234 → \"1.2K\", 1500000 → \"1.5M\")\n- `viewCount` prop to UnifiedDetailPage and DetailMetadata components\n- View count fetching in detail page routes\n\n### Changed\n\n- Moved view counter from inline text to standalone badge component\n- Falls back to \"X% popular\" text when Redis data unavailable\n\n### For Users\n\nSee view counts displayed prominently on all config cards across [AI Agents](https://claudepro.directory/agents), [MCP Servers](https://claudepro.directory/mcp), and other category pages.\n\n### Related Changes\n\n- [Production-Hardened Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "View Counter UI Redesign with Prominent Badge Display",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "View counts now appear as eye-catching badges on config cards instead of plain text."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- `formatViewCount()` utility with K/M notation (1234 → \"1.2K\", 1500000 → \"1.5M\")\n- `viewCount` prop to UnifiedDetailPage and DetailMetadata components\n- View count fetching in detail page routes"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Moved view counter from inline text to standalone badge component\n- Falls back to \"X% popular\" text when Redis data unavailable"
      }
    ]
  },
  {
    "slug": "2025-10-04-trending-page-infinite-loading-fix-with-isr",
    "title": "Trending Page Infinite Loading Fix with ISR",
    "description": "Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation.\n\n### What Was Broken\n\nThe trending page used `export const dynamic = 'force-static'` which froze data at build time when Redis was empty. Since Redis only accumulates views after deployment, build-time static generation captured zero data, causing infinite loading states.\n\n### Root Cause Analysis\n\n1. **Static generation**: Page rendered once at build time with empty Redis\n2. **No revalidation**: `force-static` prevented refreshing with new data\n3. **Wrong Redis check**: `isEnabled()` returned true in fallback mode, blocking fallback logic\n4. **Duplicate fetching**: Content fetched twice (trending data + total count separately)\n\n### Solution\n\n- **ISR configuration**: Changed to `export const revalidate = 300` (5-minute refresh)\n- **Redis check fix**: Created `isConnected()` method, use instead of `isEnabled()`\n- **Performance**: Consolidated duplicate fetching to single Promise.all()\n\n### Fixed\n\n- Infinite loading state on trending page\n- Empty tabs due to `isEnabled()` returning true in fallback mode\n- Duplicate content fetching (now single consolidated fetch)\n\n### Added\n\n- `statsRedis.isConnected()` method for accurate Redis availability check\n- `/trending/loading.tsx` using CategoryLoading factory pattern\n\n### Changed\n\n- Trending page now uses ISR (5-minute revalidation) instead of force-static\n- Redis availability check properly detects fallback mode\n\n### Technical Details\n\n```typescript\n// Before: Incorrect check (returns true in fallback mode)\nif (!statsRedis.isEnabled()) {\n  /* fallback */\n}\n\n// After: Correct check (only true when actually connected)\nif (!statsRedis.isConnected()) {\n  /* fallback */\n}\n```\n\n### For Users\n\nThe [trending page](https://claudepro.directory/trending) now loads instantly with accurate data refreshed every 5 minutes.\n\n### Related Changes\n\n- [Production-Hardened Trending Algorithm](#2025-10-04---production-hardened-trending-algorithm-with-security--performance-optimizations)\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Trending Page Infinite Loading Fix with ISR",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- `statsRedis.isConnected()` method for accurate Redis availability check\n- `/trending/loading.tsx` using CategoryLoading factory pattern"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Trending page now uses ISR (5-minute revalidation) instead of force-static\n- Redis availability check properly detects fallback mode"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- Infinite loading state on trending page\n- Empty tabs due to `isEnabled()` returning true in fallback mode\n- Duplicate content fetching (now single consolidated fetch)"
      }
    ]
  },
  {
    "slug": "2025-10-04-content-security-policy-strict-dynamic-implementation",
    "title": "Content Security Policy Strict-Dynamic Implementation",
    "description": "Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers.\n\n### What Changed\n\nAdded `'strict-dynamic'` directive to Content Security Policy configuration. This allows nonce-based scripts to dynamically load additional scripts (required for React hydration and third-party analytics).\n\n### Fixed\n\n- **Analytics**: Umami analytics script now loads correctly with CSP nonce\n- **View tracking**: `trackView()` server actions no longer blocked by CSP\n- **React hydration**: Client-side JavaScript execution now works properly\n- **Font loading**: Fixed CSP restrictions blocking web fonts\n- **Next.js chunks**: Dynamic chunk loading no longer causes `unsafe-eval` errors\n\n### Added\n\n- `'strict-dynamic'` directive to CSP configuration\n- Nonce extraction and application in UmamiScript component\n- CSP nonces to all JSON-LD structured data components\n\n### Changed\n\n- Umami script loading strategy: `lazyOnload` → `afterInteractive` (better nonce compatibility)\n- Fixed misleading comments claiming Nosecone includes `strict-dynamic` by default\n\n### Technical Details\n\n```typescript\n// CSP now allows nonce-based scripts to load additional scripts\nContent-Security-Policy: script-src 'nonce-xyz123' 'strict-dynamic'\n```\n\n**Impact**: View tracking analytics now work correctly across the site. See live stats on the [trending page](https://claudepro.directory/trending).\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Content Security Policy Strict-Dynamic Implementation",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- `'strict-dynamic'` directive to CSP configuration\n- Nonce extraction and application in UmamiScript component\n- CSP nonces to all JSON-LD structured data components"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Umami script loading strategy: `lazyOnload` → `afterInteractive` (better nonce compatibility)\n- Fixed misleading comments claiming Nosecone includes `strict-dynamic` by default"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- **Analytics**: Umami analytics script now loads correctly with CSP nonce\n- **View tracking**: `trackView()` server actions no longer blocked by CSP\n- **React hydration**: Client-side JavaScript execution now works properly\n- **Font loading**: Fixed CSP restrictions blocking web fonts\n- **Next.js chunks**: Dynamic chunk loading no longer causes `unsafe-eval` errors"
      }
    ]
  },
  {
    "slug": "2025-10-04-reddit-mcp-server-community-contribution",
    "title": "Reddit MCP Server Community Contribution",
    "description": "Added reddit-mcp-buddy server for browsing Reddit directly from Claude.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Added reddit-mcp-buddy server for browsing Reddit directly from Claude.\n\n### Added\n\n- **MCP Server**: reddit-mcp-buddy\n  - Browse Reddit posts and comments\n  - Search posts by keyword\n  - Analyze user activity\n  - Zero API keys required\n  - Thanks to @karanb192 for the contribution!\n\n### Fixed\n\n- Updated troubleshooting field to match MCP schema (object array with issue/solution properties)\n\n### For Users\n\nBrowse and discover [MCP Servers](https://claudepro.directory/mcp) including the new Reddit integration for Claude Desktop.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Reddit MCP Server Community Contribution",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Added reddit-mcp-buddy server for browsing Reddit directly from Claude."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **MCP Server**: reddit-mcp-buddy\n- Browse Reddit posts and comments\n- Search posts by keyword\n- Analyze user activity\n- Zero API keys required\n- Thanks to @karanb192 for the contribution!"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- Updated troubleshooting field to match MCP schema (object array with issue/solution properties)"
      }
    ]
  },
  {
    "slug": "2025-10-04-submit-form-github-api-elimination",
    "title": "Submit Form GitHub API Elimination",
    "description": "Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets).",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets).\n\n### What Changed\n\nCompletely refactored the [submission flow](https://claudepro.directory/submit) to eliminate all GitHub API dependencies. Users now fill the form and get redirected to GitHub with a pre-filled issue they can review before submitting.\n\n### Architecture Improvements\n\n- **Zero secrets**: No GitHub tokens, no environment variables\n- **Zero rate limits**: Direct URL navigation instead of API calls\n- **Better UX**: Users can review/edit before submission\n- **More secure**: Hardcoded repository configuration prevents tampering\n\n### Implementation\n\nNew flow: Form → Pre-fill GitHub URL → Redirect → User reviews → Submit\n\n```typescript\n// Production-grade GitHub issue URL generator\nconst url = new URL(`https://github.com/${owner}/${repo}/issues/new`);\nurl.searchParams.set(\"title\", title);\nurl.searchParams.set(\"body\", body);\nwindow.open(url.toString(), \"_blank\");\n```\n\n### Added\n\n- `/src/lib/utils/github-issue-url.ts` - URL generator for GitHub issues\n- Client-side form validation with Zod schemas\n- Popup blocker detection with manual fallback link\n\n### Removed\n\n- **416 lines of dead code**:\n  - `/src/lib/services/github.service.ts` (275 lines)\n  - `/src/app/actions/submit-config.ts` (66 lines)\n  - 5 unused GitHub API schemas (~60 lines)\n  - GitHub environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)\n  - `githubConfig` export and `hasGitHubConfig()` function\n\n### Changed\n\n- Form content types now exclude 'guides': `agents | mcp | rules | commands | hooks | statuslines`\n\n### For Users\n\n[Submit your configurations](https://claudepro.directory/submit) faster with simplified GitHub integration - no account required until final submission.\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Submit Form GitHub API Elimination",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets)."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- `/src/lib/utils/github-issue-url.ts` - URL generator for GitHub issues\n- Client-side form validation with Zod schemas\n- Popup blocker detection with manual fallback link"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- Form content types now exclude 'guides': `agents | mcp | rules | commands | hooks | statuslines`"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🗑️ Removed"
      },
      {
        "type": "text",
        "content": "- **416 lines of dead code**:\n- `/src/lib/services/github.service.ts` (275 lines)\n- `/src/app/actions/submit-config.ts` (66 lines)\n- 5 unused GitHub API schemas (~60 lines)\n- GitHub environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)\n- `githubConfig` export and `hasGitHubConfig()` function"
      }
    ]
  },
  {
    "slug": "2025-10-04-github-actions-ci-optimization-for-community-contributors",
    "title": "GitHub Actions CI Optimization for Community Contributors",
    "description": "Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-04",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR.\n\n### What Changed\n\nOptimized GitHub Actions workflows to skip intensive jobs (CI, security scans, Lighthouse, bundle analysis) for community content contributions. Only essential workflows (labeling, validation) run for `content/**/*.json` changes.\n\n### Performance Impact\n\n- **Before**: 10 workflow jobs (~15-20 minutes)\n- **After**: 2 workflow jobs (~3-5 minutes)\n- **Savings**: ~10-15 minutes per community PR\n\n### Added\n\n- **Automation**: Bundle Analysis workflow (HashiCorp's nextjs-bundle-analysis)\n- **Automation**: Lighthouse CI workflow (Core Web Vitals monitoring)\n- **Automation**: PR Labeler workflow (19 intelligent labels)\n- **Community labels**: 7 contribution types (`community-mcp`, `community-hooks`, etc.)\n- **Thresholds**: Lighthouse 90+ performance, 95+ accessibility/SEO\n\n### Changed\n\n- CI, Security, Lighthouse, Bundle Analysis now skip on `content/**/*.json` changes\n- Moved `.lighthouserc.json` to `config/tools/lighthouserc.json`\n\n### Fixed\n\n- \"Can't find action.yml\" errors: Added explicit `actions/checkout@v5` before composite actions\n- CI and Security workflows now properly check out repository\n\n---",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "GitHub Actions CI Optimization for Community Contributors",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- **Automation**: Bundle Analysis workflow (HashiCorp's nextjs-bundle-analysis)\n- **Automation**: Lighthouse CI workflow (Core Web Vitals monitoring)\n- **Automation**: PR Labeler workflow (19 intelligent labels)\n- **Community labels**: 7 contribution types (`community-mcp`, `community-hooks`, etc.)\n- **Thresholds**: Lighthouse 90+ performance, 95+ accessibility/SEO"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- CI, Security, Lighthouse, Bundle Analysis now skip on `content/**/*.json` changes\n- Moved `.lighthouserc.json` to `config/tools/lighthouserc.json`"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- \"Can't find action.yml\" errors: Added explicit `actions/checkout@v5` before composite actions\n- CI and Security workflows now properly check out repository"
      }
    ]
  },
  {
    "slug": "2025-10-03-nosecone-csp-migration-navigation-menu-fixes",
    "title": "Nosecone CSP Migration & Navigation Menu Fixes",
    "description": "Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering.",
    "author": "ClaudePro Directory",
    "dateAdded": "2025-10-03",
    "tags": [
      "changelog",
      "updates"
    ],
    "content": "**TL;DR:** Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering.\n\n### Added\n\n- Enhanced error boundary logging with error digest tracking\n- Comprehensive error context in Vercel logs (user agent, URL, timestamp)\n\n### Changed\n\n- **Security**: Implemented Nosecone nonce-based CSP with `strict-dynamic`\n- **Performance**: Migrated from manual CSP to Nosecone defaults extension\n- **UI**: Fixed navigation menu centering on xl/2xl screens (reduced excessive gap)\n\n### Fixed\n\n- CSP violations blocking Next.js chunk loading (`unsafe-eval` errors)\n- Font loading errors caused by CSP restrictions\n- Navigation menu appearing off-center on large screens\n\n### Removed\n\n- Dead code: Inactive ISR `revalidate` exports from 16 files (superseded by dynamic rendering)\n\n---\n\n### Earlier Updates\n\nPrevious changes were tracked in git commit history. This changelog starts from October 2025.",
    "category": "guides",
    "subcategory": "use-cases",
    "keywords": [
      "changelog",
      "updates",
      "features",
      "improvements",
      "release notes"
    ],
    "source": "claudepro",
    "displayTitle": "Nosecone CSP Migration & Navigation Menu Fixes",
    "sections": [
      {
        "type": "callout",
        "variant": "info",
        "title": "TL;DR",
        "content": "Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering."
      },
      {
        "type": "heading",
        "level": "3",
        "content": "✨ Added"
      },
      {
        "type": "text",
        "content": "- Enhanced error boundary logging with error digest tracking\n- Comprehensive error context in Vercel logs (user agent, URL, timestamp)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🔄 Changed"
      },
      {
        "type": "text",
        "content": "- **Security**: Implemented Nosecone nonce-based CSP with `strict-dynamic`\n- **Performance**: Migrated from manual CSP to Nosecone defaults extension\n- **UI**: Fixed navigation menu centering on xl/2xl screens (reduced excessive gap)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🗑️ Removed"
      },
      {
        "type": "text",
        "content": "- Dead code: Inactive ISR `revalidate` exports from 16 files (superseded by dynamic rendering)"
      },
      {
        "type": "heading",
        "level": "3",
        "content": "🐛 Fixed"
      },
      {
        "type": "text",
        "content": "- CSP violations blocking Next.js chunk loading (`unsafe-eval` errors)\n- Font loading errors caused by CSP restrictions\n- Navigation menu appearing off-center on large screens"
      }
    ]
  }
];

export const changelogFullBySlug = new Map(changelogFull.map(item => [item.slug, item]));

export function getChangelogFullBySlug(slug: string) {
  return changelogFullBySlug.get(slug) || null;
}

export type ChangelogFull = typeof changelogFull[number];
