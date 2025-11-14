import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
} from '../../_shared/utils/http.ts';
import { proxyStorageFile } from '../../_shared/utils/storage-proxy.ts';
import { SITE_URL, supabaseAnon } from '../../_shared/utils/supabase-clients.ts';

const CORS_JSON = getOnlyCorsHeaders;
const CORS_MARKDOWN = getWithAcceptCorsHeaders;

export async function handleRecordExport(
  category: string,
  slug: string,
  url: URL
): Promise<Response> {
  const format = (url.searchParams.get('format') || 'json').toLowerCase();

  switch (format) {
    case 'json':
      return handleJsonFormat(category, slug);
    case 'markdown':
    case 'md':
      return handleMarkdownFormat(category, slug, url);
    case 'llms':
    case 'llms-txt':
      return handleItemLlmsTxt(category, slug);
    case 'storage':
      return handleStorageFormat(category, slug);
    default:
      return badRequestResponse(
        'Invalid format. Valid formats: json, markdown, llms-txt, storage',
        CORS_JSON
      );
  }
}

async function handleJsonFormat(category: string, slug: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('get_api_content_full', {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  });

  if (error) {
    return errorResponse(error, 'data-api:get_api_content_full', CORS_JSON);
  }

  if (!data) {
    return badRequestResponse('Content not found', CORS_JSON);
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.get_api_content_full',
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleMarkdownFormat(category: string, slug: string, url: URL): Promise<Response> {
  const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
  const includeFooter = url.searchParams.get('includeFooter') === 'true';

  const { data, error } = await supabaseAnon.rpc('generate_markdown_export', {
    p_category: category,
    p_slug: slug,
    p_include_metadata: includeMetadata,
    p_include_footer: includeFooter,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_markdown_export', CORS_MARKDOWN);
  }

  if (!(data?.success && data.markdown)) {
    return badRequestResponse(data?.error || 'Failed to generate markdown', CORS_MARKDOWN);
  }

  return new Response(data.markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${data.filename}"`,
      'X-Generated-By': 'supabase.rpc.generate_markdown_export',
      'X-Content-ID': data.content_id,
      ...CORS_MARKDOWN,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleItemLlmsTxt(category: string, slug: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_item_llms_txt', {
    p_category: category,
    p_slug: slug,
  });

  if (error) {
    return errorResponse(error, 'data-api:generate_item_llms_txt', CORS_JSON);
  }

  if (!data) {
    return badRequestResponse('LLMs.txt content not found', CORS_JSON);
  }

  const formatted = data.replace(/\\n/g, '\n');

  return new Response(formatted, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Generated-By': 'supabase.rpc.generate_item_llms_txt',
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleStorageFormat(category: string, slug: string): Promise<Response> {
  if (category !== 'skills') {
    return badRequestResponse(`Storage format not supported for category '${category}'`, CORS_JSON);
  }

  const { data: content, error } = await supabaseAnon
    .from('content')
    .select('storage_url')
    .eq('category', category)
    .eq('slug', slug)
    .single();

  if (error || !content?.storage_url) {
    return badRequestResponse('Storage file not found', CORS_JSON);
  }

  const match = content.storage_url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  if (!match) {
    return errorResponse(
      new Error('Invalid storage URL format'),
      'data-api:storage_format',
      CORS_JSON
    );
  }

  const [, bucket, path] = match;
  return proxyStorageFile({
    bucket,
    path,
    cacheControl: 'public, max-age=31536000, immutable',
  });
}
