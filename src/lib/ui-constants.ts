/**
 * UI Constants - Single Source of Truth for Design System
 *
 * This file contains all design system constants organized by category.
 * Import what you need: import { UI_CLASSES, DIMENSIONS, STATE_PATTERNS } from '@/src/lib/ui-constants'
 *
 * Organization:
 * - SECTION 1: VISUAL STYLING (UI_CLASSES) - Spacing, typography, layout, cards, badges
 * - SECTION 2: DIMENSIONS - Heights, widths, max/min constraints
 * - SECTION 3: STATE PATTERNS - Hover, focus, active, disabled states
 * - SECTION 4: RESPONSIVE PATTERNS - Responsive text, padding, grids
 * - SECTION 5: POSITION PATTERNS - Absolute, fixed, sticky positioning
 * - SECTION 6: ANIMATION CONSTANTS - Motion.dev springs, durations, easing
 * - SECTION 7: BREAKPOINTS & VIEWPORTS - Standard breakpoints, container queries
 * - SECTION 8: BADGE COLORS - Category, status, difficulty badges
 *
 * Color System:
 * - Semantic colors (success, warning, error, info): @/src/lib/semantic-colors
 * - Category badge colors: BADGE_COLORS.category (below)
 * - Status/type-specific colors: BADGE_COLORS.jobType, difficulty, etc. (below)
 */

import { BookOpen, Code, HelpCircle, Layers, Sparkles, Terminal, Webhook } from '@/src/lib/icons';

// ==========================================
// SECTION 1: VISUAL STYLING (UI_CLASSES)
// ==========================================

/**
 * UI_CLASSES - Centralized className patterns for consistent UI
 *
 * USAGE GUIDELINES:
 *
 * SPACING SCALE (286+ gap usages, 471+ mb usages, 205+ px usages):
 * Gaps (flex/grid layouts):
 * - SPACE_MICRO (gap-0.5): Ultra-tight spacing (4 usages)
 * - SPACE_TIGHT (gap-1): Compact badge groups, inline icons (24 usages)
 * - SPACE_COMPACT (gap-2): Card metadata, button groups (90 usages)
 * - SPACE_DEFAULT (gap-3): Standard card sections (51 usages)
 * - SPACE_COMFORTABLE (gap-4): Between major sections (79 usages)
 * - SPACE_RELAXED (gap-6): Between content blocks (18 usages)
 * - SPACE_LOOSE (gap-8): Between major page sections (9 usages)
 *
 * Padding (containers/components):
 * - PADDING_MICRO (p-1): Ultra-compact elements (9 usages)
 * - PADDING_TIGHT (p-2): Compact elements (16 usages)
 * - PADDING_COMPACT (p-3): Badges, small cards (22 usages)
 * - PADDING_DEFAULT (p-4): Standard containers (52 usages)
 * - PADDING_COMFORTABLE (p-6): Cards, panels (28 usages)
 * - PADDING_RELAXED (p-8): Major sections (9 usages)
 *
 * Margin Bottom (element separation):
 * - MARGIN_TIGHT (mb-2): Compact separation (79 usages)
 * - MARGIN_COMPACT (mb-3): Between related elements (29 usages)
 * - MARGIN_DEFAULT (mb-4): Standard element spacing (176 usages)
 * - MARGIN_COMFORTABLE (mb-6): Between sections (71 usages)
 * - MARGIN_RELAXED (mb-8): Major section breaks (78 usages)
 * - MARGIN_SECTION (mb-12): Section boundaries (8 usages)
 * - MARGIN_HERO (mb-16): Hero/major page sections (13 usages)
 *
 * ICONS (271+ inline usages):
 * - ICON_XS (h-3 w-3): Badge icons, inline indicators
 * - ICON_SM (h-4 w-4): Button icons, card metadata (most common)
 * - ICON_MD (h-5 w-5): Card headers, section icons
 * - ICON_XS_LEADING (h-3 w-3 mr-1): Small icon + text
 * - ICON_SM_LEADING (h-4 w-4 mr-2): Medium icon + text
 * - ICON_BUTTON_SM (h-7 w-7 p-0): Icon-only buttons (17+ usages)
 *
 * CARD PADDING (20+ components):
 * - CARD_PADDING_DEFAULT (p-6): Detail pages
 * - CARD_PADDING_COMPACT (p-4): Grid layouts
 * - CARD_PADDING_TIGHT (p-3): Dense/mobile layouts
 * - CARD_HEADER_* / CARD_CONTENT_*: Header/content spacing
 *
 * TYPOGRAPHY (15+ patterns):
 * - TEXT_CARD_TITLE: All card titles
 * - TEXT_CARD_DESCRIPTION: Card descriptions
 * - TEXT_METADATA: Timestamps, secondary info
 * - TEXT_BADGE: Badge text
 * - TEXT_BADGE_SMALL: Compact badges (NEW badge)
 *
 * BADGES (35+ inline usages):
 * - BADGE_BASE: Complete badge structure
 * - BADGE_PADDING: Standard badge padding (px-2.5 py-0.5)
 * - BADGE_PADDING_COMPACT: Compact badges (px-1.5 py-0.5)
 * - BADGE_FEATURED: Featured content gradient
 * - BADGE_METADATA: Metadata badge colors
 *
 * ANIMATIONS (MOTION.DEV vs CSS):
 * - Motion.dev: Component-level interactions (cards, buttons, badges)
 * - CSS: Global micro-interactions (focus rings, link underlines, smooth scrolling)
 * - NEVER BOTH: A single element should NEVER have both Motion.dev AND CSS animations for the same property
 *
 * Motion.dev Usage (whileHover/whileTap):
 * - BaseCard: whileHover y:-2 (0.2s ease) + whileTap y:0 (0.15s ease)
 * - UnifiedBadge: whileHover y:-2 (spring 400/17) + whileTap scale:0.95
 * - Button: whileHover scale:1.02 + whileTap scale:0.98 (spring 400/17)
 * - FAB buttons: whileHover scale:1.1 + whileTap scale:0.9 (spring 400/17)
 *
 * CSS Usage (src/app/micro-interactions.css):
 * - .hover-lift: Interactive preview cards only (NOT static section cards)
 * - Link underlines: Animated ::after pseudo-element
 * - Focus rings: 2px solid ring color with offset
 * - Touch feedback: Mobile active states (scale 0.98, opacity 0.7)
 */
