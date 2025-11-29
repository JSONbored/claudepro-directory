/**
 * Package Upload Handler
 *
 * Handles POST /content/generate-package/upload requests for uploading pre-generated packages.
 * Used by build scripts to upload CLI-validated .mcpb packages.
 *
 * Authentication: Requires SUPABASE_SERVICE_ROLE_KEY (via Authorization: Bearer header)
 *
 * Body: {
 *   content_id: string;
 *   category: 'mcp';
 *   mcpb_file: string; // base64 encoded .mcpb file
 *   content_hash: string; // pre-computed hash
 * }
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { badRequestResponse, errorResponse, postCorsHeaders, jsonResponse, methodNotAllowedResponse } from '@heyclaude/edge-runtime/utils/http.ts';
import { initRequestLogging, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime/utils/logger-helpers.ts';
import { parseJsonBody } from '@heyclaude/edge-runtime/utils/parse-json-body.ts';
import { supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import { getStorageServiceClient } from '@heyclaude/edge-runtime/utils/storage/client.ts';
import { uploadObject } from '@heyclaude/edge-runtime/utils/storage/upload.ts';
import { buildSecurityHeaders } from '@heyclaude/shared-runtime/security-headers.ts';
import { createDataApiContext, logError, logInfo, logger } from '@heyclaude/shared-runtime/logging.ts';
import { timingSafeEqual } from '@heyclaude/shared-runtime/crypto-utils.ts';

const CORS = postCorsHeaders;

interface UploadPackageRequest {
  content_id: string;
  category: DatabaseGenerated['public']['Enums']['content_category'];
  mcpb_file: string; // base64 encoded
  content_hash: string;
}

interface UploadPackageResponse {
  success: boolean;
  content_id: string;
  category: DatabaseGenerated['public']['Enums']['content_category'];
  slug: string;
  storage_url: string;
  message?: string;
  error?: string;
}

/**
 * Handle internal MCP package uploads for an existing content entry.
 *
 * Validates service-role authorization, accepts a base64-encoded `.mcpb` package for content with category `mcp`, stores the file in object storage, updates the content record with the storage URL and build metadata, and returns the upload result.
 *
 * @param request - The incoming HTTP request
 * @param logContext - Optional logging context to attach to request logs and traces; if omitted a context is created
 * @returns An UploadPackageResponse object containing `success`, `content_id`, `category`, `slug`, `storage_url`, and an optional `message` or `error`
 */
