/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Thumbnail Generation Route
 * 
 * Generates optimized thumbnails for content/packages by:
 * - Resizing to maximum dimensions (maintains aspect ratio)
 * - Converting to PNG format
 * - Uploading to Supabase Storage
 * - Updating database with thumbnail URL
 * 
 * Performance optimizations:
 * - Uses PNG format (matches Supabase example pattern)
 * - Processes in memory (no temp files)
 * - Validates input size before processing
 * - Returns early on validation failures
 */

import { badRequestResponse, initRequestLogging, publicCorsHeaders, traceRequestComplete, traceStep } from '@heyclaude/edge-runtime';
import {
  createDataApiContext,
  logError,
  logInfo,
  logger,
  normalizeError,
} from '@heyclaude/shared-runtime';
import {
  ensureImageMagickInitialized,
  optimizeImage,
  getImageDimensions,
} from '@heyclaude/shared-runtime/image/manipulation.ts';
import { MagickFormat } from '@imagemagick/magick-wasm';
import {
  uploadObject,
  getStorageServiceClient,
  jsonResponse,
} from '@heyclaude/edge-runtime';

const CORS = publicCorsHeaders;

// Thumbnail optimization constants
const THUMBNAIL_MAX_DIMENSION = 400; // Good size for thumbnails (balances quality vs file size)
const THUMBNAIL_QUALITY = 85; // Good quality for thumbnails
const MAX_INPUT_SIZE = 5 * 1024 * 1024; // 5MB max input (prevents memory issues)
const BUCKET_SIZE_LIMIT = 200 * 1024; // 200KB bucket limit

/**
 * Request body schema for thumbnail generation
 */
interface ThumbnailGenerateRequest {
  /** Image data as base64 string or Uint8Array */
  imageData?: string | Uint8Array;
  /** Content ID or slug to update (optional - if not provided, just returns optimized image) */
  contentId?: string;
  /** Use slug instead of ID for content lookup */
  useSlug?: boolean;
  /** User ID for storage path organization */
  userId: string;
  /** Optional: existing thumbnail path to delete after successful upload */
  oldThumbnailPath?: string;
  /** Optional: custom max dimension (default: 400px) */
  maxDimension?: number;
}

/**
 * Response schema
 */
interface ThumbnailGenerateResponse {
  success: boolean;
  publicUrl?: string;
  path?: string;
  originalSize?: number;
  optimizedSize?: number;
  dimensions?: { width: number; height: number };
  warning?: string; // Warning message when non-critical operations fail (e.g., database update)
  error?: string;
}

/**
 * Handle POST requests to generate an optimized thumbnail from provided image data and upload it to storage.
 *
 * Supports multipart/form-data (file or base64 field) and JSON bodies (base64 or binary-like types). Validates required
 * fields (userId), optional parameters (contentId, useSlug, oldThumbnailPath, maxDimension), enforces input and output
 * size limits, initializes ImageMagick, computes original and optimized dimensions, compresses/resizes the image
 * to PNG/JPEG, uploads the optimized thumbnail to the `content-thumbnails` bucket, optionally deletes an old thumbnail,
 * and optionally updates a content record's `og_image` field. Returns structured results and non-critical warnings for
 * recoverable failures (e.g., failed old-file deletion or database update).
 *
 * @returns A Response whose JSON body is a ThumbnailGenerateResponse containing `success`, and on success may include
 *          `publicUrl`, `path`, `originalSize`, `optimizedSize`, `dimensions`, and an optional `warning`; on failure
 *          includes `success: false` and an `error` message.
 */
