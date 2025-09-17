import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Claude Pro Directory';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 128,
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Main content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Logo/Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#60a5fa',
            marginBottom: 20,
          }}
        >
          Claude Pro Directory
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Community Configurations for Claude AI
        </div>

        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 30,
            justifyContent: 'center',
          }}
        >
          {['MCP Servers', 'Agents', 'Rules', 'Commands', 'Hooks'].map((feature) => (
            <div
              key={feature}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 20,
                color: '#60a5fa',
                fontWeight: 500,
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Bottom text */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            marginTop: 40,
            fontSize: 20,
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10b981',
              }}
            />
            Free & Open Source
          </div>
          <div>1000+ Configurations</div>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
