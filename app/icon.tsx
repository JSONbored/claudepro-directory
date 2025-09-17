import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#CC785C', // Exact Claude icon color
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '6px',
      }}
    >
      {/* Asterisk-like star shape similar to Claude */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{ display: 'block' }}
        role="img"
        aria-label="Claude Pro Directory Icon"
      >
        <title>Claude Pro Directory Icon</title>
        {/* 8-pointed star/asterisk shape */}
        <path
          d="M12 2 L12 8 M12 16 L12 22 M4 12 L8 12 M16 12 L20 12 M6.5 6.5 L9 9 M15 15 L17.5 17.5 M17.5 6.5 L15 9 M9 15 L6.5 17.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Small center dot */}
        <circle cx="12" cy="12" r="1.5" fill="white" />
      </svg>
    </div>,
    {
      ...size,
    }
  );
}
