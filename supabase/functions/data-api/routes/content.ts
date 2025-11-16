import { buildReadmeMarkdown, type ReadmeData } from '../../_shared/changelog/readme-builder.ts';
import { VALID_CONTENT_CATEGORIES } from '../../_shared/config/constants/categories.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import type { BaseLogContext } from '../../_shared/utils/logging.ts';
import { handlePaginatedContent } from './content-paginated.ts';
import { handleRecordExport } from './content-record.ts';

const CORS = getOnlyCorsHeaders;

export async function handleContentRoute(
  segments: string[],
  url: URL,
  method: string,
  logContext?: BaseLogContext
): Promise<Response> {
  if (method !== 'GET') {
    return methodNotAllowedResponse('GET', CORS);
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
    if (
      first &&
      VALID_CONTENT_CATEGORIES.includes(first as (typeof VALID_CONTENT_CATEGORIES)[number])
    ) {
      return handleCategoryOnly(first, format);
    }
  }

  if (segments.length === 2) {
    const [first, second] = segments;
    if (first === 'changelog') {
      return handleChangelogEntry(second, format);
    }
    if (first === 'tools') {
      return handleToolLlmsTxt(second, format);
    }
    if (
      first &&
      VALID_CONTENT_CATEGORIES.includes(first as (typeof VALID_CONTENT_CATEGORIES)[number])
    ) {
      return handleRecordExport(first, second, url);
    }
    return badRequestResponse(
      `Invalid category '${first}'. Valid categories: ${VALID_CONTENT_CATEGORIES.join(', ')}`,
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
  const { data, error } = await callRpc(
    'generate_readme_data',
    {} as DatabaseGenerated['public']['Functions']['generate_readme_data']['Args'],
    true
  );

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

  // Validate data structure before using
  if (!data || typeof data !== 'object' || !('categories' in data)) {
    return jsonResponse(
      { error: 'README generation failed', message: 'Invalid data structure' },
      500,
      CORS
    );
  }
  // Type assertion needed - RPC returns Json type which needs conversion
  const readmeData = data as unknown as ReadmeData;
  const markdown = buildReadmeMarkdown(readmeData);

  console.log('[data-api] Sitewide readme generated', {
    ...(logContext || {}),
    bytes: markdown.length,
    categories: readmeData.categories.length,
  });

  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_readme_data',
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleSitewideLlmsTxt(logContext?: BaseLogContext): Promise<Response> {
  const { data, error } = await callRpc(
    'generate_sitewide_llms_txt',
    {} as DatabaseGenerated['public']['Functions']['generate_sitewide_llms_txt']['Args'],
    true
  );

  if (error) {
    return errorResponse(error, 'data-api:generate_sitewide_llms_txt', CORS);
  }

  if (!data || typeof data !== 'string') {
    return jsonResponse(
      { error: 'Sitewide LLMs export failed', message: 'RPC returned null or invalid' },
      500,
      CORS
    );
  }

  const formatted = data.replace(/\\n/g, '\n');

  console.log('[data-api] Sitewide llms generated', {
    ...(logContext || {}),
    bytes: formatted.length,
  });

  return new Response(formatted, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_sitewide_llms_txt',
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
  const { data, error } = await callRpc('generate_category_llms_txt', rpcArgs, true);

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
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleChangelogLlmsTxt(): Promise<Response> {
  const { data, error } = await callRpc(
    'generate_changelog_llms_txt',
    {} as DatabaseGenerated['public']['Functions']['generate_changelog_llms_txt']['Args'],
    true
  );

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
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleChangelogEntryLlmsTxt(slug: string): Promise<Response> {
  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_changelog_entry_llms_txt']['Args'];
  const { data, error } = await callRpc('generate_changelog_entry_llms_txt', rpcArgs, true);

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
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleToolLlms(tool: string): Promise<Response> {
  const rpcArgs = {
    p_tool_name: tool,
  } satisfies DatabaseGenerated['public']['Functions']['generate_tool_llms_txt']['Args'];
  const { data, error } = await callRpc('generate_tool_llms_txt', rpcArgs, true);

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
      ...CORS,
      ...buildCacheHeaders('content_export'),
    },
  });
}
