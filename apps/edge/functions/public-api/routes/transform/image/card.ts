/// <reference path="@heyclaude/edge-runtime/deno-globals.d.ts" />

/**
 * Content Card Image Generator
 * Generates social media preview cards for content items (agents, MCP servers, hooks, etc.)
 */

import { ImageResponse } from 'https://deno.land/x/og_edge@0.0.4/mod.ts';
import React from 'npm:react@18.3.1';
import {
  initRequestLogging,
  publicCorsHeaders,
  jsonResponse,
  traceRequestComplete,
  traceStep,
} from '@heyclaude/edge-runtime';
import {
  createDataApiContext,
  logError,
  logInfo,
  logger,
} from '@heyclaude/shared-runtime';
import {
  ensureImageMagickInitialized,
  getImageDimensions,
  optimizeImage,
} from '@heyclaude/shared-runtime/image/manipulation.ts';
import { MagickFormat } from '@imagemagick/magick-wasm';
import {
  uploadObject,
  getStorageServiceClient,
} from '@heyclaude/edge-runtime';

const CORS = publicCorsHeaders;
const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630; // Same as OG images for consistency
const CARD_MAX_DIMENSION = 1200;
const CARD_QUALITY = 85;
const BUCKET_SIZE_LIMIT = 200 * 1024; // 200KB

export interface ContentCardParams {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  author?: string;
  authorAvatar?: string; // URL to avatar image
  featured?: boolean;
  rating?: number;
  viewCount?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export interface ContentCardGenerateRequest {
  params: ContentCardParams;
  userId?: string;
  contentId?: string; // Optional: to update content.og_image
  useSlug?: boolean; // If true, use slug instead of ID
  oldCardPath?: string; // Optional: path to old card to delete
  saveToStorage?: boolean; // Default: true
  maxDimension?: number;
}

export interface ContentCardGenerateResponse {
  success: boolean;
  publicUrl?: string;
  path?: string;
  originalSize?: number;
  optimizedSize?: number;
  dimensions?: { width: number; height: number };
  error?: string;
  warning?: string; // Warning message when storage upload is skipped (e.g., missing userId)
}

/**
 * Generate a social-preview content card image from the provided card parameters.
 *
 * @param params - Card content and style options (title, description, category, tags, author, authorAvatar, featured, rating, viewCount, backgroundColor, textColor, accentColor)
 * @returns An ImageResponse containing the rendered card image with dimensions 1200×630
 */
function generateContentCardImage(params: ContentCardParams): Response {
  const {
    title,
    description,
    category,
    tags = [],
    author,
    featured = false,
    rating,
    viewCount,
    backgroundColor = '#1a1410',
    textColor = '#ffffff',
    accentColor = '#FF6F4A',
  } = params;

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor,
          backgroundImage:
            'radial-gradient(circle at 25px 25px, rgba(42, 32, 16, 0.3) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(42, 32, 16, 0.3) 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          padding: '60px',
          position: 'relative',
        },
      },
      // Featured badge (top right)
      featured &&
        React.createElement(
          'div',
          {
            style: {
              position: 'absolute',
              top: '40px',
              right: '40px',
              backgroundColor: accentColor,
              color: '#1A1B17',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '18px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            },
          },
          'Featured'
        ),
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
            flex: 1,
          },
        },
        // Category badge
        category &&
          React.createElement(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
            React.createElement(
              'div',
              {
                style: {
                  backgroundColor: accentColor,
                  color: '#1A1B17',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  fontSize: '20px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                },
              },
              category
            )
          ),
        // Title
        React.createElement(
          'h1',
          {
            style: {
              fontSize: '72px',
              fontWeight: '800',
              color: textColor,
              lineHeight: '1.1',
              margin: '0',
              maxWidth: '1000px',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            },
          },
          title
        ),
        // Description
        description &&
          React.createElement(
            'p',
            {
              style: {
                fontSize: '32px',
                color: '#9ca3af',
                lineHeight: '1.4',
                margin: '0',
                maxWidth: '900px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
              },
            },
            description
          ),
        // Tags
        tags.length > 0 &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '8px',
              },
            },
            ...tags.slice(0, 5).map((tag) =>
              React.createElement(
                'div',
                {
                  key: tag,
                  style: {
                    backgroundColor: '#2a2010',
                    color: accentColor,
                    padding: '4px 14px',
                    borderRadius: '9999px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: '1px solid #3a3020',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                tag
              )
            )
          )
      ),
      // Bottom section
      React.createElement(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: 'auto',
          },
        },
        // Author section (left)
        author &&
          React.createElement(
            'div',
            {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              },
            },
            React.createElement(
              'div',
              {
                style: {
                  fontSize: '20px',
                  color: textColor,
                  fontWeight: '600',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
              },
              author
            ),
            (rating !== undefined || viewCount !== undefined) &&
              React.createElement(
                'div',
                {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '16px',
                    color: '#9ca3af',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                  },
                },
                rating !== undefined &&
                  React.createElement('span', {}, `⭐ ${String(rating.toFixed(1))}`),
                viewCount !== undefined &&
                  React.createElement('span', {}, `👁️ ${String(viewCount.toLocaleString())}`)
              )
          ),
        // Domain (right)
        React.createElement(
          'div',
          {
            style: {
              fontSize: '22px',
              color: '#6b7280',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 500,
              letterSpacing: '0.01em',
            },
          },
          'claudepro.directory'
        )
      )
    ),
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    }
  );
}

