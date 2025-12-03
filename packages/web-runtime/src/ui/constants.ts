/**
 * UI Constants - Single Source of Truth for Design System
 *
 * This file contains design system constants organized by category.
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

import type { IconComponent } from '../icons.tsx';
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
// SECTION 1: BREAKPOINTS & VIEWPORTS
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

export const ICON_NAME_MAP: Record<string, IconComponent> = {
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

import { gap, grid } from '../design-system/styles/layout.ts';

export function getResponsiveGridClass(columns: 2 | 3): string {
  if (columns === 3) {
    return `${grid.cols1} sm:grid-cols-3 ${gap.comfortable}`;
  }
  return grid.responsive2;
}
