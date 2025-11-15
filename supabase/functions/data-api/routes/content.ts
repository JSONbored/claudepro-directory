import { buildReadmeMarkdown, type ReadmeData } from '../../_shared/changelog/readme-builder.ts';
import { supabaseAnon } from '../../_shared/clients/supabase.ts';
import { VALID_CONTENT_CATEGORIES } from '../../_shared/config/constants/categories.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  jsonResponse,
  methodNotAllowedResponse,
} from '../../_shared/utils/http.ts';
import { handlePaginatedContent } from './content-paginated.ts';
import { handleRecordExport } from './content-record.ts';

const CORS = getOnlyCorsHeaders;

export async function handleContentRoute(
  segments: string[],
  url: URL,
  method: string
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
      return handleSitewideContent(url);
    }
    if (first === 'paginated') {
      return handlePaginatedContent(url);
    }
    if (first === 'changelog') {
      return handleChangelogIndex(format);
    }
    if (VALID_CONTENT_CATEGORIES.includes(first)) {
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
    if (VALID_CONTENT_CATEGORIES.includes(first)) {
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

async function handleSitewideContent(url: URL): Promise<Response> {
  const format = (url.searchParams.get('format') || 'readme').toLowerCase();

  if (format === 'readme') {
    return handleSitewideReadme();
  }

  if (format === 'llms' || format === 'llms-txt') {
    return handleSitewideLlmsTxt();
  }

  return badRequestResponse(
    `Invalid sitewide format '${format}'. Valid formats: readme, llms-txt`,
    CORS
  );
}

async function handleSitewideReadme(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_readme_data');

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

  const markdown = buildReadmeMarkdown(data as ReadmeData);

  console.log('[data-api] sitewide readme generated', {
    bytes: markdown.length,
    categories: (data as ReadmeData).categories.length,
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

async function handleSitewideLlmsTxt(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_sitewide_llms_txt');

  if (error) {
    return errorResponse(error, 'data-api:generate_sitewide_llms_txt', CORS);
  }

  if (!data) {
    return jsonResponse(
      { error: 'Sitewide LLMs export failed', message: 'RPC returned null' },
      500,
      CORS
    );
  }

  const formatted = data.replace(/\\n/g, '\n');

  console.log('[data-api] sitewide llms generated', {
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

function handleChangelogIndex(format: string): Promise<Response> {
  if (format === 'llms-changelog') {
    return handleChangelogLlmsTxt();
  }
  return badRequestResponse(`Invalid format '${format}' for changelog index`, CORS);
}

function handleCategoryOnly(category: string, format: string): Promise<Response> {
  if (format === 'llms-category') {
    return handleCategoryLlmsTxt(category);
  }
  return badRequestResponse(`Invalid format '${format}' for category-only route`, CORS);
}

function handleChangelogEntry(slug: string, format: string): Promise<Response> {
  if (format === 'llms-entry') {
    return handleChangelogEntryLlmsTxt(slug);
  }
  return badRequestResponse(`Invalid format '${format}' for changelog entry`, CORS);
}

function handleToolLlmsTxt(tool: string, format: string): Promise<Response> {
  if (format === 'llms-tool') {
    return handleToolLlms(tool);
  }
  return badRequestResponse(`Invalid format '${format}' for tool`, CORS);
}

async function handleCategoryLlmsTxt(category: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_category_llms_txt', {
    p_category: category,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_category_llms_txt', CORS);
  }

  if (!data) {
    return badRequestResponse('Category LLMs.txt not found', CORS);
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
  const { data, error } = await supabaseAnon.rpc('generate_changelog_llms_txt');

  if (error) {
    return errorResponse(error, 'data-api:generate_changelog_llms_txt', CORS);
  }

  if (!data) {
    return badRequestResponse('Changelog LLMs.txt not found', CORS);
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
  const { data, error } = await supabaseAnon.rpc('generate_changelog_entry_llms_txt', {
    p_slug: slug,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_changelog_entry_llms_txt', CORS);
  }

  if (!data) {
    return badRequestResponse('Changelog entry LLMs.txt not found', CORS);
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
  const { data, error } = await supabaseAnon.rpc('generate_tool_llms_txt', {
    p_tool_name: tool,
  });

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
