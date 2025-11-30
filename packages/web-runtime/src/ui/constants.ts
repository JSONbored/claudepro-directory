/**
 * UI Constants - Single Source of Truth for Design System
 *
 * This file contains design system constants organized by category.
 * Import what you need: import { DIMENSIONS, RESPONSIVE_PATTERNS } from '@heyclaude/web-runtime/ui'
 *
 * For layout and styling utilities, use the design-system module:
 * import { cluster, stack, iconSize, absolute, fixed, sticky, focusRing, hoverBg, categoryBadge } from '@heyclaude/web-runtime/design-system'
 *
 * MIGRATED to design-system:
 * - UI_CLASSES → cluster, stack, grid, between, muted, etc.
 * - POSITION_PATTERNS → absolute, fixed, sticky
 * - STATE_PATTERNS → focusRing, hoverBg, hoverText, disabled, interactive
 * - BADGE_COLORS → categoryBadge, jobTypeBadge, statusBadge, etc.
 */

import type { LucideIcon } from '../icons.tsx';
import {
  BookOpen,
  Code,
  HelpCircle,
  Layers,
  Sparkles,
  Terminal,
  Webhook,
} from '../icons.tsx';
import type { Database } from '@heyclaude/database-types';
// Import design system badges for type derivation
import {
  jobTypeBadge,
  difficultyBadge,
  collectionTypeBadge,
  semanticBadge,
  categoryBadge,
  submissionBadge,
} from '../design-system/styles/badges.ts';

// ==========================================
// SECTION 1: DIMENSIONS
// ==========================================

export const DIMENSIONS = {
  FULL_VIEWPORT: 'h-[100dvh]',
  FULL_SCREEN: 'h-screen',

  BUTTON_LG: 'h-[52px]',
  BUTTON_MD: 'h-[40px]',
  BUTTON_SM: 'h-[36px]',

  DIVIDER: 'h-[1px]',
  UNDERLINE: 'h-[2px]',
  SEPARATOR_SM: 'h-px',

  INPUT_SM: 'min-h-[80px]',
  INPUT_MD: 'min-h-[100px]',
  INPUT_LG: 'min-h-[150px]',
  TEXTAREA_SM: 'min-h-[80px]',
  TEXTAREA_MD: 'min-h-[120px]',

  DROPDOWN_SM: 'w-[280px]',
  DROPDOWN_MD: 'w-[380px]',
  DROPDOWN_LG: 'w-[480px]',
  DROPDOWN_XL: 'w-[560px]',
  MEGA_MENU: 'w-[560px]',
  SIDEBAR: 'w-[280px]',
  SIDEBAR_LG: 'w-[380px]',

  MIN_W_BUTTON: 'min-w-[8rem]',
  MIN_W_BADGE: 'min-w-[1.5rem]',
  MIN_W_INPUT: 'min-w-[200px]',
  MIN_W_ICON_BUTTON_SM: 'min-w-[36px]',
  MIN_W_ICON_BUTTON_MD: 'min-w-[40px]',
  MIN_W_NEWSLETTER_FORM: 'min-w-[320px]',
  MIN_W_NEWSLETTER_FORM_LG: 'min-w-[360px]',
  MIN_W_NEWSLETTER_BUTTON: 'min-w-[140px]',

  MIN_H_ICON_BUTTON_SM: 'min-h-[36px]',
  MIN_H_ICON_BUTTON_MD: 'min-h-[40px]',

  MODAL_MAX: 'max-h-[80vh]',
  DROPDOWN_MAX: 'max-h-[300px]',
  SIDEBAR_MAX: 'max-h-[calc(100vh-6rem)]',
  POPOVER_MAX: 'max-h-[400px]',
  NOTIFICATION_MAX: 'max-h-[calc(80vh-8rem)]',

  CONTAINER_SM: 'max-w-md',
  CONTAINER_MD: 'max-w-2xl',
  CONTAINER_LG: 'max-w-4xl',
  CONTAINER_XL: 'max-w-7xl',
  TOOLTIP_MAX: 'max-w-[200px]',
  NEWSLETTER_FORM_MAX: 'max-w-[400px]',
} as const;

// ==========================================
// SECTION 2: RESPONSIVE PATTERNS
// ==========================================

