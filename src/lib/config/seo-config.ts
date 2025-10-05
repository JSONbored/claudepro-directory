/**
 * SEO Configuration
 * Centralized SEO constants for title optimization
 */

import type { ContentCategory } from '@/src/lib/schemas/shared.schema';

/**
 * Suffix lengths for each category
 * Format: " - {Category} - Claude Pro Directory"
 */
export const SUFFIX_LENGTHS: Record<ContentCategory, number> = {
  // Core content types
  agents: 32, // " - Agents - Claude Pro Directory"
  mcp: 29, // " - Mcp - Claude Pro Directory"
  rules: 31, // " - Rules - Claude Pro Directory"
  commands: 34, // " - Commands - Claude Pro Directory"
  hooks: 31, // " - Hooks - Claude Pro Directory"
  statuslines: 37, // " - Statuslines - Claude Pro Directory"
  collections: 37, // " - Collections - Claude Pro Directory"

  // SEO content types
  guides: 32, // " - Guides - Claude Pro Directory"
  tutorials: 35, // " - Tutorials - Claude Pro Directory"
  comparisons: 37, // " - Comparisons - Claude Pro Directory"
  workflows: 35, // " - Workflows - Claude Pro Directory"
  'use-cases': 36, // " - Use Cases - Claude Pro Directory"
  troubleshooting: 41, // " - Troubleshooting - Claude Pro Directory"
  categories: 36, // " - Categories - Claude Pro Directory"

  // Special types
  jobs: 30, // " - Jobs - Claude Pro Directory"
} as const;

/**
 * Maximum total title length (SEO best practice)
 */
export const MAX_TITLE_LENGTH = 60;

/**
 * Optimal title range for SEO
 */
export const OPTIMAL_MIN = 55;
export const OPTIMAL_MAX = 60;

/**
 * Minimum character gain for enhancement to be applied
 */
export const MIN_ENHANCEMENT_GAIN = 3;

/**
 * Maximum available characters for base title (before suffix) per category
 */
export const MAX_BASE_TITLE_LENGTH: Record<ContentCategory, number> = {
  // Core content types
  agents: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.agents, // 28 chars
  mcp: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.mcp, // 31 chars (most room)
  rules: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.rules, // 29 chars
  commands: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.commands, // 26 chars
  hooks: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.hooks, // 29 chars
  statuslines: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.statuslines, // 23 chars
  collections: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.collections, // 23 chars

  // SEO content types
  guides: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.guides, // 28 chars
  tutorials: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.tutorials, // 25 chars
  comparisons: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.comparisons, // 23 chars
  workflows: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.workflows, // 25 chars
  'use-cases': MAX_TITLE_LENGTH - SUFFIX_LENGTHS['use-cases'], // 24 chars
  troubleshooting: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.troubleshooting, // 19 chars
  categories: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.categories, // 24 chars

  // Special types
  jobs: MAX_TITLE_LENGTH - SUFFIX_LENGTHS.jobs, // 30 chars
} as const;
