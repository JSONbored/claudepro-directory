/**
 * Content Detail Export API Route (v1)
 *
 * Returns individual content records in multiple formats (JSON, Markdown, LLMs.txt, Storage).
 * Supports various export options including metadata and footer inclusion.
 * 
 * SIMPLIFIED: Uses format handler factory to eliminate 4 separate format handler functions (~900 lines → ~400 lines)
 *
 * @example
 * ```ts
 * // Request
 * GET /api/v1/content/agents/code-reviewer?format=json
 *
 * // Response (200) - application/json
 * {
 *   "id": "...",
 *   "title": "Code Reviewer",
 *   "slug": "code-reviewer",
 *   ...
 * }
 * ```
 */

import 'server-only';
import { type content_category } from '@heyclaude/data-layer/prisma';
import { APP_CONFIG } from '@heyclaude/shared-runtime';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import {
  createOptionsHandler as createApiOptionsHandler,
  createFormatHandlerRoute,
  type FormatHandlerConfig,
  type RouteHandlerContext,
} from '@heyclaude/web-runtime/api/route-factory';
import { VALID_CATEGORIES } from '@heyclaude/web-runtime/utils/category-validation';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { getOnlyCorsHeaders, getWithAcceptCorsHeaders, jsonResponse, markdownResponse, textResponse } from '@heyclaude/web-runtime/server/api-helpers';
import { notFoundResponse } from '@heyclaude/web-runtime/server/not-found-response';
import { contentDetailQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import { NextResponse } from 'next/server';

const SITE_URL = APP_CONFIG.url;

// Helper functions
function getProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) return undefined;
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc?.value;
}

function getStringProperty(obj: unknown, key: string): string | undefined {
  if (typeof obj !== 'object' || obj === null) return undefined;
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc && typeof desc.value === 'string' ? desc.value : undefined;
}

function sanitizeHeaderValue(val: string): string {
  return val.replaceAll(/[\r\n\t\b\f\v]/g, '').trim();
}

function sanitizeFilename(name: string): string {
  let cleaned = name.replaceAll(/[\r\n\t\b\f\v]/g, '').replaceAll(/["\\]/g, '').trim();
  return cleaned || 'export.md';
}

// Shared route params extractor
async function getRouteParams(nextContext: unknown): Promise<{ category: string; slug: string }> {
  interface RouteContext {
    params: Promise<{ category: string; slug: string }>;
  }
  const context = nextContext as RouteContext;
  if (!context?.params) throw new Error('Missing route context');
  const params = await context.params;
  if (!isValidCategory(params.category)) {
    throw new Error(`Invalid category '${params.category}'. Valid categories: ${VALID_CATEGORIES.join(', ')}`);
  }
  return params;
}

// Shared LLMs handler (llms and llms-txt are identical - both supported for backward compatibility)
function handleLlmsFormat(
  result: unknown,
  _format: 'llms-txt' | 'llms',
  _query: ContentDetailQuery,
  _body: unknown,
  ctx: RouteHandlerContext<ContentDetailQuery, unknown>
) {
  const { logger } = ctx;
  const data = result as string | null;
  if (!data) return notFoundResponse('LLMs.txt content not found', 'Content');
  let formatted: string;
  if (typeof data === 'string') {
    if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(data);
        logger.warn({}, 'Content LLMs.txt: RPC returned JSON instead of plain text');
        formatted = JSON.stringify(parsed, null, 2);
      } catch {
        formatted = data;
      }
    } else {
      formatted = data;
    }
  } else {
    logger.warn({}, 'Content LLMs.txt: RPC returned object instead of string');
    formatted = JSON.stringify(data, null, 2);
  }
  logger.info({ bytes: formatted.length }, 'Content LLMs.txt formatted');
  return textResponse(formatted, 200, getOnlyCorsHeaders, {
    'X-Generated-By': 'prisma.rpc.generate_item_llms_txt',
  });
}

// Shared LLMs method args builder
function buildLlmsMethodArgs(_format: ContentDetailFormat, _query: ContentDetailQuery, _body: unknown, routeParams?: Record<string, string>) {
  const category = routeParams?.['category'];
  const slug = routeParams?.['slug'];
  if (!category || !slug || !isValidCategory(category)) throw new Error('Invalid category or slug');
  return [{ p_category: category as content_category, p_slug: slug }];
}