export const UI_CLASSES = {
  // ----- Spacing Scale -----
  SPACE_MICRO: 'gap-0.5',
  SPACE_TIGHT: 'gap-1',
  SPACE_COMPACT: 'gap-2',
  SPACE_DEFAULT: 'gap-3',
  SPACE_COMFORTABLE: 'gap-4',
  SPACE_RELAXED: 'gap-6',
  SPACE_LOOSE: 'gap-8',

  PADDING_MICRO: 'p-1',
  PADDING_TIGHT: 'p-2',
  PADDING_COMPACT: 'p-3',
  PADDING_DEFAULT: 'p-4',
  PADDING_COMFORTABLE: 'p-6',
  PADDING_RELAXED: 'p-8',

  PADDING_X_TIGHT: 'px-2',
  PADDING_X_COMPACT: 'px-3',
  PADDING_X_DEFAULT: 'px-4',
  PADDING_X_COMFORTABLE: 'px-6',
  PADDING_X_RELAXED: 'px-8',

  PADDING_Y_MICRO: 'py-0.5',
  PADDING_Y_TIGHT: 'py-1',
  PADDING_Y_COMPACT: 'py-2',
  PADDING_Y_DEFAULT: 'py-4',
  PADDING_Y_COMFORTABLE: 'py-6',
  PADDING_Y_RELAXED: 'py-8',
  PADDING_Y_SECTION: 'py-12',

  MARGIN_TOP_ZERO: 'mt-0',
  MARGIN_TOP_MICRO: 'mt-0.5',
  MARGIN_TOP_TIGHT: 'mt-1',
  MARGIN_TOP_COMPACT: 'mt-2',
  MARGIN_TOP_DEFAULT: 'mt-4',
  MARGIN_TOP_COMFORTABLE: 'mt-6',
  MARGIN_TOP_RELAXED: 'mt-8',

  MARGIN_RIGHT_MICRO: 'mr-0.5',
  MARGIN_RIGHT_TIGHT: 'mr-1',
  MARGIN_RIGHT_COMPACT: 'mr-2',
  MARGIN_RIGHT_DEFAULT: 'mr-4',

  MARGIN_LEFT_MICRO: 'ml-0.5',
  MARGIN_LEFT_TIGHT: 'ml-1',
  MARGIN_LEFT_COMPACT: 'ml-2',

  MARGIN_Y_RELAXED: 'my-8',

  MARGIN_MICRO: 'mb-1',
  MARGIN_TIGHT: 'mb-2',
  MARGIN_COMPACT: 'mb-3',
  MARGIN_DEFAULT: 'mb-4',
  MARGIN_COMFORTABLE: 'mb-6',
  MARGIN_RELAXED: 'mb-8',
  MARGIN_SECTION: 'mb-12',
  MARGIN_HERO: 'mb-16',

  // ----- Layout Patterns -----
  // Flex column layouts with gaps
  FLEX_COL_GAP_1: 'flex flex-col gap-1',
  FLEX_COL_GAP_2: 'flex flex-col gap-2',
  FLEX_COL_GAP_3: 'flex flex-col gap-3',
  FLEX_COL_GAP_4: 'flex flex-col gap-4',
  FLEX_COL_GAP_6: 'flex flex-col gap-6',
  FLEX_COL_SPACE_Y_2: 'flex flex-col space-y-2',
  FLEX_COL_SPACE_Y_4: 'flex flex-col space-y-4',
  FLEX_COL_SPACE_Y_6: 'flex flex-col space-y-6',

  // Flex row layouts with items-center (most common pattern)
  FLEX_ITEMS_CENTER: 'flex items-center',
  FLEX_ITEMS_CENTER_GAP_0_5: 'flex items-center gap-0.5',
  FLEX_ITEMS_CENTER_GAP_1_5: 'flex items-center gap-1.5',
  FLEX_ITEMS_CENTER_GAP_4: 'flex items-center gap-4',

  // Flex with justify patterns
  FLEX_ITEMS_CENTER_JUSTIFY_CENTER: 'flex items-center justify-center',
  FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2: 'flex items-center justify-center gap-2',
  FLEX_ITEMS_START_JUSTIFY_CENTER: 'flex items-start justify-center',
  FLEX_JUSTIFY_CENTER: 'flex justify-center',

  // Flex-shrink patterns (prevent icon/avatar collapse)
  FLEX_SHRINK_0: 'flex-shrink-0',
  FLEX_ITEMS_CENTER_FLEX_SHRINK_0: 'flex items-center flex-shrink-0',

  // Icon/Avatar wrapper patterns
  FLEX_ICON_WRAPPER_SM: 'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md',
  FLEX_ICON_WRAPPER_MD: 'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
  FLEX_ICON_WRAPPER_LG: 'flex h-10 w-10 items-center justify-center rounded-full',

  // Responsive grid layouts
  GRID_COLS_1_MD_2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
  GRID_COLS_1_MD_2_LG_3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  GRID_COLS_1_MD_2_LG_4: 'grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:grid-cols-4',
  GRID_COLS_1_SM_2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  GRID_COLS_1_SM_2_LG_3: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  GRID_COLS_1_SM_2_LG_3_XL_6: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  GRID_COLS_2_GAP_2: 'grid grid-cols-2 gap-2',
  GRID_COLS_2_GAP_3: 'grid grid-cols-2 gap-3',
  GRID_COLS_2_GAP_4: 'grid grid-cols-2 gap-4',
  GRID_COLS_2_LG_4: 'grid grid-cols-2 lg:grid-cols-4 gap-4',
  GRID_COLS_3_GAP_2: 'grid grid-cols-3 gap-2',
  GRID_COLS_3_GAP_4: 'grid grid-cols-3 gap-4',
  GRID_COLS_1_GAP_4_SM_2_MD_6_LG_3: 'grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3',
  GRID_COLS_1_GAP_6: 'grid grid-cols-1 gap-6',
  GRID_COLS_1_GAP_8_LG_3: 'grid grid-cols-1 gap-8 lg:grid-cols-3',

  // Flex wrap patterns
  FLEX_WRAP_ITEMS_CENTER_GAP_2: 'flex flex-wrap items-center gap-2',
  FLEX_WRAP_ITEMS_CENTER_GAP_3: 'flex flex-wrap items-center gap-3',
  FLEX_WRAP_ITEMS_CENTER_JUSTIFY_CENTER_GAP_3: 'flex flex-wrap items-center justify-center gap-3',

  // Responsive flex direction (column to row)
  FLEX_COL_SM_ROW_ITEMS_CENTER: 'flex flex-col items-start sm:flex-row sm:items-center',
  FLEX_COL_SM_ROW_ITEMS_CENTER_JUSTIFY_BETWEEN:
    'flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center',
  FLEX_COL_MD_ITEMS_START: 'flex flex-col items-center gap-4 md:items-start',

  // Min-width flex patterns (prevent collapse)
  FLEX_MIN_W_0_FLEX_1_COL_ITEMS_START_GAP_0_5: 'flex min-w-0 flex-1 flex-col items-start gap-0.5',
  FLEX_W_FULL_ITEMS_CENTER_GAP_1_5: 'flex w-full items-center gap-1.5',

  // Interactive nav/menu item patterns
  FLEX_INTERACTIVE_NAV_ITEM:
    'group flex items-center gap-2 rounded-md px-3 py-2.5 no-underline transition-colors hover:bg-accent/10',
  FLEX_INTERACTIVE_MENU_ITEM:
    'group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 no-underline transition-colors hover:bg-white/5',
  FLEX_INTERACTIVE_LIST_ITEM:
    'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50',
  FLEX_INTERACTIVE_CARD_ROW:
    'flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/5',

  // Centered empty states
  FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_EMPTY:
    'flex flex-col items-center justify-center p-8 text-center',
  FLEX_ITEMS_CENTER_JUSTIFY_CENTER_EMPTY: 'flex items-center justify-center py-12',
  FLEX_ITEMS_CENTER_JUSTIFY_CENTER_EMPTY_SM: 'flex items-center justify-center py-8',

  // Code block patterns (used in production-code-block)
  CODE_BLOCK_BUTTON_BASE:
    'flex items-center justify-center rounded-md bg-code/95 p-1.5 shadow-md backdrop-blur-md transition-colors hover:bg-code',
  CODE_BLOCK_BUTTON_ICON:
    'flex items-center justify-center rounded-md bg-code/95 p-1.5 text-muted-foreground shadow-md backdrop-blur-md transition-colors hover:bg-code hover:text-foreground',
  CODE_BLOCK_SOCIAL_ICON_WRAPPER: 'flex h-5 w-5 items-center justify-center rounded-full',

  // ----- Spacing Patterns -----
  CONTAINER_PADDING_SM: 'px-4 py-2',
  CONTAINER_PADDING_MD: 'px-6 py-3',
  CONTAINER_PADDING_LG: 'px-8 py-4',
  CONTAINER_PADDING_XL: 'px-12 py-6',

  SECTION_SPACING_TIGHT: 'mb-8',
  SECTION_SPACING_DEFAULT: 'mb-12',
  SECTION_SPACING_RELAXED: 'mb-16',
  SECTION_SPACING_HERO: 'mb-20',

  CARD_HEADER_SPACING: 'px-6 py-4',
  CARD_BODY_SPACING: 'px-6 py-6',
  CARD_FOOTER_SPACING: 'px-6 py-3 border-t border-border',

  FORM_FIELD_SPACING: 'space-y-2',
  FORM_SECTION_SPACING: 'space-y-6',
  FORM_GROUP_SPACING: 'space-y-4',

  // ----- Typography Patterns -----
  HEADING_H1: 'text-4xl font-bold tracking-tight',
  HEADING_H2: 'text-3xl font-semibold tracking-tight',
  HEADING_H3: 'text-2xl font-semibold',
  HEADING_H4: 'text-xl font-semibold',
  HEADING_H5: 'text-lg font-semibold',
  HEADING_H6: 'text-base font-semibold',

  TEXT_BODY_LG: 'text-lg leading-relaxed',
  TEXT_BODY_DEFAULT: 'text-base leading-normal',
  TEXT_BODY_SM: 'text-sm leading-normal',
  TEXT_BODY_XS: 'text-xs leading-normal',

  TEXT_LABEL: 'text-sm font-medium text-foreground',
  TEXT_LABEL_SM: 'text-sm font-medium',
  TEXT_HELPER: 'text-xs text-muted-foreground',
  TEXT_ERROR: 'text-sm text-red-500',
  TEXT_SUCCESS: 'text-sm text-green-500',

  // Stats/Metric Display
  TEXT_STAT_VALUE: 'font-bold text-2xl',
  TEXT_STAT_LARGE: 'font-bold text-3xl',

  // Pricing/Numbers
  TEXT_PRICE_PRIMARY: 'font-bold text-3xl',
  TEXT_PRICE_STRIKETHROUGH: 'font-bold text-xl line-through text-muted-foreground',

  // ----- Cards -----
  CARD_INTERACTIVE:
    'card-gradient transition-smooth group cursor-pointer border-border/50 hover:border-accent/20',
  CARD_GRADIENT_HOVER: 'card-gradient transition-smooth group',

  CARD_PADDING_DEFAULT: 'p-6',
  CARD_PADDING_COMPACT: 'p-4',
  CARD_PADDING_TIGHT: 'p-3',
  CARD_HEADER_DEFAULT: 'pb-4',
  CARD_HEADER_COMPACT: 'pb-3',
  CARD_HEADER_TIGHT: 'pb-2',
  CARD_CONTENT_DEFAULT: 'pt-0',

  CARD_BADGE_CONTAINER: 'flex flex-wrap gap-1.5 md:gap-2 mb-4',
  CARD_FOOTER_RESPONSIVE: 'flex flex-col gap-2 md:flex-row md:items-center md:justify-between',
  CARD_METADATA_BADGES: 'flex items-center gap-2 text-xs flex-nowrap',
  CARD_ACTIONS_CONTAINER: 'flex items-center gap-2 text-xs flex-nowrap',

  // ----- Buttons -----
  BUTTON_PRIMARY_LARGE:
    'flex items-center w-full px-6 py-6 text-lg font-semibold rounded-2xl bg-card border border-border hover:bg-accent/10 hover:border-accent/50 active:scale-[0.97] transition-all duration-200',
  BUTTON_SECONDARY_MEDIUM:
    'flex items-center w-full px-6 py-5 text-base font-medium text-muted-foreground rounded-xl bg-card/50 border border-border/40 hover:bg-accent/5 hover:text-foreground hover:border-accent/30 transition-all duration-200 active:scale-[0.98]',
  BUTTON_GHOST_ICON: 'hover:bg-accent/10 hover:text-accent',
  BUTTON_ICON_TEXT_SM: 'h-7 px-2 text-xs gap-1',

  // ----- Badges -----
  BADGE_BASE:
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  BADGE_PADDING: 'px-2.5 py-0.5',
  BADGE_PADDING_COMPACT: 'px-1.5 py-0.5',
  BADGE_CONTAINER: 'flex flex-wrap gap-2 mb-4',
  BADGE_METADATA_CONTAINER: 'flex items-center gap-2 text-xs flex-nowrap',

  BADGE_FEATURED:
    'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-600 dark:text-amber-400',
  BADGE_METADATA: 'border-muted-foreground/20 text-muted-foreground',

  // ----- Featured Job Styling -----
  JOB_FEATURED_BORDER: 'border-2 border-orange-500/50',
  JOB_FEATURED_GRADIENT: 'bg-gradient-to-br from-orange-500/5 to-orange-600/10',
  JOB_FEATURED_BADGE: 'bg-orange-500 text-white border-orange-500',
  JOB_FEATURED_GLOW: 'shadow-lg shadow-orange-500/10',

  // ----- Grids -----
  GRID_RESPONSIVE_3: 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  GRID_RESPONSIVE_3_TIGHT: 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  GRID_RESPONSIVE_4: 'grid gap-6 md:grid-cols-2 lg:grid-cols-4',
  GRID_RESPONSIVE_LIST: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3 list-none',

  // ----- Typography (Legacy) -----
  TEXT_HEADING_HERO: 'text-4xl lg:text-6xl font-bold mb-6 text-foreground',
  TEXT_HEADING_LARGE: 'text-xl text-muted-foreground mb-8 leading-relaxed',
  TEXT_HEADING_MEDIUM: 'text-lg text-muted-foreground mb-8 leading-relaxed',
  TEXT_HEADING_PAGE: 'text-2xl font-bold mb-4',
  TEXT_HEADING_SECTION: 'text-xl font-semibold mb-3',

  TEXT_CARD_TITLE: 'text-lg font-semibold',
  TEXT_CARD_DESCRIPTION: 'text-sm text-muted-foreground',
  TEXT_BADGE: 'text-xs font-semibold',
  TEXT_BADGE_SMALL: 'text-[10px] font-semibold uppercase tracking-wider',
  TEXT_METADATA: 'text-xs text-muted-foreground',
  TEXT_BODY: 'text-sm',

  // ----- Containers (Legacy) -----
  CONTAINER_CARD_MUTED: 'text-center py-12 bg-card/50 rounded-xl border border-border/50',
  CONTAINER_OVERFLOW_BORDER: 'relative overflow-hidden border-b border-border/50 bg-card/30',
  FLEX_ITEMS_CENTER_GAP_1: 'flex items-center gap-1',
  FLEX_ITEMS_CENTER_GAP_2: 'flex items-center gap-2',
  FLEX_ITEMS_CENTER_GAP_3: 'flex items-center gap-3',
  FLEX_ITEMS_CENTER_GAP_6: 'flex items-center gap-6',
  FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN: 'flex items-center justify-between',
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
  FLEX_SHRINK_0_MT_0_5: 'flex-shrink-0 mt-0.5',
  TEXT_XS_MUTED: 'text-xs text-muted-foreground',
  TEXT_SM_MUTED: 'text-sm text-muted-foreground',
  TEXT_MUTED: 'text-muted-foreground',
  TEXT_NAV: 'text-foreground/80 hover:text-foreground',
  SPACE_Y_1: 'space-y-1',
  SPACE_Y_2: 'space-y-2',
  SPACE_Y_3: 'space-y-3',
  SPACE_Y_4: 'space-y-4',
  SPACE_Y_6: 'space-y-6',
  SPACE_Y_8: 'space-y-8',
  SPACE_X_2: 'space-x-2',
  SPACE_X_4: 'space-x-4',
  MB_1: 'mb-1',
  MB_2: 'mb-2',
  MB_4: 'mb-4',
  MB_6: 'mb-6',
  MB_8: 'mb-8',

  // ----- Icons -----
  ICON_XS: 'h-3 w-3',
  ICON_XS_HALF: 'h-3.5 w-3.5',
  ICON_SM: 'h-4 w-4',
  ICON_MD: 'h-5 w-5',
  ICON_LG: 'h-6 w-6',
  ICON_XL: 'h-8 w-8',
  ICON_INDICATOR: 'h-2 w-2',

  ICON_XS_LEADING: 'h-3 w-3 mr-1',
  ICON_SM_LEADING: 'h-4 w-4 mr-2',
  ICON_MD_LEADING: 'h-5 w-5 mr-2',

  ICON_BUTTON_SM: 'h-7 w-7 p-0',
  ICON_BUTTON_MD: 'h-9 w-9 p-0',

  // ----- Semantic Icon Colors -----
  ICON_SUCCESS: 'text-green-500 dark:text-green-400',
  ICON_WARNING: 'text-yellow-500 dark:text-yellow-400',
  ICON_ERROR: 'text-red-500 dark:text-red-400',
  ICON_INFO: 'text-blue-500 dark:text-blue-400',
  ICON_NEUTRAL: 'text-gray-500 dark:text-gray-400',

  // ----- Link Patterns -----
  LINK_NAV_UNDERLINE: 'group relative inline-block',
  LINK_NAV_UNDERLINE_SPAN:
    'absolute bottom-0 left-0 h-[2px] bg-accent transition-all duration-300 w-0 group-hover:w-full',
  LINK_ACCENT: 'text-accent hover:text-accent-hover transition-colors duration-200',
  LINK_MUTED: 'text-muted-foreground hover:text-foreground transition-colors duration-200',
  LINK_PRIMARY: 'text-primary hover:text-primary-hover transition-colors duration-200',

  // ----- Status Badge Colors -----
  STATUS_PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  STATUS_APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
  STATUS_REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
  STATUS_DRAFT: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  STATUS_PUBLISHED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  STATUS_WARNING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  STATUS_PREMIUM: 'bg-purple-500/10 text-purple-400 border-purple-500/20',

  // ----- Score/Severity Colors -----
  SCORE_EXCELLENT: 'text-green-600 dark:text-green-400',
  SCORE_GOOD: 'text-blue-600 dark:text-blue-400',
  SCORE_FAIR: 'text-yellow-600 dark:text-yellow-400',
  SCORE_POOR: 'text-red-600 dark:text-red-400',

  // ----- Card Hover Patterns -----
  CARD_HOVER_LIFT: 'transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
  CARD_HOVER_BORDER: 'border-2 transition-all hover:border-primary/50 hover:shadow-lg',
  CARD_HOVER_BG: 'transition-colors hover:bg-accent/5',
  CARD_HOVER_SCALE: 'transition-transform hover:scale-[1.02]',

  // ----- Group Hover Patterns -----
  GROUP_HOVER_ACCENT: 'group-hover:text-accent',
  GROUP_HOVER_FOREGROUND: 'group-hover:text-foreground',
  GROUP_HOVER_UNDERLINE: 'group-hover:underline',
  GROUP_HOVER_SCALE: 'group-hover:scale-105',

  // ----- Code Block Patterns -----
  CODE_BLOCK_HEADER:
    'flex items-center justify-between px-4 py-2.5 bg-code/40 border border-b-0 border-border rounded-t-lg',
  CODE_BLOCK_PRE: 'overflow-x-auto text-sm p-4 rounded-lg border border-border bg-code/60',
  CODE_BLOCK_FILENAME: 'text-sm font-mono text-foreground font-medium',
  CODE_BLOCK_COPY_BUTTON_FLOATING:
    'absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_COPY_BUTTON_HEADER_FLOATING:
    'absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-code/30 rounded-md',
  CODE_BLOCK_TAB_CONTAINER: 'flex gap-2 overflow-x-auto scrollbar-hide border-b border-border/50',
  CODE_BLOCK_TAB_ACTIVE: 'text-primary border-primary',
  CODE_BLOCK_TAB_INACTIVE: 'text-muted-foreground border-transparent hover:text-foreground',
  CODE_BLOCK_GROUP_WRAPPER: 'relative group my-6',

  // ----- Legacy (Backwards Compatibility) -----
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
  INPUT_HIDDEN: 'hidden',
  UPLOAD_ZONE:
    'flex h-32 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-muted-foreground/25 border-dashed bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted',
} as const;

