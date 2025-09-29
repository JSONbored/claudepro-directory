import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { getDisplayTitle } from '@/lib/utils';

export const runtime = 'edge';
export const alt = 'Claude Pro Directory - Claude Commands';
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

    const command = await contentProcessor.getContentItemBySlug('commands', validatedParams.slug);

    if (!command) {
      return new ImageResponse(
        <div
          style={{
            background: '#18181B',
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
          Commands Not Found
        </div>,
        { ...size }
      );
    }

    return new ImageResponse(
      <div
        style={{
          background: '#18181B',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 40,
        }}
      >
        {/* Browser Chrome */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#27272A',
            borderRadius: '8px 8px 0 0',
            padding: '12px 16px',
            marginBottom: 2,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#f59e0b',
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 14,
              color: '#a1a1aa',
              fontFamily: 'monospace',
            }}
          >
            claudepro.directory/commands/{command.slug}
          </div>
        </div>

        {/* Page Content */}
        <div
          style={{
            flex: 1,
            background: '#18181B',
            border: '1px solid #27272A',
            borderRadius: '0 0 8px 8px',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header with badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div
              style={{
                background: '#3f3f46',
                color: '#e4e4e7',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              COMMANDS
            </div>
            <div
              style={{
                background: 'transparent',
                color: '#a1a1aa',
                border: '1px solid #3f3f46',
                padding: '4px 12px',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              {command.category}
            </div>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: '#fafafa',
              marginBottom: 16,
              lineHeight: 1.1,
            }}
          >
            {getDisplayTitle(command)}
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 20,
              color: '#a1a1aa',
              marginBottom: 32,
              lineHeight: 1.4,
            }}
          >
            {command.description?.substring(0, 120)}
            {command.description && command.description.length > 120 ? '...' : ''}
          </p>

          {/* Code Preview */}
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: 20,
              fontFamily: 'monospace',
              fontSize: 16,
              color: '#10b981',
              marginBottom: 24,
            }}
          >
            $ {command.slug}
          </div>

          {/* Tags */}
          {command.tags && command.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {command.tags.slice(0, 4).map((tag: string) => (
                <div
                  key={`tag-${tag}`}
                  style={{
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: 16,
                    padding: '6px 12px',
                    fontSize: 14,
                    color: '#c4b5fd',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}

          {/* Author */}
          <div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 32,
              display: 'flex',
              alignItems: 'center',
              fontSize: 16,
              color: '#71717a',
            }}
          >
            by {command.author || 'Community'}
          </div>
        </div>
      </div>,
      { ...size }
    );
  } catch (error: unknown) {
    // LEGITIMATE: Catch blocks must handle unknown error types
    // Log validation error securely
    // biome-ignore lint/suspicious/noConsole: Error logging needed for debugging
    console.error('Commands opengraph validation error:', {
      error: error instanceof Error ? error.message : String(error),
      type: 'validation',
    });

    // Return error fallback image
    return new ImageResponse(
      <div
        style={{
          background: '#ef4444',
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
        Invalid Commands
      </div>,
      { ...size }
    );
  }
}
