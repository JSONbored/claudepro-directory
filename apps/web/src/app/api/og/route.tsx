import { OG_DEFAULTS, OG_DIMENSIONS } from '@heyclaude/shared-runtime';
import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || OG_DEFAULTS.title;
  const description = searchParams.get('description') || OG_DEFAULTS.description;
  const type = searchParams.get('type') || OG_DEFAULTS.type;
  const rawTags = searchParams.get('tags');
  const tags = rawTags
    ? rawTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
    : [];

  return new ImageResponse(
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

        {description && (
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
        )}
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
            {tags.slice(0, 5).map((tag, index) => (
              <div
                key={`${tag}-${index}`}
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
    </div>,
    {
      width: OG_DIMENSIONS.width,
      height: OG_DIMENSIONS.height,
    }
  );
}
