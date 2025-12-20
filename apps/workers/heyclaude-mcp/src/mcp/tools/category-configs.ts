/**
 * getCategoryConfigs Tool Handler
 *
 * Get category-specific configurations and features.
 * Helps understand category-specific requirements and submission guidelines.
 */

import { ContentService } from '@heyclaude/data-layer';
import { sanitizeString } from '../../lib/utils';
import type { GetCategoryConfigsInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Fetches category configurations and features.
 *
 * @param input - Tool input with optional category filter
 * @param context - Tool handler context
 * @returns Category configurations with features and submission guidelines
 */
export async function handleGetCategoryConfigs(
  input: GetCategoryConfigsInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    configs: unknown[];
    count: number;
    category: string | null;
  };
}> {
  const { prisma, logger } = context;
  const category = input.category ? sanitizeString(input.category) : undefined;
  const startTime = Date.now();

  try {
    const contentService = new ContentService(prisma);
    const data = await contentService.getCategoryConfigs();

    if (!data || !Array.isArray(data)) {
      const duration = Date.now() - startTime;
      logger.info(
        {
          tool: 'getCategoryConfigs',
          duration_ms: duration,
          category,
          resultCount: 0,
        },
        'getCategoryConfigs completed with no results'
      );

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
          category: category || null,
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

    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'getCategoryConfigs',
        duration_ms: duration,
        category,
        resultCount: filteredConfigs.length,
      },
      'getCategoryConfigs completed successfully'
    );

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
    const normalized = normalizeError(error, 'getCategoryConfigs tool failed');
    logger.error(
      { error: normalized, tool: 'getCategoryConfigs', category },
      'getCategoryConfigs tool error'
    );
    throw normalized;
  }
}