export async function handleThumbnailGenerateRoute(req: Request): Promise<Response> {
  const logContext = createDataApiContext('transform-image-thumbnail', {
    path: 'transform/image/thumbnail',
    method: 'POST',
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Thumbnail generation request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: typeof logContext['request_id'] === "string" ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === "string" ? logContext['action'] : 'thumbnail-generate',
    method: req.method,
  });

  // Handle OPTIONS for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'POST') {
    return badRequestResponse('Method not allowed. Use POST.', CORS);
  }

  try {
    traceStep('Processing thumbnail generation', logContext);
    // Parse request body
    let body: ThumbnailGenerateRequest;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const imageData = formData.get('image') as File | string | null;
      const imageDataBase64 = formData.get('imageData') as string | null;
      const userId = formData.get('userId') as string | null;
      const contentId = formData.get('contentId') as string | null;
      const useSlug = formData.get('useSlug') === 'true';
      const oldThumbnailPath = formData.get('oldThumbnailPath') as string | null;
      const maxDimensionStr = formData.get('maxDimension') as string | null;

      if (!userId) {
        return jsonResponse(
          {
            success: false,
            error: 'userId is required',
          } satisfies ThumbnailGenerateResponse,
          400,
          CORS
        );
      }

      // Get image data from either 'image' file or 'imageData' base64
      let imageBytes: Uint8Array;
      if (imageData instanceof File) {
        imageBytes = new Uint8Array(await imageData.arrayBuffer());
      } else if (imageDataBase64) {
        // Decode base64
        try {
          const binaryString = atob(imageDataBase64);
          imageBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imageBytes[i] = binaryString.charCodeAt(i);
          }
        } catch (error) {
          const errorMessage = normalizeError(error, "Operation failed").message;
          await logError('Invalid base64 image data', logContext, error);
          return jsonResponse(
            {
              success: false,
              error: `Invalid base64 image data: ${errorMessage}`,
            } satisfies ThumbnailGenerateResponse,
            400,
            CORS
          );
        }
      } else {
        return jsonResponse(
          {
            success: false,
            error: 'image or imageData is required',
          } satisfies ThumbnailGenerateResponse,
          400,
          CORS
        );
      }

      // Validate maxDimension if provided
      let maxDimension: number | undefined;
      if (maxDimensionStr) {
        // Reject if string contains decimal point or is not a valid integer string
        if (!/^\d+$/.test(maxDimensionStr)) {
          return jsonResponse(
            {
              success: false,
              error: 'Invalid maxDimension: must be a positive integer',
            } satisfies ThumbnailGenerateResponse,
            400,
            CORS
          );
        }
        const parsed = parseInt(maxDimensionStr, 10);
        if (Number.isFinite(parsed) && parsed > 0 && Number.isInteger(parsed)) {
          maxDimension = parsed;
        } else {
          return jsonResponse(
            {
              success: false,
              error: 'Invalid maxDimension: must be a positive integer',
            } satisfies ThumbnailGenerateResponse,
            400,
            CORS
          );
        }
      }

      body = {
        imageData: imageBytes,
        userId,
        useSlug,
        ...(contentId ? { contentId } : {}),
        ...(oldThumbnailPath ? { oldThumbnailPath } : {}),
        ...(maxDimension !== undefined ? { maxDimension } : {}),
      };
    } else {
      // JSON body
      const jsonBody = await req.json();
      body = jsonBody;

      if (!body.userId) {
        return jsonResponse(
          {
            success: false,
            error: 'userId is required',
          } satisfies ThumbnailGenerateResponse,
          400,
          CORS
        );
      }

      // Handle base64 imageData
      if (typeof body.imageData === 'string') {
        try {
          const binaryString = atob(body.imageData);
          body.imageData = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            (body.imageData as Uint8Array)[i] = binaryString.charCodeAt(i);
          }
        } catch (error) {
          const errorMessage = normalizeError(error, "Operation failed").message;
          await logError('Invalid base64 image data', logContext, error);
          return jsonResponse(
            {
              success: false,
              error: `Invalid base64 image data: ${errorMessage}`,
            } satisfies ThumbnailGenerateResponse,
            400,
            CORS
          );
        }
      }

      // Validate maxDimension if provided in JSON body
      if (body.maxDimension !== undefined) {
        const maxDim = body.maxDimension;
        if (
          typeof maxDim !== 'number' ||
          !Number.isFinite(maxDim) ||
          maxDim <= 0 ||
          !Number.isInteger(maxDim)
        ) {
          return jsonResponse(
            {
              success: false,
              error: 'Invalid maxDimension: must be a positive integer',
            } satisfies ThumbnailGenerateResponse,
            400,
            CORS
          );
        }
      }
    }

    // Validate and convert imageData to Uint8Array
    let imageBytes: Uint8Array;
    
    // Type guard: check if imageData is a Uint8Array (from interface)
    if (body.imageData instanceof Uint8Array) {
      // Already a Uint8Array - use directly
      imageBytes = body.imageData;
    } else if (body.imageData && typeof body.imageData === 'object') {
      // Could be ArrayBuffer or TypedArray - narrow the type
      const data = body.imageData as unknown;
      
      if (data instanceof ArrayBuffer) {
        // ArrayBuffer - create Uint8Array view
        imageBytes = new Uint8Array(data);
      } else if (
        data instanceof Int8Array ||
        data instanceof Uint8ClampedArray ||
        data instanceof Int16Array ||
        data instanceof Uint16Array ||
        data instanceof Int32Array ||
        data instanceof Uint32Array ||
        data instanceof Float32Array ||
        data instanceof Float64Array ||
        data instanceof BigInt64Array ||
        data instanceof BigUint64Array
      ) {
        // TypedArray view - create Uint8Array from it
        imageBytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
      } else {
        // Invalid object type
        const actualType = typeof body.imageData;
        await logError('Invalid imageData type', logContext, new Error(`Expected Uint8Array, ArrayBuffer, or TypedArray, got ${actualType}`));
        return jsonResponse(
          {
            success: false,
            error: `Invalid imageData type: expected Uint8Array, ArrayBuffer, or TypedArray, got ${actualType}`,
          } satisfies ThumbnailGenerateResponse,
          400,
          CORS
        );
      }
    } else {
      // Invalid type (string, null, undefined, or other primitive)
      const actualType = body.imageData === null ? 'null' : body.imageData === undefined ? 'undefined' : typeof body.imageData;
      await logError('Invalid imageData type', logContext, new Error(`Expected Uint8Array, ArrayBuffer, or TypedArray, got ${actualType}`));
      return jsonResponse(
        {
          success: false,
          error: `Invalid imageData type: expected Uint8Array, ArrayBuffer, or TypedArray, got ${actualType}`,
        } satisfies ThumbnailGenerateResponse,
        400,
        CORS
      );
    }

    if (imageBytes.length > MAX_INPUT_SIZE) {
      return jsonResponse(
        {
          success: false,
          error: `Image too large. Maximum size is ${MAX_INPUT_SIZE / 1024 / 1024}MB.`,
        } satisfies ThumbnailGenerateResponse,
        400,
        CORS
      );
    }

    if (imageBytes.length === 0) {
      return jsonResponse(
        {
          success: false,
          error: 'Image data is empty',
        } satisfies ThumbnailGenerateResponse,
        400,
        CORS
      );
    }

    // Ensure ImageMagick is initialized before processing
    await ensureImageMagickInitialized();
    
    // Get original dimensions for logging
    const originalDimensions = await getImageDimensions(imageBytes);

    logInfo('Processing thumbnail generation', {
      ...logContext,
      originalSize: imageBytes.length,
      originalDimensions: `${originalDimensions.width}x${originalDimensions.height}`,
      userId: body.userId,
      contentId: body.contentId || 'none',
    });

    // Optimize image - using PNG format (following Supabase example pattern)
    const maxDimension = body.maxDimension ?? THUMBNAIL_MAX_DIMENSION;
    const optimizedImage = await optimizeImage(
      imageBytes,
      maxDimension,
      MagickFormat.Png, // Using PNG - matches Supabase example
      THUMBNAIL_QUALITY
    );
    
    // Verify output is PNG (Supabase example outputs PNG)
    const isPng = optimizedImage[0] === 0x89 && optimizedImage[1] === 0x50 && 
                   optimizedImage[2] === 0x4e && optimizedImage[3] === 0x47;
    const isJpeg = optimizedImage[0] === 0xff && optimizedImage[1] === 0xd8;
    
    if (!isPng && !isJpeg) {
      await logError('Optimized image format is unrecognized', logContext, new Error('Invalid image format'));
      return jsonResponse(
        {
          success: false,
          error: 'Image optimization failed - output format is invalid',
        } satisfies ThumbnailGenerateResponse,
        500,
        CORS
      );
    }

    const actualFormat = isPng ? 'png' : 'jpeg';
    const actualMimeType = isPng ? 'image/png' : 'image/jpeg';

    // Get optimized dimensions
    const optimizedDimensions = await getImageDimensions(optimizedImage);

    logInfo('Thumbnail optimized', {
      ...logContext,
      originalSize: imageBytes.length,
      optimizedSize: optimizedImage.length,
      compressionRatio: ((1 - optimizedImage.length / imageBytes.length) * 100).toFixed(1) + '%',
      originalDimensions: `${originalDimensions.width}x${originalDimensions.height}`,
      optimizedDimensions: `${optimizedDimensions.width}x${optimizedDimensions.height}`,
    });

    // Validate optimized image size (bucket limit is 200KB)
    if (optimizedImage.length > BUCKET_SIZE_LIMIT) {
      await logError('Optimized image exceeds bucket size limit', logContext, new Error(`Size: ${optimizedImage.length} bytes, limit: ${BUCKET_SIZE_LIMIT} bytes`));
      return jsonResponse(
        {
          success: false,
          error: `Optimized thumbnail too large (${Math.round(optimizedImage.length / 1024)}KB). Maximum allowed: ${BUCKET_SIZE_LIMIT / 1024}KB.`,
        } satisfies ThumbnailGenerateResponse,
        400,
        CORS
      );
    }

    // Upload to storage
    const arrayBuffer = optimizedImage.buffer.slice(
      optimizedImage.byteOffset,
      optimizedImage.byteOffset + optimizedImage.byteLength
    ) as ArrayBuffer;
    
    logInfo('Uploading optimized thumbnail to storage', {
      ...logContext,
      optimizedSize: optimizedImage.length,
      bufferSize: arrayBuffer.byteLength,
      bucket: 'content-thumbnails',
    });

    const uploadResult = await uploadObject({
      bucket: 'content-thumbnails',
      buffer: arrayBuffer,
      mimeType: actualMimeType,
      pathOptions: {
        userId: body.userId,
        fileName: 'thumbnail',
        extension: actualFormat,
        includeTimestamp: true,
        sanitize: true,
      },
      cacheControl: '31536000', // 1 year cache (thumbnails rarely change)
    });

    if (!uploadResult.success || !uploadResult.publicUrl) {
      await logError('Failed to upload optimized thumbnail', logContext, new Error(uploadResult.error));
      return jsonResponse(
        {
          success: false,
          error: uploadResult.error || 'Failed to upload optimized thumbnail',
        } satisfies ThumbnailGenerateResponse,
        500,
        CORS
      );
    }

    // Delete old thumbnail if provided
    if (body.oldThumbnailPath && uploadResult.path) {
      try {
        const supabase = getStorageServiceClient();
        const { error: deleteError } = await supabase.storage
          .from('content-thumbnails')
          .remove([body.oldThumbnailPath]);

        if (deleteError) {
          await logError('Failed to delete old thumbnail', logContext, deleteError);
          // Don't fail the request - old thumbnail deletion is non-critical
        } else {
          logInfo('Old thumbnail deleted', {
            ...logContext,
            oldPath: body.oldThumbnailPath,
          });
        }
      } catch (error) {
        // Non-critical - log but don't fail
        await logError('Error deleting old thumbnail', logContext, error);
      }
    }

    // Update database if contentId provided
    let dbUpdateWarning: string | undefined;
    if (body.contentId && uploadResult.publicUrl) {
      try {
        const supabase = getStorageServiceClient();
        const updateData = { og_image: uploadResult.publicUrl };
        
        if (body.useSlug) {
          const { error: updateError } = await supabase
            .from('content')
            .update(updateData)
            .eq('slug', body.contentId);

          if (updateError) {
            // Use dbQuery serializer for consistent database query formatting
            await logError('Failed to update content thumbnail in database', {
              ...logContext,
              dbQuery: {
                table: 'content',
                operation: 'update',
                schema: 'public',
                args: {
                  slug: body.contentId,
                  // Update fields redacted by Pino's redact config
                },
              },
            }, updateError);
            dbUpdateWarning = 'Thumbnail uploaded but database update failed';
          } else {
            logInfo('Content thumbnail updated in database (by slug)', {
              ...logContext,
              slug: body.contentId,
            });
          }
        } else {
          const { error: updateError } = await supabase
            .from('content')
            .update(updateData)
            .eq('id', body.contentId);

          if (updateError) {
            // Use dbQuery serializer for consistent database query formatting
            await logError('Failed to update content thumbnail in database', {
              ...logContext,
              dbQuery: {
                table: 'content',
                operation: 'update',
                schema: 'public',
                args: {
                  id: body.contentId,
                  // Update fields redacted by Pino's redact config
                },
              },
            }, updateError);
            dbUpdateWarning = 'Thumbnail uploaded but database update failed';
          } else {
            logInfo('Content thumbnail updated in database (by ID)', {
              ...logContext,
              contentId: body.contentId,
            });
          }
        }
      } catch (error) {
        await logError('Error updating content thumbnail in database', logContext, error);
        dbUpdateWarning = 'Thumbnail uploaded but database update failed';
      }
    }

    const response: ThumbnailGenerateResponse = {
      success: true,
      ...(uploadResult.publicUrl ? { publicUrl: uploadResult.publicUrl } : {}),
      ...(uploadResult.path ? { path: uploadResult.path } : {}),
      originalSize: imageBytes.length,
      optimizedSize: optimizedImage.length,
      ...(optimizedDimensions ? { dimensions: optimizedDimensions } : {}),
      ...(dbUpdateWarning ? { warning: dbUpdateWarning } : {}),
    };

    traceRequestComplete(logContext);
    return jsonResponse(response, 200, CORS);
  } catch (error) {
    await logError('Thumbnail generation failed', logContext, error);
    return jsonResponse(
      {
        success: false,
        error: normalizeError(error, 'Unknown error occurred').message,
      } satisfies ThumbnailGenerateResponse,
      500,
      CORS
    );
  }
}