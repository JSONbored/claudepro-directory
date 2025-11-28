/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Logo Optimization Route
 * 
 * Optimizes company logos by:
 * - Resizing to maximum dimensions (maintains aspect ratio)
 * - Converting to PNG format
 * - Uploading to Supabase Storage
 * - Updating database with optimized logo URL
 * 
 * Performance optimizations:
 * - Uses PNG format for compatibility and quality
 * - Processes in memory (no temp files for small logos)
 * - Validates input size before processing
 * - Returns early on validation failures
 */

import {
  badRequestResponse,
  initRequestLogging,
  publicCorsHeaders,
  traceRequestComplete,
  traceStep,
  jsonResponse,
  uploadObject,
  getStorageServiceClient,
} from '@heyclaude/edge-runtime';
import {
  createDataApiContext,
  logError,
  logInfo,
  logger,
} from '@heyclaude/shared-runtime';
import {
  optimizeImage,
  getImageDimensions,
} from '@heyclaude/shared-runtime/image/manipulation.ts';
import { MagickFormat } from '@imagemagick/magick-wasm';

const CORS = publicCorsHeaders;

// Logo optimization constants (optimized for performance and quality)
const LOGO_MAX_DIMENSION = 512; // Reasonable max for logos (balances quality vs file size)
const LOGO_QUALITY = 90; // High quality for logos (90% is optimal for PNG logos)
const MAX_INPUT_SIZE = 5 * 1024 * 1024; // 5MB max input (prevents memory issues)

/**
 * Request body schema for logo optimization
 */
interface LogoOptimizeRequest {
  /** Image data as base64 string or Uint8Array */
  imageData?: string | Uint8Array;
  /** Company ID to update (optional - if not provided, just returns optimized image) */
  companyId?: string;
  /** User ID for storage path organization */
  userId: string;
  /** Optional: existing logo path to delete after successful upload */
  oldLogoPath?: string;
  /** Optional: custom max dimension (default: 512px) */
  maxDimension?: number;
}

/**
 * Response schema
 */
interface LogoOptimizeResponse {
  success: boolean;
  publicUrl?: string;
  path?: string;
  originalSize?: number;
  optimizedSize?: number;
  dimensions?: { width: number; height: number };
  error?: string;
}

/**
 * Optimize and store a company logo image uploaded to the server.
 *
 * Validates and authenticates the request, accepts JSON or multipart/form-data input,
 * decodes and checks image size, resizes/converts the image (PNG/JPEG) within configured limits,
 * uploads the optimized image to the `company-logos` storage bucket, optionally deletes an old logo,
 * optionally updates the company's `logo` field in the database, and returns upload and size metadata.
 *
 * @returns A Response whose JSON body is a LogoOptimizeResponse containing `success`, optional `publicUrl` and `path`,
 *          `originalSize`, `optimizedSize`, optional `dimensions`, and an `error` message when applicable.
 */