export async function handleUploadPackage(
  request: Request,
  logContext?: Record<string, unknown>
): Promise<Response> {
  // Create log context if not provided
  const finalLogContext = logContext || createDataApiContext('content-generate-upload', {
    path: '/content/generate-package/upload',
    method: request.method,
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(finalLogContext);
  traceStep('Package upload request received', finalLogContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof finalLogContext['request_id'] === 'string' ? finalLogContext['request_id'] : undefined,
    operation: typeof finalLogContext['action'] === 'string' ? finalLogContext['action'] : 'package-upload',
    method: request.method,
  });
  
  // Only allow POST
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        ...buildSecurityHeaders(),
        ...CORS,
      },
    });
  }

  if (request.method !== 'POST') {
    return methodNotAllowedResponse('POST', CORS);
  }

  // Authenticate: Internal-only endpoint (requires service role key)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    await logError('SUPABASE_SERVICE_ROLE_KEY not configured', finalLogContext);
    return jsonResponse(
      {
        error: 'Internal Server Error',
        message: 'Service role key not configured',
      },
      500,
      {
        ...CORS,
        ...buildSecurityHeaders(),
      }
    );
  }

  // Accept Authorization: Bearer <service_role_key> header (case-insensitive)
  const authHeader = request.headers.get('Authorization');
  const providedKey = authHeader?.replace(/^Bearer\s+/i, '').trim();

  if (!providedKey || !timingSafeEqual(providedKey, serviceRoleKey)) {
    logInfo('Unauthorized package upload request', {
      ...finalLogContext,
      hasAuthHeader: !!authHeader,
      hasKey: !!providedKey,
    });
    return jsonResponse(
      {
        error: 'Unauthorized',
        message: 'Invalid or missing service role key. This endpoint is for internal use only.',
      },
      401,
      {
        ...CORS,
        ...buildSecurityHeaders(),
      }
    );
  }

  // Parse request body
  const parseResult = await parseJsonBody<UploadPackageRequest>(request, {
    maxSize: 50 * 1024 * 1024, // 50MB max (for base64 encoded .mcpb files)
    cors: CORS,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const { content_id, category, mcpb_file, content_hash } = parseResult.data;

  // Validate required fields
  if (!content_id || typeof content_id !== 'string') {
    return badRequestResponse('Missing or invalid content_id', CORS);
  }

  /**
   * Checks whether a value is one of the known `content_category` enum values.
   *
   * Narrows the type to `DatabaseGenerated['public']['Enums']['content_category']` when true.
   *
   * @param value - The value to validate as a `content_category`
   * @returns `true` if `value` matches a `content_category` enum member, `false` otherwise.
   */
  function isValidContentCategory(
    value: unknown
  ): value is DatabaseGenerated['public']['Enums']['content_category'] {
    if (typeof value !== 'string') {
      return false;
    }
    // Use enum values directly from @heyclaude/database-types Constants
    const validValues = Constants.public.Enums.content_category;
    for (const validValue of validValues) {
      if (value === validValue) {
        return true;
      }
    }
    return false;
  }

  if (!isValidContentCategory(category)) {
    return badRequestResponse(`Category '${category}' is not a valid content category`, CORS);
  }

  if (category !== 'mcp') {
    return badRequestResponse(
      `Invalid category '${category}'. Only 'mcp' category is supported for package uploads.`,
      CORS
    );
  }

  if (!mcpb_file || typeof mcpb_file !== 'string') {
    return badRequestResponse('Missing or invalid mcpb_file (base64 encoded)', CORS);
  }

  if (!content_hash || typeof content_hash !== 'string') {
    return badRequestResponse('Missing or invalid content_hash', CORS);
  }

  try {
    // Fetch content from database to get slug
    const { data: contentData, error: fetchError } = await supabaseServiceRole
      .from('content')
      .select('id, slug, category')
      .eq('id', content_id)
      .single();

    if (fetchError || !contentData) {
      // Use dbQuery serializer for consistent database query formatting
      await logError('Content not found for upload', {
        ...finalLogContext,
        dbQuery: {
          table: 'content',
          operation: 'select',
          schema: 'public',
          args: {
            id: content_id,
          },
        },
      }, fetchError);
      return jsonResponse(
        {
          success: false,
          content_id,
          category,
          slug: '',
          storage_url: '',
          error: 'Not Found',
          message: `Content with id '${content_id}' not found`,
        } satisfies UploadPackageResponse,
        404,
        {
          ...CORS,
          ...buildSecurityHeaders(),
        }
      );
    }

    // Content is guaranteed to be non-null after the check above
    type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];
    const content = contentData satisfies Pick<ContentRow, 'id' | 'slug' | 'category'>;

    // Validate category matches
    if (content.category !== 'mcp') {
      return badRequestResponse(
        `Content category mismatch. Expected 'mcp', got '${content.category}'`,
        CORS
      );
    }

    if (!content.slug) {
      return badRequestResponse('Content slug is required for MCP package upload', CORS);
    }

    // Decode base64 file to ArrayBuffer
    let mcpbBuffer: ArrayBuffer;
    try {
      // Decode base64 to binary string, then to ArrayBuffer
      const binaryString = atob(mcpb_file);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      mcpbBuffer = bytes.buffer;
    } catch (error) {
      await logError('Failed to decode base64 mcpb_file', finalLogContext, error);
      return badRequestResponse('Invalid base64 encoding in mcpb_file', CORS);
    }

    // Upload to Supabase Storage
    const fileName = `packages/${content.slug}.mcpb`;
    const uploadResult = await uploadObject({
      bucket: 'mcpb-packages',
      buffer: mcpbBuffer,
      mimeType: 'application/zip',
      objectPath: fileName,
      cacheControl: '3600',
      upsert: true,
      client: getStorageServiceClient(),
    });

    if (!(uploadResult.success && uploadResult.publicUrl)) {
      await logError('Storage upload failed', finalLogContext, {
        error: uploadResult['error'] || 'Unknown upload error',
        content_id,
        slug: content.slug,
      });
      return jsonResponse(
        {
          success: false,
          content_id,
          category,
          slug: content.slug,
          storage_url: '',
          error: 'Upload Failed',
          message: uploadResult['error'] || 'Failed to upload .mcpb package to storage',
        } satisfies UploadPackageResponse,
        500,
        {
          ...CORS,
          ...buildSecurityHeaders(),
        }
      );
    }

    // Update database with storage URL and build metadata
    const updateData = {
      mcpb_storage_url: uploadResult.publicUrl,
      mcpb_build_hash: content_hash,
      mcpb_last_built_at: new Date().toISOString(),
    } satisfies DatabaseGenerated['public']['Tables']['content']['Update'];

    const { error: updateError } = await supabaseServiceRole
      .from('content')
      .update(updateData)
      .eq('id', content_id);

    if (updateError) {
      // Use dbQuery serializer for consistent database query formatting
      await logError('Database update failed', {
        ...finalLogContext,
        dbQuery: {
          table: 'content',
          operation: 'update',
          schema: 'public',
          args: {
            id: content_id,
            // Update fields redacted by Pino's redact config
          },
        },
      }, updateError);
      return jsonResponse(
        {
          success: false,
          content_id,
          category,
          slug: content.slug,
          storage_url: '',
          error: 'Database Update Failed',
          message: updateError instanceof Error ? updateError.message : String(updateError),
        } satisfies UploadPackageResponse,
        500,
        {
          ...CORS,
          ...buildSecurityHeaders(),
        }
      );
    }

    logInfo('Package uploaded successfully', {
      ...finalLogContext,
      content_id,
      category,
      slug: content.slug,
      storage_url: uploadResult.publicUrl,
    });
    traceRequestComplete(finalLogContext);

    const response: UploadPackageResponse = {
      success: true,
      content_id,
      category,
      slug: content.slug,
      storage_url: uploadResult.publicUrl,
      message: 'Package uploaded and database updated successfully',
    };

    return jsonResponse(response, 200, {
      ...CORS,
      ...buildSecurityHeaders(),
      'X-Uploaded-By': 'data-api:content-generate:upload',
    });
  } catch (error) {
    // Log the real error server-side for debugging
    await logError('Package upload failed', finalLogContext, error);
    return await errorResponse(error, 'data-api:content-generate-upload', CORS, finalLogContext);
  }
}