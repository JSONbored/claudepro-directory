/**
 * downloadContentForPlatform Tool Handler
 *
 * Downloads content formatted for a specific platform (Claude Code, Cursor, etc.)
 * Returns formatted content with installation instructions.
 */

import type { DownloadContentForPlatformInput } from '../../lib/types.js';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString, isValidSlug } from '../../lib/utils';
import {
  formatForClaudeCode,
  formatForCursor,
  formatForCodex,
  formatGeneric,
  getPlatformFilename,
  getTargetDirectory,
  getInstallationInstructions,
  type ContentItem,
} from '../../lib/platform-formatters';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Fetches content and formats it for the specified platform.
 *
 * @param input - Tool input with category, slug, platform, and optional targetDirectory
 * @param context - Tool handler context
 * @returns Formatted content with installation instructions
 * @throws If content not found or formatting fails
 */
export async function handleDownloadContentForPlatform(
  input: DownloadContentForPlatformInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    platform: string;
    filename: string;
    targetDirectory: string;
    fullPath: string;
    category: string;
    slug: string;
    title: string;
    installationInstructions: string[];
  };
}> {
  const { prisma, logger } = context;
  const category = input.category;
  const slug = sanitizeString(input.slug);
  const platform = input.platform || 'claude-code';
  const targetDirectory = input.targetDirectory ? sanitizeString(input.targetDirectory) : undefined;
  const startTime = Date.now();

  // Validate slug format
  if (!isValidSlug(slug)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_SLUG,
      `Invalid slug format: ${slug}. Slugs must be alphanumeric with hyphens, underscores, or dots.`
    );
    throw new Error(error.message);
  }

  // Validate platform
  const validPlatforms = ['claude-code', 'cursor', 'chatgpt-codex', 'generic'];
  if (!validPlatforms.includes(platform)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_PLATFORM,
      `Invalid platform: ${platform}. Supported platforms: ${validPlatforms.join(', ')}`
    );
    throw new Error(error.message);
  }

  try {
    // Fetch content using Prisma (same query as getContentDetail)
    let data;
    try {
      data = await prisma.content.findUnique({
        where: {
          slug_category: {
            slug,
            category,
          },
        },
        select: {
          slug: true,
          title: true,
          display_title: true,
          category: true,
          description: true,
          content: true,
          tags: true,
          author: true,
          author_profile_url: true,
          date_added: true,
          created_at: true,
          updated_at: true,
          metadata: true,
          view_count: true,
          bookmark_count: true,
          copy_count: true,
        },
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to fetch content');
      logger.error('Database query failed', {error: normalized, tool: 'downloadContentForPlatform', category, slug,});
      throw normalized;
    }

    if (!data) {
      const error = createErrorResponse(
        McpErrorCode.CONTENT_NOT_FOUND,
        `Content not found: ${category}/${slug}`
      );
      throw new Error(error.message);
    }

    // Build ContentItem structure
    const contentItem: ContentItem = {
      slug: data.slug,
      title: data.title || 'Untitled',
      displayTitle: data.display_title || data.title || 'Untitled',
      category: data.category,
      description: data.description || '',
      content: data.content || '',
      tags: data.tags || [],
      author: data.author || 'Unknown',
      authorProfileUrl: data.author_profile_url || null,
      dateAdded: data.date_added,
      dateUpdated: data.updated_at,
      createdAt: data.created_at,
      metadata: (data.metadata as ContentItem['metadata']) || {},
      stats: {
        views: data.view_count || 0,
        bookmarks: data.bookmark_count || 0,
        copies: data.copy_count || 0,
      },
    };

    // Format content for platform
    let formattedContent: string;
    try {
      switch (platform) {
        case 'claude-code':
          formattedContent = formatForClaudeCode(contentItem);
          break;
        case 'cursor':
          formattedContent = formatForCursor(contentItem);
          break;
        case 'chatgpt-codex':
          formattedContent = formatForCodex(contentItem);
          break;
        case 'generic':
          formattedContent = formatGeneric(contentItem);
          break;
        default:
          const errorResponse = createErrorResponse(
            McpErrorCode.INVALID_PLATFORM,
            `Unsupported platform: ${platform}. Supported platforms: claude-code, cursor, chatgpt-codex, generic`
          );
          throw new Error(errorResponse.message);
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to format content for platform');
      logger.error('Failed to format content', {error: normalized, tool: 'downloadContentForPlatform', platform, category, slug,});
      throw normalized;
    }

    // Get platform-specific metadata
    const filename = getPlatformFilename(platform);
    const targetDir = targetDirectory || getTargetDirectory(platform);
    const fullPath = targetDir === '.' ? filename : `${targetDir}/${filename}`;
    const installationInstructions = getInstallationInstructions(
      platform,
      filename,
      targetDir,
      formattedContent
    );

    // Build response with formatted content and instructions
    const responseText = `${formattedContent}\n\n${installationInstructions}`;

    logger.info('downloadContentForPlatform completed successfully', {tool: 'downloadContentForPlatform', duration_ms: Date.now() - startTime, platform, category, slug,});

    return {
      content: [
        {
          type: 'text' as const,
          text: responseText,
        },
      ],
      _meta: {
        platform,
        filename,
        targetDirectory: targetDir,
        fullPath,
        category: contentItem.category,
        slug: contentItem.slug,
        title: contentItem.title,
        installationInstructions: installationInstructions.split('\n').filter((line) => line.trim()),
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'downloadContentForPlatform tool failed');
    logger.error('downloadContentForPlatform tool error', {error: normalized, tool: 'downloadContentForPlatform', platform, category, slug});
    throw normalized;
  }
}
