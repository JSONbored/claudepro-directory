/**
 * UI Class Constants
 * SHA-2101: Centralized className patterns to eliminate duplication
 *
 * Usage: Replace long className strings with these constants
 * Before: className="card-gradient hover-lift transition-smooth group"
 * After: className={UI_CLASSES.CARD_GRADIENT_HOVER}
 *
 * =============================================================================
 * RESPONSIVE BREAKPOINT STRATEGY (Tailwind CSS)
 * =============================================================================
 *
 * Standard Breakpoints:
 * - Mobile:   < 768px   (default, no prefix)
 * - Tablet:   ≥ 768px   (md: prefix)
 * - Desktop:  ≥ 1024px  (lg: prefix)
 * - Wide:     ≥ 1280px  (xl: prefix)
 *
 * IMPORTANT: Avoid sm: (640px) breakpoint for consistency
 * - Reason: Creates inconsistent behavior between mobile (< 768px) and tablet (≥ 768px)
 * - Grid layouts use md: and lg: breakpoints
 * - Navigation shows/hides at md: (768px) and lg: (1024px)
 *
 * Standard Patterns:
 * 1. Mobile → Tablet transition: Use md: (768px)
 *    Example: flex flex-col md:flex-row
 *
 * 2. Tablet → Desktop transition: Use lg: (1024px)
 *    Example: hidden md:block lg:flex
 *
 * 3. Grid layouts:
 *    Example: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
 *
 * 4. Navigation visibility:
 *    Desktop nav: hidden md:flex
 *    Mobile menu: lg:hidden
 *
 * Architecture Decision:
 * - This ensures no "gap" where neither mobile nor desktop UI shows
 * - Aligns all responsive breakpoints across components
 * - Follows Tailwind's mobile-first philosophy
 * - Matches industry standard tablet breakpoint (768px iPad)
 *
 * =============================================================================
 * RESPONSIVE DESIGN TOKENS (2025 Modern Architecture)
 * =============================================================================
 *
 * Configuration-driven responsive system for systematic multi-viewport support.
 * Use these tokens for viewport testing, container queries, and responsive logic.
 *
 * @see BREAKPOINTS - Standard viewport sizes for testing and media queries
 * @see CONTAINER_BREAKPOINTS - Container query breakpoints (Tailwind v4 @container)
 * @see RESPONSIVE_SPACING - Proportional spacing that scales across viewports
 */

/**
 * Standard Viewport Breakpoints (px values)
 * Aligned with Tailwind CSS defaults and industry standards
 *
 * Usage:
 * - Playwright viewport configuration
 * - Visual regression testing
 * - Responsive logic in components
 * - Media query generation
 *
 * @example
 * ```typescript
 * import { BREAKPOINTS } from '@/src/lib/ui-constants';
 *
 * // Playwright viewport configuration
 * viewport: { width: BREAKPOINTS.tablet, height: 1024 }
 *
 * // Responsive logic
 * if (windowWidth >= BREAKPOINTS.desktop) { ... }
 * ```
 */
export const BREAKPOINTS = {
  /** Mobile (iPhone SE, small phones) - 320px */
  mobile: 320,
  /** Tablet (iPad portrait, medium screens) - 768px */
  tablet: 768,
  /** Desktop (Laptop, small desktop) - 1024px */
  desktop: 1024,
  /** Wide (Large desktop) - 1280px */
  wide: 1280,
  /** Ultra (1080p+ monitors) - 1920px */
  ultra: 1920,
} as const;

/**
 * Container Query Breakpoints (px values)
 * For use with Tailwind v4 @container queries
 *
 * Container queries allow components to adapt based on their parent container width,
 * not viewport width. This makes components truly reusable in any context.
 *
 * Usage:
 * - Use @container in parent: className="@container"
 * - Use @<size>: in children: className="@md:grid-cols-2"
 *
 * When to Use:
 * - ✅ Reusable components (cards, modals, sidebars)
 * - ✅ Components used in multiple layout contexts
 * - ✅ Design system components
 * - ❌ Page-level layouts (use regular breakpoints)
 *
 * @example
 * ```tsx
 * // Parent container
 * <div className="@container">
 *   {/* Child adapts to container, not viewport *\/}
 *   <div className="grid @md:grid-cols-2 @lg:grid-cols-3">
 *     <ConfigCard />
 *   </div>
 * </div>
 * ```
 */
