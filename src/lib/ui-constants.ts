/**
 * UI Constants - Centralized className patterns, breakpoints, spacing, gradients, shadows
 * Breakpoints: mobile<768 (md:), tablet≥768, desktop≥1024 (lg:), wide≥1280 (xl:). Avoid sm: for consistency.
 */

/** Standard viewport breakpoints (mobile:320, tablet:768, desktop:1024, wide:1280, ultra:1920) */
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

/** Container query breakpoints for Tailwind v4 @container (sm:384, md:448, lg:512, xl:576, 2xl:672) */
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

/** Responsive spacing scale (gap, container, section) for mobile/tablet/desktop */
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

/** Viewport dimension presets for testing (iPhone, iPad, laptop, desktop variants) */
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

/** Type-safe breakpoint keys */
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type ContainerBreakpointKey = keyof typeof CONTAINER_BREAKPOINTS;
export type ViewportPresetKey = keyof typeof VIEWPORT_PRESETS;

export const UI_CLASSES = {
  CARD_INTERACTIVE:
    'card-gradient hover-lift transition-smooth group cursor-pointer border-border/50 hover:border-accent/20',
  CARD_GRADIENT_HOVER: 'card-gradient hover-lift transition-smooth group',
  BUTTON_PRIMARY_LARGE:
    'flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200',
  BUTTON_SECONDARY_MEDIUM:
    'flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]',
  BUTTON_GHOST_ICON: 'hover:bg-accent/10 hover:text-accent',

  GRID_RESPONSIVE_3: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  GRID_RESPONSIVE_3_TIGHT: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  GRID_RESPONSIVE_4: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
  GRID_RESPONSIVE_LIST: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none',
  TEXT_HEADING_HERO: 'text-4xl lg:text-6xl font-bold mb-6 text-foreground',
  TEXT_HEADING_LARGE: 'text-xl text-muted-foreground mb-8 leading-relaxed',
  TEXT_HEADING_MEDIUM: 'text-lg text-muted-foreground mb-8 leading-relaxed',
  CONTAINER_CARD_MUTED: 'text-center py-12 bg-card/50 rounded-xl border border-border/50',
  CONTAINER_OVERFLOW_BORDER: 'relative overflow-hidden border-b border-border/50 bg-card/30',
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
  FLEX_COL_ITEMS_CENTER_GAP_4: 'flex flex-col items-center gap-4',
  FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER: 'flex flex-col items-center justify-center py-12',
  FLEX_COL_SM_ROW_GAP_2: 'flex flex-col sm:flex-row gap-2 sm:gap-3',
  FLEX_COL_SM_ROW_GAP_3: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
  FLEX_COL_SM_ROW_ITEMS_START: 'flex flex-col sm:flex-row items-start gap-3',
  FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN:
    'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4',
  FLEX_SHRINK_0_MT_0_5: 'flex-shrink-0 mt-0.5',
  TEXT_XS_MUTED: 'text-xs text-muted-foreground',
  TEXT_SM_MUTED: 'text-sm text-muted-foreground',
  TEXT_MUTED: 'text-muted-foreground',
  SPACE_Y_2: 'space-y-2',
  SPACE_Y_3: 'space-y-3',
  SPACE_Y_4: 'space-y-4',
  SPACE_Y_6: 'space-y-6',
  MB_4: 'mb-4',
  MB_6: 'mb-6',
  MB_8: 'mb-8',
  ICON_SM: 'h-3 w-3',
  ICON_SM_MR: 'h-3 w-3 mr-1',
  ICON_MD: 'h-4 w-4',
  ICON_MD_MR: 'h-4 w-4 mr-2',
  ICON_LG: 'h-5 w-5',
  ICON_LG_PRIMARY: 'h-5 w-5 text-primary',
  ICON_SUCCESS_INDICATOR: 'h-4 w-4 text-green-500 mt-0.5',
  HEADING_2XL: 'text-2xl font-bold',
  HEADING_2XL_MB: 'text-2xl font-bold mb-4',
  HEADING_2XL_SEMIBOLD_MB: 'text-2xl font-semibold mb-4',
  HEADING_LG_SEMIBOLD_MB: 'text-lg font-semibold mb-3',
  TEXT_SM: 'text-sm',
  TEXT_SM_MEDIUM: 'text-sm font-medium',
  TEXT_XS: 'text-xs',
  FONT_MEDIUM: 'font-medium',
  FLEX_1: 'flex-1',
  CONTAINER_PAGE: 'container mx-auto px-4 py-8',
  INTERACTIVE_ITEM: 'px-4 py-3 border rounded-lg hover:bg-accent transition-colors text-left',
  LIST_DISC_SPACED: 'list-disc pl-6 space-y-2',
  CODE_BLOCK_HEADER:
    'flex items-center justify-between px-4 py-2.5 bg-code/40 border border-b-0 border-border/80 rounded-t-lg shadow-sm',
  CODE_BLOCK_PRE:
    'overflow-x-auto text-sm p-4 rounded-lg border border-border/80 bg-code/60 shadow-sm',
  CODE_BLOCK_FILENAME: 'text-sm font-mono text-foreground font-medium',
  CODE_BLOCK_COPY_BUTTON_FLOATING:
    'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_COPY_BUTTON_HEADER_FLOATING:
    'absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_TAB_CONTAINER: 'flex gap-2 overflow-x-auto scrollbar-hide border-b border-border/50',
  CODE_BLOCK_TAB_ACTIVE: 'text-primary border-primary',
  CODE_BLOCK_TAB_INACTIVE: 'text-muted-foreground border-transparent hover:text-foreground',
  CODE_BLOCK_GROUP_WRAPPER: 'relative group my-6',

  CARD_BADGE_CONTAINER: 'flex flex-wrap gap-1.5 md:gap-2 mb-4',
  CARD_FOOTER_RESPONSIVE: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
  CARD_METADATA_BADGES: 'flex items-center gap-1 text-xs flex-wrap md:flex-nowrap',
} as const;

