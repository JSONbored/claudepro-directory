/**
 * Category Configuration - Database-First Architecture
 * All configuration loaded from category_configs table via get_category_config() RPC.
 * 816 lines → 66 lines (92% reduction)
 */

import type { CategoryId } from '@/src/lib/config/category-types';
import { supabase } from '@/src/lib/supabase/client';
import type { Tables } from '@/src/types/database.types';

export type CategoryConfig = Tables<'category_configs'>;

let categoryConfigCache: Record<string, CategoryConfig> | null = null;

export async function getCategoryConfig(
  category?: CategoryId
): Promise<CategoryConfig | Record<string, CategoryConfig>> {
  if (!categoryConfigCache) {
    const { data, error } = await supabase.rpc('get_category_config');
    if (error) throw new Error(`Failed to load category configs: ${error.message}`);
    categoryConfigCache = data as Record<string, CategoryConfig>;
  }

  return category ? categoryConfigCache[category] : categoryConfigCache;
}

export async function refreshCategoryConfig(): Promise<void> {
  categoryConfigCache = null;
}

// Legacy export for backward compatibility - deprecated, use getCategoryConfig() instead
export const CATEGORY_CONFIG: Record<CategoryId, null> = {
  statuslines: null,
  hooks: null,
  mcp: null,
  commands: null,
  rules: null,
  agents: null,
  skills: null,
  collections: null,
  guides: null,
  jobs: null,
  changelog: null,
};