export const CONTAINER_BREAKPOINTS = {
  /** Small container - 384px */
  sm: 384,
  /** Medium container - 448px */
  md: 448,
  /** Large container - 512px */
  lg: 512,
  /** Extra large container - 576px */
  xl: 576,
  /** 2XL container - 672px */
  '2xl': 672,
} as const;

/**
 * Responsive Spacing Scale
 * Proportional spacing tokens that scale gracefully across viewports
 *
 * Philosophy:
 * - Mobile: Tighter spacing (space is precious)
 * - Tablet: Medium spacing (balanced)
 * - Desktop: Generous spacing (ample screen real estate)
 *
 * Usage: Use these in gap, padding, margin for responsive scaling
 *
 * @example
 * ```tsx
 * import { RESPONSIVE_SPACING } from '@/src/lib/ui-constants';
 *
 * // Component with responsive gap
 * <div className={`flex gap-${RESPONSIVE_SPACING.gap.mobile} md:gap-${RESPONSIVE_SPACING.gap.tablet}`}>
 * ```
 */
export const RESPONSIVE_SPACING = {
  /** Gap spacing across viewports */
  gap: {
    mobile: 4, // 1rem (16px)
    tablet: 6, // 1.5rem (24px)
    desktop: 8, // 2rem (32px)
  },
  /** Container padding across viewports */
  container: {
    mobile: 4, // 1rem (16px)
    tablet: 6, // 1.5rem (24px)
    desktop: 8, // 2rem (32px)
  },
  /** Section spacing (between major sections) */
  section: {
    mobile: 12, // 3rem (48px)
    tablet: 16, // 4rem (64px)
    desktop: 24, // 6rem (96px)
  },
} as const;

/**
 * Viewport Dimension Presets
 * Common device dimensions for visual testing and responsive development
 *
 * Usage:
 * - Playwright projects configuration
 * - Storybook viewport addon
 * - Visual regression testing baselines
 *
 * @example
 * ```typescript
 * import { VIEWPORT_PRESETS } from '@/src/lib/ui-constants';
 *
 * // Playwright config
 * use: { viewport: VIEWPORT_PRESETS.iphone13 }
 * ```
 */
export const VIEWPORT_PRESETS = {
  /** iPhone SE (smallest modern phone) */
  iphoneSE: { width: 375, height: 667 },
  /** iPhone 13/14/15 (standard modern phone) */
  iphone13: { width: 390, height: 844 },
  /** iPhone 13/14/15 Pro Max (large phone) */
  iphone13ProMax: { width: 428, height: 926 },
  /** iPad (portrait) */
  ipadPortrait: { width: 768, height: 1024 },
  /** iPad (landscape) */
  ipadLandscape: { width: 1024, height: 768 },
  /** iPad Pro 12.9" (portrait) */
  ipadProPortrait: { width: 1024, height: 1366 },
  /** iPad Pro 12.9" (landscape) */
  ipadProLandscape: { width: 1366, height: 1024 },
  /** Laptop (13" MacBook) */
  laptop: { width: 1280, height: 800 },
  /** Desktop (1080p monitor) */
  desktop1080p: { width: 1920, height: 1080 },
  /** Desktop (1440p monitor) */
  desktop1440p: { width: 2560, height: 1440 },
  /** Desktop (4K monitor) */
  desktop4k: { width: 3840, height: 2160 },
} as const;

/**
 * Type-safe breakpoint keys
 */
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type ContainerBreakpointKey = keyof typeof CONTAINER_BREAKPOINTS;
export type ViewportPresetKey = keyof typeof VIEWPORT_PRESETS;