export const RESPONSIVE_PATTERNS = {
  TEXT_RESPONSIVE_SM: 'text-sm sm:text-sm md:text-base',
  TEXT_RESPONSIVE_MD: 'text-base sm:text-base md:text-lg',
  TEXT_RESPONSIVE_LG: 'text-lg sm:text-lg md:text-xl lg:text-2xl',
  TEXT_RESPONSIVE_XL: 'text-xl sm:text-xl md:text-2xl lg:text-3xl',
  TEXT_RESPONSIVE_2XL: 'text-2xl sm:text-2xl md:text-3xl lg:text-4xl',

  PADDING_RESPONSIVE_SM: 'px-4 sm:px-4 md:px-6',
  PADDING_RESPONSIVE_MD: 'px-4 sm:px-6 md:px-8',
  PADDING_RESPONSIVE_LG: 'px-6 sm:px-8 md:px-12',
  PADDING_RESPONSIVE_XL: 'px-8 sm:px-12 md:px-16',

  SPACING_RESPONSIVE_SM: 'gap-2 sm:gap-3 md:gap-4',
  SPACING_RESPONSIVE_MD: 'gap-3 sm:gap-4 md:gap-6',
  SPACING_RESPONSIVE_LG: 'gap-4 sm:gap-6 md:gap-8',

  FLEX_COL_SM_ROW: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
  FLEX_COL_MD_ROW: 'flex flex-col md:flex-row gap-3 md:gap-6',
  FLEX_COL_LG_ROW: 'flex flex-col lg:flex-row gap-4 lg:gap-8',

  GRID_RESPONSIVE_1_2: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  GRID_RESPONSIVE_1_2_3: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4',
  GRID_RESPONSIVE_1_2_4: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4',
  GRID_RESPONSIVE_2_3_4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
  GRID_RESPONSIVE_1_3: 'grid grid-cols-1 md:grid-cols-3 gap-6',
} as const;

// ==========================================
// SECTION 3: ANIMATION CONSTANTS
// ==========================================

export const ANIMATION_CONSTANTS = {
  DURATION_FAST: 0.15,
  DURATION_DEFAULT: 0.2,
  DURATION_SLOW: 0.3,

  EASE_DEFAULT: [0.4, 0, 0.2, 1] as const,
  EASE_OUT: [0, 0, 0.2, 1] as const,
  EASE_IN: [0.4, 0, 1, 1] as const,

  CSS_TRANSITION_FAST: 'transition-all duration-150 ease-out',
  CSS_TRANSITION_DEFAULT: 'transition-all duration-200 ease-out',
  CSS_TRANSITION_SLOW: 'transition-all duration-300 ease-out',
  CSS_TRANSITION_SMOOTH: 'transition-smooth',
} as const;

// ==========================================
// SECTION 7: BREAKPOINTS & VIEWPORTS
// ==========================================

export const BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
  ultra: 1920,
} as const;

export const CONTAINER_BREAKPOINTS = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 576,
  '2xl': 672,
} as const;

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
// SECTION 5: ICON MAPPING
// ==========================================

export const ICON_NAME_MAP: Record<string, LucideIcon> = {
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

export type DimensionKey = keyof typeof DIMENSIONS;
export type ResponsivePatternKey = keyof typeof RESPONSIVE_PATTERNS;
export type BreakpointKey = keyof typeof BREAKPOINTS;
export type ContainerBreakpointKey = keyof typeof CONTAINER_BREAKPOINTS;
export type ViewportPresetKey = keyof typeof VIEWPORT_PRESETS;

// Badge types - derived from design-system badges
export type JobType = keyof typeof jobTypeBadge;
export type DifficultyLevel = keyof typeof difficultyBadge;
export type CollectionType = keyof typeof collectionTypeBadge;
export type StatusType = keyof typeof semanticBadge;
export type CategoryType = keyof typeof categoryBadge;
export type SubmissionStatusType = keyof typeof submissionBadge;

// Database enum types
export type ChangelogCategory = Database['public']['Enums']['changelog_category'];
export type JobStatus = Database['public']['Enums']['job_status'];

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export function getResponsiveGridClass(columns: 2 | 3): string {
  if (columns === 3) {
    return 'grid grid-cols-1 sm:grid-cols-3 gap-4';
  }
  return 'grid grid-cols-1 sm:grid-cols-2 gap-4';
}
