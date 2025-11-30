/**
 * Badge Style Utilities
 *
 * Composable patterns for badges and pills.
 * Replaces UI_CLASSES badge patterns.
 *
 * @module web-runtime/design-system/styles/badges
 */

// =============================================================================
// BASE BADGE STYLES
// =============================================================================

/**
 * Base badge styles.
 */
export const badgeBase = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';

/**
 * Badge padding variants.
 */
export const badgePadding = {
  default: 'px-2.5 py-0.5',
  compact: 'px-1.5 py-0.5',
  relaxed: 'px-3 py-1',
} as const;

// =============================================================================
// BADGE VARIANTS
// =============================================================================

/**
 * Status badge variants.
 */
export const statusBadge = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  published: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  premium: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  deleted: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

/**
 * Semantic badge variants.
 */
export const semanticBadge = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
} as const;

/**
 * Featured/promoted badge.
 */
export const featuredBadge = 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400';

/**
 * Metadata badge (subtle).
 */
export const metaBadge = 'border-muted-foreground/20 text-muted-foreground';

// =============================================================================
// CATEGORY BADGES
// =============================================================================

/**
 * Category-specific badge colors.
 * These use the OKLCH-based category colors from tokens.
 */
export const categoryBadge = {
  agents: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  mcp: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  commands: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  rules: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  hooks: 'bg-green-500/10 text-green-400 border-green-500/20',
  statuslines: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  collections: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  skills: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  guides: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  jobs: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  changelog: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  default: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

// =============================================================================
// JOB TYPE BADGES
// =============================================================================

/**
 * Job type badge colors.
 */
export const jobTypeBadge = {
  'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
  'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  internship: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
} as const;

// =============================================================================
// DIFFICULTY BADGES
// =============================================================================

/**
 * Difficulty level badges.
 */
export const difficultyBadge = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

// =============================================================================
// COLLECTION TYPE BADGES
// =============================================================================

/**
 * Collection type badges.
 */
export const collectionTypeBadge = {
  'starter-kit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  workflow: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'advanced-system': 'bg-red-500/10 text-red-400 border-red-500/20',
  'use-case': 'bg-green-500/10 text-green-400 border-green-500/20',
} as const;

// =============================================================================
// CHANGELOG BADGES
// =============================================================================

/**
 * Changelog category badges.
 */
export const changelogBadge = {
  Added: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  Changed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  Deprecated: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  Removed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  Fixed: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  Security: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
} as const;

// =============================================================================
// SUBMISSION STATUS BADGES
// =============================================================================

/**
 * Submission status badges.
 */
export const submissionBadge = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  merged: 'bg-green-500/10 text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  spam: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

// =============================================================================
// MEMBER TYPE BADGES
// =============================================================================

/**
 * Member/contributor type badges.
 */
export const memberBadge = {
  owner: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  contributor: 'bg-accent/10 text-accent border-accent/30',
  member: 'text-muted-foreground border-muted-foreground/20',
} as const;

// =============================================================================
// JOB STATUS BADGES
// =============================================================================

/**
 * Job posting status badges.
 */
export const jobStatusBadge = {
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  pending_payment: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  pending_review: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  active: 'bg-green-500/10 text-green-400 border-green-500/20',
  expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  deleted: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
} as const;

// =============================================================================
// FEATURED JOB STYLES
// =============================================================================

/**
 * Featured job badge styling.
 */
export const featuredJob = {
  badge: 'bg-orange-500 text-white border-orange-500',
  border: 'border-2 border-orange-500/50',
  gradient: 'bg-gradient-to-br from-orange-500/5 to-orange-600/10',
  glow: 'shadow-lg shadow-orange-500/10',
} as const;

// =============================================================================
// BADGE CONTAINERS
// =============================================================================

/**
 * Badge container patterns.
 */
export const badgeContainer = {
  /** Default flex container */
  default: 'flex flex-wrap gap-2 mb-4',
  /** Compact container */
  compact: 'flex flex-wrap gap-1.5 mb-3',
  /** Inline metadata */
  inline: 'flex items-center gap-2 text-xs flex-nowrap',
} as const;