export const UI_CLASSES = {
  /**
   * Card Styles
   */
  CARD_INTERACTIVE:
    'card-gradient hover-lift transition-smooth group cursor-pointer border-border/50 hover:border-accent/20',
  CARD_GRADIENT_HOVER: 'card-gradient hover-lift transition-smooth group',
  /**
   * Button Styles - Common patterns
   */
  BUTTON_PRIMARY_LARGE:
    'flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200',
  BUTTON_SECONDARY_MEDIUM:
    'flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]',
  BUTTON_GHOST_ICON: 'hover:bg-accent/10 hover:text-accent',

  /**
   * Grid Layouts
   */
  GRID_RESPONSIVE_3:
    'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start auto-rows-fr',
  GRID_RESPONSIVE_3_TIGHT: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  GRID_RESPONSIVE_4: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
  GRID_RESPONSIVE_LIST: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none',
  /**
   * Text Styles
   */
  TEXT_HEADING_HERO: 'text-4xl lg:text-6xl font-bold mb-6 text-foreground',
  TEXT_HEADING_LARGE: 'text-xl text-muted-foreground mb-8 leading-relaxed',
  TEXT_HEADING_MEDIUM: 'text-lg text-muted-foreground mb-8 leading-relaxed',
  /**
   * Container Styles
   */
  CONTAINER_CARD_MUTED: 'text-center py-12 bg-card/50 rounded-xl border border-border/50',
  CONTAINER_OVERFLOW_BORDER: 'relative overflow-hidden border-b border-border/50 bg-card/30',
  /**
   * Flexbox Layouts - Common patterns
   */
  FLEX_ITEMS_CENTER_GAP_1: 'flex items-center gap-1',
  FLEX_ITEMS_CENTER_GAP_1_5: 'flex items-center gap-1.5',
  FLEX_ITEMS_CENTER_GAP_2: 'flex items-center gap-2',
  FLEX_ITEMS_CENTER_GAP_3: 'flex items-center gap-3',
  FLEX_ITEMS_CENTER_GAP_6: 'flex items-center gap-6',
  FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN: 'flex items-center justify-between',
  FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2: 'flex items-center justify-center gap-2',
  FLEX_ITEMS_START_GAP_2: 'flex items-start gap-2',
  FLEX_ITEMS_START_GAP_3: 'flex items-start gap-3',
  FLEX_ITEMS_START_JUSTIFY_BETWEEN: 'flex items-start justify-between',
  FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_2: 'flex items-start justify-between gap-2',
  FLEX_GAP_2: 'flex gap-2',
  FLEX_WRAP_GAP_2: 'flex flex-wrap gap-2',
  FLEX_WRAP_GAP_3: 'flex flex-wrap gap-3',
  /**
   * Flex Layouts - Extended
   */
  FLEX_COL_ITEMS_CENTER_GAP_4: 'flex flex-col items-center gap-4',
  FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER: 'flex flex-col items-center justify-center py-12',
  FLEX_COL_SM_ROW_GAP_2: 'flex flex-col sm:flex-row gap-2 sm:gap-3',
  FLEX_COL_SM_ROW_GAP_3: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
  FLEX_COL_SM_ROW_ITEMS_START: 'flex flex-col sm:flex-row items-start gap-3',
  FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN:
    'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4',
  /**
   * Flexbox - Extended
   */
  FLEX_SHRINK_0_MT_0_5: 'flex-shrink-0 mt-0.5',
  /**
   * Text Size & Color Combinations
   */
  TEXT_XS_MUTED: 'text-xs text-muted-foreground',
  TEXT_SM_MUTED: 'text-sm text-muted-foreground',
  /**
   * Code Block Styles - Production-grade patterns
   */
  CODE_BLOCK_HEADER:
    'flex items-center justify-between px-4 py-2 bg-code/30 border border-b-0 border-border rounded-t-lg backdrop-blur-sm',
  CODE_BLOCK_PRE:
    'overflow-x-auto text-sm leading-relaxed p-4 rounded-lg border border-border bg-code/50 backdrop-blur-sm',
  CODE_BLOCK_FILENAME: 'text-sm font-mono text-muted-foreground',
  CODE_BLOCK_COPY_BUTTON_FLOATING:
    'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_COPY_BUTTON_HEADER_FLOATING:
    'absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_TAB_CONTAINER: 'flex gap-2 overflow-x-auto scrollbar-hide border-b border-border/50',
  CODE_BLOCK_TAB_ACTIVE: 'text-primary border-primary',
  CODE_BLOCK_TAB_INACTIVE: 'text-muted-foreground border-transparent hover:text-foreground',
  CODE_BLOCK_GROUP_WRAPPER: 'relative group my-6',

  /**
   * Responsive Card Layouts
   * Mobile-first design with progressive enhancement
   * Breakpoint strategy: md: (768px) aligns with grid layouts (md:grid-cols-2 lg:grid-cols-3)
   */
  CARD_BADGE_CONTAINER: 'flex flex-wrap gap-1.5 md:gap-2 mb-4',
  CARD_FOOTER_RESPONSIVE: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
  CARD_METADATA_BADGES: 'flex items-center gap-1 text-xs flex-wrap md:flex-nowrap',
} as const;

