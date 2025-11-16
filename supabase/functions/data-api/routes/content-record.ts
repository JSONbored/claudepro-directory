import { SITE_URL } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';
import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
} from '../../_shared/utils/http.ts';
import { proxyStorageFile } from '../../_shared/utils/storage/proxy.ts';

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
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  } satisfies DatabaseGenerated['public']['Functions']['get_api_content_full']['Args'];
  const { data, error } = await callRpc('get_api_content_full', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:get_api_content_full', CORS_JSON);
  }

  if (!data) {
    return badRequestResponse('Content not found', CORS_JSON);
  }

  // RPC returns JSON string - ensure it's properly typed as string for Response body
  const jsonData: string = typeof data === 'string' ? data : JSON.stringify(data);
  return new Response(jsonData, {
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

  const rpcArgs = {
    p_category: category,
    p_slug: slug,
    p_include_metadata: includeMetadata,
    p_include_footer: includeFooter,
  } satisfies DatabaseGenerated['public']['Functions']['generate_markdown_export']['Args'];
  const { data, error } = await callRpc('generate_markdown_export', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:generate_markdown_export', CORS_MARKDOWN);
  }

  type MarkdownExportResult =
    DatabaseGenerated['public']['Functions']['generate_markdown_export']['Returns'];
  const result = data as MarkdownExportResult;
  if (
    !(
      result &&
      typeof result === 'object' &&
      'success' in result &&
      result.success &&
      'markdown' in result &&
      result.markdown
    )
  ) {
    const errorMsg =
      result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
        ? result.error
        : 'Failed to generate markdown';
    return badRequestResponse(errorMsg, CORS_MARKDOWN);
  }

  // Type-safe markdown response - result.markdown is Json type, ensure it's a string
  const markdownContent =
    typeof result.markdown === 'string' ? result.markdown : String(result.markdown);
  return new Response(markdownContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${(result as { filename?: string }).filename || 'export.md'}"`,
      'X-Generated-By': 'supabase.rpc.generate_markdown_export',
      'X-Content-ID': (result as { content_id?: string }).content_id || '',
      ...CORS_MARKDOWN,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleItemLlmsTxt(category: string, slug: string): Promise<Response> {
  const rpcArgs = {
    p_category: category,
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['generate_item_llms_txt']['Args'];
  const { data, error } = await callRpc('generate_item_llms_txt', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:generate_item_llms_txt', CORS_JSON);
  }

  if (!data) {
    return badRequestResponse('LLMs.txt content not found', CORS_JSON);
  }

  // Ensure data is a string for Response body
  const dataString = typeof data === 'string' ? data : String(data);
  const formatted: string = dataString.replace(/\\n/g, '\n');
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

  const rpcArgs = {
    p_slug: slug,
  } satisfies DatabaseGenerated['public']['Functions']['get_skill_storage_path']['Args'];
  const { data, error } = await callRpc('get_skill_storage_path', rpcArgs, true);

  if (error) {
    return errorResponse(error, 'data-api:get_skill_storage_path', CORS_JSON);
  }

  type StoragePathResult =
    DatabaseGenerated['public']['Functions']['get_skill_storage_path']['Returns'];
  const result = data as StoragePathResult;
  const location = Array.isArray(result) ? result[0] : result;
  if (
    !location ||
    typeof location !== 'object' ||
    !('bucket' in location) ||
    !('object_path' in location)
  ) {
    return badRequestResponse('Storage file not found', CORS_JSON);
  }
  const typedLocation = location as { bucket: string; object_path: string };

  return proxyStorageFile({
    bucket: typedLocation.bucket,
    path: typedLocation.object_path,
    cacheControl: 'public, max-age=31536000, immutable',
  });
}
