/**
 * Changelog Type Definitions
 *
 * Client-safe type definitions for changelog entries.
 * These match the Prisma changelog model but don't import Prisma client.
 */

import type { changelog_category, changelog_source } from './client-safe-enums.ts';

/**
 * Changelog changes structure
 * Matches the changes JSON field in the database
 */
export interface ChangelogChanges {
  Added: string[];
  Fixed: string[];
  Changed: string[];
  Removed: string[];
  Security: string[];
  Deprecated: string[];
}

/**
 * Changelog entry type
 * Matches the changelog model from Prisma but without Prisma dependency
 */
export interface ChangelogEntry {
  id: string;
  release_date: Date | string;
  title: string;
  slug: string;
  tldr: string | null;
  changes: ChangelogChanges;
  content: string;
  raw_content: string;
  description: string | null;
  keywords: string[];
  published: boolean;
  featured: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  og_image: string | null;
  canonical_url: string | null;
  og_type: string | null;
  twitter_card: string | null;
  robots_index: boolean | null;
  robots_follow: boolean | null;
  json_ld: Record<string, unknown> | null;
  git_commit_sha: string | null;
  commit_count: number | null;
  contributors: string[];
  metadata: Record<string, unknown> | null;
  source: changelog_source | null;
  seo_title: string | null;
  seo_description: string | null;
}

/**
 * Extract non-empty categories from changelog changes
 * Returns the database category names directly (Added, Changed, Fixed, etc.)
 */
export function getNonEmptyCategories(changes: ChangelogChanges): changelog_category[] {
  const categories: changelog_category[] = [];
  if (changes.Added && changes.Added.length > 0) categories.push('Added');
  if (changes.Changed && changes.Changed.length > 0) categories.push('Changed');
  if (changes.Fixed && changes.Fixed.length > 0) categories.push('Fixed');
  if (changes.Removed && changes.Removed.length > 0) categories.push('Removed');
  if (changes.Security && changes.Security.length > 0) categories.push('Security');
  if (changes.Deprecated && changes.Deprecated.length > 0) categories.push('Deprecated');
  return categories;
}