/**
 * Type-safe UI class constant keys
 */
export type UIClassKey = keyof typeof UI_CLASSES;

/**
 * Content Card Behavior Configuration - Configuration-Driven
 *
 * Auto-generates default behaviors for all categories in registry.
 * Special cases (guides, collections) override as needed.
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Default behaviors derived from UNIFIED_CATEGORY_REGISTRY
 * - Tree-shakeable: Only imported configurations included in bundle
 * - Type-safe: Enforces valid content types at compile time
 *
 * @see lib/config/category-config.ts - Single source of truth for categories
 *
 * @example
 * ```typescript
 * const behavior = CARD_BEHAVIORS[item.category] || CARD_BEHAVIORS.default;
 * if (behavior.showCopyButton) {
 *   // Render copy button
 * }
 * ```
 */
// REMOVED: import from category-config to prevent server code in browser
// Previously: import { getAllCategoryIds, UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
//
// Architecture Decision: Hardcode category IDs here instead of importing from category-config
// to avoid pulling server-side dependencies into browser bundles (Storybook compatibility).
// These values are static configuration and don't change at runtime.

// Default behavior template for config-based categories
const DEFAULT_CONFIG_BEHAVIOR = {
  showCopyButton: true,
  showViewCount: true,
  showCopyCount: true,
  showRating: true,
  showFeaturedBadge: true,
} as const;

// Default behavior template for guide-like categories
const DEFAULT_GUIDE_BEHAVIOR = {
  showCopyButton: false,
  showViewCount: true,
  showCopyCount: false,
  showRating: true,
  showFeaturedBadge: true,
} as const;

// Static list of category IDs (matches UNIFIED_CATEGORY_REGISTRY keys)
// Update this list when adding new categories to category-config.ts
const CATEGORY_IDS = ['agents', 'hooks', 'mcps', 'rules', 'skills'] as const;

// Build behaviors statically
const derivedBehaviors = Object.fromEntries(
  CATEGORY_IDS.map((categoryId) => [categoryId, DEFAULT_CONFIG_BEHAVIOR])
);

export const CARD_BEHAVIORS = {
  // Default for unknown categories
  default: DEFAULT_CONFIG_BEHAVIOR,

  // Registry categories (static)
  ...derivedBehaviors,

  // Guide categories (educational content - not copyable)
  guides: DEFAULT_GUIDE_BEHAVIOR,
  tutorials: DEFAULT_GUIDE_BEHAVIOR,
  workflows: DEFAULT_GUIDE_BEHAVIOR,
  comparisons: DEFAULT_GUIDE_BEHAVIOR,
  'use-cases': DEFAULT_GUIDE_BEHAVIOR,
  troubleshooting: DEFAULT_GUIDE_BEHAVIOR,

  // Special case overrides
  collections: {
    showCopyButton: true,
    showViewCount: true,
    showCopyCount: true,
    showRating: false, // Collections don't have ratings (yet)
    showFeaturedBadge: false, // Collections have their own type badges
  },
} as const;

/**
 * Type-safe card behavior keys
 */
export type CardBehaviorKey = keyof typeof CARD_BEHAVIORS;

/**
 * Badge Color Constants
 * Centralized color schemes for badges to eliminate inline color definitions
 * SHA-2101: Part of consolidation effort to reduce duplication
 *
 * Usage: Replace inline badge color objects with these constants
 * Before: const colors = { 'full-time': 'bg-green-500/10...' }
 * After: className={BADGE_COLORS.jobType['full-time']}
 */
