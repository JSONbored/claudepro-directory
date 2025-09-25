import { ImageResponse } from 'next/og';
import { getAgentMetadataBySlug } from '@/generated/agents-metadata';

export const runtime = 'edge';
export const alt = 'Claude Pro Directory - AI Agent';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { slug: string } }) {
  const agent = getAgentMetadataBySlug(params.slug);

  if (!agent) {
    // Fallback for non-existent agents
    return new ImageResponse(
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
        Agent Not Found
      </div>,
      { ...size }
    );
  }

  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            color: '#764ba2',
          }}
        >
          AI Agent
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
          {agent.title || agent.name}
        </h1>

        <p
          style={{
            fontSize: 32,
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: 40,
            lineHeight: 1.4,
          }}
        >
          {agent.description?.substring(0, 150)}
          {agent.description && agent.description.length > 150 ? '...' : ''}
        </p>

        {/* Tags */}
        {agent.tags && agent.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {agent.tags.slice(0, 4).map((tag: string) => (
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
        Created by {agent.author || 'Community'}
      </div>
    </div>,
    { ...size }
  );
}
