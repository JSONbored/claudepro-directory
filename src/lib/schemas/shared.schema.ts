/**
 * Shared schemas used across multiple domains (categories, guide subcategories)
 */

import { z } from 'zod';
import type { CategoryId } from '@/src/lib/config/category-config';
import type { Enums } from '@/src/types/database.types';

export type { CategoryId } from '@/src/lib/config/category-config';

export const categoryIdSchema = z.enum([
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
] as const satisfies readonly Enums<'content_category'>[]);

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

export const cacheableCategorySchema = z.enum(CACHEABLE_CATEGORIES as any);

export const GUIDE_SUBCATEGORIES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const satisfies readonly Enums<'guide_subcategory'>[];

export type GuideSubcategory = (typeof GUIDE_SUBCATEGORIES)[number];

export const guideSubcategorySchema = z.enum(GUIDE_SUBCATEGORIES);
