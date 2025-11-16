/**
 * Changelog Utilities - Date formatting and URL generation for changelog entries
 */

import { APP_CONFIG } from '@/src/lib/data/config/constants';
import type { ChangelogCategory } from '@/src/types/database-overrides';

export function formatChangelogDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatChangelogDateShort(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

export function formatChangelogDateISO8601(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function getRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch {
    return isoDate;
  }
}

export function getChangelogUrl(slug: string): string {
  return `${APP_CONFIG.url}/changelog/${slug}`;
}

export function getChangelogPath(slug: string): string {
  return `/changelog/${slug}`;
}

export function getNonEmptyCategories(categories: unknown): ChangelogCategory[] {
  const nonEmpty: ChangelogCategory[] = [];

  const cats = categories as Record<string, unknown>;
  if (!cats) return nonEmpty;

  if (Array.isArray(cats.Added) && cats.Added.length > 0)
    nonEmpty.push('Added' as ChangelogCategory);
  if (Array.isArray(cats.Changed) && cats.Changed.length > 0)
    nonEmpty.push('Changed' as ChangelogCategory);
  if (Array.isArray(cats.Deprecated) && cats.Deprecated.length > 0)
    nonEmpty.push('Deprecated' as ChangelogCategory);
  if (Array.isArray(cats.Removed) && cats.Removed.length > 0)
    nonEmpty.push('Removed' as ChangelogCategory);
  if (Array.isArray(cats.Fixed) && cats.Fixed.length > 0)
    nonEmpty.push('Fixed' as ChangelogCategory);
  if (Array.isArray(cats.Security) && cats.Security.length > 0)
    nonEmpty.push('Security' as ChangelogCategory);

  return nonEmpty;
}