// ==========================================
// SECTION 2: DIMENSIONS
// ==========================================

/**
 * DIMENSIONS - Height, width, min/max constraints
 *
 * Use these constants for consistent sizing across the app.
 * - Viewport heights: Full screen, full viewport
 * - Interactive element heights: Buttons, inputs, textareas
 * - Dividers & underlines: Horizontal lines
 * - Container widths: Dropdowns, sidebars, mega menus
 * - Min widths: Prevent elements from collapsing
 * - Max heights: Modals, popovers, scrollable containers
 * - Max widths: Content containers, responsive layouts
 */
export const DIMENSIONS = {
  // ----- Viewport Heights -----
  FULL_VIEWPORT: 'h-[100dvh]',
  FULL_SCREEN: 'h-screen',

  // ----- Interactive Element Heights -----
  BUTTON_LG: 'h-[52px]',
  BUTTON_MD: 'h-[40px]',
  BUTTON_SM: 'h-[36px]',

  // ----- Dividers & Underlines -----
  DIVIDER: 'h-[1px]',
  UNDERLINE: 'h-[2px]',
  SEPARATOR_SM: 'h-px',

  // ----- Form Input Heights -----
  INPUT_SM: 'min-h-[80px]',
  INPUT_MD: 'min-h-[100px]',
  INPUT_LG: 'min-h-[150px]',
  TEXTAREA_SM: 'min-h-[80px]',
  TEXTAREA_MD: 'min-h-[120px]',

  // ----- Container Widths -----
  DROPDOWN_SM: 'w-[280px]',
  DROPDOWN_MD: 'w-[380px]',
  DROPDOWN_LG: 'w-[480px]',
  DROPDOWN_XL: 'w-[560px]',
  MEGA_MENU: 'w-[560px]',
  SIDEBAR: 'w-[280px]',
  SIDEBAR_LG: 'w-[380px]',

  // ----- Min Widths -----
  MIN_W_BUTTON: 'min-w-[8rem]',
  MIN_W_BADGE: 'min-w-[1.5rem]',
  MIN_W_INPUT: 'min-w-[200px]',
  MIN_W_ICON_BUTTON_SM: 'min-w-[36px]',
  MIN_W_ICON_BUTTON_MD: 'min-w-[40px]',
  MIN_W_NEWSLETTER_FORM: 'min-w-[320px]',
  MIN_W_NEWSLETTER_FORM_LG: 'min-w-[360px]',
  MIN_W_NEWSLETTER_BUTTON: 'min-w-[140px]',

  // ----- Min Heights -----
  MIN_H_ICON_BUTTON_SM: 'min-h-[36px]',
  MIN_H_ICON_BUTTON_MD: 'min-h-[40px]',

  // ----- Max Heights (Modals, Popovers) -----
  MODAL_MAX: 'max-h-[80vh]',
  DROPDOWN_MAX: 'max-h-[300px]',
  SIDEBAR_MAX: 'max-h-[calc(100vh-6rem)]',
  POPOVER_MAX: 'max-h-[400px]',
  NOTIFICATION_MAX: 'max-h-[calc(80vh-8rem)]',

  // ----- Max Widths (Content Containers) -----
  CONTAINER_SM: 'max-w-md',
  CONTAINER_MD: 'max-w-2xl',
  CONTAINER_LG: 'max-w-4xl',
  CONTAINER_XL: 'max-w-7xl',
  TOOLTIP_MAX: 'max-w-[200px]',
  NEWSLETTER_FORM_MAX: 'max-w-[400px]',
} as const;

