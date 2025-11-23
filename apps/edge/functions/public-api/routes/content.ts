import { ContentService } from '@heyclaude/data-layer';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { supabaseAnon } from '@heyclaude/edge-runtime';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

// Use enum values directly from @heyclaude/database-types Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders, logInfo, validateSlug } from '@heyclaude/shared-runtime';
import { handlePaginatedContent } from './content-paginated.ts';
import { handleRecordExport } from './content-record.ts';

const CORS = getOnlyCorsHeaders;

// Export handlers for use in other modules
// Note: handleContentHighlight logic is now consolidated in content-process.ts to avoid circular dependencies
// Do not export it from here.

export async function handleContentRoute(
  segments: string[],
  url: URL,
  method: string,
  _request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Handle POST requests for content generation operations
  if (method === 'POST') {
    const action = url.searchParams.get('action')?.toLowerCase();

    // Handle .mcpb generation check: POST /content/mcp/[slug]?action=generate
    // Note: Currently just checks if package exists (read operation), no auth needed
    // When actual generation is implemented, this will become a write operation
    if (action === 'generate' && segments.length === 2) {
      const [category, slug] = segments;
      if (category === 'mcp' && slug !== undefined) {
        return handleMcpbGeneration(slug, _request, logContext);
      }
      return badRequestResponse(
        `Generation not supported for category '${category}'. Supported: mcp`,
        CORS
      );
    }

    return badRequestResponse(
      'Invalid POST request. Supported: POST /content/mcp/[slug]?action=generate',
      CORS
    );
  }

  // Handle GET requests (existing functionality)
  if (method !== 'GET' && method !== 'HEAD') {
    return methodNotAllowedResponse('GET, HEAD, POST', CORS);
  }

  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  if (segments.length === 0) {
    return badRequestResponse('Missing content path segments', CORS);
  }

  if (segments.length === 1) {
    const [first] = segments;
    if (first === 'sitewide') {
      return handleSitewideContent(url, logContext);
    }
    if (first === 'paginated') {
      return handlePaginatedContent(url);
    }
    if (first === 'changelog') {
      return handleChangelogIndex(format);
    }
    if (first === 'category-configs' || first === 'categories') {
      return handleCategoryConfigs();
    }
    // Validate content category without type assertion
    const isValidContentCategory = (value: string): value is ContentCategory => {
      for (const validValue of CONTENT_CATEGORY_VALUES) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };
    if (first && isValidContentCategory(first)) {
      return handleCategoryOnly(first, format);
    }
  }

  if (segments.length === 2) {
    const [first, second] = segments;
    if (first === 'changelog' && second !== undefined) {
      return handleChangelogEntry(second, format);
    }
    if (first === 'tools' && second !== undefined) {
      return handleToolLlmsTxt(second, format);
    }
    // Validate content category without type assertion
    const isValidContentCategory = (value: string): value is ContentCategory => {
      for (const validValue of CONTENT_CATEGORY_VALUES) {
        if (value === validValue) {
          return true;
        }
      }
      return false;
    };
    if (first && isValidContentCategory(first) && second !== undefined) {
      return handleRecordExport(first, second, url);
    }
    return badRequestResponse(
      `Invalid category '${first}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
      CORS
    );
  }

  return jsonResponse(
    {
      error: 'Not Found',
      message: 'Content resource unavailable',
      path: `/content/${segments.join('/')}`,
    },
    404,
    CORS
  );
}

async function handleSitewideContent(url: URL, logContext?: BaseLogContext): Promise<Response> {
  const format = (url.searchParams.get('format') || 'llms').toLowerCase();

  if (format === 'llms' || format === 'llms-txt') {
    return handleSitewideLlmsTxt(logContext);
  }

  return badRequestResponse(
    `Invalid sitewide format '${format}'. Valid formats: llms, llms-txt`,
    CORS
  );
}

async function handleSitewideLlmsTxt(logContext?: BaseLogContext): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getSitewideLlmsTxt();

    if (!data) {
      return jsonResponse(
        {
          error: 'Sitewide LLMs export failed',
          message: 'RPC returned null or invalid',
        },
        500,
        CORS
      );
    }

    const formatted = data.replace(/\\n/g, '\n');

    if (logContext) {
      logInfo('Sitewide llms generated', {
        ...logContext,
        bytes: formatted.length,
      });
    }

    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_sitewide_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_sitewide_llms_txt', CORS);
  }
}

async function handleChangelogIndex(format: string): Promise<Response> {
  if (format === 'llms-changelog') {
    return handleChangelogLlmsTxt();
  }
  return badRequestResponse(`Invalid format '${format}' for changelog index`, CORS);
}

function parseContentCategory(value: string | null): ContentCategory | null {
  if (!value) return null;
  return CONTENT_CATEGORY_VALUES.includes(value as ContentCategory)
    ? (value as ContentCategory)
    : null;
}

async function handleCategoryOnly(category: string, format: string): Promise<Response> {
  if (format === 'llms-category') {
    const typedCategory = parseContentCategory(category);
    if (!typedCategory) {
      return badRequestResponse(`Invalid category '${category}'`, CORS);
    }
    return handleCategoryLlmsTxt(typedCategory);
  }
  return badRequestResponse(`Invalid format '${format}' for category-only route`, CORS);
}

async function handleChangelogEntry(slug: string, format: string): Promise<Response> {
  if (format === 'llms-entry') {
    return handleChangelogEntryLlmsTxt(slug);
  }
  return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
}

async function handleToolLlmsTxt(tool: string, format: string): Promise<Response> {
  if (format === 'llms-tool') {
    return handleToolLlms(tool);
  }
  return badRequestResponse(`Invalid format '${format}' for tool`, CORS);
}

async function handleCategoryLlmsTxt(category: ContentCategory): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getCategoryLlmsTxt({ p_category: category });

    if (!data) {
      return badRequestResponse('Category LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_category_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_category_llms_txt', CORS);
  }
}

async function handleChangelogLlmsTxt(): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getChangelogLlmsTxt();

    if (!data) {
      return badRequestResponse('Changelog LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_changelog_llms_txt', CORS);
  }
}

async function handleChangelogEntryLlmsTxt(slug: string): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getChangelogEntryLlmsTxt({ p_slug: slug });

    if (!data) {
      return badRequestResponse('Changelog entry LLMs.txt not found or invalid', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_changelog_entry_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_changelog_entry_llms_txt', CORS);
  }
}

async function handleToolLlms(tool: string): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getToolLlmsTxt({ p_tool_name: tool });

    if (!data) {
      return badRequestResponse('Tool LLMs.txt not found', CORS);
    }

    const formatted = data.replace(/\\n/g, '\n');
    return new Response(formatted, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Generated-By': 'supabase.rpc.generate_tool_llms_txt',
        ...buildSecurityHeaders(),
        ...CORS,
        ...buildCacheHeaders('content_export'),
      },
    });
  } catch (error) {
    return errorResponse(error, 'data-api:generate_tool_llms_txt', CORS);
  }
}

async function handleCategoryConfigs(): Promise<Response> {
  const service = new ContentService(supabaseAnon);

  try {
    const data = await service.getCategoryConfigs();

    if (!data) {
      return jsonResponse(
        {
          error: 'Not Found',
          message: 'Category configs not available',
        },
        404,
        CORS
      );
    }

    return jsonResponse(data, 200, {
      ...CORS,
      ...buildSecurityHeaders(),
      ...buildCacheHeaders('config'),
      'X-Generated-By': 'supabase.rpc.get_category_configs_with_features',
    });
  } catch (error) {
    return errorResponse(error, 'data-api:get_category_configs_with_features', CORS);
  }
}

/**
 * Handle on-demand .mcpb package generation for MCP servers
 * Route: POST /content/mcp/[slug]?action=generate
 */
async function handleMcpbGeneration(
  slug: string,
  _request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Validate slug format (prevent path traversal)
  const sanitizedSlug = slug.trim();
  const slugValidation = validateSlug(sanitizedSlug);
  if (!slugValidation.valid) {
    return badRequestResponse(slugValidation.error || 'Invalid slug', CORS);
  }

  if (logContext) {
    logInfo('Fetching MCP server for generation', {
      ...logContext,
      slug: sanitizedSlug,
    });
  }

  const service = new ContentService(supabaseAnon);

  try {
    // Fetch MCP server using service
    const data = await service.getApiContentFull({
      p_category: 'mcp',
      p_slug: sanitizedSlug,
      p_base_url: Deno.env.get('SITE_URL') || '',
    });

    if (!data) {
      return jsonResponse(
        {
          error: 'Not Found',
          message: `MCP server with slug '${sanitizedSlug}' not found`,
        },
        404,
        CORS
      );
    }

    // Parse JSON string returned by RPC (handled in service, but double check here)
    const contentData = data;

    // Validate content data structure without type assertion
    if (typeof contentData !== 'object' || contentData === null) {
      return jsonResponse(
        {
          error: 'Invalid Response',
          message: 'RPC returned invalid data structure',
        },
        500,
        CORS
      );
    }

    // Safely check for required properties
    const getStringProperty = (obj: unknown, key: string): string | undefined => {
      if (typeof obj !== 'object' || obj === null) {
        return undefined;
      }
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      if (desc && typeof desc.value === 'string') {
        return desc.value;
      }
      return undefined;
    };

    // Validate that this looks like a content row by checking for required fields
    const contentSlug = getStringProperty(contentData, 'slug');
    const contentCategory = getStringProperty(contentData, 'category');

    if (!(contentSlug && contentCategory)) {
      return jsonResponse(
        {
          error: 'Invalid Response',
          message: 'RPC returned incomplete data',
        },
        500,
        CORS
      );
    }

    const mcpServer = contentData as DatabaseGenerated['public']['Tables']['content']['Row'];

    // Check if .mcpb already exists
    const mcpbStorageUrl = mcpServer.mcpb_storage_url;
    if (mcpbStorageUrl && typeof mcpbStorageUrl === 'string') {
      if (logContext) {
        logInfo('MCPB package already exists', {
          ...logContext,
          slug: sanitizedSlug,
          storage_url: mcpbStorageUrl,
        });
      }

      return jsonResponse(
        {
          success: true,
          slug: sanitizedSlug,
          mcpb_storage_url: mcpbStorageUrl,
          already_exists: true,
          message: 'MCPB package already exists. Use the existing URL.',
        },
        200,
        {
          ...CORS,
          ...buildSecurityHeaders(),
          'X-Generated-By': 'supabase.rpc.get_api_content_full',
        }
      );
    }

    // .mcpb doesn't exist - return 501 (Not Implemented)
    if (logContext) {
      logInfo('MCPB package does not exist - generation not yet implemented', {
        ...logContext,
        slug: sanitizedSlug,
      });
    }

    return jsonResponse(
      {
        error: 'Not Implemented',
        message:
          'On-demand generation is not yet implemented. Please run `pnpm build:mcpb` to generate packages.',
        slug: sanitizedSlug,
        instructions: 'Run the build script: pnpm build:mcpb',
      },
      501,
      {
        ...CORS,
        ...buildSecurityHeaders(),
        'X-Generated-By': 'data-api:handleMcpbGeneration',
      }
    );
  } catch (error) {
    return errorResponse(error, 'data-api:get_api_content_full', CORS);
  }
}
