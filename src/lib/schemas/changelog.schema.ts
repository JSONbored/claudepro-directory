/**
 * Changelog Schema
 *
 * Type-safe schemas for parsing and validating CHANGELOG.md entries.
 * Follows Keep a Changelog 1.0.0 specification with custom extensions
 * for SEO optimization and AI discoverability.
 *
 * Production Standards:
 * - All schemas properly typed with Zod v4
 * - JSDoc comments for every export
 * - Uses primitives from base-strings for consistency
 * - Compatible with existing content schema patterns
 */

import { z } from 'zod';
import {
  extraLongString,
  isoDateString,
  longString,
  mediumString,
  slugString,
  ultraLongString,
} from '@/src/lib/schemas/primitives/base-strings';

/**
 * Changelog Category Enum
 *
 * Standard Keep a Changelog 1.0.0 categories plus custom extensions.
 * Used for organizing changes by type and filtering in UI.
 *
 * Categories:
 * - Added: New features or functionality
 * - Changed: Changes to existing functionality
 * - Deprecated: Soon-to-be removed features
 * - Removed: Removed features
 * - Fixed: Bug fixes
 * - Security: Security vulnerability fixes
 */
export const changelogCategorySchema = z
  .enum(['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'])
  .describe(
    'Keep a Changelog category type for organizing changes (Added, Changed, Fixed, Removed, Security)'
  );

export type ChangelogCategory = z.infer<typeof changelogCategorySchema>;

/**
 * Changelog Category Item Schema
 *
 * Individual item within a category section (e.g., a bullet point under "### Added").
 * Supports nested markdown content including lists, links, and code blocks.
 */
export const changelogCategoryItemSchema = z
  .object({
    content: extraLongString.describe(
      'Markdown content for the changelog item (supports lists, links, code blocks)'
    ),
  })
  .describe('Individual changelog item within a category section');

export type ChangelogCategoryItem = z.infer<typeof changelogCategoryItemSchema>;

/**
 * Changelog Categories Schema
 *
 * Collection of categorized changes for a single changelog entry.
 * Each category (Added, Fixed, etc.) contains an array of items.
 */
export const changelogCategoriesSchema = z
  .object({
    Added: z
      .array(changelogCategoryItemSchema)
      .default([])
      .describe('List of added features or functionality'),
    Changed: z
      .array(changelogCategoryItemSchema)
      .default([])
      .describe('List of changes to existing functionality'),
    Deprecated: z
      .array(changelogCategoryItemSchema)
      .default([])
      .describe('List of deprecated features (soon to be removed)'),
    Removed: z.array(changelogCategoryItemSchema).default([]).describe('List of removed features'),
    Fixed: z.array(changelogCategoryItemSchema).default([]).describe('List of bug fixes'),
    Security: z
      .array(changelogCategoryItemSchema)
      .default([])
      .describe('List of security vulnerability fixes'),
  })
  .describe('Categorized changes following Keep a Changelog specification');

export type ChangelogCategories = z.infer<typeof changelogCategoriesSchema>;

/**
 * Changelog Entry Schema
 *
 * Complete changelog entry parsed from CHANGELOG.md.
 * Represents a single release or update with all metadata and content.
 *
 * Fields:
 * - date: ISO date string (YYYY-MM-DD)
 * - title: Entry title (extracted from header)
 * - slug: URL-safe identifier (auto-generated from date + title)
 * - tldr: Brief summary (extracted from "**TL;DR:**" section)
 * - categories: Categorized changes (Added, Fixed, Changed, etc.)
 * - content: Full markdown content of the entry
 * - rawContent: Original unparsed markdown (for llms.txt export)
 */
export const changelogEntrySchema = z
  .object({
    date: isoDateString.describe('ISO date string (YYYY-MM-DD) when the changes were released'),
    title: longString.describe('Entry title describing the main change or release'),
    slug: slugString.describe(
      'URL-safe identifier auto-generated from date and title (e.g., 2025-10-06-automated-submission-tracking)'
    ),
    tldr: mediumString
      .optional()
      .describe('Brief TL;DR summary extracted from the entry (1-2 sentences)'),
    categories: changelogCategoriesSchema.describe(
      'Categorized changes organized by type (Added, Fixed, Changed, etc.)'
    ),
    content: ultraLongString.describe(
      'Full markdown content of the changelog entry including all sections'
    ),
    rawContent: ultraLongString.describe(
      'Original unparsed markdown content for llms.txt and feed export'
    ),
  })
  .describe(
    'Complete changelog entry with date, title, categories, and full content. Parsed from CHANGELOG.md following Keep a Changelog specification.'
  );

export type ChangelogEntry = z.infer<typeof changelogEntrySchema>;

/**
 * Changelog Metadata Schema
 *
 * Aggregated metadata about the entire changelog.
 * Used for analytics, filtering, and UI state management.
 *
 * Fields:
 * - totalEntries: Total number of changelog entries
 * - latestEntry: Most recent changelog entry
 * - dateRange: Date range of all entries (earliest to latest)
 * - categoryCounts: Count of entries per category
 */
export const changelogMetadataSchema = z
  .object({
    totalEntries: z.number().int().nonnegative().describe('Total number of changelog entries'),
    latestEntry: changelogEntrySchema
      .optional()
      .describe('Most recent changelog entry (if any exist)'),
    dateRange: z
      .object({
        earliest: isoDateString.describe('Date of the earliest changelog entry'),
        latest: isoDateString.describe('Date of the most recent changelog entry'),
      })
      .optional()
      .describe('Date range spanning all changelog entries'),
    categoryCounts: z
      .object({
        Added: z.number().int().nonnegative().default(0),
        Changed: z.number().int().nonnegative().default(0),
        Deprecated: z.number().int().nonnegative().default(0),
        Removed: z.number().int().nonnegative().default(0),
        Fixed: z.number().int().nonnegative().default(0),
        Security: z.number().int().nonnegative().default(0),
      })
      .describe('Count of entries containing each category type'),
  })
  .describe('Aggregated metadata about all changelog entries for analytics and filtering');

export type ChangelogMetadata = z.infer<typeof changelogMetadataSchema>;

/**
 * Parsed Changelog Schema
 *
 * Complete parsed CHANGELOG.md file with all entries and metadata.
 * This is the top-level schema returned by the parser.
 */
export const parsedChangelogSchema = z
  .object({
    entries: z.array(changelogEntrySchema).describe('Array of all parsed changelog entries'),
    metadata: changelogMetadataSchema.describe('Aggregated metadata about the changelog'),
  })
  .describe('Complete parsed CHANGELOG.md with all entries and aggregated metadata');

export type ParsedChangelog = z.infer<typeof parsedChangelogSchema>;
