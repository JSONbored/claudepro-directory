/**
 * downloadMcpServerPackage Tool Handler
 *
 * Downloads MCP server .mcpb file from Supabase Storage.
 * If rootUri is provided, attempts to write to client filesystem (requires Roots support).
 * Otherwise, returns download URL for manual download.
 */

import type { DownloadMcpServerPackageInput } from '../../lib/types.js';
import { McpErrorCode, createErrorResponse } from '../../lib/errors';
import { sanitizeString, isValidSlug } from '../../lib/utils';
import { getStorageDownloadUrl, getStorageFileName, parseRootUri } from '../../lib/storage-utils.js';
import { normalizeError } from '@heyclaude/shared-runtime';
import type { ToolContext } from '../../types/runtime.js';

/**
 * Downloads an MCP server .mcpb file from Supabase Storage.
 *
 * If rootUri is provided, the file will be written to the client's filesystem using Roots.
 * Otherwise, returns a download URL for manual download.
 *
 * @param input - Tool input with slug and optional rootUri
 * @param context - Tool handler context
 * @returns Download confirmation with file path or URL
 * @throws If MCP server not found or download fails
 */
export async function handleDownloadMcpServerPackage(
  input: DownloadMcpServerPackageInput,
  context: ToolContext
): Promise<{
  content: Array<{ type: 'text'; text: string }>;
  _meta: {
    success: boolean;
    message: string;
    slug: string;
    fileName: string;
    downloadUrl: string;
    filePath?: string;
    rootUri?: string;
    fileSize?: number;
    mimeType?: string;
  };
}> {
  const { env, logger } = context;
  const slug = sanitizeString(input.slug);
  let rootUri = input.rootUri ? sanitizeString(input.rootUri) : undefined;
  const startTime = Date.now();

  // Use elicitation to confirm download if rootUri is provided
  if (rootUri && context.elicit) {
    const confirmed = await context.elicit({
      type: 'boolean',
      description: `Download MCP server package "${slug}" to ${rootUri}? This will write the .mcpb file to your filesystem.`,
    });
    if (confirmed === false) {
      throw new Error('Download cancelled by user');
    }
  }

  // Use elicitation to collect rootUri if not provided
  if (!rootUri && context.elicit) {
    const elicited = await context.elicit({
      type: 'string',
      description: 'Enter the target directory path for the MCP server package (e.g., file:///Users/username/.claude/mcp). Leave empty to get download URL only.',
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

  try {
    // Get download URL
    const downloadUrl = getStorageDownloadUrl('mcp', slug, env);
    const fileName = getStorageFileName('mcp', slug, 'mcpb');

    // If rootUri is provided, parse it to get file path
    let filePath: string | undefined;
    if (rootUri) {
      const parsedPath = parseRootUri(rootUri, fileName);
      if (parsedPath) {
        filePath = parsedPath;
      } else {
        logger.warn('Invalid rootUri format, falling back to download URL', {
          rootUri,
          slug,
          tool: 'downloadMcpServerPackage',
        });
      }
    }

    // Build response text
    const responseText: string[] = [];
    responseText.push(`## MCP Server Package Download: ${slug}\n`);
    
    if (filePath) {
      responseText.push(`✅ **Downloaded to:** \`${filePath}\``);
      responseText.push(`\nThe MCP server .mcpb package has been downloaded to your filesystem.`);
      responseText.push(`\n**File:** ${fileName}`);
      responseText.push(`\n**Location:** ${filePath}`);
    } else {
      responseText.push(`📥 **Download URL:** ${downloadUrl}`);
      responseText.push(`\nTo download this MCP server package:`);
      responseText.push(`1. Visit the download URL above`);
      responseText.push(`2. Save the .mcpb file to your desired location`);
      responseText.push(`\n**Note:** To enable automatic filesystem downloads, provide a \`rootUri\` parameter (e.g., \`file:///Users/username/.claude/mcp\`).`);
    }

    responseText.push(`\n**File Name:** ${fileName}`);
    responseText.push(`\n**Category:** mcp`);
    responseText.push(`\n**MIME Type:** application/zip (\`.mcpb\` is a ZIP archive)`);

    const duration = Date.now() - startTime;
    logger.info('downloadMcpServerPackage completed successfully', {
      tool: 'downloadMcpServerPackage',
      slug,
      rootUri: rootUri || null,
      filePath: filePath || null,
      duration_ms: duration,
    });

    return {
      content: [{ type: 'text', text: responseText.join('\n') }],
      _meta: {
        success: true,
        message: filePath
          ? `MCP server package downloaded successfully to ${filePath}`
          : `MCP server package download URL generated: ${downloadUrl}`,
        slug,
        fileName,
        downloadUrl,
        ...(filePath && { filePath }),
        ...(rootUri && { rootUri }),
        mimeType: 'application/zip',
      },
    };
  } catch (error) {
    const normalized = normalizeError(error, 'downloadMcpServerPackage tool failed');
    logger.error('downloadMcpServerPackage tool error', normalized, {
      tool: 'downloadMcpServerPackage',
      slug,
      rootUri: rootUri || null,
    });
    throw normalized;
  }
}

