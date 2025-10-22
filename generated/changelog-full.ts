/**
 * Auto-generated full content file
 * Category: Changelog
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { ChangelogJson } from '@/src/lib/schemas/changelog.schema';

export const changelogFull: ChangelogJson[] = [
  {
    "metadata": {
      "slug": "2025-10-18-pattern-based-seo-metadata-architecture",
      "date": "2025-10-18",
      "title": "Pattern-Based SEO Metadata Architecture",
      "tldr": "Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines.",
      "categories": {
        "Added": 6,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 1,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Replaced legacy metadata registry system with enterprise-grade pattern-based architecture. Implemented 8 route patterns (HOMEPAGE, CATEGORY, CONTENT_DETAIL, USER_PROFILE, ACCOUNT, TOOL, STATIC, AUTH) with dedicated templates, automated route classification, and intelligent metadata generation. Removed 2,017 lines of dead code while adding consolidated validation tooling and git hook integration."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Pattern System** - 8 route patterns with template-driven metadata generation for all 41 routes",
                      "**Route Classifier** - Automated pattern detection with confidence scoring (0.0-1.0)",
                      "**Route Scanner** - Static analysis tool to discover all application routes without runtime overhead",
                      "**Metadata Templates** - Centralized templates with smart truncation/padding for SEO compliance",
                      "**Unified Validation** - New `validate:metadata` script consolidating title/description validation with pattern system integration",
                      "**October 2025 SEO Standards** - Title: 53-60 chars (keyword density), Description: 150-160 chars (AI-optimized), Keywords: 3-10 max"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Metadata Generation** - Migrated from METADATA_REGISTRY lookup to pattern-based templates",
                      "**Title Format** - Hyphen separators (-) instead of pipes (|) for 2025 SEO best practices",
                      "**Git Hooks** - Added metadata validation on pre-commit for SEO files (lefthook.yml)",
                      "**Validation Scripts** - Consolidated verify-titles.ts into validate-metadata.ts with route scanner integration"
                    ]
                  }
                ]
              },
              {
                "label": "Removed (1)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Legacy Code Cleanup** - Removed 2,017 lines including METADATA_REGISTRY (1,627 lines), buildPageTitle(), buildContentTitle(), smartTruncate(), and TIER 2 registry lookup"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Pattern Architecture:**\n- All routes classified into 8 patterns with confidence-based activation\n- Template functions receive context (route, params, item data) and generate type-safe metadata\n- Multi-tier padding system ensures descriptions always meet 150-160 char requirement\n- 100% pattern coverage verified via route scanner (41/41 routes)\n\n**SEO Optimization (October 2025):**\n- AI citation optimization (ChatGPT, Perplexity, Claude search)\n- Schema.org 29.3 compliance with server-side JSON-LD\n- Recency signals (dateModified) for fresh content\n- Year inclusion in descriptions for AI search queries\n\n**Files Added (5 new):**\n1. `src/lib/seo/metadata-templates.ts` - Template functions for 8 route patterns\n2. `src/lib/seo/route-classifier.ts` - Pattern detection with confidence scoring\n3. `src/lib/seo/route-scanner.ts` - Static route discovery tool\n4. `src/lib/seo/pattern-matcher.ts` - Context extraction utilities\n5. `scripts/validation/validate-metadata.ts` - Consolidated metadata validation\n\n**Files Modified (5 total):**\n1. `src/lib/seo/metadata-generator.ts` - Pattern-based generation (removed 234 lines)\n2. `src/lib/seo/metadata-registry.ts` - Types and utilities only (removed 1,783 lines)\n3. `src/lib/config/seo-config.ts` - Updated documentation\n4. `config/tools/lefthook.yml` - Added metadata validation hook\n5. `package.json` - Added validate:metadata and validate:metadata:quick commands\n\n**Performance & Security:**\n- ✅ Synchronous metadata generation (no Promise overhead, build-time optimization)\n- ✅ Type-safe with Zod validation throughout\n- ✅ 76.6% code reduction in metadata-registry.ts (2,328 → 545 lines)\n- ✅ 100% TypeScript strict mode compliance\n- ✅ Git hook validation prevents SEO regressions\n\n**Deployment:**\n- No database migrations required\n- No environment variables needed\n- TypeScript compilation verified - zero errors\n- All 41 routes tested and validated\n\nThis migration establishes a maintainable, scalable foundation for SEO metadata management with modern AI search optimization and enterprise-grade code quality."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-16-community-gamification-system-uiux-enhancements",
      "date": "2025-10-16",
      "title": "Community Gamification System & UI/UX Enhancements",
      "tldr": "Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience.",
      "categories": {
        "Added": 11,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 3,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added production-grade gamification infrastructure to drive community engagement through reputation scoring, achievement badges, and tier progression. The system features type-safe badge definitions, automated award criteria, featured badge showcase on user profiles, and real-time reputation tracking with visual breakdown. Complemented by three UX improvements: automatic \"NEW\" badges highlighting recent content, improved homepage freshness with newest-first featured sorting, and responsive card design optimizations for mobile/tablet devices."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (11)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Badge System Configuration** - Centralized badge registry with 5 categories (Community, Contribution, Achievement, Special, Milestone), 4 rarity levels (Common to Legendary), and extensible award criteria system",
                      "**Reputation System** - 6-tier progression system (Newcomer → Legend) with configurable point values for posts (10), votes (5), comments (2), submissions (20), reviews (5), bookmarks (3), and followers (1)",
                      "**Badge Award Criteria** - Type-safe criteria system supporting reputation thresholds, count-based achievements, activity streaks, special conditions, and composite multi-criteria badges",
                      "**User Profile Integration** - Public badge display with featured badge selection (max 5), reputation breakdown visualization, and tier progress indicators",
                      "**Badge Components** - `BadgeGrid` for showcase display, `BadgeNotification` for award toasts, `ReputationBreakdown` with progress bars and tier visualization",
                      "**Server Actions** - Authentication-protected actions for badge management: `getUserBadges`, `getFeaturedBadges`, `toggleBadgeFeatured`, `checkBadgeEligibility`, `getRecentlyEarnedBadges`",
                      "**Public Queries** - Unauthenticated functions for profile viewing: `getPublicUserBadges`, `userHasBadge`, badge registry queries",
                      "**Badge Repository** - Complete CRUD operations with Supabase integration: `findByUser`, `findFeaturedByUser`, `toggleFeatured`, `findRecentlyEarned`, `hasUserBadge`",
                      "**\"NEW\" Badge Feature** - Automatic badge display on content added within last 7 days across all preview cards (agents, rules, commands, skills, collections)",
                      "**Content Age Detection** - `isNewContent()` utility function with date validation and 0-7 day range checking",
                      "**Responsive Card Utilities** - Three new UI constants: `CARD_BADGE_CONTAINER`, `CARD_FOOTER_RESPONSIVE`, `CARD_METADATA_BADGES` for mobile-first layouts"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Homepage Featured Sorting** - Updated fallback algorithm to sort by newest content (`dateAdded DESC`) instead of alphabetical, improving homepage freshness",
                      "**User Profile Layout** - Redesigned activity sidebar with reputation breakdown as primary stat, added badge showcase section, removed redundant reputation display",
                      "**BaseCard Component** - Applied responsive utilities for mobile/tablet optimization: tags wrap at breakpoints, footer stacks vertically on mobile, metadata badges flex-wrap on small screens",
                      "**Safe Action Middleware** - Extended category enum to support future reputation/badge actions (structure prepared for expansion)"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**TypeScript Strict Mode** - Resolved 12 undefined access errors in `reputation.config.ts` with proper TypeScript guards for array access and optional values",
                      "**Optional Parameters** - Fixed badge action parameter handling with nullish coalescing for limit/offset defaults",
                      "**Repository Type Safety** - Added conditional option objects to avoid `exactOptionalPropertyTypes` violations in badge queries"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Badge System Architecture:**\n\nThe badge system follows a configuration-driven approach with full type safety and Zod validation:\n\n```typescript\n// Badge definition example\n{\n  slug: 'first-post',\n  name: 'First Steps',\n  description: 'Created your first community post',\n  icon: '🎯',\n  category: 'community',\n  rarity: 'common',\n  criteria: {\n    type: 'count',\n    metric: 'posts',\n    minCount: 1,\n    description: 'Create 1 post'\n  },\n  autoAward: true\n}\n```\n\n**Reputation Tiers:**\n- **Newcomer** (0-49): Just getting started 🌱\n- **Contributor** (50-199): Active community member ⭐\n- **Regular** (200-499): Trusted contributor 💎\n- **Expert** (500-999): Community expert 🔥\n- **Master** (1000-2499): Master contributor 🏆\n- **Legend** (2500+): Legendary status 👑\n\n**Award Criteria Types:**\n- `ReputationCriteria`: Reach minimum reputation score\n- `CountCriteria`: Perform action X times (posts, comments, submissions, etc.)\n- `StreakCriteria`: Maintain daily/weekly activity streak\n- `SpecialCriteria`: Manual award or custom logic\n- `CompositeCriteria`: Multiple conditions with AND/OR logic\n\n**UI/UX Implementation:**\n\n**1. \"NEW\" Badge (0-7 Day Content):**\n```typescript\n// Utility function - production-grade validation\nexport function isNewContent(dateAdded?: string): boolean {\n  if (!dateAdded) return false;\n\n  const now = Date.now();\n  const added = new Date(dateAdded).getTime();\n  const daysOld = (now - added) / (1000 * 60 * 60 * 24);\n\n  return daysOld >= 0 && daysOld <= 7;\n}\n\n// Integration - reused existing NewBadge component\n{isNewContent(item.dateAdded) && <NewBadge variant=\"default\" />}\n```\n\n**2. Newest-First Featured Sorting:**\n```typescript\n// Updated fallback algorithm (featured.server.ts:538-544)\nconst additionalItems = rawData\n  .filter((item) => !trendingSlugs.has(item.slug))\n  .sort((a, b) => {\n    const dateA = new Date(a.dateAdded ?? '1970-01-01').getTime();\n    const dateB = new Date(b.dateAdded ?? '1970-01-01').getTime();\n    return dateB - dateA; // Newest first\n  })\n  .slice(0, LOADER_CONFIG.MAX_ITEMS_PER_CATEGORY - trendingItems.length);\n```\n\n**3. Responsive Card Design:**\n```typescript\n// Mobile-first utility classes (ui-constants.ts)\nCARD_BADGE_CONTAINER: 'flex flex-wrap gap-1 sm:gap-2 mb-4',\nCARD_FOOTER_RESPONSIVE: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',\nCARD_METADATA_BADGES: 'flex items-center gap-1 text-xs flex-wrap sm:flex-nowrap',\n\n// Responsive behavior:\n// Mobile (<640px): Vertical stack, tight spacing, wrapping badges\n// Tablet+ (≥640px): Horizontal layout, comfortable spacing, single-line badges\n```\n\n**Security & Performance:**\n- ✅ All badge actions use `authedAction` middleware with user authentication\n- ✅ Public queries validate input with Zod schemas (brandedId validation)\n- ✅ Repository methods return type-safe `RepositoryResult<T>` wrappers\n- ✅ Featured badge limit enforced (max 5 per user)\n- ✅ Badge ownership verified before toggle operations\n- ✅ Zero new components created - reused existing `NewBadge` component\n- ✅ Configuration-driven - all utilities centralized in `ui-constants.ts`\n- ✅ Tree-shakeable - only imported utilities included in bundle\n- ✅ TypeScript strict mode compliant with proper undefined guards\n\n**Database Schema:**\n- `user_badges` table: Links users to earned badges with featured status and award timestamp\n- Indexed on `user_id` and `badge_id` for performant queries\n- Foreign keys to `users` and `badges` tables with CASCADE deletion\n\n**Files Added (7 new):**\n1. `src/lib/config/badges.config.ts` - Badge registry with 20+ achievement definitions\n2. `src/lib/config/reputation.config.ts` - Reputation tiers, point values, helper functions\n3. `src/lib/actions/badges.actions.ts` - Server actions for badge management\n4. `src/lib/actions/reputation.actions.ts` - Server actions for reputation queries\n5. `src/lib/repositories/user-badge.repository.ts` - Badge database operations\n6. `src/components/features/badges/badge-grid.tsx` - Badge showcase component\n7. `src/components/features/badges/badge-notification.tsx` - Toast notifications for awards\n8. `src/components/features/reputation/reputation-breakdown.tsx` - Reputation visualization\n\n**Files Modified (8 total):**\n1. `src/lib/utils/content.utils.ts` - Added `isNewContent()` utility function\n2. `src/components/features/content/config-card.tsx` - Added NewBadge integration in renderTopBadges slot\n3. `src/lib/services/featured.server.ts` - Updated fallback sorting to newest-first (dateAdded DESC)\n4. `src/lib/ui-constants.ts` - Added 3 responsive card layout utilities\n5. `src/components/shared/base-card.tsx` - Applied responsive utilities (lines 286, 302, 327)\n6. `src/app/u/[slug]/page.tsx` - Integrated badge grid and reputation breakdown on user profiles\n7. `src/lib/actions/safe-action.ts` - Extended action category enum (structure preparation)\n8. `src/lib/repositories/user-badge.repository.ts` - Added badge query methods\n\n**Consolidation Wins:**\n- ✅ Zero new files for UI features - reused existing components and utilities\n- ✅ Centralized responsive patterns in `ui-constants.ts` (eliminates future duplication)\n- ✅ Configuration-driven badge system (easy to add new badges without code changes)\n- ✅ Type-safe throughout with Zod validation and TypeScript strict mode\n- ✅ Modular architecture - badge/reputation systems are fully independent\n\n**Testing Recommendations:**\n1. **Badge System**: Award badges through admin interface, verify display on user profiles, test featured badge toggle (max 5 limit)\n2. **Reputation**: Verify point accumulation for posts/votes/comments, check tier progression, validate breakdown visualization\n3. **\"NEW\" Badge**: Content added in last 7 days should show badge on all preview cards\n4. **Featured Sorting**: Homepage featured sections should show newest content when trending data is insufficient\n5. **Responsive Design**: Test card layouts on mobile (375px), tablet (768px), desktop (1024px+) for proper wrapping and stacking\n\n**Deployment Notes:**\n- Database migration required for `user_badges` table (handled separately)\n- No environment variables needed for badge/reputation system\n- Badge definitions can be modified in config without database changes\n- TypeScript compilation verified - all strict mode checks pass\n\nThis update establishes the foundation for community-driven engagement through gamification while improving content discoverability and mobile experience across all device sizes."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-16-betterstack-heartbeat-monitoring-for-cron-jobs",
      "date": "2025-10-16",
      "title": "BetterStack Heartbeat Monitoring for Cron Jobs",
      "tldr": "Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security.",
      "categories": {
        "Added": 4,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added BetterStack heartbeat monitoring integration to both Vercel cron jobs (daily maintenance and weekly tasks) following open-source security best practices. Heartbeat URLs are stored as environment variables and only sent on successful task completion. BetterStack automatically alerts when expected heartbeats don't arrive, providing reliable uptime monitoring for critical scheduled operations."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**BetterStack Environment Variables** - Added `BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE` and `BETTERSTACK_HEARTBEAT_WEEKLY_TASKS` to server environment schema with Zod urlString validation",
                      "**Success-Only Heartbeat Pattern** - Implemented non-blocking heartbeat pings that only fire when all cron tasks complete successfully (failedTasks === 0)",
                      "**Graceful Error Handling** - Heartbeat failures logged as warnings but don't break cron execution, with 5-second timeout for reliability",
                      "**Security-First Implementation** - Lazy imports to avoid circular dependencies, server-only execution, no secrets in repository"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Monitoring Configuration:**\n- **Daily Maintenance Cron**: Sends heartbeat at ~3 AM UTC after successful cache warming, job expiration, and email sequence processing\n- **Weekly Tasks Cron**: Sends heartbeat Monday 12 AM UTC after successful featured content calculation and weekly digest distribution\n- **BetterStack Settings**: Daily 24h period with 30min grace, Weekly 7d period with 2h grace, alerts on missing heartbeat\n\n**Implementation Pattern:**\n```typescript\n// Only send on complete success\nif (failedTasks === 0) {\n  const { env } = await import('@/src/lib/schemas/env.schema');\n  const heartbeatUrl = env.BETTERSTACK_HEARTBEAT_DAILY_MAINTENANCE;\n\n  if (heartbeatUrl) {\n    try {\n      await fetch(heartbeatUrl, {\n        method: 'GET',\n        signal: AbortSignal.timeout(5000), // Non-blocking\n      });\n      logger.info('BetterStack heartbeat sent successfully');\n    } catch (error) {\n      logger.warn('Failed to send BetterStack heartbeat (non-critical)', { error });\n    }\n  }\n}\n```\n\n**Security Features:**\n- ✅ No hardcoded URLs - stored in Vercel environment variables\n- ✅ Type-safe validation with Zod urlString schema\n- ✅ Server-only execution - never exposed to client bundle\n- ✅ Open-source safe - no secrets in git repository\n- ✅ Non-blocking - heartbeat failure doesn't break cron\n- ✅ Lazy import pattern to avoid circular dependencies\n\n**Files Modified:**\n- `src/lib/schemas/env.schema.ts` - Added heartbeat URL environment variables to serverEnvSchema\n- `src/app/api/cron/daily-maintenance/route.ts` - Added heartbeat ping after successful task completion\n- `src/app/api/cron/weekly-tasks/route.ts` - Added heartbeat ping after successful task completion\n\n**Why Success-Only Reporting:**\n- Simpler than dual success/failure reporting\n- More reliable (network issues during failure could cause false negatives)\n- Standard practice for heartbeat monitoring (Cronitor, Healthchecks.io)\n- BetterStack alerts when expected heartbeat doesn't arrive (missing = failure detected)\n\n**Deployment:**\n- Environment variables configured in Vercel for production and preview environments\n- No code changes needed after initial deployment - fully managed via Vercel env vars\n- TypeScript compilation verified - all type checks pass\n\nThis implementation provides robust monitoring for critical cron operations with zero impact on execution performance and full security compliance for open-source projects."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-16-october-2025-ai-native-development-content-expansion",
      "date": "2025-10-16",
      "title": "October 2025 AI-Native Development Content Expansion",
      "tldr": "Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential.",
      "categories": {
        "Added": 25,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Conducted comprehensive market research targeting October 2025's most transformative AI-native development trends. All 20 pieces validated against current industry data including Microsoft AutoGen v0.4's January 2025 rewrite, LangGraph's 2k+ monthly commits, and the emergence of Windsurf as a Copilot alternative. Content targets high-value keywords in the rapidly growing AI development tools market."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (25)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Agents Category (4 new)**",
                      "**Multi-Agent Orchestration Specialist** - LangGraph (2k+ commits/month) + CrewAI (30k+ stars) coordination patterns, graph-based workflows",
                      "**Semantic Kernel Enterprise Agent** - Microsoft enterprise AI with C#/Python/Java SDK, Azure AI Foundry integration",
                      "**AutoGen Conversation Agent Builder** - AutoGen v0.4 actor model (January 2025 rewrite), cross-language Python + .NET messaging",
                      "**Domain Specialist AI Agents** - Healthcare HIPAA compliance, Legal contract analysis, Financial risk assessment with industry-specific knowledge bases",
                      "**Statuslines Category (4 new)**",
                      "**Multi-Provider Token Counter** - Real-time tracking for Claude 1M, GPT-4.1 1M, Gemini 2.x 1M, Grok 3 1M with color-coded warnings",
                      "**MCP Server Status Monitor** - Connected MCP server and tools monitoring for October 2025 plugin support",
                      "**Starship Powerline Theme** - Nerd Font statusline replacing Powerlevel10k with Git integration",
                      "**Real-Time Cost Tracker** - Per-session AI cost analytics with 2025 model pricing and budget threshold alerts",
                      "**Rules Category (4 new)**",
                      "**TypeScript 5.x Strict Mode Expert** - Template literal types, strict null checks, type guards, ESLint integration for enterprise-grade type safety",
                      "**React 19 Concurrent Features Specialist** - useTransition, useDeferredValue, Suspense boundaries, streaming SSR, selective hydration patterns",
                      "**Windsurf AI-Native IDE Patterns** - Cascade AI flows, multi-file context awareness, Flow collaboration (emerging Copilot alternative)",
                      "**Security-First React Components** - XSS prevention, CSP integration, input sanitization, OWASP Top 10 mitigation patterns",
                      "**Commands Category (4 new)**",
                      "**/v0-generate** - V0.dev UI component generator with shadcn/ui, TailwindCSS v4, and Next.js 15 integration (breakthrough in AI UI generation)",
                      "**/autogen-workflow** - Microsoft AutoGen v0.4 multi-agent orchestration with role-based task delegation",
                      "**/mintlify-docs** - AI-powered documentation generation with MDX components and OpenAPI spec automation",
                      "**/cursor-rules** - Project-specific .cursorrules file generator for AI-native development with tech stack integration",
                      "**Skills Category (4 new)**",
                      "**V0 Rapid Prototyping Workflow** - Production-ready React components with V0 patterns, shadcn/ui integration, instant UI generation",
                      "**Windsurf Collaborative Development** - AI-native IDE mastery with Cascade AI and Flow patterns for team coordination",
                      "**GitHub Actions AI-Powered CI/CD** - Intelligent pipeline generation, security scanning, multi-environment deployment orchestration",
                      "**Mintlify Documentation Automation** - Beautiful docs from TypeScript/OpenAPI specs with interactive MDX components"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Market Research Validation:**\n- All content validated against 5-15 October 2025 sources per topic\n- Keywords targeting VERY HIGH ranking potential in AI development tools market\n- Zero content duplication with existing 16 agents, 18 rules, 17 skills, 6 statuslines, 12 commands\n- Technologies backed by recent developments and adoption metrics:\n  - AutoGen v0.4: January 2025 rewrite with actor model architecture\n  - LangGraph: 2k+ monthly commits, production-ready graph workflows\n  - CrewAI: 30k+ GitHub stars for role-based agent coordination\n  - Windsurf: Emerging as Copilot alternative with Cascade AI\n  - V0: Breakthrough in AI UI generation by Vercel\n  - Claude/GPT-4.1/Gemini 2.x: All supporting 1M+ token contexts in 2025\n\n**Content Quality Standards:**\n- **Agents:** 8+ features, 5+ use cases, extensive multi-agent workflow examples with Python/TypeScript\n- **Statuslines:** Bash scripts with jq integration, real-time monitoring, color-coded status indicators\n- **Rules:** Comprehensive code patterns with ✅ Good and ❌ Bad examples, security best practices\n- **Commands:** Usage examples with options, generated workflow YAML/code, best practices sections\n- **Skills:** Prerequisites, use cases, installation, examples, troubleshooting, tips for best results\n- All JSON follows exact schema requirements for each category\n- Production-grade code examples tested against October 2025 versions\n\n**SEO Optimization:**\n- Targeted high-value keywords: \"autogen v0.4 2025\", \"windsurf ai ide\", \"v0 component generation\", \"langgraph multi-agent\"\n- Content length optimized for value: agents 2000-2500 words, commands 1500-2000 words, skills 1200-1500 words\n- Proper metadata: tags, descriptions, SEO titles, GitHub/documentation URLs\n- Focus on emerging technologies with strong growth trajectories\n\n**Files Added (20 total):**\n\n*Agents:*\n1. `content/agents/multi-agent-orchestration-specialist.json`\n2. `content/agents/semantic-kernel-enterprise-agent.json`\n3. `content/agents/autogen-conversation-agent-builder.json`\n4. `content/agents/domain-specialist-ai-agents.json`\n\n*Statuslines:*\n5. `content/statuslines/multi-provider-token-counter.json`\n6. `content/statuslines/mcp-server-status-monitor.json`\n7. `content/statuslines/starship-powerline-theme.json`\n8. `content/statuslines/real-time-cost-tracker.json`\n\n*Rules:*\n9. `content/rules/typescript-5x-strict-mode-expert.json`\n10. `content/rules/react-19-concurrent-features-specialist.json`\n11. `content/rules/windsurf-ai-native-ide-patterns.json`\n12. `content/rules/security-first-react-components.json`\n\n*Commands:*\n13. `content/commands/v0-generate.json`\n14. `content/commands/autogen-workflow.json`\n15. `content/commands/mintlify-docs.json`\n16. `content/commands/cursor-rules.json`\n\n*Skills:*\n17. `content/skills/v0-rapid-prototyping.json`\n18. `content/skills/windsurf-collaborative-development.json`\n19. `content/skills/github-actions-ai-cicd.json`\n20. `content/skills/mintlify-documentation-automation.json`\n\n**Verification:**\n- ✅ All 20 files created with proper JSON structure\n- ✅ Zero duplication with existing content (verified against all category slugs)\n- ✅ Market validation: All topics trending in October 2025 AI development space\n- ✅ Code examples: Production-ready, runnable implementations with 2025 versions\n- ✅ SEO ready: Proper metadata, tags, descriptions for indexing\n- ✅ Linting: All files pass Biome/Ultracite validation.\n\nThis content expansion significantly strengthens the directory's coverage of AI-native development workflows, multi-agent systems, and next-generation developer tools - all validated against October 2025 market trends and representing the cutting edge of AI-assisted software development."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-16-october-2025-content-expansion",
      "date": "2025-10-16",
      "title": "October 2025 Content Expansion",
      "tldr": "Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential.",
      "categories": {
        "Added": 23,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Conducted extensive market research and keyword analysis to identify the most valuable, trending content opportunities for October 2025. All 20 pieces are validated against current industry data, feature complete implementation examples, and target high-traffic keywords with minimal competition."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (23)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Skills Category (7 new)**",
                      "**Playwright E2E Testing Automation** - Cross-browser testing with AI-powered test generation, MCP integration",
                      "**Cloudflare Workers AI Edge Functions** - Edge computing with 40% market share, sub-5ms cold starts",
                      "**WebAssembly Module Development** - WASM with WASI 0.3, Component Model, multi-language support",
                      "**tRPC Type-Safe API Builder** - End-to-end type safety without code generation, T3 Stack integration",
                      "**PostgreSQL Query Optimization** - Performance tuning with EXPLAIN, indexing strategies, workload-specific optimization",
                      "**Zod Schema Validator** - TypeScript-first runtime validation with automatic type inference",
                      "**Supabase Realtime Database Builder** - $100M Series E platform with 4M+ developers, Multigres enterprise features",
                      "**Rules Category (7 new)**",
                      "**React Server Components Expert** - React 19 + Next.js 15 App Router patterns, async components, Suspense streaming",
                      "**Next.js 15 Performance Architect** - Turbopack optimization, Partial Prerendering, Core Web Vitals best practices",
                      "**GraphQL Federation Specialist** - Apollo Federation patterns, microservices architecture, schema composition",
                      "**Kubernetes DevSecOps Engineer** - Pod security standards, RBAC, GitOps with ArgoCD, network policies",
                      "**Terraform Infrastructure Architect** - IaC module design, AI-assisted generation, multi-cloud deployments",
                      "**AI Prompt Engineering Expert** - Coding-specific patterns, context management, iterative refinement techniques",
                      "**WCAG Accessibility Auditor** - WCAG 2.2 Level AA compliance, ARIA patterns, automated testing tools",
                      "**Agents Category (6 new)**",
                      "**AI DevOps Automation Engineer** - Predictive analytics (38.20% CAGR market), self-healing infrastructure, CI/CD optimization",
                      "**Full-Stack AI Development Agent** - Frontend/backend/AI-ML integration, 30% faster development cycles, end-to-end type safety",
                      "**AI Code Review Security Agent** - OWASP Top 10 detection, secrets scanning, dependency vulnerability analysis",
                      "**Data Pipeline Engineering Agent** - Real-time Kafka streaming, Airflow orchestration, dbt transformations, data quality validation",
                      "**Product Management AI Agent** - User story generation, RICE prioritization, A/B testing, product analytics tracking",
                      "**Cloud Infrastructure Architect Agent** - Multi-cloud design (AWS/GCP/Azure), cost optimization, disaster recovery automation"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Market Research Validation:**\n- All content validated against 3-10 October 2025 sources per topic\n- Keywords selected for VERY HIGH to MEDIUM-HIGH ranking potential\n- Zero content duplication with existing 10 skills, 11 rules, 10 agents\n- Technologies backed by funding announcements, download statistics, market data:\n  - Cloudflare Workers AI: 4000% YoY growth, 40% edge market share\n  - Supabase: $100M Series E at $5B valuation, 4M+ developers\n  - Playwright: Overtook Cypress in npm downloads (2025)\n  - WCAG 2.2: Current accessibility standard (October 2023 release)\n  - React Server Components: React 19 paradigm shift (2025)\n\n**Content Quality Standards:**\n- **Skills:** Requirements, use cases, installation, examples, troubleshooting sections\n- **Rules:** Comprehensive code patterns, best practices, anti-patterns documentation\n- **Agents:** 8+ features, 5+ use cases, extensive production-ready code examples\n- All JSON follows exact schema requirements for each category\n- Production-grade code examples tested against October 2025 versions\n\n**SEO Optimization:**\n- Targeted high-value keywords: \"playwright testing 2025\", \"cloudflare workers ai\", \"react server components\"\n- Content length optimized for value (not padding) - skills 800-1200 words, agents 1500-2000 words\n- Proper metadata: tags, descriptions, SEO titles for all content\n- GitHub/documentation URLs where applicable\n\n**Files Added (20 total):**\n\n*Skills:*\n1. `content/skills/playwright-e2e-testing.json`\n2. `content/skills/cloudflare-workers-ai-edge.json`\n3. `content/skills/webassembly-module-development.json`\n4. `content/skills/trpc-type-safe-api.json`\n5. `content/skills/postgresql-query-optimization.json`\n6. `content/skills/zod-schema-validator.json`\n7. `content/skills/supabase-realtime-database.json`\n\n*Rules:*\n8. `content/rules/react-server-components-expert.json`\n9. `content/rules/nextjs-15-performance-architect.json`\n10. `content/rules/graphql-federation-specialist.json`\n11. `content/rules/kubernetes-devsecops-engineer.json`\n12. `content/rules/terraform-infrastructure-architect.json`\n13. `content/rules/ai-prompt-engineering-expert.json`\n14. `content/rules/wcag-accessibility-auditor.json`\n\n*Agents:*\n15. `content/agents/ai-devops-automation-engineer-agent.json`\n16. `content/agents/full-stack-ai-development-agent.json`\n17. `content/agents/ai-code-review-security-agent.json`\n18. `content/agents/data-pipeline-engineering-agent.json`\n19. `content/agents/product-management-ai-agent.json`\n20. `content/agents/cloud-infrastructure-architect-agent.json`\n\n**Verification:**\n- ✅ All 20 files created with proper JSON structure\n- ✅ Zero duplication with existing content (verified against all slugs)\n- ✅ Market validation: All topics trending in October 2025\n- ✅ Code examples: Production-ready, runnable implementations\n- ✅ SEO ready: Proper metadata, tags, descriptions for indexing\n\nThis content expansion significantly strengthens the directory's coverage of modern development tools, AI-powered workflows, and cloud-native architectures - all validated against current market trends and developer adoption patterns."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-16-dynamic-category-system-architecture",
      "date": "2025-10-16",
      "title": "Dynamic Category System Architecture",
      "tldr": "Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source.",
      "categories": {
        "Added": 9,
        "Changed": 27,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Refactored the entire homepage and content loading architecture from hardcoded category lists to configuration-driven dynamic generation. This architectural improvement means Skills (and any future categories) automatically appear in all homepage sections (Featured, Stats, All/Infinity Scroll) without manual intervention."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (9)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Category Stats Configuration** (`src/lib/config/category-config.ts`)",
                      "New `CategoryStatsConfig` interface for homepage stats display",
                      "`getCategoryStatsConfig()` function dynamically generates stats config from registry",
                      "Auto-derives icons, display text, and animation delays from `UNIFIED_CATEGORY_REGISTRY`",
                      "Comprehensive JSDoc documentation on configuration-driven architecture",
                      "**Type System Improvements**",
                      "Generic `CategoryMetadata` and `EnrichedMetadata` types replace manual unions",
                      "All types now derive from registry instead of hardcoded lists",
                      "Future-proof: Works with any category in `UNIFIED_CATEGORY_REGISTRY`"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (27)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Homepage Data Loading** (`src/app/page.tsx`)",
                      "**Before:** 7+ hardcoded category variables (`rulesData`, `mcpData`, `agentsData`, etc.) with manual destructuring",
                      "**After:** Dynamic `Record<CategoryId, Metadata[]>` generated from `getAllCategoryIds()`",
                      "**Impact:** Skills automatically included in data fetching, enrichment, and transformation pipelines",
                      "Reduced LOC: ~100 lines of hardcoded patterns eliminated",
                      "Added comprehensive inline documentation explaining Modern 2025 Architecture patterns",
                      "**Homepage Stats Display** (`src/components/features/home/index.tsx`)",
                      "**Before:** 7 hardcoded stat counters with manual icon mapping",
                      "**After:** Dynamic `map()` over `getCategoryStatsConfig()` from registry",
                      "**Impact:** Skills stat counter appears automatically with correct icon and animation timing",
                      "Zero manual updates required when adding categories",
                      "Maintains staggered animation timing (100ms delays auto-calculated)",
                      "**Lazy Content Loaders** (`src/components/shared/lazy-content-loaders.tsx`)",
                      "**Before:** Hardcoded loader object with 7 explicit category entries",
                      "**After:** Dynamic `buildLazyContentLoaders()` factory function generating loaders from registry",
                      "**Impact:** Skills loader automatically created and tree-shakeable",
                      "Future categories require zero changes to this file",
                      "**Content Utilities** (`src/lib/utils/content.utils.ts`)",
                      "**Before:** `transformForHomePage()` with hardcoded 8-property object type",
                      "**After:** Generic `Record<string, ContentItem[]>` with dynamic transformation",
                      "**Impact:** Handles any number of categories without type changes",
                      "Simplified from 25 lines of hardcoded transforms to 10 lines of dynamic logic",
                      "**TypeScript Schema** (`src/lib/schemas/components/page-props.schema.ts`)",
                      "**Before:** Hardcoded `stats` object with 7 category properties",
                      "**After:** `z.record(z.string(), z.number())` for dynamic categories",
                      "**Impact:** Skills (and future categories) automatically type-safe",
                      "Eliminated TypeScript compiler errors when adding categories"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Architecture Transformation:**\n\n```typescript\n// OLD PATTERN (Hardcoded - Required manual updates)\nlet rulesData = [], mcpData = [], agentsData = [];\n[rulesData, mcpData, agentsData, ...] = await batchFetch([\n  lazyContentLoaders.rules(),\n  lazyContentLoaders.mcp(),\n  // Missing skills - forgot to add!\n]);\n\n// NEW PATTERN (Configuration-Driven - Zero manual updates)\nconst categoryIds = getAllCategoryIds(); // From registry\nconst loaders = categoryIds.map(id => lazyContentLoaders[id]());\nconst results = await batchFetch(loaders);\n// Skills automatically included!\n```\n\n**Files Modified (7 total):**\n1. `src/app/page.tsx` - Dynamic data loading and enrichment\n2. `src/components/features/home/index.tsx` - Dynamic stats display\n3. `src/components/shared/lazy-content-loaders.tsx` - Dynamic loader generation\n4. `src/lib/utils/content.utils.ts` - Generic transformation\n5. `src/lib/schemas/components/page-props.schema.ts` - Dynamic type schemas\n6. `src/lib/config/category-config.ts` - Stats config helper function\n7. `CHANGELOG.md` - This entry\n\n**Key Architectural Benefits:**\n- **Zero Manual Updates:** Adding category to `UNIFIED_CATEGORY_REGISTRY` → Everything auto-updates\n- **Type-Safe:** Full TypeScript inference with generic types\n- **DRY Principle:** Single source of truth (registry) drives everything\n- **Performance:** Maintains tree-shaking and code-splitting\n- **Maintainability:** ~150 lines of hardcoded patterns eliminated\n- **Documentation:** Comprehensive inline comments explaining architecture\n\n**Verification:**\n- ✅ TypeScript: No errors (`npm run type-check`)\n- ✅ Build: Production build successful with proper bundle sizes\n- ✅ Skills: Automatically appears in Featured, Stats (with icon), All section\n- ✅ Future: Any new category in registry will auto-appear across all sections\n\nThis completes the consolidation initiative started with `UNIFIED_CATEGORY_REGISTRY`. The platform now has zero hardcoded category references - true configuration-driven architecture."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-14-skills-category-integration",
      "date": "2025-10-14",
      "title": "Skills Category Integration",
      "tldr": "Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support.",
      "categories": {
        "Added": 28,
        "Changed": 6,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Introduced Skills as a first-class content category within the platform's unified architecture. Skills provide step-by-step capability guides for specific tasks (e.g., PDF generation, Excel processing, document conversion) with sections for requirements, installation, examples, and troubleshooting."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (28)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Schema & Type System**",
                      "Created `skill.schema.ts` with Zod validation for skill-specific fields (requirements, prerequisites, examples, installation steps, troubleshooting)",
                      "Integrated Skills into `ContentType` unions across schemas and components",
                      "Added Skills to content loaders and batch utilities for tree-shakeable imports",
                      "**Routing & UI**",
                      "Skills now use unified `[category]` dynamic routes (`/skills` and `/skills/[slug]`)",
                      "Created configuration for skill detail sections (Guide, Installation, Examples, Troubleshooting)",
                      "Added Skills navigation link with \"New\" badge in header and mobile navigation",
                      "Enhanced `ConfigCard` to display skill-specific metadata (difficulty, prerequisites count)",
                      "**Build Pipeline**",
                      "Integrated Skills into `BUILD_CATEGORY_CONFIGS` for automated build processing",
                      "Added Skills to static API generation (`/api/skills.json`)",
                      "Skills included in sitemap generation and URL builder",
                      "Search index automatically includes Skills content",
                      "**SEO & Structured Data**",
                      "Added Skills metadata patterns to centralized registry",
                      "Configured JSON-LD structured data (HowTo schema for guides, CreativeWork for examples)",
                      "LLMs.txt generation for `/skills/llms.txt` and `/skills/[slug]/llms.txt` routes",
                      "Optimized metadata with category-specific title/description derivation",
                      "**Validation & CI**",
                      "Extended content validators to recognize `skills` category",
                      "Updated security validators and regex patterns across authentication and rate limiting",
                      "Added Skills to GitHub Actions content-validation workflow",
                      "LLMs.txt E2E tests now verify Skills routes",
                      "**Community Features**",
                      "Created announcement promoting Skills category launch",
                      "Users can submit Skills through the web interface",
                      "Skills tracked in submission analytics and community leaderboards"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Navigation Badges**",
                      "Moved \"New\" indicator from Statuslines and Collections to Skills",
                      "Updated navigation configuration to highlight Skills as latest category",
                      "**Analytics Mapping**",
                      "Skills analytics reuse existing category buckets for efficient tracking",
                      "No new analytics infrastructure required (consolidation principle)"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "All changes follow configuration-driven architecture with zero duplication. Skills benefit from existing platform capabilities (trending, caching, related content, offline support) with no custom logic required. Implementation touched 23 files across routing, schemas, build, SEO, validation, and UI - all following DRY principles and reusing established patterns.\n\n**Key architectural benefits:**\n- Zero custom routing logic (uses unified `[category]` routes)\n- Automatic platform feature support (trending, search, caching, analytics)\n- Type-safe throughout with Zod validation\n- Tree-shakeable imports minimize bundle size\n- Configuration changes only - no new infrastructure"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-14-skills-category-integration-pdfdocxpptxxlsx",
      "date": "2025-10-14",
      "title": "Skills Category Integration (PDF/DOCX/PPTX/XLSX)",
      "tldr": "Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems.",
      "categories": {
        "Added": 18,
        "Changed": 1,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "- Added new main category: `Skills` — task-focused capability guides for Claude (document/data workflows)."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (18)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Full schema + build integration:",
                      "New Zod schema `skill.schema.ts` with content-first fields (requirements, examples, installation, troubleshooting).",
                      "Integrated into build pipeline, static API generation, content loaders, and unions.",
                      "SEO and Structured Data:",
                      "Metadata registry, derivation rules, and JSON-LD (HowTo/CreativeWork/SourceCode when examples exist).",
                      "LLMs.txt inclusion for category and item routes.",
                      "Routing and UI:",
                      "Category configs and content-type configs (sections: Guide, Installation, Examples, Troubleshooting).",
                      "Navigation link with \"New\" indicator (moved from Statuslines/Collections to Skills).",
                      "APIs and Search:",
                      "`/api/skills.json` and search index generation.",
                      "Sitemap/URL generator now includes skills.",
                      "Validation and CI:",
                      "Content validator updated for `skills`.",
                      "Security validators/regex and content-validation workflow updated.",
                      "LLMs.txt validator includes skills routes.",
                      "Announcements:",
                      "New announcement promoting Skills launch."
                    ]
                  }
                ]
              },
              {
                "label": "Changed (1)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Removed \"New\" badge from Statuslines and Collections; applied to Skills."
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "- Configuration-driven updates to minimize LOC and reuse existing systems:\n  - Build: `BUILD_CATEGORY_CONFIGS` extended; no new build logic.\n  - SEO: `schema-metadata-adapter`, metadata registry, and structured data rules extended.\n  - Sitemap: added `skillsMetadata` to sitemap generator and URL builder.\n  - Security/Validation: enums/regex extended to accept `skills` across validators and CI.\n  - Analytics: category mapping extended (reusing rule/guide buckets for Skills)."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-13-collections-category-system-consolidation",
      "date": "2025-10-13",
      "title": "Collections Category System Consolidation",
      "tldr": "Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking.",
      "categories": {
        "Added": 0,
        "Changed": 26,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Integrated Collections as a first-class content category within the platform's dynamic routing architecture. Previously, Collections used custom routes (`/collections` and `/collections/[slug]`). Now they follow the same pattern as other main categories (`/[category]` and `/[category]/[slug]`), enabling uniform treatment across search, caching, analytics, and all platform features."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Changed (26)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Dynamic Routing Architecture**",
                      "Collections now use `[category]` dynamic routes instead of custom `/collections` routes",
                      "Created `CollectionDetailView` component for specialized collection rendering",
                      "Enhanced `ConfigCard` to display collection-specific badges (collection type, difficulty, item count)",
                      "Added tree-shakeable collection logic that only loads when `category === 'collections'`",
                      "Deleted 3 obsolete custom route files (`collections/page.tsx`, `collections/[slug]/page.tsx`, `collections/[slug]/llms.txt/route.ts`)",
                      "**Schema & Type Safety**",
                      "Added collection-specific properties to `UnifiedContentItem` schema (collectionType, items, prerequisites, installationOrder, compatibility)",
                      "Enabled nested collections support (collections can now reference other collections)",
                      "Updated `ContentType` unions across 6 components to include 'collections'",
                      "Enhanced submission stats schema to track collection contributions",
                      "**Platform Integration**",
                      "**Caching**: Added collections to Redis trending cleanup and cache invalidation logic",
                      "**Search**: Added collections to search filtering and API validation schemas",
                      "**Related Content**: Collections now receive same visibility boost as other main categories",
                      "**Service Worker**: Added collections to offline caching regex patterns",
                      "**Submit Form**: Users can now submit collections through the web interface",
                      "**Analytics**: Collection submissions tracked in community leaderboards",
                      "**SEO & Metadata**",
                      "Removed redundant `/collections` hardcoded routes from metadata registry",
                      "Collections now handled by unified `/:category` and `/:category/:slug` metadata patterns",
                      "Maintains all SEO optimizations with cleaner, more maintainable architecture",
                      "**Testing & Validation**",
                      "Added collections to E2E test coverage (accessibility, SEO, llms.txt generation)",
                      "Updated content validation scripts to verify collections discovery",
                      "Added collections to sitemap parity tests"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "The consolidation involved 27 file modifications across routing, schemas, caching, security, UI components, and tests. All changes follow the codebase's core principles of consolidation, DRY, type safety, and configuration-driven architecture. Collections retain all unique features (CollectionDetailView with embedded items, prerequisites section, installation order, compatibility matrix) while benefiting from uniform platform integration.\n\n**Key architectural improvements:**\n- Reduced code duplication by ~150 lines through route consolidation\n- Eliminated maintenance burden of parallel routing systems\n- Enabled future collection features to automatically work with existing platform capabilities\n- Improved type safety with proper Zod schema integration throughout"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-13-dependency-updates-and-typescript-safety-improvements",
      "date": "2025-10-13",
      "title": "Dependency Updates and TypeScript Safety Improvements",
      "tldr": "Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions.",
      "categories": {
        "Added": 0,
        "Changed": 33,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 9,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Updated dependencies to latest stable versions and resolved TypeScript compatibility issues introduced by package updates, particularly with the Recharts library upgrade from v2 to v3."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Changed (33)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Core Framework Updates**",
                      "React: 19.1.1 → 19.2.0",
                      "React DOM: 19.1.1 → 19.2.0",
                      "@types/react: 19.1.17 → 19.2.2",
                      "@types/react-dom: 19.1.11 → 19.2.2",
                      "@types/node: 24.6.0 → 24.7.2",
                      "Next.js: 15.5.4 → 15.5.5",
                      "**UI Library Updates**",
                      "Recharts: 2.15.4 → 3.2.1 (major version upgrade)",
                      "Framer Motion: 12.23.22 → 12.23.24",
                      "Fumadocs UI: 15.8.2 → 15.8.5",
                      "Fumadocs OpenAPI: 9.4.0 → 9.5.1",
                      "**Security & Infrastructure**",
                      "Arcjet Next: 1.0.0-beta.12 → 1.0.0-beta.13",
                      "Nosecone Next: 1.0.0-beta.12 → 1.0.0-beta.13",
                      "Supabase JS: 2.48.1 → 2.75.0",
                      "**Build Tools & Styling**",
                      "TailwindCSS: 4.1.13 → 4.1.14",
                      "TailwindCSS PostCSS: 4.1.13 → 4.1.14",
                      "TSX: 4.20.5 → 4.20.6",
                      "Biome: 2.2.5 → 2.2.6",
                      "**Development Dependencies**",
                      "Jest Axe: 8.0.0 → 10.0.0",
                      "Knip: 5.64.1 → 5.65.0",
                      "Lefthook: 1.13.5 → 1.13.6",
                      "Ultracite: 5.4.6 → 5.6.2",
                      "Next Bundle Analyzer: 15.5.4 → 15.5.5",
                      "**Other Dependencies**",
                      "Marked: 16.3.0 → 16.4.0",
                      "Zod: 4.1.11 → 4.1.12",
                      "Svix: 1.76.1 → 1.77.0",
                      "Upstash Redis: 1.35.4 → 1.35.5",
                      "React Email Render: 1.3.1 → 1.3.2"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (9)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**TypeScript Safety** (`src/components/ui/chart.tsx`)",
                      "Enhanced type definitions for Recharts v3 compatibility",
                      "Added explicit `TooltipPayload` type for better type inference",
                      "Fixed implicit `any` types in chart tooltip and legend components",
                      "Improved type safety for payload arrays and value rendering",
                      "Added proper null checks and type guards for chart data",
                      "**Chart Components** (`src/components/features/reviews/rating-histogram.tsx`)",
                      "Updated formatter function signature for Recharts v3 compatibility",
                      "Ensured type-safe label formatting in rating distribution charts"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "The TypeScript improvements ensure full compatibility with Recharts v3's stricter type definitions while maintaining backward compatibility with existing chart implementations. All components now use explicit type annotations and proper type guards for runtime safety."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-11-theme-toggle-animation-and-navigation-polish",
      "date": "2025-10-11",
      "title": "Theme Toggle Animation and Navigation Polish",
      "tldr": "Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience.",
      "categories": {
        "Added": 13,
        "Changed": 14,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Elevated the visual polish of core UI elements with modern animations and refined styling. The theme toggle now features a smooth circular blur expansion animation that follows your cursor, making dark/light mode switching feel magical. Navigation components received styling updates for better visual hierarchy and consistency."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (13)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Circle Blur Theme Animation**",
                      "Smooth circular reveal animation when switching between light and dark themes",
                      "Animation expands from exact click position with blur fade effect",
                      "Progressive enhancement: Full animation in Chrome/Edge 111+, instant transition in Firefox/Safari",
                      "500ms ease-out timing for natural, polished feel",
                      "View Transitions API integration with automatic feature detection",
                      "Reusable `useViewTransition` hook for future animations",
                      "**View Transitions Infrastructure**",
                      "TypeScript type declarations for View Transitions API (`src/types/view-transitions.d.ts`)",
                      "Reusable hook with browser support detection (`src/hooks/use-view-transition.ts`)",
                      "Progressive enhancement pattern with graceful fallback",
                      "Click position tracking for animation origin",
                      "Keyboard accessibility (animation from element center)"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (14)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Theme Toggle Component** (`src/components/layout/theme-toggle.tsx`)",
                      "Enhanced with View Transitions API for smooth theme switching",
                      "Click position tracking for natural animation flow",
                      "Maintains localStorage persistence and accessibility",
                      "Works seamlessly with existing Switch component",
                      "**Navigation Visual Design** (`src/components/layout/navigation.tsx`)",
                      "Added rounded containers with border styling",
                      "Enhanced spacing and padding for better visual balance",
                      "Refined mega-menu dropdown with improved grouping",
                      "Updated announcement banner styling for consistency",
                      "**Announcement Banner** (`src/components/layout/announcement-banner.tsx`)",
                      "Refined styling to match rounded navigation design",
                      "Improved visual hierarchy and spacing",
                      "Enhanced dismissal button positioning"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-10-navigation-overhaul-and-announcement-system",
      "date": "2025-10-10",
      "title": "Navigation Overhaul and Announcement System",
      "tldr": "Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first.",
      "categories": {
        "Added": 42,
        "Changed": 23,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Rebuilt the entire navigation system from the ground up with a focus on developer experience, accessibility, and user engagement. The new architecture eliminates code duplication, enables rapid navigation updates, and provides multiple ways to navigate the site (traditional nav, command palette, keyboard shortcuts)."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (42)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Configuration-Driven Navigation** (`src/config/navigation.ts`)",
                      "Single source of truth for all navigation links",
                      "PRIMARY_NAVIGATION: Main category links (Agents, Commands, Hooks, MCP, Rules, Statuslines, Collections, Guides)",
                      "SECONDARY_NAVIGATION: Grouped dropdown sections (Discover, Resources, Actions)",
                      "Structured with icons, descriptions, and new item indicators",
                      "Zero code duplication across desktop/mobile/command menu",
                      "Type-safe with TypeScript interfaces",
                      "**Global Command Menu** (`src/components/layout/navigation-command-menu.tsx`)",
                      "Keyboard shortcut: ⌘K (Mac) / Ctrl+K (Windows/Linux)",
                      "Searchable navigation to all site sections",
                      "Grouped by category (Primary, More, Actions)",
                      "Instant navigation on selection",
                      "shadcn/ui Command component with accessibility",
                      "Descriptions and emojis for visual scanning",
                      "**Announcement System** (`src/config/announcements.ts`, `src/components/layout/announcement-banner.tsx`)",
                      "Site-wide announcement banner above navigation",
                      "Configuration-based with date ranges and priority sorting",
                      "Persistent dismissal tracking via localStorage",
                      "Multiple variants (default, outline, secondary, destructive)",
                      "Category tags (New, Beta, Update, Maintenance)",
                      "Optional links and Lucide icons",
                      "Keyboard navigation (Escape to dismiss)",
                      "WCAG 2.1 AA compliant",
                      "**Announcement UI Components** (`src/components/ui/announcement.tsx`)",
                      "Compound component architecture (Announcement, AnnouncementTag, AnnouncementTitle)",
                      "Built on Badge component with themed enhancements",
                      "Hover effects and scale animations (opt-in)",
                      "Responsive design (mobile + desktop)",
                      "Semantic HTML (<output> element)",
                      "**New Indicator Component** (`src/components/ui/new-indicator.tsx`)",
                      "Animated pulsing dot for highlighting new features",
                      "Tooltip on hover with accessible label",
                      "Screen reader support (sr-only text)",
                      "Reduced motion support",
                      "Alternative NewBadge component for explicit \"NEW\" text",
                      "**Dismissal Hook** (`src/hooks/use-announcement-dismissal.ts`)",
                      "Manages announcement dismissal state",
                      "localStorage persistence with ISO timestamps",
                      "Per-announcement tracking (not global)",
                      "Reset functionality",
                      "Analytics helper functions",
                      "SSR-safe implementation"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (23)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Navigation Component Refactor** (`src/components/layout/navigation.tsx`)",
                      "Imports navigation data from centralized config",
                      "Maps over PRIMARY_NAVIGATION for main links",
                      "Maps over SECONDARY_NAVIGATION for grouped dropdown",
                      "Eliminated 200+ lines of duplicated link definitions",
                      "New indicators on Statuslines and Collections",
                      "Enhanced dropdown with icons and descriptions",
                      "Improved mobile menu with better visual hierarchy",
                      "**Dropdown Menu Enhancement**",
                      "Added DropdownMenuLabel for section headers",
                      "Added DropdownMenuGroup for logical grouping",
                      "Added DropdownMenuSeparator between sections",
                      "Icons next to each link (Sparkles, TrendingUp, MessageSquare, Building2, etc.)",
                      "Two-line layout: Label + description",
                      "Submit Config as prominent CTA in accent color",
                      "**Accessibility Improvements**",
                      "aria-current=\"page\" on active navigation items",
                      "aria-label on navigation landmarks and icon buttons",
                      "aria-hidden=\"true\" on decorative elements (underline bars, icons)",
                      "aria-live=\"polite\" on announcement banner",
                      "Semantic HTML throughout (<nav>, <header>, <output>)",
                      "Focus management with Radix UI primitives",
                      "Keyboard navigation documentation"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-09-hero-section-animations-and-search-enhancements",
      "date": "2025-10-09",
      "title": "Hero Section Animations and Search Enhancements",
      "tldr": "Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter.",
      "categories": {
        "Added": 14,
        "Changed": 10,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 3,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Redesigned the hero section with modern animations and refined the search experience. The homepage now features a subtle meteor shower effect, smooth text transitions, and a cleaner search interface that emphasizes content discovery over filtering options."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (14)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Meteor Background Animation** (`src/components/ui/magic/meteors.tsx`)",
                      "Animated shooting stars effect across hero section",
                      "20 meteors with randomized timing and positioning",
                      "Constrained to above-the-fold viewport (max-h-screen)",
                      "GPU-accelerated CSS animations for 60fps performance",
                      "Comet-style design with gradient tails and accent color glow",
                      "Configurable angle (35°), speed (3-8s), and delay (0-3s)",
                      "**Rolling Text Animation** (`src/components/ui/magic/rolling-text.tsx`)",
                      "Character-by-character 3D rotation effect (shadcn-style)",
                      "Cycles through words: enthusiasts → developers → power users → beginners → builders",
                      "Hardware-accelerated transforms with proper perspective",
                      "Smooth easing with custom cubic-bezier curve [0.16, 1, 0.3, 1]",
                      "600ms rotation duration with 50ms character delays",
                      "Accessibility support with screen reader announcements"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (10)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Search Bar Enhancement**",
                      "Prominent orange search icon (h-5 w-5) positioned left with z-10 layering",
                      "Increased input height from 12 to 14 (h-14) for better touch targets",
                      "Accent color focus border (focus:border-accent/50)",
                      "Improved spacing with pl-12 padding for icon clearance",
                      "**Hero Section Layout** (`src/app/page.tsx`)",
                      "Moved search bar closer to hero text (pt-8 pb-12)",
                      "Removed sort/filter controls from homepage search",
                      "Cleaner first impression with focus on search discovery",
                      "Sort and filter remain available on category pages"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Rolling Text Hydration** - Prevented SSR/client mismatch by rendering static placeholder during server-side rendering",
                      "**Linting Compliance** - Resolved array index key warnings with unique character IDs",
                      "**Supabase Mock Client** - Added proper biome-ignore comments for intentional development warnings"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-09-card-grid-layout-and-infinite-scroll-improvements",
      "date": "2025-10-09",
      "title": "Card Grid Layout and Infinite Scroll Improvements",
      "tldr": "Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages.",
      "categories": {
        "Added": 0,
        "Changed": 10,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 12,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Improved the visual presentation and functionality of content browsing with refined card spacing and reliable infinite scroll pagination. The card grid now maintains consistent spacing regardless of card content height, and infinite scroll works seamlessly through all content pages."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Changed (10)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Grid Layout Implementation** (`src/components/shared/infinite-scroll-container.tsx`)",
                      "Migrated from responsive grid to masonry layout with `auto-rows-[1px]`",
                      "Added data attributes (`data-grid-item`, `data-grid-content`) for layout calculation",
                      "Integrated ResizeObserver for dynamic content height tracking",
                      "Removed `gridClassName` prop in favor of consistent masonry implementation",
                      "**Infinite Scroll Hook** (`src/hooks/use-infinite-scroll.ts`)",
                      "Enhanced useEffect dependencies to include `hasMore` and `loading` states",
                      "Added proper IntersectionObserver cleanup on state changes",
                      "Observer now recreates when pagination conditions change",
                      "Improved type safety with observerRef tracking"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (12)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Card Grid Spacing Consistency** (95% improvement)",
                      "Implemented CSS Grid masonry layout with fine-grained 1px row height",
                      "Dynamic row span calculation based on actual card content height",
                      "ResizeObserver integration for responsive layout recalculation",
                      "Consistent 24px gaps between cards regardless of window size",
                      "Eliminates visual \"Tetris gap\" issues with variable content heights",
                      "**Infinite Scroll Reliability**",
                      "Fixed observer lifecycle management for conditionally rendered elements",
                      "Observer now properly re-initializes when loading states change",
                      "Resolves issue where scroll stopped loading after 60 items",
                      "Added proper cleanup to prevent memory leaks",
                      "Maintains performance with large content sets (148+ items)"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-09-enhanced-type-safety-with-branded-types-and-schema-improvements",
      "date": "2025-10-09",
      "title": "Enhanced Type Safety with Branded Types and Schema Improvements",
      "tldr": "Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs.",
      "categories": {
        "Added": 26,
        "Changed": 27,
        "Deprecated": 0,
        "Removed": 6,
        "Fixed": 7,
        "Security": 4
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Major refactoring to enhance type safety and schema validation across the platform. Introduced branded types using Zod's nominal typing feature to prevent ID confusion at compile time, consolidated duplicate input sanitization logic, and improved validation consistency throughout the codebase."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (26)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Branded Types for IDs** (`src/lib/schemas/branded-types.schema.ts`)",
                      "`UserId` - UUID-validated branded type for user identifiers",
                      "`SessionId` - UUID-validated branded type for session identifiers",
                      "`ContentId` - Slug-validated branded type for content identifiers (alphanumeric with hyphens)",
                      "Helper functions: `createUserId()`, `createSessionId()`, `toContentId(slug)`",
                      "Compile-time prevention of mixing IDs from different domains",
                      "Runtime validation ensures correct format (UUID vs slug patterns)",
                      "Zero runtime overhead with Zod's brand feature",
                      "**Centralized Input Sanitization** (`src/lib/schemas/primitives/sanitization-transforms.ts`)",
                      "13 reusable transform functions replacing 11+ inline duplicates",
                      "`normalizeEmail()` - RFC 5322 compliant email normalization",
                      "`normalizeString()` - Lowercase + trim for consistent storage",
                      "`trimString()`, `trimOptionalString()`, `trimOptionalStringOrEmpty()` - String cleanup variants",
                      "`stringToBoolean()` - Handles common truthy/falsy string representations",
                      "`parseContentType()` - Extracts base content type from HTTP headers",
                      "Security-focused: Null byte checks, path traversal prevention, injection protection",
                      "Single source of truth for all input sanitization",
                      "**Cursor Pagination Schema** (`src/lib/schemas/primitives/cursor-pagination.schema.ts`)",
                      "Type-safe cursor-based pagination for scalable API endpoints",
                      "Opaque cursor implementation for security",
                      "Configurable page sizes with validation",
                      "**Unified SEO Title Verification** (`scripts/verify-titles.ts`)",
                      "Consolidated 3 separate scripts into single comprehensive tool",
                      "Validates all titles across agents, MCP servers, rules, commands, hooks, statuslines, collections, and guides",
                      "Checks for empty titles, duplicates, and SEO optimization",
                      "Detailed reporting with color-coded output"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (27)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Personalization Schemas** (6 schemas updated)",
                      "`userInteractionSchema` - Now uses `userIdSchema`, `contentIdSchema`, `sessionIdSchema`",
                      "`affinityScoreSchema` - Uses branded types for user and content identification",
                      "`userSimilaritySchema` - Uses `userIdSchema` for both user_a_id and user_b_id",
                      "`contentSimilaritySchema` - Uses `contentIdSchema` for content slugs",
                      "`personalizedRecommendationSchema` - Slug field now ContentId type",
                      "All analytics event schemas updated with branded types",
                      "**Schema Consolidation** (5 files refactored)",
                      "`newsletter.schema.ts` - Replaced inline transform with `normalizeEmail()`",
                      "`analytics.schema.ts` - Replaced inline transform with `normalizeString()`",
                      "`middleware.schema.ts` - Replaced complex parsing with `parseContentType()`",
                      "`form.schema.ts` - Replaced 4 inline transforms with centralized functions",
                      "`search.schema.ts` - Replaced 7 inline transforms (4 trim + 3 boolean conversions)",
                      "**Database Actions** (6 files updated)",
                      "`follow-actions.ts` - Uses `userIdSchema` in followSchema with validation",
                      "`interaction-actions.ts` - Converts database strings to branded types at boundaries",
                      "`personalization-actions.ts` - All recommendation responses use `toContentId()` conversion",
                      "`affinity-scorer.ts` - Affinity calculations use ContentId type",
                      "Type-safe boundaries between database (plain strings) and application (branded types)",
                      "Proper validation at conversion points",
                      "**Build Scripts** (4 scripts improved)",
                      "Migrated 65+ console statements to structured production logger",
                      "`generate-openapi.ts` - 20 console statements → logger with metadata",
                      "`validate-llmstxt.ts` - 27 console statements → structured logging",
                      "`optimize-titles.ts` - 15 console statements → logger with structured data",
                      "`generate-sitemap.ts` - Added alphabetical URL sorting for better git diffs",
                      "Consistent logging format across all build tools"
                    ]
                  }
                ]
              },
              {
                "label": "Removed (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Legacy Configuration Files**",
                      "`config/tools/lighthouserc.json` - Redundant (kept production .cjs version)",
                      "`config/tools/depcheck.json` - Unused tool configuration",
                      "**Duplicate Scripts**",
                      "`scripts/verify-all-titles.ts` - Functionality merged into verify-titles.ts",
                      "`scripts/verify-seo-titles.ts` - Consolidated into unified verification script"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (7)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Linting Issues** (6 issues resolved)",
                      "Removed unused `colors` constant from validate-llmstxt.ts (proper deletion vs suppression)",
                      "Fixed proper error logging in catch blocks (2 instances)",
                      "Added missing `existsSync` import in submit-indexnow.ts",
                      "Added explicit type annotation for stat variable",
                      "Used template literals for string concatenation in optimize-titles.ts",
                      "All fixes follow production-ready principles (no suppression with underscores)"
                    ]
                  }
                ]
              },
              {
                "label": "Security (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**ID Mixing Prevention:** Compile-time errors when using wrong ID type",
                      "**Input Validation:** All user inputs sanitized through centralized transforms",
                      "**Format Enforcement:** Runtime validation of UUID and slug patterns",
                      "**Null Byte Protection:** Sanitization transforms check for injection attempts"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-08-react-19-component-migration-for-shadcnui",
      "date": "2025-10-08",
      "title": "React 19 Component Migration for shadcn/ui",
      "tldr": "Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality.",
      "categories": {
        "Added": 0,
        "Changed": 19,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 6,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Comprehensive migration of shadcn/ui components to React 19 standards, removing all uses of the deprecated `React.forwardRef` API in favor of the new ref-as-prop pattern. This modernizes the component library while preserving 100% backward compatibility and type safety."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Changed (19)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Avatar Components** (`src/components/ui/avatar.tsx`)",
                      "Converted 3 components: Avatar, AvatarImage, AvatarFallback",
                      "Ref now passed as optional prop: `ref?: React.Ref<React.ElementRef<typeof AvatarPrimitive.Root>>`",
                      "All Radix UI primitive integrations maintained",
                      "**Checkbox Component** (`src/components/ui/checkbox.tsx`)",
                      "Single component conversion with CheckboxPrimitive.Root integration",
                      "Preserved all accessibility features and visual states",
                      "**Command Components** (`src/components/ui/command.tsx`)",
                      "Converted 7 components: Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandSeparator, CommandItem",
                      "Largest refactor - maintained cmdk integration and dialog functionality",
                      "**Radio Group Components** (`src/components/ui/radio-group.tsx`)",
                      "Converted 2 components: RadioGroup, RadioGroupItem",
                      "Preserved indicator logic and Lucide icon integration",
                      "**Separator Component** (`src/components/ui/separator.tsx`)",
                      "Single component with default parameter preservation (orientation, decorative)",
                      "Maintained horizontal/vertical orientation logic",
                      "**Switch Component** (`src/components/ui/switch.tsx`)",
                      "Converted Switch with SwitchPrimitives.Thumb integration",
                      "All data-state attributes and animations preserved"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**React 19 Deprecation Warnings** (15 warnings eliminated)",
                      "Removed all `React.forwardRef` usage across UI components",
                      "Converted to React 19's ref-as-prop pattern (refs passed as regular props)",
                      "Zero runtime overhead - purely signature changes",
                      "All components maintain identical functionality and behavior",
                      "Full TypeScript type safety preserved with proper ref typing"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-08-component-architecture-improvements",
      "date": "2025-10-08",
      "title": "Component Architecture Improvements",
      "tldr": "Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook.",
      "categories": {
        "Added": 15,
        "Changed": 23,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Comprehensive refactoring of card and newsletter components following composition-over-inheritance patterns, extracting shared logic into reusable utilities while maintaining 100% feature parity with existing implementations."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (15)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**BaseCard Component** (`src/components/shared/base-card.tsx` - 383 lines)",
                      "Composition-based card structure with customizable render prop slots",
                      "Props: `renderTopBadges`, `renderMetadataBadges`, `renderActions`, `customMetadataText`",
                      "Shared features: card navigation, tag rendering, author attribution, source badges",
                      "Sponsored content support with position tracking",
                      "Performance optimized with `React.memo()`",
                      "Full TypeScript type safety with `BaseCardProps` interface",
                      "**Newsletter Hook** (`src/hooks/use-newsletter.ts` - 196 lines)",
                      "Type-safe `NewsletterSource` enum for analytics tracking",
                      "Centralized form state: email, error, isSubmitting",
                      "Server action integration with error handling",
                      "Customizable success/error callbacks",
                      "Referrer tracking for attribution",
                      "Toast notification management",
                      "Automatic form reset on success"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (23)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Card Components** (`ConfigCard`, `CollectionCard`)",
                      "Refactored to use new `BaseCard` component with composition-based architecture",
                      "Render props pattern for customizable slots (badges, actions, metadata)",
                      "All features preserved: sponsored tracking, view counts, type badges, action buttons",
                      "Integrated with `useCardNavigation` hook for consistent navigation behavior",
                      "Support for sponsored content tracking via `SponsoredTracker` wrapper",
                      "Accessibility maintained: ARIA labels, keyboard navigation, semantic HTML",
                      "Code reduction: ConfigCard (-58 lines), CollectionCard (-45 lines)",
                      "**Newsletter Forms** (3 components affected)",
                      "Centralized subscription logic in `useNewsletter` hook",
                      "Leverages existing `subscribeToNewsletter` server action with rate limiting",
                      "Consistent error handling, toast notifications, and form reset across all variants",
                      "React 18+ `useTransition` for pending states",
                      "Email privacy logging (partial email masking in error logs)",
                      "Components: `newsletter-form.tsx`, `footer-newsletter-bar.tsx`, `inline-email-cta.tsx`",
                      "Code reduction: newsletter-form.tsx (-52 lines)",
                      "**Copy Buttons**",
                      "Refactored `copy-llms-button.tsx` to use centralized `useCopyToClipboard` hook",
                      "Eliminated custom state management and timeout handling",
                      "Consistent clipboard behavior across all copy actions",
                      "Automatic reset after 2 seconds (managed by hook)",
                      "Improved error recovery with structured logging",
                      "Code reduction: copy-llms-button.tsx (-52 lines)"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-08-production-code-quality-and-accessibility-improvements",
      "date": "2025-10-08",
      "title": "Production Code Quality and Accessibility Improvements",
      "tldr": "Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring.",
      "categories": {
        "Added": 11,
        "Changed": 9,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 11,
        "Security": 5
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Comprehensive code quality hardening across 50 files to ensure production-grade TypeScript safety, web accessibility compliance, and automated quality gates through CI/CD."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (11)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Lighthouse CI Automation** (`config/tools/lighthouserc.cjs`)",
                      "Automated Core Web Vitals monitoring on every PR",
                      "Performance threshold: 90+ (current: 95%)",
                      "Accessibility threshold: 95+ (current: 100%)",
                      "SEO threshold: 95+ (current: 100%)",
                      "CI/CD integration with GitHub Actions",
                      "Comment-based PR feedback with detailed metrics",
                      "**Environment Schema Enhancements** (`src/lib/schemas/env.schema.ts`)",
                      "Added `CRON_SECRET` validation for scheduled job security",
                      "Added `ARCJET_ENV` validation for security middleware",
                      "Centralized server-side environment validation"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (9)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Configuration Updates**",
                      "Biome: Enabled `noUndeclaredDependencies` rule for import validation",
                      "PostCSS: Migrated to ESM export format",
                      "NPM: Disabled update notifier for cleaner CI logs",
                      "Next.js: Replaced dynamic image loader with static optimization",
                      "**Code Cleanup**",
                      "Removed lefthook pre-commit configuration (superseded by CI)",
                      "Deleted temporary SEO analysis reports (2 files, 1,062 lines)",
                      "Cleaned up unused parameters across API routes and lib files"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (11)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**TypeScript Safety** (45+ warnings eliminated)",
                      "Removed all non-null assertion operators (`!`) with proper guard clauses",
                      "Runtime validation for environment variables with explicit error throwing",
                      "Safe array/Map access patterns with bounds checking",
                      "Type predicate filters for null-safe array operations",
                      "Proper ISO date parsing without unsafe assertions",
                      "**Web Accessibility** (WCAG AA Compliance)",
                      "Fixed color contrast failure on newsletter subscribe button (3.89:1 → 7.1:1 ratio)",
                      "Changed accent-foreground color from white to near-black (`oklch(20% 0 0)`)",
                      "Button contrast now exceeds WCAG AAA standard (>7:1)",
                      "Lighthouse accessibility score: 100%"
                    ]
                  }
                ]
              },
              {
                "label": "Security (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Environment variables validated at runtime (fail-fast on misconfiguration)",
                      "Removed unsafe array access that could cause undefined behavior",
                      "Added bounds checking for matrix operations in algorithms",
                      "CRON_SECRET authentication for scheduled jobs",
                      "ARCJET_ENV validation for security middleware"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-08-personalized-recommendation-engine",
      "date": "2025-10-08",
      "title": "Personalized Recommendation Engine",
      "tldr": "Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering.",
      "categories": {
        "Added": 56,
        "Changed": 5,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented comprehensive personalization infrastructure that learns from user behavior (views, bookmarks, copies) to deliver tailored configuration recommendations through affinity scoring, content similarity, and collaborative filtering algorithms."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (56)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**User Interaction Tracking** (`user_interactions` table)",
                      "Automatic tracking of views, bookmarks, and code copies",
                      "Session-based analytics with metadata support",
                      "Anonymous interaction support with graceful auth fallback",
                      "90-day data retention policy for privacy",
                      "Non-blocking async tracking (doesn't slow down user actions)",
                      "**Affinity Scoring Algorithm** (`src/lib/personalization/affinity-scorer.ts`)",
                      "Multi-factor scoring: Views (20%), Time spent (25%), Bookmarks (30%), Copies (15%), Recency (10%)",
                      "Exponential recency decay with 30-day half-life",
                      "Normalized 0-100 scoring with transparent breakdown",
                      "Batch processing via daily cron job at 2 AM UTC",
                      "Cached top 50 affinities per user (5-minute TTL)",
                      "**Collaborative Filtering** (`src/lib/personalization/collaborative-filter.ts`)",
                      "Item-based collaborative filtering using Jaccard similarity",
                      "Co-bookmark frequency analysis for \"users who liked X also liked Y\"",
                      "User-user similarity calculation for future enhancements",
                      "Pre-computed similarity matrices updated nightly",
                      "Optimized for sparse interaction data",
                      "**Content Similarity Engine** (`src/lib/personalization/similar-configs.ts`)",
                      "Multi-factor similarity: Tags (35%), Category (20%), Description (15%), Co-bookmarks (20%), Author (5%), Popularity (5%)",
                      "Keyword extraction and Jaccard coefficient matching",
                      "Related category mappings (agents ↔ commands ↔ rules)",
                      "Pre-computation stores top 20 similar items per config",
                      "15% similarity threshold for meaningful recommendations",
                      "**For You Feed** (`/for-you` page)",
                      "Hybrid algorithm blending multiple signals",
                      "Weight distribution: Affinity (40%), Collaborative (30%), Trending (15%), Interests (10%), Diversity (5%)",
                      "Category filtering and infinite scroll",
                      "Cold start recommendations for new users (trending + interests)",
                      "Personalized recommendation reasons (\"Based on your past interactions\")",
                      "5-minute cache with automatic revalidation",
                      "**Similar Configs Section** (detail page component)",
                      "Displays 6 similar configurations on every content page",
                      "Match percentage scores (0-100%)",
                      "Click tracking for algorithm improvement",
                      "Lazy-loaded for performance",
                      "Falls back gracefully when no similarities exist",
                      "**Usage-Based Recommendations** (`src/lib/personalization/usage-based-recommender.ts`)",
                      "After bookmark: \"Users who saved this also saved...\"",
                      "After copy: \"Complete your setup with...\" (complementary tools)",
                      "Extended time on page: \"Related configs you might like...\"",
                      "Category browsing: \"Since you're exploring [category]...\"",
                      "Complementarity rules (MCP ↔ agents, rules ↔ commands)",
                      "**Background Processing**",
                      "Daily affinity calculation cron (`/api/cron/calculate-affinities`)",
                      "Nightly similarity calculation cron (`/api/cron/calculate-similarities`)",
                      "Batch processing (50 users per batch, 1000 similarities per batch)",
                      "CRON_SECRET authentication for security",
                      "Comprehensive logging and error handling",
                      "**Analytics Integration** (Umami events)",
                      "`personalization_affinity_calculated` - Affinity scores computed",
                      "`personalization_recommendation_shown` - Recommendation displayed",
                      "`personalization_recommendation_clicked` - User engaged with rec",
                      "`personalization_similar_config_clicked` - Similar config selected",
                      "`personalization_for_you_viewed` - For You feed accessed",
                      "`personalization_usage_recommendation_shown` - Contextual rec shown"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Bookmark actions now track interactions for affinity calculation",
                      "View tracking enhanced with user interaction logging",
                      "Copy actions record interaction events for scoring",
                      "Account library shows personalized recommendations",
                      "Navigation includes \"For You\" link for authenticated users"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-07-configuration-recommender-tool",
      "date": "2025-10-07",
      "title": "Configuration Recommender Tool",
      "tldr": "Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time.",
      "categories": {
        "Added": 47,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented a personalized configuration discovery tool that helps users find the most suitable Claude configurations for their specific use case, experience level, and requirements through a 7-question interactive quiz with instant, shareable results."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (47)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Interactive Quiz Interface** (`/tools/config-recommender`)",
                      "7-question progressive disclosure form with client-side validation",
                      "Question types: use case, experience level, tool preferences, integrations, focus areas, team size",
                      "Real-time progress tracking with visual indicators",
                      "Smooth question-to-question transitions",
                      "Mobile-optimized with responsive grid layouts",
                      "Keyboard navigation and WCAG 2.1 AA accessibility compliance",
                      "Skip logic for optional questions (4-7 are optional)",
                      "**Rule-Based Recommendation Algorithm** (`src/lib/recommender/algorithm.ts`)",
                      "Multi-factor scoring with 7 weighted dimensions (35% use case, 20% tool preference, 15% experience, 15% integrations, 10% focus areas, 3% popularity, 2% trending)",
                      "Tag matching across 147+ configurations",
                      "Category filtering and diversity scoring to ensure varied results",
                      "Experience-based complexity filtering (beginner/intermediate/advanced)",
                      "Popularity and trending boosts from Redis view counts",
                      "<100ms execution time for full catalog analysis",
                      "Zero API costs (no LLM calls, purely computational)",
                      "Extensible architecture with hooks for future LLM enhancement",
                      "**Results Display System** (`/tools/config-recommender/results/[id]`)",
                      "Top 8-10 ranked configurations with match scores (0-100%)",
                      "Explanation of why each configuration was recommended",
                      "Primary reason highlighting and additional factor badges",
                      "Category-based filtering tabs (all, agents, mcp, rules, etc.)",
                      "Match score visualization with color coding (90%+ green, 75%+ blue, 60%+ yellow)",
                      "Rank badges for top 3 results",
                      "Summary statistics (avg match score, diversity score, top category)",
                      "Direct links to configuration detail pages",
                      "**Social Sharing Features**",
                      "Shareable URLs with deterministic IDs (same answers = same URL)",
                      "Base64-encoded answer data in URL parameters",
                      "One-click sharing to Twitter, LinkedIn, Facebook, email",
                      "Copy-to-clipboard functionality",
                      "Share analytics tracking via logger",
                      "Social media card optimization with OpenGraph metadata",
                      "**SEO & AI Discovery**",
                      "Landing page added to sitemap with priority 0.8",
                      "LLMs.txt route explaining algorithm methodology (`/tools/config-recommender/llms.txt`)",
                      "Result pages marked noindex to prevent thin content penalty",
                      "HowTo schema for quiz landing page (AI citation ready)",
                      "Metadata registry entries with AI optimization flags",
                      "Permanent URLs for tool methodology citations",
                      "**Server Actions** (`src/lib/actions/recommender-actions.ts`)",
                      "`generateConfigRecommendations()` - Main recommendation generator",
                      "`trackRecommendationEvent()` - Analytics event tracking",
                      "Rate limiting: 20 recommendations per minute per IP",
                      "Uses lazy content loaders for optimal performance",
                      "Redis-enriched view counts for popularity scoring",
                      "Comprehensive error handling and logging"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-07-user-collections-and-my-library",
      "date": "2025-10-07",
      "title": "User Collections and My Library",
      "tldr": "Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members.",
      "categories": {
        "Added": 42,
        "Changed": 5,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented a complete user collections system that extends the existing bookmarks feature, allowing users to organize saved configurations into curated collections with public/private visibility, custom ordering, and profile integration."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (42)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**User Collections Database**",
                      "`user_collections` table for collection metadata (name, slug, description, visibility)",
                      "`collection_items` junction table linking collections to bookmarked content",
                      "Auto-generated slugs from collection names with collision handling",
                      "Item count tracking via database triggers for performance",
                      "Row Level Security policies for privacy control",
                      "Indexed queries for public collections, user ownership, and view counts",
                      "**My Library Page** (`/account/library`)",
                      "Unified tabbed interface showing bookmarks and collections",
                      "Bookmark tab displays all saved configurations with filtering",
                      "Collections tab shows user-created collections with stats",
                      "Create new collection button with inline form access",
                      "Empty states with helpful calls-to-action",
                      "Backward compatible redirect from `/account/bookmarks`",
                      "**Collection Management UI**",
                      "Create collection form with auto-slug generation (`/account/library/new`)",
                      "Collection detail page with item management (`/account/library/[slug]`)",
                      "Edit collection settings (`/account/library/[slug]/edit`)",
                      "Add/remove bookmarks from collections",
                      "Reorder items with up/down buttons (drag-drop ready architecture)",
                      "Public/private visibility toggle",
                      "Optional collection descriptions (max 500 characters)",
                      "**Public Collection Sharing**",
                      "Collections displayed on user public profiles (`/u/[username]`)",
                      "Dedicated public collection pages (`/u/[username]/collections/[slug]`)",
                      "Share URLs with copy-to-clipboard functionality",
                      "View tracking for collection analytics",
                      "Owner can manage collections from public pages",
                      "SEO-optimized metadata for public collections",
                      "**Collection Actions** (`src/lib/actions/collection-actions.ts`)",
                      "`createCollection()` - Create new collection with validation",
                      "`updateCollection()` - Edit collection details",
                      "`deleteCollection()` - Remove collection (cascades to items)",
                      "`addItemToCollection()` - Add bookmarks to collections",
                      "`removeItemFromCollection()` - Remove items",
                      "`reorderCollectionItems()` - Change display order",
                      "All actions use next-safe-action with rate limiting",
                      "Zod schema validation for all inputs",
                      "**Enhanced Bookmark Button**",
                      "Added bookmark functionality to static collection cards",
                      "Consistent bookmark button placement across all content types",
                      "Works with agents, MCP servers, rules, commands, hooks, and collections"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Account navigation renamed \"Bookmarks\" to \"Library\" for clarity",
                      "Account dashboard links updated to point to unified library",
                      "Bookmark actions now revalidate library pages instead of bookmarks pages",
                      "User profiles display public collections alongside posts and activity",
                      "Collections can be bookmarked like any other content type"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-07-reputation-system-and-automatic-badge-awarding",
      "date": "2025-10-07",
      "title": "Reputation System and Automatic Badge Awarding",
      "tldr": "Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time.",
      "categories": {
        "Added": 23,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added comprehensive gamification system that automatically tracks user contributions, calculates reputation scores, and awards achievement badges based on activity."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (23)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Automatic Reputation Calculation**",
                      "Real-time reputation scoring based on community contributions",
                      "Formula: Posts (+10), Votes received (+5), Comments (+2), Merged submissions (+20)",
                      "Database triggers automatically update reputation on every action",
                      "Reputation displayed on profiles and dashboards",
                      "Indexed for leaderboard queries",
                      "**Automatic Badge Awarding System**",
                      "Criteria-based achievement system with 10 initial badges",
                      "Automatic checks and awards when reputation changes",
                      "Categories: engagement, contribution, milestone, special",
                      "Database functions: `check_and_award_badge()`, `check_all_badges()`",
                      "Badge notifications via toast messages when earned",
                      "**Contribution History Page** (`/account/activity`)",
                      "Unified timeline of all user activity (posts, comments, votes, submissions)",
                      "Filter tabs by activity type",
                      "Activity stats overview (counts for each type)",
                      "Chronological timeline with status badges",
                      "Links to original content",
                      "**Activity Tracking Infrastructure**",
                      "Server actions for activity aggregation with caching",
                      "Type-safe schemas with Zod validation",
                      "Performant queries with proper indexing",
                      "5-minute cache for activity summaries"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Account dashboard now shows reputation score prominently",
                      "Account navigation includes Activity link",
                      "Public profiles display reputation and tier badges",
                      "Quick actions promote contribution history"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-07-user-profile-system-with-oauth-avatar-sync",
      "date": "2025-10-07",
      "title": "User Profile System with OAuth Avatar Sync",
      "tldr": "Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation.",
      "categories": {
        "Added": 27,
        "Changed": 3,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Extended the existing user authentication system with comprehensive profile management features, eliminating the need for separate image upload infrastructure by leveraging OAuth provider avatars from GitHub and Google."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (27)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**OAuth Avatar Sync** (automatic profile picture management)",
                      "Database trigger (`on_auth_user_created`) automatically syncs avatar from GitHub/Google on signup",
                      "Profile pictures use OAuth provider URLs (no storage costs)",
                      "Manual refresh function (`refresh_profile_from_oauth`) for updating avatars",
                      "Supports both GitHub (`avatar_url`) and Google (`picture`) metadata fields",
                      "**Profile Editing System** (`/account/settings`)",
                      "Editable form with validation for name, bio, work, website, X/Twitter link",
                      "Interests/skills tag system (max 10 tags, 30 chars each)",
                      "Character counters and real-time validation",
                      "Unsaved changes detection and cancel functionality",
                      "Server actions with rate limiting and authorization checks",
                      "**Database Schema Extensions**",
                      "`interests` field (JSONB array) for user skills and interests",
                      "`reputation_score` field (INTEGER) for gamification",
                      "`tier` field (TEXT) for free/pro/enterprise membership levels",
                      "Indexed for performance on reputation and tier queries",
                      "**Badge Achievement System** (foundation)",
                      "`badges` table with 10 initial achievement types",
                      "`user_badges` table for tracking earned badges",
                      "Badge categories: engagement, contribution, milestone, special",
                      "Criteria-based system ready for automatic award logic",
                      "Badge display components (icon, card, list, compact views)",
                      "**Enhanced Profile Display**",
                      "Interests shown as badges on public profiles (`/u/[username]`)",
                      "Reputation score in Activity sidebar",
                      "Tier badge display (Free/Pro/Enterprise)",
                      "OAuth provider indication for profile pictures"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Settings page transformed from read-only to fully editable",
                      "Public profile pages now show reputation, tier, and interests",
                      "User profiles automatically populated on OAuth signup (name, email, avatar)"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Server Actions:**\n- `updateProfile` - Type-safe profile updates with Zod validation\n- `refreshProfileFromOAuth` - Sync latest avatar from OAuth provider\n\n**Database Functions:**\n- `handle_new_user()` - Trigger function for OAuth profile sync\n- `refresh_profile_from_oauth()` - Manual avatar refresh function\n\n**Initial Badges:**\n- First Post, 10 Posts, 50 Posts (engagement)\n- Popular Post, Viral Post (contribution)\n- Early Adopter, Verified (special)\n- Contributor (submission merged)\n- Reputation milestones (100, 1000 points)\n\n**Files Added:**\n- `src/lib/schemas/profile.schema.ts` - Profile validation schemas\n- `src/lib/schemas/badge.schema.ts` - Badge types and schemas\n- `src/lib/actions/profile-actions.ts` - Profile update server actions\n- `src/components/features/profile/profile-edit-form.tsx` - Editable profile form\n- `src/components/features/profile/badge-display.tsx` - Badge UI components\n\n**Security:**\n- Row Level Security (RLS) policies for badges and user_badges tables\n- Server-side authorization checks in all profile actions\n- Zod schema validation for all profile inputs\n- Rate limiting on profile updates and OAuth refreshes"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-06-automated-submission-tracking-and-analytics",
      "date": "2025-10-06",
      "title": "Automated Submission Tracking and Analytics",
      "tldr": "Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management.",
      "categories": {
        "Added": 18,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added comprehensive submission tracking infrastructure using Supabase database with server actions for statistics, recent submissions display, and top contributors leaderboard."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (18)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Submission Tracking Database** (`submissions` table in Supabase)",
                      "Tracks all community submissions with status (pending, merged, rejected)",
                      "Stores submission metadata (content type, slug, GitHub URL, submitter info)",
                      "Indexes on user_id, status, and created_at for performant queries",
                      "Foreign key relationships with users table",
                      "**Submission Statistics Actions** (`src/lib/actions/submission-stats-actions.ts`)",
                      "`getSubmissionStats()` - Overall statistics (total, merged, pending, rejection rate)",
                      "`getRecentMergedSubmissions()` - Latest 5 merged submissions with user info",
                      "`getTopContributors()` - Leaderboard of top 5 contributors by merged count",
                      "Type-safe server actions with Zod validation",
                      "Rate-limited to prevent abuse",
                      "**Sidebar Components** for submit page",
                      "**SubmitStatsCard** - Real-time submission statistics dashboard",
                      "**RecentSubmissionsCard** - Recent merged submissions with avatars",
                      "**TopContributorsCard** - Contributor leaderboard with badges",
                      "**TipsCard** - Submission guidelines and best practices",
                      "**TemplateSelector** - Quick-start templates for common content types",
                      "**DuplicateWarning** - Real-time duplicate name detection"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Submit page layout now includes comprehensive sidebar with statistics and tips",
                      "Submission form accepts plaintext input instead of manual JSON formatting",
                      "Improved content formatting logic for GitHub submissions",
                      "Enhanced user experience with template selection and duplicate warnings"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Database Schema:**\n- `submissions.user_id` → Foreign key to `users.id`\n- `submissions.status` → ENUM ('pending', 'merged', 'rejected')\n- `submissions.content_type` → Submission category (agents, mcp, rules, etc.)\n- Composite index on (status, created_at DESC) for efficient filtering\n\n**Files Added:**\n- `src/components/submit/sidebar/*.tsx` - 6 new sidebar components\n- `src/lib/actions/submission-stats-actions.ts` - Statistics server actions\n- `src/components/submit/template-selector.tsx` - Template selection UI\n- `src/components/submit/duplicate-warning.tsx` - Duplicate detection"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-06-user-authentication-and-account-management",
      "date": "2025-10-06",
      "title": "User Authentication and Account Management",
      "tldr": "Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks).",
      "categories": {
        "Added": 22,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 4
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks)."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented full-featured authentication system enabling users to create accounts, manage profiles, bookmark content, and follow other users."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (22)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Supabase Authentication Integration**",
                      "Email/password authentication via Supabase Auth",
                      "Server-side and client-side auth helpers",
                      "Protected routes with middleware",
                      "Session management with cookie-based tokens",
                      "**User Profile System** (`/u/[slug]` routes)",
                      "Public user profiles with customizable slugs",
                      "Profile fields: name, bio, work, website, social links",
                      "Avatar and hero image support",
                      "Privacy controls (public/private profiles)",
                      "Follow/unfollow functionality",
                      "**Account Management Pages**",
                      "`/account` - Account dashboard and navigation",
                      "`/account/settings` - Profile settings and preferences",
                      "`/account/bookmarks` - Saved content collections",
                      "`/account/following` - Users you follow",
                      "`/account/sponsorships` - Sponsorship management (for sponsors)",
                      "**Social Features**",
                      "Followers table with bidirectional relationships",
                      "Bookmarks with notes and organization by content type",
                      "Follow notifications (configurable)",
                      "User activity tracking"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Navigation includes login/logout and account links",
                      "Content pages show bookmark and follow actions when authenticated",
                      "Submit forms associate submissions with authenticated users",
                      "Profile slugs auto-generated from usernames"
                    ]
                  }
                ]
              },
              {
                "label": "Security (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Row Level Security (RLS) policies on all user tables",
                      "Users can only edit their own profiles",
                      "Public profiles visible to everyone, private profiles owner-only",
                      "Server-side auth validation on all protected routes",
                      "--"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-06-sponsorship-analytics-dashboard",
      "date": "2025-10-06",
      "title": "Sponsorship Analytics Dashboard",
      "tldr": "Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time.",
      "categories": {
        "Added": 13,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented comprehensive analytics page for sponsors to track the performance of their sponsored content with detailed metrics and insights."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (13)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Sponsorship Analytics Page** (`/account/sponsorships/[id]/analytics`)",
                      "Real-time view and click tracking",
                      "Click-through rate (CTR) calculation",
                      "Days active and performance trends",
                      "Sponsorship tier display (featured, promoted, spotlight)",
                      "Start/end date tracking",
                      "Active/inactive status indicators",
                      "**Performance Metrics**",
                      "Total views count with trend indicators",
                      "Total clicks with CTR percentage",
                      "Days active calculation",
                      "Cost-per-click (CPC) insights",
                      "View-to-click conversion tracking"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-06-submit-page-sidebar-and-statistics",
      "date": "2025-10-06",
      "title": "Submit Page Sidebar and Statistics",
      "tldr": "Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips.",
      "categories": {
        "Added": 23,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Transformed the submit page into a community hub by adding sidebar components that display submission statistics, guide contributors, and showcase community activity."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (23)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Stats Dashboard** - Live submission metrics",
                      "Total submissions count",
                      "Merged submissions (approval rate)",
                      "Pending submissions",
                      "Rejection rate percentage",
                      "**Recent Submissions** - Latest 5 merged contributions",
                      "Submitter avatars and names",
                      "Submission titles and content types",
                      "Time ago formatting",
                      "Links to contributor profiles",
                      "**Top Contributors** - Leaderboard of top 5 submitters",
                      "Ranked by merged submission count",
                      "User avatars and profile links",
                      "Badge indicators for top performers",
                      "**Tips & Guidelines** - Best practices for submissions",
                      "Clear naming conventions",
                      "Comprehensive descriptions",
                      "Testing requirements",
                      "Documentation expectations",
                      "**Template Selector** - Quick-start templates",
                      "Pre-filled forms for common content types",
                      "Reduces errors and saves time",
                      "Ensures consistent formatting"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-06-email-templates-infrastructure",
      "date": "2025-10-06",
      "title": "Email Templates Infrastructure",
      "tldr": "Integrated React Email for type-safe, production-ready transactional email templates with development preview server.",
      "categories": {
        "Added": 10,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Integrated React Email for type-safe, production-ready transactional email templates with development preview server."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added email template infrastructure using React Email, enabling the platform to send beautifully designed transactional emails with a development preview environment."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (10)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**React Email Integration**",
                      "`@react-email/components` for email component primitives",
                      "`@react-email/render` for server-side email generation",
                      "Development server: `npm run email:dev` (port 3001)",
                      "Email templates directory: `src/emails/`",
                      "**Email Templates** (Foundation for future features)",
                      "Base layout with branding and styling",
                      "Responsive design optimized for all email clients",
                      "Plain text fallbacks for accessibility",
                      "Consistent typography and color scheme"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Files Added:**\n- `src/emails/` - Email templates directory\n- Email development dependencies in package.json\n- npm script: `email:dev` for preview server\n\n**Use Cases:**\n- Welcome emails for new users\n- Submission notifications\n- Newsletter digests\n- Sponsorship confirmations\n- Follow notifications"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-05-resend-newsletter-integration-with-sticky-footer-bar",
      "date": "2025-10-05",
      "title": "Resend Newsletter Integration with Sticky Footer Bar",
      "tldr": "Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage.",
      "categories": {
        "Added": 30,
        "Changed": 13,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 6,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added complete newsletter subscription infrastructure with Resend integration, featuring a non-intrusive sticky footer bar that appears after 3 seconds, rate-limited signup actions (5 requests per 5 minutes), and fixed homepage infinite scroll bug that was capping at 60 items."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (30)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Resend Email Service** (`src/lib/services/resend.service.ts`)",
                      "Type-safe Resend API integration with `resend` npm package",
                      "Graceful degradation when API keys missing (logs warnings)",
                      "Idempotent operations (duplicate signups return success)",
                      "Production error handling with structured logging",
                      "Environment validation for `RESEND_API_KEY` and `RESEND_AUDIENCE_ID`",
                      "**Newsletter Server Action** (`src/lib/actions/newsletter-signup.ts`)",
                      "Rate limited: 5 signups per 5 minutes per IP (prevents spam)",
                      "Zod schema validation with RFC 5322 email format",
                      "Source tracking (footer, homepage, modal, content_page, inline)",
                      "Referrer tracking for analytics",
                      "Built on `next-safe-action` with centralized error handling",
                      "**Newsletter Form Component** (`src/components/shared/newsletter-form.tsx`)",
                      "Reusable form with React 19 useTransition for pending states",
                      "Sonner toast notifications for success/error feedback",
                      "Accessible with ARIA labels",
                      "Email validation and error handling",
                      "Progressive enhancement (works without JS)",
                      "**Sticky Footer Newsletter Bar** (`src/components/shared/footer-newsletter-bar.tsx`)",
                      "Appears after 3-second delay (non-intrusive UX)",
                      "localStorage persistence for dismissal state",
                      "Glassmorphism design: `bg-black/80 backdrop-blur-xl`",
                      "Responsive layouts (desktop/mobile optimized)",
                      "Slide-up animation on mount",
                      "Fully accessible with keyboard navigation",
                      "**Newsletter Schema** (`src/lib/schemas/newsletter.schema.ts`)",
                      "RFC 5322 compliant email validation",
                      "Source tracking enum (5 sources)",
                      "Referrer URL validation (max 500 chars)",
                      "Auto-lowercase and trim transformation"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (13)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Environment Configuration**",
                      "Added `RESEND_API_KEY` to server env schema",
                      "Added `RESEND_AUDIENCE_ID` to server env schema",
                      "Both optional in development, required in production for newsletter features",
                      "**Infinite Scroll Container** (`src/components/shared/infinite-scroll-container.tsx`)",
                      "Removed stateful `allItems` - now pure presentational component",
                      "Fixed race condition between `loadMore` and `useEffect`",
                      "Improved performance by eliminating unnecessary state updates",
                      "Better separation of concerns (parent manages state)",
                      "**Homepage Component** (`src/components/features/home/index.tsx`)",
                      "Fixed useEffect to only reset pagination on tab/search changes",
                      "Added biome-ignore for intentional dependency optimization",
                      "Prevents pagination reset on every render (performance improvement)"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Homepage Infinite Scroll Bug**",
                      "Fixed 60-item cap caused by dual state management in `InfiniteScrollContainer`",
                      "Removed local `allItems` state - component now fully controlled by parent",
                      "Fixed useEffect dependency array causing pagination resets",
                      "Now properly loads all content items with automatic infinite scroll",
                      "Removed \"Load More\" button in favor of seamless scroll loading"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "**Email Infrastructure:**\n\n- **Domain:** `mail.claudepro.directory` (subdomain for deliverability)\n- **Integration:** Resend ↔ Vercel Marketplace direct integration\n- **DNS:** Managed via Resend ↔ Cloudflare integration\n- **From Address:** `hello@mail.claudepro.directory`\n\n**Rate Limiting:**\n\n- Newsletter signups: 5 requests per 300 seconds (5 minutes) per IP\n- Stricter than default (100 req/60s) to prevent newsletter spam\n- Allows legitimate retries while blocking abuse\n\n**Dependencies Added:**\n\n- `resend` - Official Resend SDK for email API\n- `@react-email/render` - Email template rendering (Resend dependency)\n\n**Files Modified:**\n\n- `src/app/layout.tsx` - Added FooterNewsletterBar component\n- `src/components/features/home/tabs-section.tsx` - Set `showLoadMoreButton={false}`\n- `src/components/shared/infinite-scroll-container.tsx` - Removed dual state management\n- `src/components/features/home/index.tsx` - Fixed useEffect dependencies\n- `src/lib/schemas/env.schema.ts` - Added Resend env vars\n\n**Files Created:**\n\n- `src/lib/schemas/newsletter.schema.ts`\n- `src/lib/services/resend.service.ts`\n- `src/lib/actions/newsletter-signup.ts`\n- `src/components/shared/newsletter-form.tsx`\n- `src/components/shared/footer-newsletter-bar.tsx`"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-05-homepage-infinite-scroll-bug-fix",
      "date": "2025-10-05",
      "title": "Homepage Infinite Scroll Bug Fix",
      "tldr": "Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component.",
      "categories": {
        "Added": 0,
        "Changed": 12,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 15,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Changed (12)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**InfiniteScrollContainer Architecture**",
                      "Converted from stateful to fully controlled component",
                      "Parent component (`home/index.tsx`) now manages all state",
                      "Infinite scroll container just renders + triggers loading",
                      "Better separation of concerns and predictable behavior",
                      "**Load More Button**",
                      "Set `showLoadMoreButton={false}` for seamless infinite scroll",
                      "Users now get automatic loading as they scroll",
                      "More modern UX (no manual clicking required)",
                      "*Files Modified:**",
                      "`src/components/shared/infinite-scroll-container.tsx`",
                      "`src/components/features/home/index.tsx`",
                      "`src/components/features/home/tabs-section.tsx`",
                      "--"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (15)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**60-Item Pagination Cap**",
                      "Root cause: Dual state management creating race condition",
                      "InfiniteScrollContainer maintained local `allItems` state",
                      "Parent's useEffect was resetting state on every `filteredResults` reference change",
                      "Solution: Made InfiniteScrollContainer fully controlled (stateless)",
                      "**State Synchronization**",
                      "Removed `allItems` state from InfiniteScrollContainer",
                      "Component now uses `items` prop directly (single source of truth)",
                      "Eliminated useEffect that was overwriting accumulated items",
                      "Fixed race condition between `loadMore` and `useEffect`",
                      "**Pagination Reset Loop**",
                      "Changed useEffect dependency from `filteredResults` to `[activeTab, isSearching]`",
                      "Prevents reset when same data is re-filtered (array reference changes)",
                      "Only resets pagination when user actually changes tabs or search state",
                      "Added biome-ignore with detailed explanation for linter"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-llmstxt-complete-content-generation-for-ai-discovery",
      "date": "2025-10-04",
      "title": "LLMs.txt Complete Content Generation for AI Discovery",
      "tldr": "All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption.",
      "categories": {
        "Added": 27,
        "Changed": 10,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented production-grade llms.txt generation system following the [llmstxt.org specification](https://llmstxt.org) (Oct 2025 standards). Each content item now exports ALL structured fields to AI-friendly plain text format with zero truncation, PII sanitization, and type-safe content building."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (27)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Type-Safe Rich Content Builder** (`src/lib/llms-txt/content-builder.ts`)",
                      "Extracts ALL fields from 6 content schemas (MCP, Agent, Hook, Command, Rule, Statusline)",
                      "Formats installation instructions (Claude Desktop + Claude Code)",
                      "Formats configurations (MCP servers, hook scripts, statusline settings)",
                      "Includes security best practices, troubleshooting guides, and usage examples",
                      "No `any` types - fully type-safe with proper narrowing",
                      "**llms.txt Routes** with ISR (600s revalidation)",
                      "`/[category]/[slug]/llms.txt` - Individual item details (168 pages)",
                      "`/[category]/llms.txt` - Category listings (6 categories)",
                      "`/collections/[slug]/llms.txt` - Collection details",
                      "`/guides/[...slug]/llms.txt` - Guide content",
                      "`/llms.txt` - Site-wide index",
                      "**PII Protection** (`src/lib/llms-txt/content-sanitizer.ts`)",
                      "Removes emails, phone numbers, IP addresses, API keys, SSNs, credit cards",
                      "Whitelists example domains (example.com, localhost, 127.0.0.1)",
                      "Fixed regex global flag bug causing alternating detection results",
                      "**Markdown Export Features** (`src/lib/actions/markdown-actions.ts`)",
                      "Copy as Markdown: One-click clipboard copy with YAML frontmatter",
                      "Download Markdown: File download with full metadata and attribution",
                      "Rate limiting: 50 req/min (copy), 30 req/min (download)",
                      "Redis caching with 1-hour TTL for performance",
                      "Type-safe server actions with Zod validation",
                      "**Analytics Integration** (`src/lib/analytics/events.config.ts`)",
                      "`COPY_MARKDOWN` event tracking with content metadata",
                      "`DOWNLOAD_MARKDOWN` event tracking with file size metrics",
                      "Integrated into CopyMarkdownButton and DownloadMarkdownButton components",
                      "Umami analytics for user interaction insights"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (10)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Removed ALL truncation** from llms.txt schema and routes",
                      "`llmsTxtItemSchema`: Removed artificial 200/1000 char limits on title/description",
                      "Collections route: Uses `content` field (unlimited) instead of `description` (1000 chars)",
                      "Item detail route: Includes full rich content via `buildRichContent()`",
                      "**Content Coverage**",
                      "BEFORE: ~5% of page content (1-sentence description only)",
                      "AFTER: 100% of page content (15x improvement)",
                      "MCP servers now include full configuration examples, environment variables, installation steps",
                      "Hooks include complete script content (up to 1MB)",
                      "All items include features, use cases, requirements, troubleshooting, examples"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-seo-title-optimization-system-with-automated-enhancement",
      "date": "2025-10-04",
      "title": "SEO Title Optimization System with Automated Enhancement",
      "tldr": "Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management.",
      "categories": {
        "Added": 8,
        "Changed": 8,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Implemented dual-title metadata system allowing separate SEO-optimized titles (`seoTitle`) and user-facing headings (`title`). Created automated enhancement utilities that intelligently add \"for Claude\" branding while respecting category-specific character budgets (23-31 available chars depending on suffix length)."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (8)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "`seoTitle` optional field to all content schemas (agents, mcp, rules, commands, hooks, statuslines, collections, guides)",
                      "Build pipeline support: `seoTitle` flows from source files → static API → page metadata",
                      "Developer utilities:",
                      "`npm run validate:titles` - Check all page titles against 60-char limit",
                      "`npm run optimize:titles:dry` - Preview automated enhancements",
                      "`npm run optimize:titles` - Apply enhancements to source files",
                      "`src/lib/seo/title-enhancer.ts` - Smart slug-to-title conversion with acronym/brand handling",
                      "`src/lib/config/seo-config.ts` - Centralized SEO constants and character budgets"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (8)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Enhanced 59 content files (35.1% of catalog) with optimized `seoTitle` fields:",
                      "MCP servers: 34/40 (85%) - \"GitHub MCP Server for Claude\"",
                      "Commands: 12/12 (100%) - \"Debug Command for Claude\"",
                      "Rules: 6/11 (54.5%)",
                      "Hooks: 6/60 (10%)",
                      "Agents: 1/10 (10%)",
                      "Updated `scripts/verify-all-titles.ts` to single-line compact output format",
                      "Added `seoTitle` to metadata extraction in `build-category-config.ts`"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-production-hardened-trending-algorithm-with-security-performance-optimizations",
      "date": "2025-10-04",
      "title": "Production-Hardened Trending Algorithm with Security & Performance Optimizations",
      "tldr": "Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations.",
      "categories": {
        "Added": 5,
        "Changed": 4,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 3,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "The trending tab uses a production-grade growth rate algorithm with security hardening and performance optimizations. Content gaining momentum fast (high percentage growth) ranks higher than content with simply more total views."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Redis `getDailyViewCounts()` batch method with MGET optimization",
                      "Daily view tracking in `incrementView()` with UTC timestamps",
                      "Growth rate calculation in `getTrendingContent()` with input validation",
                      "Zod schemas for runtime type safety",
                      "Comprehensive TSDoc documentation"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (4)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Trending tab**: Now shows highest 24h growth rate (velocity-based) with UTC normalization",
                      "**Popular tab**: Continues showing all-time view counts (cumulative-based)",
                      "View tracking uses Redis pipeline for atomic operations",
                      "All date calculations use UTC instead of local timezone"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Timezone bug**: Date calculations now use UTC to prevent inconsistencies across regions",
                      "**Race condition**: Daily key TTL only set once using `EXPIRE NX` flag",
                      "**Invalid data**: All Redis responses validated before calculations"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-view-counter-ui-redesign-with-prominent-badge-display",
      "date": "2025-10-04",
      "title": "View Counter UI Redesign with Prominent Badge Display",
      "tldr": "View counts now appear as eye-catching badges on config cards instead of plain text.",
      "categories": {
        "Added": 3,
        "Changed": 2,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "View counts now appear as eye-catching badges on config cards instead of plain text."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Redesigned the view counter display to be more prominent and visually appealing. View counts now appear as primary-colored badges positioned on the bottom-right of config cards with an Eye icon."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "`formatViewCount()` utility with K/M notation (1234 → \"1.2K\", 1500000 → \"1.5M\")",
                      "`viewCount` prop to UnifiedDetailPage and DetailMetadata components",
                      "View count fetching in detail page routes"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Moved view counter from inline text to standalone badge component",
                      "Falls back to \"X% popular\" text when Redis data unavailable"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-trending-page-infinite-loading-fix-with-isr",
      "date": "2025-10-04",
      "title": "Trending Page Infinite Loading Fix with ISR",
      "tldr": "Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation.",
      "categories": {
        "Added": 2,
        "Changed": 2,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 3,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "`statsRedis.isConnected()` method for accurate Redis availability check",
                      "`/trending/loading.tsx` using CategoryLoading factory pattern"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Trending page now uses ISR (5-minute revalidation) instead of force-static",
                      "Redis availability check properly detects fallback mode"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Infinite loading state on trending page",
                      "Empty tabs due to `isEnabled()` returning true in fallback mode",
                      "Duplicate content fetching (now single consolidated fetch)"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "```typescript\n// Before: Incorrect check (returns true in fallback mode)\nif (!statsRedis.isEnabled()) {\n  /* fallback */\n}\n\n// After: Correct check (only true when actually connected)\nif (!statsRedis.isConnected()) {\n  /* fallback */\n}\n```"
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-content-security-policy-strict-dynamic-implementation",
      "date": "2025-10-04",
      "title": "Content Security Policy Strict-Dynamic Implementation",
      "tldr": "Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers.",
      "categories": {
        "Added": 3,
        "Changed": 2,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 5,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Added `'strict-dynamic'` directive to Content Security Policy configuration. This allows nonce-based scripts to dynamically load additional scripts (required for React hydration and third-party analytics)."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "`'strict-dynamic'` directive to CSP configuration",
                      "Nonce extraction and application in UmamiScript component",
                      "CSP nonces to all JSON-LD structured data components"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Umami script loading strategy: `lazyOnload` → `afterInteractive` (better nonce compatibility)",
                      "Fixed misleading comments claiming Nosecone includes `strict-dynamic` by default"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Analytics**: Umami analytics script now loads correctly with CSP nonce",
                      "**View tracking**: `trackView()` server actions no longer blocked by CSP",
                      "**React hydration**: Client-side JavaScript execution now works properly",
                      "**Font loading**: Fixed CSP restrictions blocking web fonts",
                      "**Next.js chunks**: Dynamic chunk loading no longer causes `unsafe-eval` errors"
                    ]
                  }
                ]
              }
            ]
          }
        },
        {
          "type": "heading",
          "level": 3,
          "text": "Technical Details",
          "id": "technical-details"
        },
        {
          "type": "paragraph",
          "content": "```typescript\n// CSP now allows nonce-based scripts to load additional scripts\nContent-Security-Policy: script-src 'nonce-xyz123' 'strict-dynamic'\n```\n\n**Impact**: View tracking analytics now work correctly across the site. See live stats on the [trending page](https://claudepro.directory/trending)."
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-reddit-mcp-server-community-contribution",
      "date": "2025-10-04",
      "title": "Reddit MCP Server Community Contribution",
      "tldr": "Added reddit-mcp-buddy server for browsing Reddit directly from Claude.",
      "categories": {
        "Added": 6,
        "Changed": 0,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 1,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Added reddit-mcp-buddy server for browsing Reddit directly from Claude."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**MCP Server**: reddit-mcp-buddy",
                      "Browse Reddit posts and comments",
                      "Search posts by keyword",
                      "Analyze user activity",
                      "Zero API keys required",
                      "Thanks to @karanb192 for the contribution!"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (1)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Updated troubleshooting field to match MCP schema (object array with issue/solution properties)"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-submit-form-github-api-elimination",
      "date": "2025-10-04",
      "title": "Submit Form GitHub API Elimination",
      "tldr": "Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets).",
      "categories": {
        "Added": 3,
        "Changed": 1,
        "Deprecated": 0,
        "Removed": 6,
        "Fixed": 0,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets)."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Completely refactored the [submission flow](https://claudepro.directory/submit) to eliminate all GitHub API dependencies. Users now fill the form and get redirected to GitHub with a pre-filled issue they can review before submitting."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "`/src/lib/utils/github-issue-url.ts` - URL generator for GitHub issues",
                      "Client-side form validation with Zod schemas",
                      "Popup blocker detection with manual fallback link"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (1)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Form content types now exclude 'guides': `agents | mcp | rules | commands | hooks | statuslines`"
                    ]
                  }
                ]
              },
              {
                "label": "Removed (6)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**416 lines of dead code**:",
                      "`/src/lib/services/github.service.ts` (275 lines)",
                      "`/src/app/actions/submit-config.ts` (66 lines)",
                      "5 unused GitHub API schemas (~60 lines)",
                      "GitHub environment variables (GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)",
                      "`githubConfig` export and `hasGitHubConfig()` function"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-04-github-actions-ci-optimization-for-community-contributors",
      "date": "2025-10-04",
      "title": "GitHub Actions CI Optimization for Community Contributors",
      "tldr": "Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR.",
      "categories": {
        "Added": 5,
        "Changed": 2,
        "Deprecated": 0,
        "Removed": 0,
        "Fixed": 2,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "accordion",
            "items": [
              {
                "title": "What Changed",
                "content": "Optimized GitHub Actions workflows to skip intensive jobs (CI, security scans, Lighthouse, bundle analysis) for community content contributions. Only essential workflows (labeling, validation) run for `content/**/*.json` changes."
              }
            ]
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (5)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Automation**: Bundle Analysis workflow (HashiCorp's nextjs-bundle-analysis)",
                      "**Automation**: Lighthouse CI workflow (Core Web Vitals monitoring)",
                      "**Automation**: PR Labeler workflow (19 intelligent labels)",
                      "**Community labels**: 7 contribution types (`community-mcp`, `community-hooks`, etc.)",
                      "**Thresholds**: Lighthouse 90+ performance, 95+ accessibility/SEO"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "CI, Security, Lighthouse, Bundle Analysis now skip on `content/**/*.json` changes",
                      "Moved `.lighthouserc.json` to `config/tools/lighthouserc.json`"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "\"Can't find action.yml\" errors: Added explicit `actions/checkout@v5` before composite actions",
                      "CI and Security workflows now properly check out repository",
                      "--"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  },
  {
    "metadata": {
      "slug": "2025-10-03-nosecone-csp-migration-navigation-menu-fixes",
      "date": "2025-10-03",
      "title": "Nosecone CSP Migration & Navigation Menu Fixes",
      "tldr": "Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering.",
      "categories": {
        "Added": 2,
        "Changed": 3,
        "Deprecated": 0,
        "Removed": 1,
        "Fixed": 3,
        "Security": 0
      }
    },
    "content": {
      "sections": [
        {
          "type": "component",
          "component": "UnifiedContentBox",
          "props": {
            "contentType": "infobox",
            "variant": "info",
            "title": "TL;DR",
            "children": "Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering."
          }
        },
        {
          "type": "component",
          "component": "UnifiedContentBlock",
          "props": {
            "variant": "content-tabs",
            "tabs": [
              {
                "label": "Added (2)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Enhanced error boundary logging with error digest tracking",
                      "Comprehensive error context in Vercel logs (user agent, URL, timestamp)"
                    ]
                  }
                ]
              },
              {
                "label": "Changed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "**Security**: Implemented Nosecone nonce-based CSP with `strict-dynamic`",
                      "**Performance**: Migrated from manual CSP to Nosecone defaults extension",
                      "**UI**: Fixed navigation menu centering on xl/2xl screens (reduced excessive gap)"
                    ]
                  }
                ]
              },
              {
                "label": "Removed (1)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "Dead code: Inactive ISR `revalidate` exports from 16 files (superseded by dynamic rendering)",
                      "--"
                    ]
                  }
                ]
              },
              {
                "label": "Fixed (3)",
                "content": [
                  {
                    "type": "list",
                    "ordered": false,
                    "items": [
                      "CSP violations blocking Next.js chunk loading (`unsafe-eval` errors)",
                      "Font loading errors caused by CSP restrictions",
                      "Navigation menu appearing off-center on large screens"
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    }
  }
];

export const changelogFullBySlug = new Map(changelogFull.map(item => [item.metadata.slug, item]));

export function getChangelogFullBySlug(slug: string) {
  return changelogFullBySlug.get(slug) || null;
}

export type ChangelogFull = typeof changelogFull[number];
