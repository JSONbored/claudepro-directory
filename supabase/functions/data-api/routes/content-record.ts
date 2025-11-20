import { SITE_URL } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { callRpc } from '../../_shared/database-overrides.ts';

// Content category validation
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
] as const satisfies readonly DatabaseGenerated['public']['Enums']['content_category'][];

function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  return CONTENT_CATEGORY_VALUES.includes(
    value as DatabaseGenerated['public']['Enums']['content_category']
  );
}

import {
  badRequestResponse,
  buildCacheHeaders,
  errorResponse,
  getOnlyCorsHeaders,
  getWithAcceptCorsHeaders,
} from '../../_shared/utils/http.ts';
import { buildSecurityHeaders } from '../../_shared/utils/security-headers.ts';
import { proxyStorageFile } from '../../_shared/utils/storage/proxy.ts';

const CORS_JSON = getOnlyCorsHeaders;
const CORS_MARKDOWN = getWithAcceptCorsHeaders;

export async function handleRecordExport(
  category: string,
  slug: string,
  url: URL
): Promise<Response> {
  // Validate category is valid ENUM value (for all formats)
  // Database will also validate, but we check early for better error messages
  if (!isValidContentCategory(category)) {
    return badRequestResponse(
      `Invalid category '${category}'. Valid categories: ${CONTENT_CATEGORY_VALUES.join(', ')}`,
      CORS_JSON
    );
  }

  // Type guard has narrowed category to ENUM - database will validate
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

async function handleJsonFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string
): Promise<Response> {
  // Category is already validated ENUM - database will validate
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
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleMarkdownFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string,
  url: URL
): Promise<Response> {
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

  if (!data) {
    return badRequestResponse('Markdown generation failed: RPC returned null', CORS_MARKDOWN);
  }

  // Use generated type from database.types.ts (returns Json)
  // Type assertion to the known structure (discriminated union)
  type MarkdownExportResult =
    | { success: true; markdown: string; filename: string; length: number; content_id: string }
    | { success: false; error: string };
  const result = data as MarkdownExportResult | null;

  if (!result || typeof result !== 'object' || !('success' in result)) {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  if (!result.success) {
    // TypeScript narrows to failure case
    const errorResult = result as { success: false; error: string };
    return badRequestResponse(errorResult.error, CORS_MARKDOWN);
  }

  // TypeScript narrows to success case - all fields are properly typed
  return new Response(result.markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${result.filename}"`,
      'X-Generated-By': 'supabase.rpc.generate_markdown_export',
      'X-Content-ID': result.content_id,
      ...buildSecurityHeaders(),
      ...CORS_MARKDOWN,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleItemLlmsTxt(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string
): Promise<Response> {
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
      ...buildSecurityHeaders(),
      ...CORS_JSON,
      ...buildCacheHeaders('content_export'),
    },
  });
}

async function handleStorageFormat(
  category: DatabaseGenerated['public']['Enums']['content_category'],
  slug: string
): Promise<Response> {
  // Support both 'skills' and 'mcp' categories for storage format
  if (category === 'skills') {
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

  if (category === 'mcp') {
    // get_mcpb_storage_path RPC function (properly typed in database-overrides.ts)
    const rpcArgs = {
      p_slug: slug,
    };
    const { data, error } = await callRpc('get_mcpb_storage_path', rpcArgs, true);

    if (error) {
      return errorResponse(error, 'data-api:get_mcpb_storage_path', CORS_JSON);
    }

    type StoragePathResult =
      DatabaseGenerated['public']['Functions']['get_mcpb_storage_path']['Returns'];
    const result = data as StoragePathResult;
    const location = Array.isArray(result) ? result[0] : result;
    if (
      !location ||
      typeof location !== 'object' ||
      !('bucket' in location) ||
      !('object_path' in location)
    ) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
    }
    const typedLocation = location as { bucket: string; object_path: string };

    return proxyStorageFile({
      bucket: typedLocation.bucket,
      path: typedLocation.object_path,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  return badRequestResponse(
    `Storage format not supported for category '${category}'. Supported categories: skills, mcp`,
    CORS_JSON
  );
}
