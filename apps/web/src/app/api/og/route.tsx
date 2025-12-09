import { OG_DEFAULTS, OG_DIMENSIONS } from '@heyclaude/shared-runtime';
import { logger, normalizeError, createErrorResponse } from '@heyclaude/web-runtime/logging/server';
import { ImageResponse } from 'next/og';
import { type NextRequest } from 'next/server';

/**
 * Generate an Open Graph image SVG/JSX using values from the request URL's search parameters.
 *
 * The function reads these optional search parameters from `request.url`:
 * - `title` — title text to render (falls back to OG_DEFAULTS.title)
 * - `description` — descriptive subtitle (falls back to OG_DEFAULTS.description)
 * - `type` — badge text rendered at the top (falls back to OG_DEFAULTS.type)
 * - `tags` — comma-separated list of tags; parsed, trimmed, uniqued, and up to 5 tags rendered
 *
 * @param request - NextRequest whose URL search params supply `title`, `description`, `type`, and `tags`
 * @returns An ImageResponse containing the rendered Open Graph image using OG_DIMENSIONS for width and height
 *
 * @see OG_DEFAULTS
 * @see OG_DIMENSIONS
 * @see ImageResponse
 */
export async function GET(request: NextRequest) {
  const reqLogger = logger.child({
    operation: 'OGImageAPI',
    route: '/api/og',
    method: 'GET',
  });

  // Extract parameters and prepare data outside try/catch to avoid JSX construction in try/catch
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? OG_DEFAULTS.title;
  const description = searchParams.get('description') ?? OG_DEFAULTS.description;
  const type = searchParams.get('type') ?? OG_DEFAULTS.type;
  const rawTags = searchParams.get('tags');
  const tags = rawTags
    ? [
        ...new Set(
          rawTags
            .split(',')
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        ),
      ]
    : [];

  reqLogger.info('Generating OG image', { title, type, tagCount: tags.length });

  // Construct JSX element outside try/catch to avoid JSX construction errors in try/catch
  const ogImageJSX = (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        backgroundColor: '#1a1410',
        backgroundImage:
          'radial-gradient(circle at 25px 25px, #2a2010 2%, transparent 0%), radial-gradient(circle at 75px 75px, #2a2010 2%, transparent 0%)',
        backgroundSize: '100px 100px',
        padding: '60px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: '#f97316',
              color: '#1a1410',
              padding: '8px 20px',
              borderRadius: '8px',
              fontSize: '24px',
              fontWeight: '700',
              textTransform: 'uppercase',
            }}
          >
            {type}
          </div>
        </div>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: '800',
            color: '#ffffff',
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
              fontSize: '32px',
              color: '#9ca3af',
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
                  color: '#f97316',
                  padding: '6px 16px',
                  borderRadius: '6px',
                  fontSize: '20px',
                  border: '1px solid #3a3020',
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                fontSize: '32px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              ClaudePro
            </div>
            <div style={{ fontSize: '28px', color: '#6b7280' }}>Directory</div>
          </div>

          <div style={{ fontSize: '24px', color: '#6b7280' }}>claudepro.directory</div>
        </div>
      </div>
    </div>
  );

  try {
    // ImageResponse may throw during rendering, so we wrap it in try/catch
    return new ImageResponse(ogImageJSX, {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'OG image generation failed');
    reqLogger.error('OG image generation failed', normalized, {
      route: '/api/og',
      operation: 'OGImageAPI',
      method: 'GET',
    });
    return createErrorResponse(normalized, {
      route: '/api/og',
      operation: 'OGImageAPI',
      method: 'GET',
      logContext: {},
    });
  }
}
