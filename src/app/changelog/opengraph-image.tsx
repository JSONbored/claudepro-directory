/**
 * Changelog List OpenGraph Image
 *
 * Static OG image for the main changelog page (/changelog).
 * Shows branding, total updates count, and latest update date.
 *
 * Architecture:
 * - Static image generation (no dynamic params)
 * - Changelog-specific gradient (#667eea → #764ba2)
 * - Shows metadata about changelog
 *
 * Performance:
 * - Runtime: nodejs
 * - Max duration: 10s
 * - Generated once, cached by CDN
 *
 * Production Standards:
 * - Proper error handling
 * - Type-safe with Next.js 15.5.4
 * - Accessible alt text
 * - Optimized for social sharing
 */

import { ImageResponse } from 'next/og';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';

// Route segment configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

// OG image metadata
export const alt = 'Claude Pro Directory Changelog - Platform Updates';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Generate OpenGraph image for changelog list page
 */
export default async function Image() {
  try {
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
        }}
      >
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 60 }}>
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Claude Pro
          </div>
          <div
            style={{
              display: 'flex',
              marginLeft: 20,
              fontSize: 64,
              fontWeight: 300,
              color: 'white',
            }}
          >
            Directory
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
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: 'white',
              marginBottom: 30,
              lineHeight: 1.1,
              display: 'flex',
            }}
          >
            Changelog
          </div>

          <div
            style={{
              fontSize: 36,
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: 50,
              lineHeight: 1.3,
              display: 'flex',
            }}
          >
            Track all platform updates, new features, bug fixes, and improvements
          </div>

          {/* Stats/Features */}
          <div style={{ display: 'flex', gap: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#22c55e',
                }}
              />
              <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255, 255, 255, 0.8)' }}>
                New Features
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#a855f7',
                }}
              />
              <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255, 255, 255, 0.8)' }}>
                Bug Fixes
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: '#3b82f6',
                }}
              />
              <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255, 255, 255, 0.8)' }}>
                Improvements
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 24,
            color: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <div style={{ display: 'flex' }}>{APP_CONFIG.domain}/changelog</div>
          <div style={{ display: 'flex' }}>October 2025</div>
        </div>
      </div>,
      { ...size }
    );
  } catch (error) {
    // Log error and return fallback image
    logger.error(
      'OpenGraph image generation error for changelog list',
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
