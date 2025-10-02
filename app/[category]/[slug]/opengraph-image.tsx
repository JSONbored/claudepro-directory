import { ImageResponse } from 'next/og';
import { getCategoryConfig, isValidCategory } from '@/lib/config/category-config';
import { getContentBySlug } from '@/lib/content-loaders';
import { logger } from '@/lib/logger';
import { getDisplayTitle } from '@/lib/utils';

export const alt = 'Claude Pro Directory';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Category-specific gradient colors
const CATEGORY_GRADIENTS: Record<string, { start: string; end: string }> = {
  agents: { start: '#667eea', end: '#764ba2' },
  mcp: { start: '#f093fb', end: '#f5576c' },
  commands: { start: '#4facfe', end: '#00f2fe' },
  rules: { start: '#43e97b', end: '#38f9d7' },
  hooks: { start: '#fa709a', end: '#fee140' },
  statuslines: { start: '#30cfd0', end: '#330867' },
};

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  try {
    const { category, slug } = await params;

    // Validate category
    if (!isValidCategory(category)) {
      return new ImageResponse(
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          Invalid Category
        </div>,
        { ...size }
      );
    }

    const config = getCategoryConfig(category);
    if (!config) {
      return new ImageResponse(
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          Category Not Found
        </div>,
        { ...size }
      );
    }

    // Load item metadata
    const item = await getContentBySlug(category, slug);

    if (!item) {
      // Fallback for non-existent items
      const gradient = CATEGORY_GRADIENTS[category] || { start: '#667eea', end: '#764ba2' };
      return new ImageResponse(
        <div
          style={{
            background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: 'white',
          }}
        >
          {config.title} Not Found
        </div>,
        { ...size }
      );
    }

    const gradient = CATEGORY_GRADIENTS[category] || { start: '#667eea', end: '#764ba2' };

    return new ImageResponse(
      <div
        style={{
          background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)`,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 30 }}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 24,
              fontWeight: 600,
              color: gradient.end,
            }}
          >
            {config.title}
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 28, color: 'white', opacity: 0.9 }}>
            Claude Pro Directory
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            {getDisplayTitle(item)}
          </h1>

          <p
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 40,
              lineHeight: 1.4,
            }}
          >
            {item.description?.substring(0, 150)}
            {item.description && item.description.length > 150 ? '...' : ''}
          </p>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {item.tags.slice(0, 4).map((tag: string) => (
                <div
                  key={`tag-${tag}`}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 20,
                    padding: '8px 20px',
                    fontSize: 20,
                    color: 'white',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Author */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          Created by {item.author || 'Community'}
        </div>
      </div>,
      { ...size }
    );
  } catch (error: unknown) {
    // Log validation error securely with structured logging
    logger.error(
      'OpenGraph image generation error',
      error instanceof Error ? error : new Error(String(error)),
      { type: 'opengraph' }
    );

    // Return error fallback image
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48,
          fontWeight: 700,
          color: 'white',
        }}
      >
        Error Generating Image
      </div>,
      { ...size }
    );
  }
}