// ==========================================
// SECTION 3: STATE PATTERNS
// ==========================================

/**
 * STATE_PATTERNS - Hover, focus, active, disabled states
 *
 * Use these patterns for consistent interactive feedback.
 * - Hover states: Background, text, border changes
 * - Focus states: Keyboard navigation rings
 * - Active states: Click/tap feedback (scale)
 * - Disabled states: Opacity, cursor changes
 * - Combined states: Pre-composed interactive patterns
 */
export const STATE_PATTERNS = {
  // ----- Hover States -----
  HOVER_BG_SUBTLE: 'hover:bg-accent/5',
  HOVER_BG_DEFAULT: 'hover:bg-accent/10',
  HOVER_BG_STRONG: 'hover:bg-accent/20',
  HOVER_TEXT_ACCENT: 'hover:text-accent',
  HOVER_TEXT_FOREGROUND: 'hover:text-foreground',
  HOVER_BORDER_ACCENT: 'hover:border-accent/50',

  // ----- Focus States -----
  FOCUS_RING:
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  FOCUS_RING_ACCENT: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
  FOCUS_RING_OFFSET: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  FOCUS_OUTLINE: 'focus:outline-none focus:ring-2 focus:ring-accent',

  // ----- Active States -----
  ACTIVE_SCALE_DOWN: 'active:scale-[0.98]',
  ACTIVE_SCALE_DOWN_SM: 'active:scale-[0.99]',
  ACTIVE_SCALE_UP: 'active:scale-[1.02]',

  // ----- Disabled States -----
  DISABLED_STANDARD: 'disabled:opacity-50 disabled:pointer-events-none',
  DISABLED_CURSOR: 'disabled:opacity-50 disabled:cursor-not-allowed',
  DISABLED_OPACITY: 'disabled:opacity-40',

  // ----- Combined Interactive States -----
  INTERACTIVE_DEFAULT:
    'hover:bg-accent/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  INTERACTIVE_BUTTON:
    'hover:bg-accent/90 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
  INTERACTIVE_CARD: 'hover:bg-accent/5 active:scale-[0.99] transition-colors',
  INTERACTIVE_LINK: 'hover:text-accent active:text-accent-hover focus-visible:underline',
} as const;

