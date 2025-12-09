/**
 * getChangelog Tool Handler
 *
 * Get changelog of content updates in LLMs.txt format.
 * Helps AI agents understand recent changes and stay current.
 */

import { ContentService } from '@heyclaude/data-layer/services/content.ts';
import type { Database } from '@heyclaude/database-types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logError } from '@heyclaude/shared-runtime/logging.ts';
import { McpErrorCode, createErrorResponse } from '../lib/errors.ts';
import type { GetChangelogInput } from '../lib/types.ts';

/**
 * Fetches changelog in LLMs.txt format.
 *
 * @param supabase - Authenticated Supabase client
 * @param input - Tool input with optional format (default: 'llms-txt')
 * @returns Changelog content in requested format
 * @throws If changelog generation fails
 */
export async function handleGetChangelog(
  supabase: SupabaseClient<Database>,
  input: GetChangelogInput
) {
  const format = input.format || 'llms-txt';

  // Validate format
  if (format !== 'llms-txt' && format !== 'json') {
    const error = createErrorResponse(
      McpErrorCode.INVALID_FORMAT,
      `Invalid format: ${format}. Supported formats: llms-txt, json`
    );
    throw new Error(error.message);
  }

  try {
    const contentService = new ContentService(supabase);
    const data = await contentService.getChangelogLlmsTxt();

    if (!data) {
      throw new Error('Changelog not found or invalid');
    }

    // Format the changelog (replace escaped newlines)
    const formatted = data.replaceAll(String.raw`\n`, '\n');

    if (format === 'json') {
      // For JSON format, parse and return structured data
      // Note: LLMs.txt format is primarily text-based, so JSON format may be limited
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
    await logError('Changelog generation failed', {
      format,
    }, error);
    throw new Error(`Failed to generate changelog: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