// Shared markdown handler (markdown and md are identical - both supported for backward compatibility)
function handleMarkdownFormat(
  result: unknown,
  _format: 'markdown' | 'md',
  _query: ContentDetailQuery,
  _body: unknown,
  ctx: RouteHandlerContext<ContentDetailQuery, unknown>
) {
  const { logger } = ctx;
  const data = result as { success?: boolean; error?: string; markdown?: string; filename?: string; content_id?: string };
  const success = getProperty(data, 'success');
  if (typeof success !== 'boolean' || !success) {
    const error = getProperty(data, 'error');
    return jsonResponse(
      { error: typeof error === 'string' ? error : 'Markdown generation failed' },
      400,
      getWithAcceptCorsHeaders
    );
  }
  const markdown = getProperty(data, 'markdown');
  const filename = getProperty(data, 'filename');
  const contentId = getProperty(data, 'content_id');
  if (typeof markdown !== 'string' || typeof filename !== 'string' || typeof contentId !== 'string') {
    logger.warn({}, 'Content Markdown: invalid response structure');
    return jsonResponse({ error: 'Markdown generation failed: invalid response' }, 400, getWithAcceptCorsHeaders);
  }
  if (!markdown || markdown.trim().length === 0) {
    logger.warn({}, 'Content Markdown: empty markdown content returned');
    return jsonResponse({ error: 'Markdown generation failed: empty content' }, 400, getWithAcceptCorsHeaders);
  }
  const safeFilename = sanitizeFilename(filename);
  const safeContentId = sanitizeHeaderValue(contentId);
  logger.info({ filename: safeFilename, markdownLength: markdown.length }, 'Content Markdown generated');
  return markdownResponse(markdown, safeFilename, 200, getWithAcceptCorsHeaders, {
    'X-Content-ID': safeContentId,
    'X-Generated-By': 'prisma.rpc.generate_markdown_export',
  });
}

// Shared markdown method args builder
function buildMarkdownMethodArgs(_format: ContentDetailFormat, query: ContentDetailQuery, _body: unknown, routeParams?: Record<string, string>) {
  const category = routeParams?.['category'];
  const slug = routeParams?.['slug'];
  if (!category || !slug || !isValidCategory(category)) throw new Error('Invalid category or slug');
  return [{
    p_category: category as content_category,
    p_include_footer: query.includeFooter ?? false,
    p_include_metadata: query.includeMetadata ?? true,
    p_slug: slug,
  }];
}

// Shared storage handler
async function handleStorageFormat(
  category: content_category,
  slug: string,
  metadataMode: boolean,
  logger: RouteHandlerContext<ContentDetailQuery, unknown>['logger'],
  getStoragePath: (args: { p_slug: string }) => Promise<unknown>,
  rpcName: string
): Promise<NextResponse> {
  const data = await getStoragePath({ p_slug: slug });
  const location = Array.isArray(data) ? data[0] : data;
  const bucket = getStringProperty(location, 'bucket');
  const objectPath = getStringProperty(location, 'object_path');
  if (!bucket || !objectPath) throw new Error('Storage file not found');

  if (metadataMode) {
    const metadata = {
      bucket,
      category,
      download_url: `${SITE_URL}/api/v1/content/${category}/${slug}?format=storage`,
      note: 'Use download_url to fetch the actual binary file',
      object_path: objectPath,
      slug,
    };
    logger.info({ bucket, objectPath }, 'Returning storage metadata');
    return jsonResponse(metadata, 200, getOnlyCorsHeaders, {
      'X-Generated-By': rpcName,
    });
  }

  const { createSupabaseAnonClient } = await import('@heyclaude/web-runtime/supabase/server-anon');
  const storageClient = createSupabaseAnonClient();
  const { data: { publicUrl } } = storageClient.storage.from(bucket).getPublicUrl(objectPath);
  logger.info({ bucket, objectPath, publicUrl, redirect: true }, 'Redirecting to Supabase Storage public URL');
  return NextResponse.redirect(publicUrl, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Source': 'supabase-storage:redirect',
      'X-Storage-Bucket': bucket,
      'X-Storage-Path': objectPath,
      ...getOnlyCorsHeaders,
    },
    status: 308,
  });
}

type ContentDetailFormat = 'json' | 'markdown' | 'md' | 'llms' | 'llms-txt' | 'storage';

type ContentDetailQuery = {
  format: ContentDetailFormat;
  includeMetadata?: boolean;
  includeFooter?: boolean;
  metadata?: boolean;
};

/**
 * GET /api/v1/content/[category]/[slug] - Get content detail in multiple formats
 *
 * Returns individual content records in multiple formats with optimized caching.
 * Uses format handler factory to eliminate switch/if statements and consolidate 4 format handlers.
 */
