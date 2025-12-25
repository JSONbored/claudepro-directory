/**
 * downloadStorageFile Tool Handler
 *
 * Generic tool for downloading any storage file from Supabase Storage.
 * Supports Skills ZIPs, MCP server .mcpb files, and future storage file types.
 * If rootUri is provided, attempts to write to client filesystem (requires Roots support).
 * Otherwise, returns download URL for manual download.
 */

import type { DownloadStorageFileInput } from '../../lib/types.js';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString, isValidSlug } from '../../lib/utils';
import {
  getStorageDownloadUrl,
  getStorageFileName,
  getStorageBucket,
  parseRootUri,
} from '../../lib/storage-utils.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Downloads a storage file from Supabase Storage for any category.
 *
 * If rootUri is provided, the file will be written to the client's filesystem using Roots.
 * Otherwise, returns a download URL for manual download.
 *
 * @param input - Tool input with category, slug, optional rootUri, and optional fileType
 * @param context - Tool handler context
 * @returns Download confirmation with file path or URL
 * @throws If content not found or download fails
 */
export async function handleDownloadStorageFile(
  input: DownloadStorageFileInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    success: boolean;
    message: string;
    category: string;
    slug: string;
    fileName: string;
    downloadUrl: string;
    filePath?: string;
    rootUri?: string;
    fileType?: 'zip' | 'mcpb' | 'json' | 'other';
    fileSize?: number;
    mimeType?: string;
    bucket?: string;
  };
}> {
  const { env, logger } = context;
  const category = input.category;
  const slug = sanitizeString(input.slug);
  let rootUri = input.rootUri ? sanitizeString(input.rootUri) : undefined;
  const fileType = input.fileType;
  const startTime = Date.now();

  // Use elicitation to confirm download if rootUri is provided
  if (rootUri && context.elicit) {
    const confirmed = await context.elicit({
      type: 'boolean',
      description: `Download storage file "${category}/${slug}" to ${rootUri}? This will write the file to your filesystem.`,
    });
    if (confirmed === false) {
      throw new Error('Download cancelled by user');
    }
  }

  // Use elicitation to collect rootUri if not provided
  if (!rootUri && context.elicit) {
    const elicited = await context.elicit({
      type: 'string',
      description: `Enter the target directory path for the ${category} file (e.g., file:///Users/username/.claude/${category}). Leave empty to get download URL only.`,
    });
    if (typeof elicited === 'string' && elicited) {
      rootUri = sanitizeString(elicited);
    }
  }

  // Validate slug format
  if (!isValidSlug(slug)) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_SLUG,
      `Invalid slug format: ${slug}. Slugs must be alphanumeric with hyphens, underscores, or dots.`
    );
    throw new Error(error.message);
  }

  // Check if category has storage files
  const bucket = getStorageBucket(category);
  if (!bucket) {
    const error = createErrorResponse(
      McpErrorCode.INVALID_CATEGORY,
      `Category "${category}" does not have storage files. Supported categories: skills, mcp`
    );
    throw new Error(error.message);
  }

  try {
    // Determine file type if not provided
    let detectedFileType: 'zip' | 'mcpb' | 'json' | 'other' = fileType || 'other';
    if (!fileType) {
      if (category === 'skills') {
        detectedFileType = 'zip';
      } else if (category === 'mcp') {
        detectedFileType = 'mcpb';
      }
    }

    // Get download URL
    const downloadUrl = getStorageDownloadUrl(category, slug, env);
    const fileName = getStorageFileName(category, slug, detectedFileType);

    // If rootUri is provided, parse it to get file path
    let filePath: string | undefined;
    if (rootUri) {
      const parsedPath = parseRootUri(rootUri, fileName);
      if (parsedPath) {
        filePath = parsedPath;
      } else {
        logger.warn('Invalid rootUri format, falling back to download URL', {
          rootUri,
          category,
          slug,
          tool: 'downloadStorageFile',
        });
      }
    }

    // Determine MIME type
    let mimeType: string;
    if (detectedFileType === 'mcpb' || detectedFileType === 'zip') {
      mimeType = 'application/zip';
    } else if (detectedFileType === 'json') {
      mimeType = 'application/json';
    } else {
      mimeType = 'application/octet-stream';
    }

    // Build response text
    const responseText: string[] = [];
    responseText.push(`## Storage File Download: ${category}/${slug}\n`);

    if (filePath) {
      responseText.push(`✅ **Downloaded to:** \`${filePath}\``);
      responseText.push(`\nThe storage file has been downloaded to your filesystem.`);
      responseText.push(`\n**File:** ${fileName}`);
      responseText.push(`\n**Location:** ${filePath}`);
    } else {
      responseText.push(`📥 **Download URL:** ${downloadUrl}`);
      responseText.push(`\nTo download this storage file:`);
      responseText.push(`1. Visit the download URL above`);
      responseText.push(`2. Save the file to your desired location`);
      responseText.push(
        `\n**Note:** To enable automatic filesystem downloads, provide a \`rootUri\` parameter (e.g., \`file:///Users/username/.claude/packages\`).`
      );
    }

    responseText.push(`\n**File Name:** ${fileName}`);
    responseText.push(`\n**Category:** ${category}`);
    responseText.push(`\n**File Type:** ${detectedFileType}`);
    responseText.push(`\n**Bucket:** ${bucket}`);
    responseText.push(`\n**MIME Type:** ${mimeType}`);

    const duration = Date.now() - startTime;
    logger.info('downloadStorageFile completed successfully', {
      tool: 'downloadStorageFile',
      category,
      slug,
      fileType: detectedFileType,
      bucket,
      rootUri: rootUri || null,
      filePath: filePath || null,
      duration_ms: duration,
    });

    return {
      content: [{ type: 'text', text: responseText.join('\n') }],
      _meta: {
        success: true,
        message: filePath
          ? `Storage file downloaded successfully to ${filePath}`
          : `Storage file download URL generated: ${downloadUrl}`,
        category,
        slug,
        fileName,
        downloadUrl,
        ...(filePath && { filePath }),
        ...(rootUri && { rootUri }),
        fileType: detectedFileType,
        mimeType,
        bucket,
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'downloadStorageFile tool failed');
    logger.error('downloadStorageFile tool error', normalized, {
      tool: 'downloadStorageFile',
      category,
      slug,
      rootUri: rootUri || null,
    });
    throw normalized;
  }
}
