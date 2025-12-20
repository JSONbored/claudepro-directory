/**
 * Open Graph Image Generation API Route
 *
 * Generates dynamic Open Graph images using Next.js ImageResponse.
 * Supports custom title, description, type badge, and tags.
 *
 * @example
 * ```ts
 * // Request
 * GET /api/og?title=My%20Title&description=My%20Description&type=AGENT&tags=ai,automation
 *
 * // Response (200) - image/png
 * [Binary image data]
 * ```
 */

import 'server-only';
import { OG_DEFAULTS, OG_DIMENSIONS } from '@heyclaude/shared-runtime';
import {
  createOptionsHandler as createApiOptionsHandler,
  createApiRoute,
} from '@heyclaude/web-runtime/api/route-factory';
import { ogImageQuerySchema } from '@heyclaude/web-runtime/api/schemas';
import {
  errorResponseSchema,
  ogImageResponseSchema,
} from '@heyclaude/web-runtime/api/response-schemas';
import { getVersionedRoute } from '@heyclaude/web-runtime/api/versioning';
import { ImageResponse } from 'next/og';

/******
 *
 * Generate an Open Graph image using Next.js ImageResponse.
 * Caching is handled via HTTP cache headers (not Cache Components).
 * @param {string} title
 * @param {string} description
 * @param {string} type
 * @param {string[]} tags
 * @returns {Promise<unknown>} Return value description
 */
async function generateOgImage(
  title: string,
  description: string,
  type: string,
  tags: string[]
): Promise<ImageResponse> {
  // Construct JSX element
  const ogImageJSX = (
    <div
      style={{
        alignItems: 'flex-start',
        backgroundColor: '#1a1410',
        backgroundImage:
          'radial-gradient(circle at 25px 25px, #2a2010 2%, transparent 0%), radial-gradient(circle at 75px 75px, #2a2010 2%, transparent 0%)',
        backgroundSize: '100px 100px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '60px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#f97316',
              borderRadius: '8px',
              color: '#1a1410',
              fontSize: '24px',
              fontWeight: '700',
              padding: '8px 20px',
              textTransform: 'uppercase',
            }}
          >
            {type}
          </div>
        </div>

        <h1
          style={{
            color: '#ffffff',
            fontSize: '72px',
            fontWeight: '800',
            lineHeight: '1.1',
            margin: '0',
            maxWidth: '900px',
          }}
        >
          {title}
        </h1>

        {description ? (
          <p
            style={{
              color: '#9ca3af',
              fontSize: '32px',
              lineHeight: '1.4',
              margin: '0',
              maxWidth: '800px',
            }}
          >
            {description}
          </p>
        ) : null}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          width: '100%',
        }}
      >
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {tags.slice(0, 5).map((tag) => (
              <div
                key={tag}
                style={{
                  backgroundColor: '#2a2010',
                  border: '1px solid #3a3020',
                  borderRadius: '6px',
                  color: '#f97316',
                  fontSize: '20px',
                  padding: '6px 16px',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                fontSize: '32px',
                fontWeight: '700',
              }}
            >
              ClaudePro
            </div>
            <div style={{ color: 'var(--muted-foreground)', fontSize: '28px' }}>Directory</div>
          </div>

          <div style={{ color: 'var(--muted-foreground)', fontSize: '24px' }}>
            claudepro.directory
          </div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(ogImageJSX, {
    height: OG_DIMENSIONS.height,
    width: OG_DIMENSIONS.width,
  });
}

/**
 * GET /api/og - Generate Open Graph image
 *
 * Generates dynamic Open Graph images using Next.js ImageResponse.
 * Supports custom title, description, type badge, and tags.
 *
 * The function reads these optional search parameters:
 * - `title` — title text to render (falls back to OG_DEFAULTS.title)
 * - `description` — descriptive subtitle (falls back to OG_DEFAULTS.description)
 * - `type` — badge text rendered at the top (falls back to OG_DEFAULTS.type)
 * - `tags` — comma-separated list of tags; parsed, trimmed, uniqued, and up to 5 tags rendered
 */
export const GET = createApiRoute({
  cors: 'anon',
  handler: async ({ logger, query }) => {
    // Zod schema ensures proper types
    const {
      description: queryDescription,
      tags: rawTags,
      title: queryTitle,
      type: queryType,
    } = query;

    // Use defaults if not provided
    const title = queryTitle ?? OG_DEFAULTS.title;
    const description = queryDescription ?? OG_DEFAULTS.description;
    const type = queryType ?? OG_DEFAULTS.type;

    // Parse and deduplicate tags (single-pass with Set for efficiency)
    const tags: string[] = [];
    if (rawTags) {
      const tagSet = new Set<string>();
      for (const part of rawTags.split(',')) {
        const trimmed = part.trim();
        if (trimmed) tagSet.add(trimmed);
      }
      tags.push(...tagSet);
    }

    logger.info({ tagCount: tags.length, title, type }, 'Generating OG image');
    return await generateOgImage(title, description, type, tags);
  },
  method: 'GET',
  openapi: {
    description:
      'Generates dynamic Open Graph images using Next.js ImageResponse. Supports custom title, description, type badge, and tags.',
    operationId: 'generateOgImage',
    responses: {
      200: {
        description: 'OG image generated successfully (image/png)',
        schema: ogImageResponseSchema,
        headers: {
          'Content-Type': {
            schema: { type: 'string' },
            description: 'Content type (image/png)',
          },
          'Cache-Control': {
            schema: { type: 'string' },
            description: 'Cache control directive',
          },
        },
        example: '[Binary PNG image data - 1200x630 pixels]',
      },
      400: {
        description: 'Invalid query parameters',
        schema: errorResponseSchema,
        example: {
          error: 'Invalid query parameters',
          message: 'Title must be a string',
        },
      },
      500: {
        description: 'Internal server error',
        schema: errorResponseSchema,
        example: {
          error: 'Internal server error',
          message: 'An unexpected error occurred while generating OG image',
        },
      },
    },
    summary: 'Generate Open Graph image',
    tags: ['og', 'images', 'seo'],
  },
  operation: 'OGImageAPI',
  querySchema: ogImageQuerySchema,
  route: getVersionedRoute('og'),
});

/**
 * OPTIONS handler for CORS preflight requests
 */
export const OPTIONS = createApiOptionsHandler('anon');
