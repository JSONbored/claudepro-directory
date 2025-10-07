/**
 * Changelog Entry OpenGraph Image
 *
 * Dynamically generates OG images for individual changelog entries.
 * Displays date, title, TL;DR, and category badges.
 *
 * Architecture:
 * - Uses Next.js ImageResponse API
 * - Generates 1200x630 PNG images
 * - Changelog-specific gradient (#667eea → #764ba2)
 * - Category badges with colors
 *
 * Performance:
 * - Runtime: nodejs (fast image generation)
 * - Max duration: 10s
 * - Generated on-demand, cached by CDN
 *
 * Production Standards:
 * - Proper error handling with fallbacks
 * - Type-safe with Next.js 15.5.4
 * - Accessible alt text
 * - Optimized for social sharing
 */

import { ImageResponse } from 'next/og';
import { getChangelogEntryBySlug } from '@/src/lib/changelog/loader';
import { formatChangelogDateShort, getNonEmptyCategories } from '@/src/lib/changelog/utils';
import { logger } from '@/src/lib/logger';

// Route segment configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

// OG image metadata
export const alt = 'Claude Pro Directory Changelog';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Changelog gradient (purple-blue)
const CHANGELOG_GRADIENT = {
  start: '#667eea',
  end: '#764ba2',
};

// Category badge colors (matching ChangelogCard)
const CATEGORY_COLORS: Record<string, string> = {
  Added: '#22c55e',
  Changed: '#3b82f6',
  Deprecated: '#eab308',
  Removed: '#ef4444',
  Fixed: '#a855f7',
  Security: '#f97316',
};

/**
 * Generate OpenGraph image for changelog entry
 */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;

    // Load changelog entry
    const entry = await getChangelogEntryBySlug(slug);

    if (!entry) {
      // Fallback for non-existent entries
      return new ImageResponse(
        <div
          style={{
            background: `linear-gradient(135deg, ${CHANGELOG_GRADIENT.start} 0%, ${CHANGELOG_GRADIENT.end} 100%)`,
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
          Changelog Entry Not Found
        </div>,
        { ...size }
      );
    }

    const nonEmptyCategories = getNonEmptyCategories(entry.categories);
    const displayDescription = entry.tldr || entry.content.slice(0, 150);

    return new ImageResponse(
      <div
        style={{
          background: `linear-gradient(135deg, ${CHANGELOG_GRADIENT.start} 0%, ${CHANGELOG_GRADIENT.end} 100%)`,
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
              display: 'flex',
              backgroundColor: 'white',
              borderRadius: 12,
              padding: '12px 24px',
              fontSize: 24,
              fontWeight: 600,
              color: CHANGELOG_GRADIENT.end,
            }}
          >
            Changelog
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 'auto',
              fontSize: 28,
              color: 'white',
              opacity: 0.9,
            }}
          >
            Claude Pro Directory
          </div>
        </div>

        {/* Date Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: '8px 20px',
              fontSize: 20,
              color: 'white',
              fontWeight: 500,
            }}
          >
            {formatChangelogDateShort(entry.date)}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Title */}
          <div
            style={{
              display: 'flex',
              fontSize: 60,
              fontWeight: 700,
              color: 'white',
              marginBottom: 20,
              lineHeight: 1.1,
              maxHeight: 200,
              overflow: 'hidden',
            }}
          >
            {entry.title}
          </div>

          {/* Description/TL;DR */}
          {displayDescription && (
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: 30,
                lineHeight: 1.4,
                maxHeight: 120,
                overflow: 'hidden',
              }}
            >
              {displayDescription.length > 150
                ? `${displayDescription.substring(0, 147)}...`
                : displayDescription}
            </div>
          )}

          {/* Category Badges */}
          {nonEmptyCategories.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {nonEmptyCategories.slice(0, 5).map((category) => (
                <div
                  key={category}
                  style={{
                    display: 'flex',
                    backgroundColor: CATEGORY_COLORS[category] || '#6b7280',
                    borderRadius: 20,
                    padding: '8px 20px',
                    fontSize: 18,
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  {category}
                </div>
              ))}
              {nonEmptyCategories.length > 5 && (
                <div
                  style={{
                    display: 'flex',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 20,
                    padding: '8px 20px',
                    fontSize: 18,
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  +{nonEmptyCategories.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>,
      { ...size }
    );
  } catch (error) {
    // Log error and return fallback image
    logger.error(
      'OpenGraph image generation error for changelog entry',
      error instanceof Error ? error : new Error(String(error))
    );

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