// ==========================================
// SECTION 4: RESPONSIVE PATTERNS
// ==========================================

/**
 * RESPONSIVE_PATTERNS - Mobile-first responsive utilities
 *
 * Use these patterns for consistent responsive behavior.
 * - Responsive text sizing: Scale typography across breakpoints
 * - Responsive padding: Adjust spacing for different viewports
 * - Responsive spacing: Gap adjustments
 * - Responsive flex direction: Column to row layouts
 * - Responsive grid columns: 1 → 2 → 3 → 4 columns
 */
export const RESPONSIVE_PATTERNS = {
  // ----- Responsive Text Sizing -----
  TEXT_RESPONSIVE_SM: 'text-sm sm:text-sm md:text-base',
  TEXT_RESPONSIVE_MD: 'text-base sm:text-base md:text-lg',
  TEXT_RESPONSIVE_LG: 'text-lg sm:text-lg md:text-xl lg:text-2xl',
  TEXT_RESPONSIVE_XL: 'text-xl sm:text-xl md:text-2xl lg:text-3xl',
  TEXT_RESPONSIVE_2XL: 'text-2xl sm:text-2xl md:text-3xl lg:text-4xl',

  // ----- Responsive Padding -----
  PADDING_RESPONSIVE_SM: 'px-4 sm:px-4 md:px-6',
  PADDING_RESPONSIVE_MD: 'px-4 sm:px-6 md:px-8',
  PADDING_RESPONSIVE_LG: 'px-6 sm:px-8 md:px-12',
  PADDING_RESPONSIVE_XL: 'px-8 sm:px-12 md:px-16',

  // ----- Responsive Spacing -----
  SPACING_RESPONSIVE_SM: 'gap-2 sm:gap-3 md:gap-4',
  SPACING_RESPONSIVE_MD: 'gap-3 sm:gap-4 md:gap-6',
  SPACING_RESPONSIVE_LG: 'gap-4 sm:gap-6 md:gap-8',

  // ----- Responsive Flex Direction -----
  FLEX_COL_SM_ROW: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
  FLEX_COL_MD_ROW: 'flex flex-col md:flex-row gap-3 md:gap-6',
  FLEX_COL_LG_ROW: 'flex flex-col lg:flex-row gap-4 lg:gap-8',

  // ----- Responsive Grid Columns -----
  GRID_RESPONSIVE_1_2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  GRID_RESPONSIVE_1_2_3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
  GRID_RESPONSIVE_1_2_4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4',
  GRID_RESPONSIVE_2_3_4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
  GRID_RESPONSIVE_1_3: 'grid grid-cols-1 md:grid-cols-3 gap-6',
} as const;

