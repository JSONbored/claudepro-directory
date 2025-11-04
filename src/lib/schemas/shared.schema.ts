/**
 * Shared schemas - Derived from database enum types for single source of truth
 */

import { z } from 'zod';
import type { CategoryId } from '@/src/lib/config/category-config';
import type { Enums } from '@/src/types/database.types';

export type { CategoryId } from '@/src/lib/config/category-config';

// Derive Zod schema from database enum type (validates user input against DB enum)
const contentCategoryValues: readonly Enums<'content_category'>[] = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const;

export const categoryIdSchema = z.enum(
  contentCategoryValues as [Enums<'content_category'>, ...Enums<'content_category'>[]]
);

// Static array - MUST NOT call async getCacheableCategoryIds() at module load time
// This would trigger database queries during middleware initialization → 504 timeout
export const CACHEABLE_CATEGORIES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
] as const satisfies readonly CategoryId[];

export const cacheableCategorySchema = z.enum([...CACHEABLE_CATEGORIES] as [
  CategoryId,
  ...CategoryId[],
]);

// Derive from database enum type
const guideSubcategoryValues: readonly Enums<'guide_subcategory'>[] = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const;

export const GUIDE_SUBCATEGORIES = guideSubcategoryValues;
export type GuideSubcategory = (typeof GUIDE_SUBCATEGORIES)[number];

export const guideSubcategorySchema = z.enum(
  guideSubcategoryValues as [Enums<'guide_subcategory'>, ...Enums<'guide_subcategory'>[]]
);
