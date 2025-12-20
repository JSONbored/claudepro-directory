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
} from '@prisma/client';

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

// Types - using Prisma enums directly (source of truth)
import type { experience_level } from '@prisma/client';
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
import { changelog_category as ChangelogCategoryEnum } from '@prisma/client';

export const ChangelogCategory = ChangelogCategoryEnum;

export type JobStatus = job_status;
export type StatusType = 'success' | 'warning' | 'error' | 'info';
export type CategoryType = content_category;
export type SubmissionStatusType = submission_status;