// ==========================================
// SECTION 5: POSITION PATTERNS
// ==========================================

/**
 * POSITION_PATTERNS - Absolute, fixed, sticky positioning
 *
 * Use these patterns for consistent element positioning.
 * - Absolute positioning: Top, bottom, left, right corners, center
 * - Fixed positioning: Full-width bars, floating action buttons
 * - Sticky positioning: Headers, navigation, sidebars
 */
export const POSITION_PATTERNS = {
  // ----- Absolute Positioning -----
  ABSOLUTE_TOP_RIGHT: 'absolute top-0 right-0',
  ABSOLUTE_TOP_RIGHT_OFFSET: 'absolute top-2 right-2',
  ABSOLUTE_TOP_RIGHT_OFFSET_LG: 'absolute top-3 right-3',
  ABSOLUTE_TOP_RIGHT_OFFSET_XL: 'absolute top-4 right-4',
  ABSOLUTE_TOP_LEFT: 'absolute top-0 left-0',
  ABSOLUTE_TOP_LEFT_OFFSET: 'absolute top-2 left-2',
  ABSOLUTE_TOP_LEFT_OFFSET_XL: 'absolute top-4 left-4',
  ABSOLUTE_TOP_FULL: 'absolute top-0 right-0 left-0',
  ABSOLUTE_BOTTOM_LEFT: 'absolute bottom-0 left-0',
  ABSOLUTE_BOTTOM_RIGHT: 'absolute bottom-0 right-0',
  ABSOLUTE_BOTTOM_RIGHT_OFFSET: 'absolute bottom-4 right-4',
  ABSOLUTE_BOTTOM_FULL: 'absolute right-0 bottom-0 left-0',
  ABSOLUTE_TOP_HALF: 'absolute top-1/2',
  ABSOLUTE_TOP_HALF_LEFT: 'absolute top-1/2 left-3',
  ABSOLUTE_TOP_HALF_RIGHT: 'absolute top-1/2 right-3',
  ABSOLUTE_TOP_HALF_CENTERED_LEFT: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  ABSOLUTE_CENTER: 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  ABSOLUTE_CENTER_Y: 'absolute top-1/2 -translate-y-1/2',
  ABSOLUTE_INSET: 'absolute inset-0',
  ABSOLUTE_INSET_Y: 'absolute inset-y-0',
  ABSOLUTE_INSET_Y_LEFT: 'absolute inset-y-0 left-0',
  ABSOLUTE_INSET_Y_RIGHT: 'absolute inset-y-0 right-0',
  ABSOLUTE_TOP_BADGE: 'absolute -top-1 -right-1',
  ABSOLUTE_LEFT_ICON: 'absolute left-2',

  // ----- Fixed Positioning -----
  FIXED_TOP_FULL: 'fixed top-0 left-0 right-0',
  FIXED_BOTTOM_FULL: 'fixed bottom-0 left-0 right-0',
  FIXED_BOTTOM_FULL_RESPONSIVE: 'fixed right-0 bottom-0 left-0',
  FIXED_BOTTOM_RIGHT: 'fixed bottom-4 right-4',
  FIXED_BOTTOM_RIGHT_LG: 'fixed bottom-6 right-6',
  FIXED_BOTTOM_RIGHT_RESPONSIVE: 'fixed right-6 bottom-6',
  FIXED_BOTTOM_LEFT: 'fixed bottom-4 left-4',
  FIXED_TOP_RIGHT: 'fixed top-4 right-4',
  FIXED_TOP_RIGHT_RESPONSIVE: 'fixed top-20 right-6',
  FIXED_INSET: 'fixed inset-0',
  FIXED_CENTER: 'fixed top-[50%] left-[50%]',

  // ----- Sticky Positioning -----
  STICKY_TOP: 'sticky top-0 z-10',
  STICKY_TOP_NAV: 'sticky top-20 z-10',
  STICKY_TOP_4: 'sticky top-4',
  STICKY_BOTTOM: 'sticky bottom-0 z-10',
} as const;

