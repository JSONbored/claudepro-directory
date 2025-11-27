/**
 * Package Generation Route Handler
 *
 * Handles POST /content/generate-package requests for automatic package generation.
 * Internal-only endpoint (requires SUPABASE_SERVICE_ROLE_KEY authentication).
 *
 * Authentication:
 * - Database triggers use: Authorization: Bearer <service_role_key>
 * - The service role key is available via SUPABASE_SERVICE_ROLE_KEY environment variable
 * - This key is automatically set by Supabase for all edge functions
 *
 * Uses extensible generator registry to support multiple content categories.
 */

import { Constants, type Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  badRequestResponse,
  errorResponse,
  getOnlyCorsHeaders,
  initRequestLogging,
  jsonResponse,
  methodNotAllowedResponse,
  parseJsonBody,
  pgmqSend,
  supabaseServiceRole,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import { buildSecurityHeaders, logError, logInfo, logger, timingSafeEqual } from '@heyclaude/shared-runtime';
import { getGenerator, getSupportedCategories, isCategorySupported } from './registry.ts';
import type { GeneratePackageRequest, GeneratePackageResponse } from './types.ts';

// Use generated type directly from database
type ContentRow = DatabaseGenerated['public']['Tables']['content']['Row'];

const CORS = getOnlyCorsHeaders;

/**
 * Handle package generation request
 * POST /content/generate-package
 *
 * Body: { content_id: string, category: ContentCategory }
 *
 * Authentication: Requires SUPABASE_SERVICE_ROLE_KEY (via Authorization: Bearer header)
 */
export async function handleGeneratePackage(
  request: Request,
  logContext?: BaseLogContext
): Promise<Response> {
  // Create log context if not provided
  const finalLogContext = logContext || {
    function: 'content-generate',
    action: 'generate-package',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
  };
  
  // Initialize request logging with trace and bindings
  initRequestLogging(finalLogContext);
  traceStep('Package generation request received', finalLogContext);
  
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
  
  // Set bindings for this request
  logger.setBindings({
    requestId: finalLogContext.request_id,
    operation: finalLogContext.action || 'generate-package',
    method: request.method,
  });

  // Authenticate: Internal-only endpoint (requires service role key)
  // Database triggers and internal services use SUPABASE_SERVICE_ROLE_KEY
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    if (logContext) {
      logError('SUPABASE_SERVICE_ROLE_KEY not configured', logContext);
    }
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

  // Accept Authorization: Bearer <service_role_key> header
  // Database triggers use: Authorization: Bearer <service_role_key>
  const authHeader = request.headers.get('Authorization');
  const providedKey = authHeader?.replace('Bearer ', '').trim();

  // Use timing-safe comparison to prevent timing attacks
  if (!providedKey || !timingSafeEqual(providedKey, serviceRoleKey)) {
    if (logContext) {
      logInfo('Unauthorized package generation request', {
        ...logContext,
        hasAuthHeader: !!authHeader,
        hasKey: !!providedKey,
      });
    }
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
  const parseResult = await parseJsonBody<GeneratePackageRequest>(request, {
    maxSize: 10 * 1024, // 10KB max (just JSON with IDs)
    cors: CORS,
  });

  if (!parseResult.success) {
    return parseResult.response;
  }

  const { content_id, category } = parseResult.data;

  // Validate required fields
  if (!content_id || typeof content_id !== 'string') {
    return badRequestResponse('content_id is required and must be a string', CORS);
  }

  if (!category || typeof category !== 'string') {
    return badRequestResponse('category is required and must be a string', CORS);
  }

  // Validate category enum type
  function isValidContentCategory(
    value: unknown
  ): value is DatabaseGenerated['public']['Enums']['content_category'] {
    if (typeof value !== 'string') {
      return false;
    }
    // Use enum values directly from @heyclaude/database-types Constants
    return Constants.public.Enums.content_category.includes(
      value as DatabaseGenerated['public']['Enums']['content_category']
    );
  }

  if (!isValidContentCategory(category)) {
    return badRequestResponse(`Category '${category}' is not a valid content category`, CORS);
  }

  // Check if category is supported
  if (!isCategorySupported(category)) {
    return badRequestResponse(
      `Category '${category}' does not support package generation. Supported categories: ${getSupportedCategories().join(', ')}`,
      CORS
    );
  }

  // Get generator for category
  const generator = getGenerator(category);
  if (!generator) {
    return errorResponse(
      new Error(`Generator not found for category '${category}'`),
      'content-generate:getGenerator',
      CORS,
      logContext
    );
  }

  // Fetch content from database
  const { data: content, error: fetchError } = await supabaseServiceRole
    .from('content')
    .select('*')
    .eq('id', content_id)
    .single();

  if (fetchError || !content) {
    if (logContext) {
      logError('Content not found', logContext, fetchError);
    }
    return jsonResponse(
      {
        error: 'Not Found',
        message: `Content with ID '${content_id}' not found`,
        content_id,
      },
      404,
      {
        ...CORS,
        ...buildSecurityHeaders(),
      }
    );
  }

  // Content is guaranteed to be non-null after the check above
  // Use satisfies to ensure type correctness without assertion
  const contentRow = content satisfies ContentRow;

  // Validate content can be generated
  if (!generator.canGenerate(contentRow)) {
    return badRequestResponse(
      `Content '${content_id}' cannot be generated. Missing required fields or invalid category.`,
      CORS
    );
  }

  // Check if async mode is requested (via query parameter or header)
  const url = new URL(request.url);
  const asyncParam = url.searchParams.get('async') === 'true';
  const asyncHeader = request.headers.get('X-Async-Mode') === 'true';
  const asyncMode = asyncParam || asyncHeader;

  // Async mode: Enqueue to queue and return immediately
  if (asyncMode) {
    try {
      if (logContext) {
        logInfo('Enqueuing package generation', {
          ...logContext,
          content_id,
          category,
          slug: contentRow.slug,
        });
      }

      await pgmqSend('package_generation', {
        content_id,
        category,
        slug: contentRow.slug || '',
        created_at: new Date().toISOString(),
      });

      const response: GeneratePackageResponse = {
        success: true,
        content_id,
        category,
        slug: contentRow.slug || '',
        storage_url: '', // Will be set when generation completes
        message: 'Package generation queued successfully',
      };

      if (logContext) {
        logInfo('Package generation queued', {
          ...logContext,
          content_id,
          category,
          slug: contentRow.slug,
        });
      }

      return jsonResponse(response, 202, {
        // 202 Accepted (async processing)
        ...CORS,
        ...buildSecurityHeaders(),
        'X-Generated-By': `data-api:content-generate:${category}`,
        'X-Processing-Mode': 'async',
      });
    } catch (error) {
      // Log error details server-side (not exposed to users)
      if (logContext) {
        logError('Failed to enqueue package generation', logContext, error);
      }

      // errorResponse accepts optional logContext, so no need for conditional
      return errorResponse(error, 'data-api:content-generate-enqueue', CORS, logContext);
    }
  }

  // Sync mode: Generate immediately (for manual triggers or testing)
  try {
    if (logContext) {
      logInfo('Generating package (sync mode)', {
        ...logContext,
        content_id,
        category,
        slug: contentRow.slug,
      });
    }

    const result = await generator.generate(contentRow);

    const response: GeneratePackageResponse = {
      success: true,
      content_id,
      category,
      slug: contentRow.slug || '',
      storage_url: result.storageUrl,
      ...(result.metadata !== undefined ? { metadata: result.metadata } : {}),
      message: 'Package generated successfully',
    };

    logInfo('Package generated successfully', {
      ...finalLogContext,
      content_id,
      category,
      slug: contentRow.slug,
      storage_url: result.storageUrl,
    });
    traceRequestComplete(finalLogContext);

    return jsonResponse(response, 200, {
      ...CORS,
      ...buildSecurityHeaders(),
      'X-Generated-By': `data-api:content-generate:${category}`,
      'X-Processing-Mode': 'sync',
    });
  } catch (error) {
    // Log error details server-side (not exposed to users)
    logError('Package generation failed', finalLogContext, error);
    return errorResponse(error, 'data-api:content-generate-sync', CORS, finalLogContext);
  }
}
