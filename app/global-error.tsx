'use client';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '28rem',
              padding: '2rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                marginBottom: '1rem',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#ef4444',
              }}
            >
              Application Error
            </h2>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