// ==========================================
// SECTION 6: ANIMATION CONSTANTS
// ==========================================

/**
 * ANIMATION_CONSTANTS - Standardized Motion.dev animation timings and spring configs
 *
 * USAGE GUIDELINES:
 *
 * WHEN TO USE MOTION.DEV:
 * - Component-level interactions (card hover, button tap, badge hover)
 * - Element-specific physics (spring animations for natural feel)
 * - State-driven animations (loading, success, error states)
 * - Gesture-based interactions (swipe, drag, pan)
 *
 * WHEN TO USE CSS:
 * - Global micro-interactions (focus rings, link underlines)
 * - Theme transitions (dark mode toggle)
 * - Reduced motion fallbacks
 * - Performance-critical animations (GPU-accelerated transforms)
 *
 * NEVER MIX BOTH:
 * - A single element should NEVER have Motion.dev whileHover AND CSS hover:transform
 * - Choose one approach per animation property to avoid conflicts
 * - Example conflict: BaseCard had both whileHover y:-2 AND .hover-lift CSS translateY
 *
 * SPRING PHYSICS EXPLAINED:
 * - stiffness: How quickly the animation responds (higher = snappier)
 * - damping: How much the animation bounces (higher = less bouncy)
 * - Default (400/17): Responsive with subtle bounce (cards, badges)
 * - Bouncy (500/20): More pronounced bounce (FAB buttons, notifications)
 * - Smooth (300/25): Minimal bounce, smooth motion (dialogs, sheets)
 *
 * @example
 * ```tsx
 * // Card hover animation
 * <motion.div
 *   whileHover={{
 *     y: -2,
 *     transition: { duration: ANIMATION_DURATION_DEFAULT, ease: ANIMATION_EASE_DEFAULT }
 *   }}
 *   whileTap={{
 *     y: 0,
 *     transition: { duration: ANIMATION_DURATION_FAST, ease: ANIMATION_EASE_DEFAULT }
 *   }}
 * >
 *   <Card />
 * </motion.div>
 *
 * // Badge hover animation
 * <motion.div
 *   whileHover={{
 *     y: -2,
 *     transition: ANIMATION_SPRING_DEFAULT
 *   }}
 *   whileTap={{ scale: 0.95 }}
 * >
 *   <Badge />
 * </motion.div>
 *
 * // Button hover animation
 * <motion.div
 *   whileHover={{ scale: 1.02 }}
 *   whileTap={{ scale: 0.98 }}
 *   transition={ANIMATION_SPRING_DEFAULT}
 * >
 *   <Button />
 * </motion.div>
 * ```
 */