export const GET = createFormatHandlerRoute<ContentDetailFormat, ContentDetailQuery, unknown>({
  route: getVersionedRoute('content/[category]/[slug]'),
  operation: 'ContentRecordAPI',
  method: 'GET',
  cors: 'anon',
  cacheLife: 'long', // 1 day stale, 6hr revalidate, 30 days expire
  cacheTags: (format, _query, _body, routeParams) => {
    const category = routeParams?.['category'] ?? '';
    const slug = routeParams?.['slug'] ?? '';
    return ['content', 'content-detail', `content-${category}-${slug}`, `content-${category}-${slug}-${format}`];
  },
  querySchema: contentDetailQuerySchema as any, // Type compatibility issue with exactOptionalPropertyTypes
  defaultFormat: 'json',
  formats: {
    json: {
      serviceKey: 'content',
      methodName: 'getApiContentFull',
      getRouteParams,
      methodArgs: (_format, _query, _body, routeParams) => {
        const category = routeParams?.['category'];
        const slug = routeParams?.['slug'];
        if (!category || !slug || !isValidCategory(category)) throw new Error('Invalid category or slug');
        return [{ p_base_url: SITE_URL, p_category: category as content_category, p_slug: slug }];
      },
      responseHandler: (result: unknown, _format: 'json', _query: ContentDetailQuery, _body: unknown, ctx: RouteHandlerContext<ContentDetailQuery, unknown>) => {
        const { logger } = ctx;
        const data = result as unknown;
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
          logger.warn({}, 'Content not found');
          return notFoundResponse('Content not found', 'Content');
        }
        let parsedData: unknown;
        if (typeof data === 'string') {
          try {
            parsedData = JSON.parse(data);
          } catch {
            logger.warn({}, 'Content JSON: RPC returned non-JSON string');
            return jsonResponse({ error: 'Invalid JSON data from RPC' }, 500, getOnlyCorsHeaders);
          }
        } else {
          parsedData = data;
        }
        const jsonData = JSON.stringify(parsedData, null, 2);
        logger.info({ bytes: jsonData.length }, 'Content JSON generated');
        return jsonResponse(JSON.parse(jsonData), 200, getOnlyCorsHeaders, {
          'X-Generated-By': 'prisma.rpc.get_api_content_full',
        });
      },
    },
    // llms and llms-txt are identical (both supported for backward compatibility)
    'llms-txt': {
      serviceKey: 'content',
      methodName: 'getItemLlmsTxt',
      getRouteParams,
      methodArgs: buildLlmsMethodArgs,
      responseHandler: handleLlmsFormat,
    },
    llms: {
      serviceKey: 'content',
      methodName: 'getItemLlmsTxt',
      getRouteParams,
      methodArgs: buildLlmsMethodArgs,
      responseHandler: handleLlmsFormat,
    },
    // markdown and md are identical (both supported for backward compatibility)
    markdown: {
      serviceKey: 'content',
      methodName: 'generateMarkdownExport',
      getRouteParams,
      methodArgs: buildMarkdownMethodArgs,
      responseHandler: handleMarkdownFormat,
    },
    md: {
      serviceKey: 'content',
      methodName: 'generateMarkdownExport',
      getRouteParams,
      methodArgs: buildMarkdownMethodArgs,
      responseHandler: handleMarkdownFormat,
    },
    storage: {
      serviceKey: 'content',
      methodName: 'getSkillStoragePath', // Dummy - actual method called conditionally in responseHandler
      getRouteParams,
      methodArgs: (_format, _query, _body, _routeParams) => {
        // Return empty args - storage format calls service methods directly in responseHandler
        return [];
      },
      responseHandler: async (_result: unknown, _format: 'storage', query: ContentDetailQuery, _body: unknown, ctx: RouteHandlerContext<ContentDetailQuery, unknown>) => {
        const { logger, nextContext } = ctx;
        const metadataMode = query.metadata ?? false;
        
        // Extract category from route params
        interface RouteContext {
          params: Promise<{ category: string; slug: string }>;
        }
        const context = nextContext as RouteContext;
        if (!context?.params) throw new Error('Missing route context');
        const { category, slug } = await context.params;
        const typedCategory = category as content_category;
        
        logger.info({ category: typedCategory, metadataMode, slug }, 'Handling storage format');
        
        // Handle skills category
        if (typedCategory === 'skills') {
          const { ContentService } = await import('@heyclaude/data-layer');
          const service = new ContentService();
          return handleStorageFormat(
            typedCategory,
            slug,
            metadataMode,
            logger,
            (args) => service.getSkillStoragePath(args),
            'prisma.rpc.get_skill_storage_path'
          );
        }
        
        // Handle mcp category
        if (typedCategory === 'mcp') {
          const { ContentService } = await import('@heyclaude/data-layer');
          const service = new ContentService();
          return handleStorageFormat(
            typedCategory,
            slug,
            metadataMode,
            logger,
            (args) => service.getMcpbStoragePath(args),
            'prisma.rpc.get_mcpb_storage_path'
          );
        }
        
        throw new Error(`Storage format not supported for category '${typedCategory}'. Supported categories: skills, mcp`);
      },
    },
  } as Record<ContentDetailFormat, FormatHandlerConfig<ContentDetailFormat, ContentDetailQuery, unknown>>,
  openapi: {
    summary: 'Get content detail in multiple formats',
    description:
      'Returns individual content records in multiple formats (JSON, Markdown, LLMs.txt, Storage). Supports various export options including metadata and footer inclusion.',
    tags: ['content', 'export'],
    operationId: 'getContentDetail',
    responses: {
      200: {
        description: 'Content detail retrieved successfully',
      },
      400: {
        description: 'Invalid category, format, or query parameters',
      },
      404: {
        description: 'Content not found',
      },
    },
  },
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