export async function handleLogoOptimizeRoute(req: Request): Promise<Response> {
  const logContext = createDataApiContext('transform-image-logo', {
    path: 'transform/image/logo',
    method: 'POST',
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Logo optimization request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'logo-optimize',
    method: req.method,
  });

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  // Authenticate: Internal-only endpoint (requires service role key)
  // This endpoint performs privileged operations (storage uploads, DB updates)
  // and must be protected from unauthorized access
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    await logError('SUPABASE_SERVICE_ROLE_KEY not configured', logContext);
    return jsonResponse(
      {
        success: false,
        error: 'Internal Server Error',
      } satisfies LogoOptimizeResponse,
      500,
      CORS
    );
  }

  // Accept Authorization: Bearer <service_role_key> header
  const authHeader = req.headers.get('Authorization');
  const providedKey = authHeader?.replace('Bearer ', '').trim();

  if (!providedKey || providedKey !== serviceRoleKey) {
    logInfo('Unauthorized logo optimization request', logContext);
    return jsonResponse(
      {
        success: false,
        error: 'Unauthorized',
      } satisfies LogoOptimizeResponse,
      401,
      CORS
    );
  }

  try {
    traceStep('Processing logo optimization', logContext);
    // Parse request body
    let body: LogoOptimizeRequest;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const imageFile = formData.get('image') as File | null;
      const userId = formData.get('userId') as string | null;
      const companyId = formData.get('companyId') as string | null;
      const oldLogoPath = formData.get('oldLogoPath') as string | null;
      const maxDimensionStr = formData.get('maxDimension') as string | null;

      if (!imageFile || !userId) {
        return badRequestResponse('Missing required fields: image and userId', CORS);
      }

      const imageData = new Uint8Array(await imageFile.arrayBuffer());
      
      // Validate maxDimension if provided
      let maxDimension: number | undefined;
      if (maxDimensionStr) {
        const parsed = Number.parseInt(maxDimensionStr, 10);
        if (Number.isNaN(parsed) || parsed < 0) {
          return badRequestResponse(
            `Invalid maxDimension: must be a non-negative integer, got "${maxDimensionStr}"`,
            CORS
          );
        }
        maxDimension = parsed;
      }
      
      body = {
        imageData,
        userId,
        ...(companyId ? { companyId } : {}),
        ...(oldLogoPath ? { oldLogoPath } : {}),
        ...(maxDimension !== undefined ? { maxDimension } : {}),
      };
    } else {
      return badRequestResponse('Content-Type must be application/json or multipart/form-data', CORS);
    }

    // Validate required fields
    if (!body.imageData || !body.userId) {
      return badRequestResponse('Missing required fields: imageData and userId', CORS);
    }

    // Convert base64 to Uint8Array if needed
    let imageBytes: Uint8Array;
    if (typeof body.imageData === 'string') {
      // Remove data URL prefix if present
      const base64Data = body.imageData.includes(',')
        ? body.imageData.split(',')[1]
        : body.imageData;
      if (!base64Data) {
        return badRequestResponse('Invalid base64 image data', CORS);
      }
      try {
        const binaryString = atob(base64Data);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError('Invalid base64 image data', logContext, error);
        return badRequestResponse(`Invalid base64 image data: ${errorMessage}`, CORS);
      }
    } else {
      imageBytes = body.imageData;
    }

    // Validate input size (prevent memory exhaustion)
    if (imageBytes.length > MAX_INPUT_SIZE) {
      return badRequestResponse(
        `Image too large. Maximum size is ${MAX_INPUT_SIZE / 1024 / 1024}MB`,
        CORS
      );
    }

    if (imageBytes.length === 0) {
      return badRequestResponse('Image data is empty', CORS);
    }

    // Get original dimensions for logging
    const originalDimensions = await getImageDimensions(imageBytes);
    logInfo('Processing logo optimization', {
      ...logContext,
      originalSize: imageBytes.length,
      originalDimensions: `${originalDimensions.width}x${originalDimensions.height}`,
      userId: body.userId,
      companyId: body.companyId || 'none',
    });

    // Optimize image - using PNG format (following Supabase example pattern exactly)
    // The Supabase example uses img.write((data) => data) which outputs PNG
    // Validate maxDimension from JSON body if provided
    let maxDimension = LOGO_MAX_DIMENSION;
    if (body.maxDimension !== undefined) {
      const value = typeof body.maxDimension === 'number' 
        ? body.maxDimension 
        : Number(body.maxDimension);
      if (!Number.isFinite(value) || value <= 0) {
        return badRequestResponse(
          `Invalid maxDimension: must be a finite positive number, got "${body.maxDimension}"`,
          CORS
        );
      }
      maxDimension = value;
    }
    const optimizedImage = await optimizeImage(
      imageBytes,
      maxDimension,
      MagickFormat.Png, // Using PNG - matches Supabase example
      LOGO_QUALITY
    );
    
    // Verify output is PNG (processImage always outputs PNG)
    const isPng = optimizedImage[0] === 0x89 && optimizedImage[1] === 0x50 && 
                   optimizedImage[2] === 0x4e && optimizedImage[3] === 0x47;
    
    if (!isPng) {
      await logError('Optimized image format is unrecognized', logContext, new Error('Invalid image format - expected PNG'));
      return jsonResponse(
        {
          success: false,
          error: 'Image optimization failed - output format is invalid (expected PNG)',
        } satisfies LogoOptimizeResponse,
        500,
        CORS
      );
    }

    const actualFormat = 'png';
    const actualMimeType = 'image/png';

    // Get optimized dimensions
    const optimizedDimensions = await getImageDimensions(optimizedImage);

    logInfo('Logo optimized', {
      ...logContext,
      originalSize: imageBytes.length,
      optimizedSize: optimizedImage.length,
      compressionRatio: ((1 - optimizedImage.length / imageBytes.length) * 100).toFixed(1) + '%',
      originalDimensions: `${originalDimensions.width}x${originalDimensions.height}`,
      optimizedDimensions: `${optimizedDimensions.width}x${optimizedDimensions.height}`,
    });

    // Validate optimized image size (bucket limit is 200KB)
    const BUCKET_SIZE_LIMIT = 200 * 1024; // 200KB
    if (optimizedImage.length > BUCKET_SIZE_LIMIT) {
      await logError('Optimized image exceeds bucket size limit', logContext, new Error(`Size: ${optimizedImage.length} bytes, limit: ${BUCKET_SIZE_LIMIT} bytes`));
      return jsonResponse(
        {
          success: false,
          error: `Optimized image too large (${Math.round(optimizedImage.length / 1024)}KB). Maximum allowed: ${BUCKET_SIZE_LIMIT / 1024}KB.`,
        } satisfies LogoOptimizeResponse,
        400,
        CORS
      );
    }

    // Upload to storage
    // Note: We skip validationPolicy here because:
    // 1. We've already validated and processed the input image
    // 2. The optimized image is guaranteed to be smaller and valid PNG
    // 3. We've validated size above against bucket limits
    // Convert Uint8Array to ArrayBuffer for uploadObject
    // Create a new ArrayBuffer to ensure proper conversion
    const arrayBuffer = optimizedImage.buffer.slice(
      optimizedImage.byteOffset,
      optimizedImage.byteOffset + optimizedImage.byteLength
    ) as ArrayBuffer;
    
    logInfo('Uploading optimized logo to storage', {
      ...logContext,
      optimizedSize: optimizedImage.length,
      bufferSize: arrayBuffer.byteLength,
      bucket: 'company-logos',
    });

    const uploadResult = await uploadObject({
      bucket: 'company-logos',
      buffer: arrayBuffer,
      mimeType: actualMimeType, // Use detected format
      pathOptions: {
        userId: body.userId,
        fileName: 'logo',
        extension: actualFormat, // Use detected format extension
        includeTimestamp: true,
        sanitize: true,
      },
      cacheControl: '31536000', // 1 year cache (logos rarely change)
      // Skip validationPolicy - optimized image is already validated and processed
    });

    if (!uploadResult.success || !uploadResult.publicUrl) {
      await logError('Failed to upload optimized logo', logContext, new Error(uploadResult.error));
      return jsonResponse(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload optimized logo',
        } satisfies LogoOptimizeResponse,
        500,
        CORS
      );
    }

    // Delete old logo if provided
    if (body.oldLogoPath && uploadResult.path) {
      try {
        const supabase = getStorageServiceClient();
        const { error: deleteError } = await supabase.storage
          .from('company-logos')
          .remove([body.oldLogoPath]);

        if (deleteError) {
          await logError('Failed to delete old logo', logContext, deleteError);
          // Don't fail the request - old logo deletion is non-critical
        } else {
          logInfo('Old logo deleted', {
            ...logContext,
            oldPath: body.oldLogoPath,
          });
        }
      } catch (error) {
        // Non-critical - log but don't fail
        await logError('Error deleting old logo', logContext, error);
      }
    }

    // Update database if companyId provided
    if (body.companyId && uploadResult.publicUrl) {
      try {
        const supabase = getStorageServiceClient();
        const { error: updateError } = await supabase
          .from('companies')
          .update({ logo: uploadResult.publicUrl })
          .eq('id', body.companyId);

        if (updateError) {
          // Use dbQuery serializer for consistent database query formatting
          await logError('Failed to update company logo in database', {
            ...logContext,
            dbQuery: {
              table: 'companies',
              operation: 'update',
              schema: 'public',
              args: {
                id: body.companyId,
                // Update fields redacted by Pino's redact config
              },
            },
          }, updateError);
          // Don't fail - return success with URL, client can update manually if needed
        } else {
          logInfo('Company logo updated in database', {
            ...logContext,
            companyId: body.companyId,
          });
        }
      } catch (error) {
        await logError('Error updating company logo in database', logContext, error);
        // Non-critical - return success with URL
      }
    }

    const response: LogoOptimizeResponse = {
      success: true,
      ...(uploadResult.publicUrl ? { publicUrl: uploadResult.publicUrl } : {}),
      ...(uploadResult.path ? { path: uploadResult.path } : {}),
      originalSize: imageBytes.length,
      optimizedSize: optimizedImage.length,
      ...(optimizedDimensions ? { dimensions: optimizedDimensions } : {}),
    };

    traceRequestComplete(logContext);
    return jsonResponse(response, 200, CORS);
  } catch (error) {
    await logError('Logo optimization failed', logContext, error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } satisfies LogoOptimizeResponse,
      500,
      CORS
    );
  }
}