/** Motion animation constants - spring physics tunable via Statsig animationConfigs */
export const ANIMATION_CONSTANTS = {
  // ----- Spring Physics -----
  SPRING_DEFAULT: { type: 'spring' as const, stiffness: 400, damping: 17 },
  SPRING_BOUNCY: { type: 'spring' as const, stiffness: 500, damping: 20 },
  SPRING_SMOOTH: { type: 'spring' as const, stiffness: 300, damping: 25 },

  // ----- Duration (for non-spring animations) -----
  DURATION_FAST: 0.15,
  DURATION_DEFAULT: 0.2,
  DURATION_SLOW: 0.3,

  // ----- Easing Curves -----
  EASE_DEFAULT: [0.4, 0, 0.2, 1] as const,
  EASE_OUT: [0, 0, 0.2, 1] as const,
  EASE_IN: [0.4, 0, 1, 1] as const,

  // ----- CSS Transition Classes (for Tailwind usage) -----
  CSS_TRANSITION_FAST: 'transition-all duration-150 ease-out',
  CSS_TRANSITION_DEFAULT: 'transition-all duration-200 ease-out',
  CSS_TRANSITION_SLOW: 'transition-all duration-300 ease-out',
  CSS_TRANSITION_SMOOTH: 'transition-smooth',
} as const;

// ==========================================
// SECTION 7: BREAKPOINTS & VIEWPORTS
// ==========================================

/**
 * BREAKPOINTS - Standard viewport breakpoints
 *
 * Use these for media queries and responsive logic.
 * Mobile: 320px, Tablet: 768px, Desktop: 1024px, Wide: 1280px, Ultra: 1920px
 */
export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1920,
} as const;

/**
 * CONTAINER_BREAKPOINTS - Container query breakpoints
 *
 * Use these for Tailwind v4 @container queries.
 * sm: 384px, md: 448px, lg: 512px, xl: 576px, 2xl: 672px
 */
export const CONTAINER_BREAKPOINTS = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  '2xl': 672,
} as const;

/**
 * RESPONSIVE_SPACING - Mobile/tablet/desktop spacing scale
 *
 * Use these for consistent responsive spacing.
 */
export const RESPONSIVE_SPACING = {
  gap: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
  },
  container: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
  },
  section: {
    mobile: 12,
    tablet: 16,
    desktop: 24,
  },
} as const;

/**
 * VIEWPORT_PRESETS - Testing viewport dimensions
 *
 * Use these for testing responsive layouts.
 */
export const VIEWPORT_PRESETS = {
  iphoneSE: { width: 375, height: 667 },
  iphone13: { width: 390, height: 844 },
  iphone13ProMax: { width: 428, height: 926 },
  ipadPortrait: { width: 768, height: 1024 },
  ipadLandscape: { width: 1024, height: 768 },
  ipadProPortrait: { width: 1024, height: 1366 },
  ipadProLandscape: { width: 1366, height: 1024 },
  laptop: { width: 1280, height: 800 },
  desktop1080p: { width: 1920, height: 1080 },
  desktop1440p: { width: 2560, height: 1440 },
  desktop4k: { width: 3840, height: 2160 },
} as const;

// ==========================================
// SECTION 8: BADGE COLORS
// ==========================================

/**
 * BADGE_COLORS - Category, status, difficulty badge colors
 *
 * Use these for consistent badge styling across the app.
 * All badges use 10% opacity backgrounds with 20% opacity borders.
 */

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

  memberType: {
    owner: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    contributor: 'bg-accent/10 text-accent border-accent/30',
    member: 'text-muted-foreground border-muted-foreground/20',
  },

  jobStatus: {
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    paused: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
} as const;

// ==========================================
// SECTION 9: CARD BEHAVIORS & ICON MAPPING
// ==========================================

/** Card behavior patterns - defaults tunable via Statsig componentConfigs */
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

/**
 * ICON_NAME_MAP - Static icon name mapping
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
export const ICON_NAME_MAP = {
  sparkles: Sparkles,
  code: Code,
  terminal: Terminal,
  'book-open': BookOpen,
  bookopen: BookOpen,
  webhook: Webhook,
  layers: Layers,
  'help-circle': HelpCircle,
} as const;

// ==========================================
// TYPE EXPORTS
// ==========================================

export type UIClassKey = keyof typeof UI_CLASSES;
export type DimensionKey = keyof typeof DIMENSIONS;
export type StatePatternKey = keyof typeof STATE_PATTERNS;
export type ResponsivePatternKey = keyof typeof RESPONSIVE_PATTERNS;
export type PositionPatternKey = keyof typeof POSITION_PATTERNS;
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type ContainerBreakpointKey = keyof typeof CONTAINER_BREAKPOINTS;
export type ViewportPresetKey = keyof typeof VIEWPORT_PRESETS;
export type CardBehaviorKey = keyof typeof CARD_BEHAVIORS;
export type JobType = keyof typeof BADGE_COLORS.jobType;
export type DifficultyLevel = keyof typeof BADGE_COLORS.difficulty;
export type CollectionType = keyof typeof BADGE_COLORS.collectionType;
export type ChangelogCategory = keyof typeof BADGE_COLORS.changelogCategory;
export type StatusType = keyof typeof BADGE_COLORS.status;
export type CategoryType = keyof typeof BADGE_COLORS.category;
export type SubmissionStatusType = keyof typeof BADGE_COLORS.submissionStatus;
export type JobStatusType = keyof typeof BADGE_COLORS.jobStatus;

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

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
  return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
}
