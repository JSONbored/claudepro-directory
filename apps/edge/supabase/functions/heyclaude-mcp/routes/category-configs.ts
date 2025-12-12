/**
 * getCategoryConfigs Tool Handler
 *
 * Get category-specific configurations and features.
 * Helps understand category-specific requirements and submission guidelines.
 */

import { ContentService } from '@heyclaude/data-layer/services/content.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { sanitizeString } from '../lib/utils.ts';
import type { GetCategoryConfigsInput } from '../lib/types.ts';

/**
 * Fetches category configurations and features.
 *
 * @param supabase - Authenticated Supabase client
 * @param input - Tool input with optional category filter
 * @returns Category configurations with features and submission guidelines
 * @throws If RPC fails
 */
export async function handleGetCategoryConfigs(
  supabase: SupabaseClient<Database>,
  input: GetCategoryConfigsInput
) {
  const category = input.category ? sanitizeString(input.category) : undefined;

  try {
    const contentService = new ContentService(supabase);
    const data = await contentService.getCategoryConfigs();

    if (!data || !Array.isArray(data)) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'No category configurations found.',
          },
        ],
        _meta: {
          configs: [],
          count: 0,
        },
      };
    }

    // Filter by category if provided
    const filteredConfigs = category
      ? data.filter((config: { category?: string }) => config.category === category)
      : data;

    // Create text summary
    const textSummary = category
      ? `**Category Configuration: ${category}**\n\n${filteredConfigs.length > 0 ? JSON.stringify(filteredConfigs[0], null, 2) : 'No configuration found for this category.'}`
      : `**Available Category Configurations**\n\n${filteredConfigs.length} categor${filteredConfigs.length === 1 ? 'y' : 'ies'} configured:\n\n${filteredConfigs.map((config: { category?: string }, i: number) => `${i + 1}. ${config.category || 'unknown'}`).join('\n')}\n\nUse getCategoryConfigs with a specific category parameter to see detailed configuration.`;

    return {
      content: [
        {
          type: 'text' as const,
          text: textSummary,
        },
      ],
      _meta: {
        configs: filteredConfigs,
        count: filteredConfigs.length,
        category: category || null,
      },
    };
  } catch (error) {
    await logError('Category configs fetch failed', {
      category,
    }, error);
    throw new Error(`Failed to fetch category configs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
