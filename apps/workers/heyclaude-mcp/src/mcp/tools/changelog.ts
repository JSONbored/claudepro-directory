/**
 * getChangelog Tool Handler
 *
 * Get changelog of content updates in LLMs.txt format.
 * Helps AI agents understand recent changes and stay current.
 */

import { ContentService } from '@heyclaude/data-layer';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import type { GetChangelogInput } from '../../lib/types';
import { normalizeError } from '@heyclaude/cloudflare-runtime/utils/errors';
import type { ToolContext } from './categories';

/**
 * Fetches changelog in LLMs.txt format.
 *
 * @param input - Tool input with optional format (default: 'llms-txt')
 * @param context - Tool handler context
 * @returns Changelog content in requested format
 */
export async function handleGetChangelog(
  input: GetChangelogInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    format: string;
    length: number;
    note?: string;
  };
}> {
  const { prisma, logger } = context;
  const format = input.format || 'llms-txt';
  const startTime = Date.now();

  // Validate format
  if (format !== 'llms-txt' && format !== 'json') {
    const error = createErrorResponse(
      McpErrorCode.INVALID_FORMAT,
      `Invalid format: ${format}. Supported formats: llms-txt, json`
    );
    throw new Error(error.message);
  }

  try {
    const contentService = new ContentService(prisma);
    const data = await contentService.getChangelogLlmsTxt();

    if (!data) {
      throw new Error('Changelog not found or invalid');
    }

    // Format the changelog (replace escaped newlines)
    const formatted = data.replaceAll(String.raw`\n`, '\n');

    if (format === 'json') {
      // For JSON format, parse and return structured data
      // Note: LLMs.txt format is primarily text-based, so JSON format may be limited
      const duration = Date.now() - startTime;
      logger.info(
        {
          tool: 'getChangelog',
          duration_ms: duration,
          format,
          length: formatted.length,
        },
        'getChangelog completed successfully (JSON format requested)'
      );

      return {
        content: [
          {
            type: 'text' as const,
            text: formatted,
          },
        ],
        _meta: {
          format: 'llms-txt', // Note: Currently only LLMs.txt format is available
          length: formatted.length,
          note: 'Changelog is available in LLMs.txt format. JSON format conversion not yet implemented.',
        },
      };
    }

    // LLMs.txt format (default)
    const duration = Date.now() - startTime;
    logger.info(
      {
        tool: 'getChangelog',
        duration_ms: duration,
        format,
        length: formatted.length,
      },
      'getChangelog completed successfully'
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: formatted,
        },
      ],
      _meta: {
        format: 'llms-txt',
        length: formatted.length,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'getChangelog tool failed');
    logger.error({ error: normalized, tool: 'getChangelog', format }, 'getChangelog tool error');
    throw normalized;
  }
}