/** Type-safe UI class constant keys */
export type UIClassKey = keyof typeof UI_CLASSES;

/** Card behavior configuration keys */
export type CardBehaviorKey = 'default' | 'code' | 'link';

/** Badge color constants for categories */
const CATEGORY_BADGE_COLORS = {
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

/** Card behavior configuration (copy vs link actions) */
export const CARD_BEHAVIORS = {
  default: {
    primaryAction: 'copy' as const,
    showCopyButton: true,
    showBookmark: true,
    showViewCount: true,
    showCopyCount: true,
    showRating: false,
  },
  code: {
    primaryAction: 'copy' as const,
    showCopyButton: true,
    showBookmark: true,
    showViewCount: true,
    showCopyCount: true,
    showRating: false,
  },
  link: {
    primaryAction: 'link' as const,
    showCopyButton: false,
    showBookmark: true,
    showViewCount: true,
    showCopyCount: false,
    showRating: true,
  },
} as const;

export const BADGE_COLORS = {
  jobType: {
    'full-time': 'bg-green-500/10 text-green-400 border-green-500/20',
    'part-time': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    contract: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    freelance: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    remote: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },

  difficulty: {
    beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
  },

  collectionType: {
    'starter-kit': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    workflow: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'advanced-system': 'bg-red-500/10 text-red-400 border-red-500/20',
    'use-case': 'bg-green-500/10 text-green-400 border-green-500/20',
  },

  changelogCategory: {
    Added: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    Changed: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    Deprecated: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    Removed: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    Fixed: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    Security: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  },

  status: {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },

  category: CATEGORY_BADGE_COLORS,

  submissionStatus: {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    merged: 'bg-green-500/10 text-green-400 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  },

  jobStatus: {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
} as const;

/** Type-safe badge color keys */
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
