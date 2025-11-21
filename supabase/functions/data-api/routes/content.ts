import { buildReadmeMarkdown } from '../../_shared/changelog/readme-builder.ts';
import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';

type ContentCategory = DatabaseGenerated['public']['Enums']['content_category'];

const CONTENT_CATEGORY_VALUES = [
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'skills',
  'collections',
  'guides',
  'jobs',
  'changelog',
] as const satisfies readonly ContentCategory[];

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import type { BaseLogContext } from '../../_shared/utils/logging.ts';
import { logInfo } from '../../_shared/utils/logging.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';
import { handlePaginatedContent } from './content-paginated.ts';
import { handleRecordExport } from './content-record.ts';

const CORS = getOnlyCorsHeaders;

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
  const format = (url.searchParams.get('format') || 'readme').toLowerCase();

  if (format === 'readme') {
    return handleSitewideReadme(logContext);
  }

  if (format === 'llms' || format === 'llms-txt') {
    return handleSitewideLlmsTxt(logContext);
  }

  return badRequestResponse(
    `Invalid sitewide format '${format}'. Valid formats: readme, llms-txt`,
    CORS
  );
}

async function handleSitewideReadme(logContext?: BaseLogContext): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_readme_data', undefined);

  if (error) {
    return errorResponse(error, 'data-api:generate_readme_data', CORS);
  }

  if (!data) {
    return jsonResponse(
      { error: 'README generation failed', message: 'RPC returned null' },
      500,
      CORS
    );
  }

  // Use generated composite type directly - Supabase RPC automatically converts composite types to JSON
  // Field names are snake_case as defined in the composite type
  const readmeData =
    data as DatabaseGenerated['public']['Functions']['generate_readme_data']['Returns'];
  const markdown = buildReadmeMarkdown(readmeData);

  if (logContext) {
    logInfo('Sitewide readme generated', {
      ...logContext,
      bytes: markdown.length,
      categories: readmeData.categories?.length ?? 0,
    });
  }

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_readme_data',
      ...buildSecurityHeaders(),
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleSitewideLlmsTxt(logContext?: BaseLogContext): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_sitewide_llms_txt', undefined);

  if (error) {
    return errorResponse(error, 'data-api:generate_sitewide_llms_txt', CORS);
  }

  if (!data || typeof data !== 'string') {
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
}

async function handleChangelogIndex(format: string): Promise<Response> {
  if (format === 'llms-changelog') {
    return handleChangelogLlmsTxt();
  }
  return badRequestResponse(`Invalid format '${format}' for changelog index`, CORS);
}

async function handleCategoryOnly(category: string, format: string): Promise<Response> {
  if (format === 'llms-category') {
    return handleCategoryLlmsTxt(category);
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

async function handleCategoryLlmsTxt(category: string): Promise<Response> {
  const rpcArgs = {
    p_category: category,
  } satisfies DatabaseGenerated['public']['Functions']['generate_category_llms_txt']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_category_llms_txt', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:generate_category_llms_txt', CORS);
  }

  if (!data || typeof data !== 'string') {
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
}

async function handleChangelogLlmsTxt(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_changelog_llms_txt', undefined);

  if (error) {
    return errorResponse(error, 'data-api:generate_changelog_llms_txt', CORS);
  }

  if (!data || typeof data !== 'string') {
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
}

async function handleChangelogEntryLlmsTxt(slug: string): Promise<Response> {
  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_entry_llms_txt']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_changelog_entry_llms_txt', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:generate_changelog_entry_llms_txt', CORS);
  }

  if (!data || typeof data !== 'string') {
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
}

async function handleToolLlms(tool: string): Promise<Response> {
  const rpcArgs = {
    p_tool_name: tool,
  } satisfies DatabaseGenerated['public']['Functions']['generate_tool_llms_txt']['Args'];
  const { data, error } = await supabaseAnon.rpc('generate_tool_llms_txt', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:generate_tool_llms_txt', CORS);
  }

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
}

async function handleCategoryConfigs(): Promise<Response> {
  // get_category_configs_with_features has Args: never (no arguments)
  const { data, error } = await supabaseAnon.rpc('get_category_configs_with_features', undefined);

  if (error) {
    return errorResponse(error, 'data-api:get_category_configs_with_features', CORS);
  }

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
}

/**
 * Handle on-demand .mcpb package generation for MCP servers
 * Route: POST /content/mcp/[slug]?action=generate
 *
 * Purpose: Check if .mcpb package exists and return URL (read operation)
 * Future: Will trigger actual package generation when implemented (write operation)
 *
 * Note: Currently this is a read-only operation (checking if package exists),
 * similar to the download endpoint. No authentication required until actual
 * generation is implemented (which would be a write/processing operation).
 *
 * Flow:
 * 1. Validate slug parameter
 * 2. Fetch MCP server from database
 * 3. Check if .mcpb already exists (mcpb_storage_url)
 * 4. If exists, return existing URL
 * 5. If not, return 501 (Not Implemented) - full generation requires Deno-compatible refactoring
 */
async function handleMcpbGeneration(
  slug: string,
  _request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Validate slug format (prevent path traversal)
  const sanitizedSlug = slug.trim();
  if (!/^[a-z0-9-]+$/.test(sanitizedSlug)) {
    return badRequestResponse(
      'Invalid slug format. Only lowercase letters, numbers, and hyphens allowed.',
      CORS
    );
  }

  if (logContext) {
    logInfo('Fetching MCP server for generation', {
      ...logContext,
      slug: sanitizedSlug,
    });
  }

  // Fetch MCP server using existing RPC (reuse existing pattern)
  const rpcArgs = {
    p_category: 'mcp' as const,
    p_slug: sanitizedSlug,
    p_base_url: Deno.env.get('SITE_URL') || '',
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];

  const { data, error } = await supabaseAnon.rpc('get_api_content_full', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:get_api_content_full', CORS);
  }

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

  // Parse JSON string returned by RPC (same pattern as other handlers)
  const contentData = typeof data === 'string' ? JSON.parse(data) : data;

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

  // TypeScript will infer the type from our validation
  // We can safely access mcpb_storage_url as it's part of the generated type
  const mcpServer = contentData satisfies DatabaseGenerated['public']['Tables']['content']['Row'];

  // Check if .mcpb already exists
  // mcpb_storage_url field exists in generated types (database.types.ts)
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
  // Full on-demand generation requires Deno-compatible refactoring of generation logic
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
}
