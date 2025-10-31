/**
 * Content Generation Rules - Database-First Architecture
 * All configuration loaded from category_configs table via get_generation_config() RPC.
 * 199 lines → 30 lines (85% reduction)
 */

import type { CategoryId } from '@/src/lib/config/category-types';
import { supabase } from '@/src/lib/supabase/client';

export interface GenerationConfig {
  validationConfig: Record<string, unknown>;
  generationConfig: Record<string, unknown>;
}

let generationConfigCache: Record<string, GenerationConfig> | null = null;

export async function getGenerationConfig(
  category?: CategoryId
): Promise<GenerationConfig | Record<string, GenerationConfig>> {
  if (!generationConfigCache) {
    const { data, error } = await supabase.rpc('get_generation_config');
    if (error) throw new Error(`Failed to load generation configs: ${error.message}`);
    generationConfigCache = data as Record<string, GenerationConfig>;
  }

  return category ? generationConfigCache[category] : generationConfigCache;
}

export async function refreshGenerationConfig(): Promise<void> {
  generationConfigCache = null;
}
