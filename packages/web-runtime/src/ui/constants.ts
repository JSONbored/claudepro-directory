/**
 * UI Constants - Non-Design-System Constants
 *
 * This file contains non-design-system constants (icon mappings, data types, changelog categories).
 *
 * For styling, use Direct Tailwind classes directly. See .cursor/rules/design-system.mdc for usage guide.
 */

import type { LucideIcon } from '../icons.tsx';
import { BookOpen, Code, HelpCircle, Layers, Sparkles, Terminal, Webhook } from '../icons.tsx';
import type {
  changelog_category,
  content_category,
  job_status,
  submission_status,
} from '../types/client-safe-enums';

// ==========================================
// SECTION 1: ICON MAPPING
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
// SECTION 2: TYPE EXPORTS
// ==========================================

// Types - using client-safe enums (source of truth)
import type { experience_level } from '../types/client-safe-enums';
export type JobType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'freelance'
  | 'internship'
  | 'remote';
export type DifficultyLevel = experience_level;
export type CollectionType = 'starter-kit' | 'workflow' | 'advanced-system' | 'use-case';

export type ChangelogCategory = changelog_category;

// Re-export ChangelogCategory enum from Prisma for ordered iteration
// The enum order in Prisma schema matches the desired UI display order
import { changelog_category as ChangelogCategoryEnum } from '../types/client-safe-enums.ts';

export const ChangelogCategory = ChangelogCategoryEnum;

export type JobStatus = job_status;
export type StatusType = 'success' | 'warning' | 'error' | 'info';
export type CategoryType = content_category;
export type SubmissionStatusType = submission_status;

// ==========================================
// SECTION 3: CHANGELOG BADGE COLORS
// ==========================================

/**
 * Changelog Badge Color Map
 * 
 * Tailwind utility classes for each changelog category badge.
 * Uses theme color variables for consistent styling across light/dark modes.
 * 
 * @see changelog_category - Type from Prisma enum
 */
export const CHANGELOG_BADGE_COLOR_MAP: Record<changelog_category, string> = {
  Added:
    'bg-color-badge-changelog-added-bg text-color-badge-changelog-added-text-light dark:text-color-badge-changelog-added-text-dark border-color-badge-changelog-added-border',
  Changed:
    'bg-color-badge-changelog-changed-bg text-color-badge-changelog-changed-text-light dark:text-color-badge-changelog-changed-text-dark border-color-badge-changelog-changed-border',
  Deprecated:
    'bg-color-badge-changelog-deprecated-bg text-color-badge-changelog-deprecated-text-light dark:text-color-badge-changelog-deprecated-text-dark border-color-badge-changelog-deprecated-border',
  Removed:
    'bg-color-badge-changelog-removed-bg text-color-badge-changelog-removed-text-light dark:text-color-badge-changelog-removed-text-dark border-color-badge-changelog-removed-border',
  Fixed:
    'bg-color-badge-changelog-fixed-bg text-color-badge-changelog-fixed-text-light dark:text-color-badge-changelog-fixed-text-dark border-color-badge-changelog-fixed-border',
  Security:
    'bg-color-badge-changelog-security-bg text-color-badge-changelog-security-text-light dark:text-color-badge-changelog-security-text-dark border-color-badge-changelog-security-border',
} as const;
