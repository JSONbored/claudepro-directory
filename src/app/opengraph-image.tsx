import { ImageResponse } from 'next/og';
import { APP_CONFIG, SEO_CONFIG } from '@/src/lib/constants';

// Route segment configuration
export const runtime = 'nodejs';
export const maxDuration = 10;

// OG image metadata
export const alt = `${APP_CONFIG.name} - Your Essential AI Toolkit`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
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
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            marginBottom: 30,
            lineHeight: 1.1,
          }}
        >
          Your Essential AI Toolkit
        </h1>

        <p
          style={{
            fontSize: 36,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 50,
            lineHeight: 1.3,
          }}
        >
          {SEO_CONFIG.defaultDescription}
        </p>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#667eea' }}>100+</div>
            <div style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.6)' }}>AI Agents</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#0ea5e9' }}>50+</div>
            <div style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.6)' }}>MCP Servers</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#10b981' }}>200+</div>
            <div style={{ fontSize: 20, color: 'rgba(255, 255, 255, 0.6)' }}>Resources</div>
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
        <div>{APP_CONFIG.domain}</div>
        <div>Open Source • Community Driven</div>
      </div>
    </div>,
    { ...size }
  );
}
