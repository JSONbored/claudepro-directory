import { SITE_URL, supabaseAnon } from '../../_shared/clients/supabase.ts';
import type { Database as DatabaseGenerated } from '../../_shared/database.types.ts';
import { Constants } from '../../_shared/database.types.ts';

// Use enum values directly from database.types.ts Constants
const CONTENT_CATEGORY_VALUES = Constants.public.Enums.content_category;

function isValidContentCategory(
  value: string
): value is DatabaseGenerated['public']['Enums']['content_category'] {
  // Validate without type assertion
  for (const validValue of CONTENT_CATEGORY_VALUES) {
    if (value === validValue) {
      return true;
    }
  }
  return false;
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
  const { data, error } = await supabaseAnon.rpc('get_api_content_full', rpcArgs);

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
  const { data, error } = await supabaseAnon.rpc('generate_markdown_export', rpcArgs);

  if (error) {
    return errorResponse(error, 'data-api:generate_markdown_export', CORS_MARKDOWN);
  }

  if (!data) {
    return badRequestResponse('Markdown generation failed: RPC returned null', CORS_MARKDOWN);
  }

  // Validate data structure without type assertion
  if (typeof data !== 'object' || data === null || !('success' in data)) {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  // Safely extract properties
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc?.value;
  };

  const success = getProperty(data, 'success');
  if (typeof success !== 'boolean') {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  if (!success) {
    // Failure case
    const error = getProperty(data, 'error');
    if (typeof error !== 'string') {
      return badRequestResponse('Markdown generation failed: invalid error', CORS_MARKDOWN);
    }
    return badRequestResponse(error, CORS_MARKDOWN);
  }

  // Success case - validate required fields
  const markdown = getProperty(data, 'markdown');
  const filename = getProperty(data, 'filename');
  const contentId = getProperty(data, 'content_id');

  if (
    typeof markdown !== 'string' ||
    typeof filename !== 'string' ||
    typeof contentId !== 'string'
  ) {
    return badRequestResponse('Markdown generation failed: invalid response', CORS_MARKDOWN);
  }

  const result = {
    success: true,
    markdown,
    filename,
    content_id: contentId,
  };

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
  const { data, error } = await supabaseAnon.rpc('generate_item_llms_txt', rpcArgs);

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
    const { data, error } = await supabaseAnon.rpc('get_skill_storage_path', rpcArgs);

    if (error) {
      return errorResponse(error, 'data-api:get_skill_storage_path', CORS_JSON);
    }

    // Validate data structure without type assertion
    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    // Safely extract properties
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

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!(bucket && objectPath)) {
      return badRequestResponse('Storage file not found', CORS_JSON);
    }

    const typedLocation = { bucket, object_path: objectPath };

    return proxyStorageFile({
      bucket: typedLocation.bucket,
      path: typedLocation.object_path,
      cacheControl: 'public, max-age=31536000, immutable',
    });
  }

  if (category === 'mcp') {
    // get_mcpb_storage_path RPC function (uses generated types from database.types.ts)
    const rpcArgs = {
      p_slug: slug,
    } satisfies DatabaseGenerated['public']['Functions']['get_mcpb_storage_path']['Args'];
    const { data, error } = await supabaseAnon.rpc('get_mcpb_storage_path', rpcArgs);

    if (error) {
      return errorResponse(error, 'data-api:get_mcpb_storage_path', CORS_JSON);
    }

    // Validate data structure without type assertion
    const result = data;
    const location = Array.isArray(result) ? result[0] : result;

    // Safely extract properties
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

    const bucket = getStringProperty(location, 'bucket');
    const objectPath = getStringProperty(location, 'object_path');

    if (!(bucket && objectPath)) {
      return badRequestResponse('MCPB package not found', CORS_JSON);
    }

    const typedLocation = { bucket, object_path: objectPath };

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
