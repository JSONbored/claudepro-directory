/**
 * Auto-generated metadata file
 * Category: Changelog
 * Generated: 2025-10-23T12:47:39.399Z
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { GuideContent } from '@/src/lib/schemas/content/guide.schema';

export type ChangelogMetadata = Pick<GuideContent, 'slug' | 'title' | 'description' | 'dateAdded'>;

export const changelogMetadata: ChangelogMetadata[] = [
  {
    "slug": "2025-10-18-pattern-based-seo-metadata-architecture",
    "title": "Pattern-Based SEO Metadata Architecture",
    "description": "Migrated from 1,600+ lines of legacy metadata code to a modern pattern-based architecture with template-driven metadata generation. All 41 routes now use 8 reusable patterns, achieving 100% coverage with titles (53-60 chars) and descriptions (150-160 chars) optimized for October 2025 SEO standards and AI search engines.",
    "dateAdded": "2025-10-18"
  },
  {
    "slug": "2025-10-16-community-gamification-system-uiux-enhancements",
    "title": "Community Gamification System & UI/UX Enhancements",
    "description": "Implemented comprehensive badge and reputation system for community gamification with 6 reputation tiers, 20+ achievement badges, and public profile integration. Added UI/UX improvements including \"NEW\" badges for recent content (0-7 days), newest-first sorting for homepage featured sections, and mobile-responsive card layouts for better mobile/tablet experience.",
    "dateAdded": "2025-10-16"
  },
  {
    "slug": "2025-10-16-betterstack-heartbeat-monitoring-for-cron-jobs",
    "title": "BetterStack Heartbeat Monitoring for Cron Jobs",
    "description": "Implemented secure BetterStack heartbeat monitoring for Vercel cron jobs to automatically detect failures and send alerts when scheduled tasks don't complete successfully. Uses success-only reporting pattern with environment variable configuration for open-source security.",
    "dateAdded": "2025-10-16"
  },
  {
    "slug": "2025-10-16-october-2025-ai-native-development-content-expansion",
    "title": "October 2025 AI-Native Development Content Expansion",
    "description": "Added 20 cutting-edge, AI-native development content pieces validated against October 2025 trends across Agents (4), Statuslines (4), Rules (4), Commands (4), and Skills (4) categories. All content features production-ready patterns for multi-agent orchestration, AI-powered workflows, and next-generation development tools with strong SEO potential.",
    "dateAdded": "2025-10-16"
  },
  {
    "slug": "2025-10-16-october-2025-content-expansion",
    "title": "October 2025 Content Expansion",
    "description": "Added 20 high-value, keyword-optimized content pieces validated against October 2025 trends across Skills (7), Rules (7), and Agents (6) categories. All content features production-ready code examples, comprehensive documentation, and targets trending technologies with strong SEO potential.",
    "dateAdded": "2025-10-16"
  },
  {
    "slug": "2025-10-16-dynamic-category-system-architecture",
    "title": "Dynamic Category System Architecture",
    "description": "Eliminated all hardcoded category references throughout the codebase. Homepage, stats display, data loading, and type systems now derive dynamically from `UNIFIED_CATEGORY_REGISTRY`. Adding new categories (like Skills) requires zero manual updates across the application - everything auto-updates from a single configuration source.",
    "dateAdded": "2025-10-16"
  },
  {
    "slug": "2025-10-14-skills-category-integration",
    "title": "Skills Category Integration",
    "description": "Added new Skills category for task-focused capability guides covering document/data workflows (PDF, DOCX, PPTX, XLSX). Full platform integration with unified routing, SEO optimization, structured data, and build pipeline support.",
    "dateAdded": "2025-10-14"
  },
  {
    "slug": "2025-10-14-skills-category-integration-pdfdocxpptxxlsx",
    "title": "Skills Category Integration (PDF/DOCX/PPTX/XLSX)",
    "description": "Introduced Skills as a new main content category for task-focused capability guides (document/data workflows). Fully integrated into build pipeline, SEO infrastructure, routing, search, and validation with configuration-driven updates that minimize new code and maximize reuse of existing systems.",
    "dateAdded": "2025-10-14"
  },
  {
    "slug": "2025-10-13-collections-category-system-consolidation",
    "title": "Collections Category System Consolidation",
    "description": "Consolidated Collections into the unified dynamic category routing system alongside Agents, MCP Servers, Rules, Commands, Hooks, and Statuslines. Collections now benefit from uniform handling across the entire platform while maintaining all specialized features like nested collections, prerequisites, installation order, and compatibility tracking.",
    "dateAdded": "2025-10-13"
  },
  {
    "slug": "2025-10-13-dependency-updates-and-typescript-safety-improvements",
    "title": "Dependency Updates and TypeScript Safety Improvements",
    "description": "Updated core dependencies including React 19.2, Next.js 15.5.5, and Recharts 3.2, with enhanced TypeScript safety across chart components to ensure compatibility with the latest package versions.",
    "dateAdded": "2025-10-13"
  },
  {
    "slug": "2025-10-11-theme-toggle-animation-and-navigation-polish",
    "title": "Theme Toggle Animation and Navigation Polish",
    "description": "Added smooth Circle Blur animation to theme switching using the View Transitions API, creating a delightful circular reveal effect from your click position. Enhanced navigation visual design with rounded containers, updated announcement banner styling, and refined mega-menu dropdown for improved aesthetics and user experience.",
    "dateAdded": "2025-10-11"
  },
  {
    "slug": "2025-10-10-navigation-overhaul-and-announcement-system",
    "title": "Navigation Overhaul and Announcement System",
    "description": "Completely refactored navigation with configuration-driven architecture, added global command palette (⌘K), implemented site-wide announcement system with dismissal tracking, and enhanced accessibility to WCAG 2.1 AA standards. Navigation is now DRY, maintainable, and keyboard-first.",
    "dateAdded": "2025-10-10"
  },
  {
    "slug": "2025-10-09-hero-section-animations-and-search-enhancements",
    "title": "Hero Section Animations and Search Enhancements",
    "description": "Transformed the homepage with dynamic meteor background animations, character-by-character rolling text effects, and streamlined search UI. These enhancements create a more engaging first impression while improving search discoverability and reducing visual clutter.",
    "dateAdded": "2025-10-09"
  },
  {
    "slug": "2025-10-09-card-grid-layout-and-infinite-scroll-improvements",
    "title": "Card Grid Layout and Infinite Scroll Improvements",
    "description": "Enhanced visual consistency across card grids with CSS masonry layout achieving 95% spacing uniformity, and fixed infinite scroll reliability issues that prevented loading beyond 60 items. These improvements deliver a more polished browsing experience across all content pages.",
    "dateAdded": "2025-10-09"
  },
  {
    "slug": "2025-10-09-enhanced-type-safety-with-branded-types-and-schema-improvements",
    "title": "Enhanced Type Safety with Branded Types and Schema Improvements",
    "description": "Implemented branded types for user/session/content IDs with compile-time safety, centralized input sanitization transforms into 13 reusable functions, and enhanced schema validation across the personalization engine. These changes improve type safety, eliminate duplicate code, and provide better protection against ID mixing bugs.",
    "dateAdded": "2025-10-09"
  },
  {
    "slug": "2025-10-08-react-19-component-migration-for-shadcnui",
    "title": "React 19 Component Migration for shadcn/ui",
    "description": "Migrated 6 shadcn/ui components (15 total component instances) from deprecated React.forwardRef pattern to React 19's ref-as-prop pattern, eliminating all forwardRef deprecation warnings while maintaining full type safety and functionality.",
    "dateAdded": "2025-10-08"
  },
  {
    "slug": "2025-10-08-component-architecture-improvements",
    "title": "Component Architecture Improvements",
    "description": "Refactored card and newsletter components to eliminate code duplication through shared utilities, improving maintainability while preserving all existing features. Extracted 407 lines of duplicate code into reusable BaseCard component and useNewsletter hook.",
    "dateAdded": "2025-10-08"
  },
  {
    "slug": "2025-10-08-production-code-quality-and-accessibility-improvements",
    "title": "Production Code Quality and Accessibility Improvements",
    "description": "Eliminated all TypeScript non-null assertions with production-safe patterns, fixed WCAG AA color contrast violations, and added automated Lighthouse CI workflow for continuous accessibility monitoring.",
    "dateAdded": "2025-10-08"
  },
  {
    "slug": "2025-10-08-personalized-recommendation-engine",
    "title": "Personalized Recommendation Engine",
    "description": "Intelligent personalization system with hybrid recommendation algorithms, \"For You\" feed, similar configs, and usage-based suggestions powered by interaction tracking and collaborative filtering.",
    "dateAdded": "2025-10-08"
  },
  {
    "slug": "2025-10-07-configuration-recommender-tool",
    "title": "Configuration Recommender Tool",
    "description": "Interactive quiz tool that analyzes user needs and recommends the best-fit Claude configurations from our catalog of 147+ options using a zero-cost rule-based algorithm with <100ms response time.",
    "dateAdded": "2025-10-07"
  },
  {
    "slug": "2025-10-07-user-collections-and-my-library",
    "title": "User Collections and My Library",
    "description": "Users can now create custom collections to organize their bookmarked configurations, share them publicly on their profiles, and discover collections from other community members.",
    "dateAdded": "2025-10-07"
  },
  {
    "slug": "2025-10-07-reputation-system-and-automatic-badge-awarding",
    "title": "Reputation System and Automatic Badge Awarding",
    "description": "Implemented automatic reputation scoring and achievement badge system with database triggers that reward community contributions in real-time.",
    "dateAdded": "2025-10-07"
  },
  {
    "slug": "2025-10-07-user-profile-system-with-oauth-avatar-sync",
    "title": "User Profile System with OAuth Avatar Sync",
    "description": "Enhanced user profiles with automatic OAuth avatar syncing, editable profile fields, interests/skills tags, reputation scoring, tier system, and badge achievement foundation.",
    "dateAdded": "2025-10-07"
  },
  {
    "slug": "2025-10-06-automated-submission-tracking-and-analytics",
    "title": "Automated Submission Tracking and Analytics",
    "description": "Implemented database-backed submission tracking system with statistics dashboard, enabling community contribution analytics and submission management.",
    "dateAdded": "2025-10-06"
  },
  {
    "slug": "2025-10-06-user-authentication-and-account-management",
    "title": "User Authentication and Account Management",
    "description": "Complete user authentication system with Supabase Auth, user profiles, account settings, and social features (following, bookmarks).",
    "dateAdded": "2025-10-06"
  },
  {
    "slug": "2025-10-06-sponsorship-analytics-dashboard",
    "title": "Sponsorship Analytics Dashboard",
    "description": "Added detailed analytics dashboard for sponsored content showing views, clicks, CTR, and performance metrics over time.",
    "dateAdded": "2025-10-06"
  },
  {
    "slug": "2025-10-06-submit-page-sidebar-and-statistics",
    "title": "Submit Page Sidebar and Statistics",
    "description": "Enhanced submit page with comprehensive sidebar featuring real-time statistics, recent submissions, top contributors, and helpful tips.",
    "dateAdded": "2025-10-06"
  },
  {
    "slug": "2025-10-06-email-templates-infrastructure",
    "title": "Email Templates Infrastructure",
    "description": "Integrated React Email for type-safe, production-ready transactional email templates with development preview server.",
    "dateAdded": "2025-10-06"
  },
  {
    "slug": "2025-10-05-resend-newsletter-integration-with-sticky-footer-bar",
    "title": "Resend Newsletter Integration with Sticky Footer Bar",
    "description": "Implemented production-ready email newsletter subscription system using Resend API with rate-limited server actions, sticky footer bar (3s delay, localStorage dismissal), and automatic infinite scroll on homepage.",
    "dateAdded": "2025-10-05"
  },
  {
    "slug": "2025-10-05-homepage-infinite-scroll-bug-fix",
    "title": "Homepage Infinite Scroll Bug Fix",
    "description": "Fixed critical bug where homepage \"All\" section stopped loading after 60 items due to state synchronization issues between parent and InfiniteScrollContainer component.",
    "dateAdded": "2025-10-05"
  },
  {
    "slug": "2025-10-04-llmstxt-complete-content-generation-for-ai-discovery",
    "title": "LLMs.txt Complete Content Generation for AI Discovery",
    "description": "All 168 content pages now generate comprehensive llms.txt files with 100% of page content (features, installation, configuration, security, examples) optimized for AI tool discovery and LLM consumption.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-seo-title-optimization-system-with-automated-enhancement",
    "title": "SEO Title Optimization System with Automated Enhancement",
    "description": "Optimized 59 page titles with automated \"for Claude\" branding while staying under 60-character SEO limits. Added validation tools and developer utilities for ongoing title management.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-production-hardened-trending-algorithm-with-security-performance-optimizations",
    "title": "Production-Hardened Trending Algorithm with Security & Performance Optimizations",
    "description": "Trending content now ranks by growth velocity with UTC-normalized timestamps, input validation, and atomic Redis operations.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-view-counter-ui-redesign-with-prominent-badge-display",
    "title": "View Counter UI Redesign with Prominent Badge Display",
    "description": "View counts now appear as eye-catching badges on config cards instead of plain text.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-trending-page-infinite-loading-fix-with-isr",
    "title": "Trending Page Infinite Loading Fix with ISR",
    "description": "Fixed trending page stuck in loading state by enabling ISR with 5-minute revalidation.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-content-security-policy-strict-dynamic-implementation",
    "title": "Content Security Policy Strict-Dynamic Implementation",
    "description": "Fixed React hydration and analytics by adding `'strict-dynamic'` to CSP headers.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-reddit-mcp-server-community-contribution",
    "title": "Reddit MCP Server Community Contribution",
    "description": "Added reddit-mcp-buddy server for browsing Reddit directly from Claude.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-submit-form-github-api-elimination",
    "title": "Submit Form GitHub API Elimination",
    "description": "Submission flow now uses GitHub URL pre-filling instead of GitHub API (zero rate limits, zero secrets).",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-04-github-actions-ci-optimization-for-community-contributors",
    "title": "GitHub Actions CI Optimization for Community Contributors",
    "description": "Community PRs now trigger only 2 workflows instead of 10, saving ~10-15 minutes per PR.",
    "dateAdded": "2025-10-04"
  },
  {
    "slug": "2025-10-03-nosecone-csp-migration-navigation-menu-fixes",
    "title": "Nosecone CSP Migration & Navigation Menu Fixes",
    "description": "Migrated to Nosecone nonce-based CSP for better security and fixed navigation menu centering.",
    "dateAdded": "2025-10-03"
  }
];

export const changelogMetadataBySlug = new Map(changelogMetadata.map(item => [item.slug, item]));

export function getChangelogMetadataBySlug(slug: string): ChangelogMetadata | null {
  return changelogMetadataBySlug.get(slug) || null;
}
