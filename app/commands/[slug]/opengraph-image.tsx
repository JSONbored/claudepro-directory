import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { getCommandMetadataBySlug } from '@/generated/commands-metadata';
import { logger } from '@/lib/logger';
import { getDisplayTitle } from '@/lib/utils';

export const alt = 'Claude Pro Directory - Command';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Validation schema for route parameters
const paramsSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug is too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toLowerCase().trim()),
});

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  try {
    // Await params and validate
    const rawParams = await params;
    const validatedParams = paramsSchema.parse(rawParams);

    const command = getCommandMetadataBySlug(validatedParams.slug);

    if (!command) {
      return new ImageResponse(
        <div
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
          Command Not Found
        </div>,
        { ...size }
      );
    }

    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
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
              color: '#7c3aed',
            }}
          >
            Command
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
            {getDisplayTitle(command)}
          </h1>

          <p
            style={{
              fontSize: 32,
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: 40,
              lineHeight: 1.4,
            }}
          >
            {command.description?.substring(0, 150)}
            {command.description && command.description.length > 150 ? '...' : ''}
          </p>

          {/* Tags */}
          {command.tags && command.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {command.tags.slice(0, 4).map((tag: string) => (
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
          Created by {command.author || 'Community'}
        </div>
      </div>,
      { ...size }
    );
  } catch (error: unknown) {
    // Log validation error securely with structured logging
    logger.error(
      'Command opengraph validation error',
      error instanceof Error ? error : new Error(String(error)),
      { type: 'validation' }
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
        Invalid Command
      </div>,
      { ...size }
    );
  }
}
