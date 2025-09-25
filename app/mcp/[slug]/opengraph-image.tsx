import { ImageResponse } from 'next/og';
import { getMcpMetadataBySlug } from '@/generated/mcp-metadata';

export const runtime = 'edge';
export const alt = 'Claude Pro Directory - MCP Server';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const server = getMcpMetadataBySlug(params.slug);

  if (!server) {
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
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
        MCP Server Not Found
      </div>,
      { ...size }
    );
  }

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
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
            color: '#3b82f6',
          }}
        >
          MCP Server
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 28, color: 'white', opacity: 0.9 }}>
          Claude Pro Directory
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: 'white',
            marginBottom: 20,
            lineHeight: 1.1,
          }}
        >
          {server.title || server.name}
        </h1>

        <p
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 40,
            lineHeight: 1.4,
          }}
        >
          {server.description?.substring(0, 150)}
          {server.description && server.description.length > 150 ? '...' : ''}
        </p>

        {/* Tags */}
        {server.tags && server.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {server.tags.slice(0, 4).map((tag: string) => (
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
        Created by {server.author || 'Community'}
      </div>
    </div>,
    { ...size }
  );
}