export const BADGE_COLORS = {
  /**
   * Job type badge colors
   * Used in: JobCard, job detail pages, job listings
   */
  jobType: {
    'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
    'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },

  /**
   * Difficulty level badge colors
   * Used in: Collection cards, guide pages, content filters
   */
  difficulty: {
    beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
  },

  /**
   * Collection type badge colors
   * Used in: Collection cards, collection detail pages
   */
  collectionType: {
    'starter-kit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    workflow: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'advanced-system': 'bg-red-500/10 text-red-400 border-red-500/20',
    'use-case': 'bg-green-500/10 text-green-400 border-green-500/20',
  },

  /**
   * Changelog category badge colors
   * Used in: Changelog cards, changelog pages
   */
  changelogCategory: {
    Added: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    Changed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    Deprecated: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    Removed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    Fixed: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    Security: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  },

  /**
   * Generic status badge colors
   * Used in: Various status indicators throughout the app
   */
  status: {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },

  /**
   * Content category badge colors - Static Configuration
   * Hardcoded from category-config.ts colorScheme values for browser compatibility
   * Update when adding new categories to category-config.ts
   * Used in: DetailSidebar category badges
   */
  category: {
    default: 'bg-primary/20 text-primary border-primary/30',
    // From UNIFIED_CATEGORY_REGISTRY colorScheme mappings:
    agents: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
    mcp: 'bg-green-500/20 text-green-500 border-green-500/30',
    commands: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
    rules: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    hooks: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    statuslines: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
    collections: 'bg-indigo-500/20 text-indigo-500 border-indigo-500/30',
    skills: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  },

  /**
   * Submission status badge colors (SHA-3146)
   * Used in: User submissions page, submission tracking
   */
  submissionStatus: {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    merged: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  },

  /**
   * Job posting status badge colors (SHA-3146)
   * Used in: Job dashboard, job analytics, job listings
   */
  jobStatus: {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
} as const;

/**
 * Type-safe badge color keys
 */
export type JobType = keyof typeof BADGE_COLORS.jobType;
export type DifficultyLevel = keyof typeof BADGE_COLORS.difficulty;
export type CollectionType = keyof typeof BADGE_COLORS.collectionType;
export type ChangelogCategory = keyof typeof BADGE_COLORS.changelogCategory;
export type StatusType = keyof typeof BADGE_COLORS.status;
export type CategoryType = keyof typeof BADGE_COLORS.category;
export type SubmissionStatusType = keyof typeof BADGE_COLORS.submissionStatus;
export type JobStatusType = keyof typeof BADGE_COLORS.jobStatus;

/**
 * Static Icon Name Mapping
 *
 * Tree-shakeable icon mapping for string-based icon lookups.
 * Only the icons actually used in code will be included in the bundle.
 *
 * Purpose: Replace dynamic iconMap that prevented tree-shaking (SHA-BUNDLE-OPT)
 * Location: Centralized in ui-constants.ts following consolidation principles
 *
 * Usage:
 * ```typescript
 * import { ICON_NAME_MAP } from '@/src/lib/ui-constants';
 * const IconComponent = ICON_NAME_MAP[iconName] || HelpCircle;
 * ```
 */
import { BookOpen, Code, HelpCircle, Layers, Sparkles, Terminal, Webhook } from '@/src/lib/icons';

export const ICON_NAME_MAP = {
  // Category icons (from category-config.ts)
  sparkles: Sparkles,
  code: Code,
  terminal: Terminal,
  'book-open': BookOpen,
  bookopen: BookOpen, // displayName lowercase fallback
  webhook: Webhook,
  layers: Layers,

  // Fallback for unknown icons
  'help-circle': HelpCircle,
} as const;

/**
 * Get Responsive Grid Class
 *
 * Utility function to generate responsive grid className based on column count.
 * Consolidates repeated grid logic from content-type-field-renderer.
 *
 * @param columns - Number of columns (2 or 3)
 * @returns Responsive grid className string
 *
 * @example
 * ```tsx
 * <div className={getResponsiveGridClass(2)}>
 *   <FormField ... />
 *   <FormField ... />
 * </div>
 * ```
 */
export function getResponsiveGridClass(columns: 2 | 3): string {
  if (columns === 3) {
    return 'grid grid-cols-1 sm:grid-cols-3 gap-4';
  }
  // Default to 2 columns
  return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
}