/**
 * Handle POST requests to generate a content card image, optimize it, and optionally store and register it.
 *
 * Expects a JSON body matching ContentCardGenerateRequest with a required `params.title`. Generates a 1200x630 card image, runs image optimization and size validation, and — unless `saveToStorage` is false or `userId` is missing — uploads the optimized image to the `content-cards` storage bucket. When an upload succeeds the handler may delete an `oldCardPath` and update the content record (`contentId`) in the database (by id or slug). Handles CORS preflight (OPTIONS) and returns appropriate HTTP error statuses for invalid methods, invalid input, optimization failures, upload failures, and size limit violations.
 *
 * @returns An HTTP Response whose JSON payload conforms to ContentCardGenerateResponse. On success (200) the payload includes `success: true` and metadata such as `originalSize`, `optimizedSize`, `dimensions`, and, if applicable, `publicUrl` and `path`. Error responses use 400, 405, or 500 with `success: false` and an `error` message.
 */
export async function handleContentCardGenerateRoute(req: Request): Promise<Response> {
  const logContext = createDataApiContext('transform-image-card', {
    path: 'transform/image/card',
    method: 'POST',
    app: 'public-api',
  });
  
  // Initialize request logging with trace and bindings
  initRequestLogging(logContext);
  traceStep('Content card generation request received', logContext);
  
  // Set bindings for this request
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'card-generate',
    method: req.method,
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse(
      {
        success: false,
        error: 'Method not allowed. Use POST.',
      } satisfies ContentCardGenerateResponse,
      405,
      CORS
    );
  }

  try {
    traceStep('Processing content card generation', logContext);
    // Parse request body
    let body: ContentCardGenerateRequest;
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      return jsonResponse(
        {
          success: false,
          error: 'Content-Type must be application/json',
        } satisfies ContentCardGenerateResponse,
        400,
        CORS
      );
    }

    // Validate required fields
    if (!body.params || !body.params.title) {
      return jsonResponse(
        {
          success: false,
          error: 'Missing required field: params.title',
        } satisfies ContentCardGenerateResponse,
        400,
        CORS
      );
    }

    // Generate the card image
    const cardResponse = generateContentCardImage(body.params);
    const cardImageData = new Uint8Array(await cardResponse.arrayBuffer());

    logInfo('Content card generated', {
      ...logContext,
      title: body.params.title,
      category: body.params.category || 'none',
      tagsCount: body.params.tags?.length || 0,
      originalSize: cardImageData.length,
    });

    // Optimize the image
    await ensureImageMagickInitialized();
    const maxDimension = body.maxDimension ?? CARD_MAX_DIMENSION;
    const optimizedImage = await optimizeImage(
      cardImageData,
      maxDimension,
      MagickFormat.Png,
      CARD_QUALITY
    );

    // Detect actual format
    const isPng = optimizedImage[0] === 0x89 && optimizedImage[1] === 0x50 && 
                   optimizedImage[2] === 0x4e && optimizedImage[3] === 0x47;
    const isJpeg = optimizedImage[0] === 0xff && optimizedImage[1] === 0xd8;
    const actualFormat = isPng ? 'png' : (isJpeg ? 'jpeg' : 'png');
    const actualMimeType = isPng ? 'image/png' : (isJpeg ? 'image/jpeg' : 'image/png');

    if (!isPng && !isJpeg) {
      await logError('Optimized card format is unrecognized', logContext, new Error('Invalid image format'));
      return jsonResponse(
        {
          success: false,
          error: 'Image optimization failed - output format is invalid',
        } satisfies ContentCardGenerateResponse,
        500,
        CORS
      );
    }

    const optimizedDimensions = await getImageDimensions(optimizedImage);

    logInfo('Content card optimized', {
      ...logContext,
      originalSize: cardImageData.length,
      optimizedSize: optimizedImage.length,
      compressionRatio: ((1 - optimizedImage.length / cardImageData.length) * 100).toFixed(1) + '%',
      dimensions: `${optimizedDimensions.width}x${optimizedDimensions.height}`,
    });

    // Validate optimized image size
    if (optimizedImage.length > BUCKET_SIZE_LIMIT) {
      await logError('Optimized card exceeds bucket size limit', logContext, new Error(`Size: ${optimizedImage.length} bytes, limit: ${BUCKET_SIZE_LIMIT} bytes`));
      return jsonResponse(
        {
          success: false,
          error: `Optimized card too large (${Math.round(optimizedImage.length / 1024)}KB). Maximum allowed: ${BUCKET_SIZE_LIMIT / 1024}KB.`,
        } satisfies ContentCardGenerateResponse,
        400,
        CORS
      );
    }

    // Upload to storage if requested (default: true)
    // Note: If saveToStorage is true but userId is missing, we skip upload and return success
    // without publicUrl/path. Clients should check for publicUrl if they expect a stored asset.
    let publicUrl: string | undefined;
    let path: string | undefined;
    let storageSkipped = false;

    if (body.saveToStorage !== false) {
      if (!body.userId) {
        logInfo('Skipping storage upload - userId not provided (saveToStorage requires userId)', logContext);
        storageSkipped = true;
      } else {
        const arrayBuffer = optimizedImage.buffer.slice(
          optimizedImage.byteOffset,
          optimizedImage.byteOffset + optimizedImage.byteLength
        ) as ArrayBuffer;

        logInfo('Uploading content card to storage', {
          ...logContext,
          optimizedSize: optimizedImage.length,
          bucket: 'content-cards',
        });

        const uploadResult = await uploadObject({
          bucket: 'content-cards',
          buffer: arrayBuffer,
          mimeType: actualMimeType,
          pathOptions: {
            userId: body.userId,
            fileName: 'content-card',
            extension: actualFormat,
            includeTimestamp: true,
            sanitize: true,
          },
          cacheControl: '31536000', // 1 year cache
        });

        if (!uploadResult.success || !uploadResult.publicUrl) {
          await logError('Failed to upload content card', logContext, new Error(uploadResult.error || 'Unknown upload error'));
          return jsonResponse(
            {
              success: false,
              error: uploadResult.error || 'Failed to upload content card to storage',
            } satisfies ContentCardGenerateResponse,
            500,
            CORS
          );
        }

        publicUrl = uploadResult.publicUrl;
        path = uploadResult.path;

        // Delete old card if provided
        if (body.oldCardPath && path) {
          try {
            const supabase = getStorageServiceClient();
            const { error: deleteError } = await supabase.storage
              .from('content-cards')
              .remove([body.oldCardPath]);
            if (deleteError) {
              await logError('Error deleting old card', logContext, deleteError);
            } else {
              logInfo('Old content card deleted', { ...logContext, oldPath: body.oldCardPath });
            }
          } catch (error) {
            await logError('Error deleting old card', logContext, error);
          }
        }

        // Update database if contentId provided
        if (body.contentId && publicUrl) {
          try {
            const supabase = getStorageServiceClient();
            const updateData = { og_image: publicUrl };
            
            if (body.useSlug) {
              const { error: updateError } = await supabase
                .from('content')
                .update(updateData)
                .eq('slug', body.contentId);
              if (updateError) {
                // Use dbQuery serializer for consistent database query formatting
                await logError('Error updating content card in database (slug)', {
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
              } else {
                logInfo('Content card URL updated in database (slug)', { ...logContext, slug: body.contentId });
              }
            } else {
              const { error: updateError } = await supabase
                .from('content')
                .update(updateData)
                .eq('id', body.contentId);
              if (updateError) {
                // Use dbQuery serializer for consistent database query formatting
                await logError('Error updating content card in database (id)', {
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
              } else {
                logInfo('Content card URL updated in database (id)', { ...logContext, contentId: body.contentId });
              }
            }
          } catch (error) {
            await logError('Error updating content card in database', logContext, error);
          }
        }
      }
    }

    const response: ContentCardGenerateResponse = {
      success: true,
      ...(publicUrl ? { publicUrl } : {}),
      ...(storageSkipped ? { warning: 'Storage upload skipped: userId required when saveToStorage is true' } : {}),
      ...(path ? { path } : {}),
      originalSize: cardImageData.length,
      optimizedSize: optimizedImage.length,
      ...(optimizedDimensions ? { dimensions: optimizedDimensions } : {}),
    };

    traceRequestComplete(logContext);
    return jsonResponse(response, 200, CORS);
  } catch (error) {
    await logError('Content card generation failed', logContext, error);
    return jsonResponse(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      } satisfies ContentCardGenerateResponse,
      500,
      CORS
    );
  }
}