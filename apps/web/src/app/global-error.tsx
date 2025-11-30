'use client';

import { padding } from '@heyclaude/web-runtime/design-system';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

/**
 * Global error boundary for the entire application.
 * 
 * This is the top-level error boundary that catches errors not handled
 * by other error boundaries. Logs errors using client-side logging utilities
 * and displays a critical error fallback UI.
 * 
 * @see {@link logClientErrorBoundary} - Client-side error logging utility
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical global errors with digest for Vercel observability
    logClientErrorBoundary(
      'Global error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'global-error',
      }
    );
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 font-sans">
          <div className="max-w-md rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="mb-4 font-bold text-2xl text-destructive">Application Error</h2>
            <p className="mb-6 text-muted-foreground">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`cursor-pointer rounded-md border-none bg-primary ${padding.xDefault} text-base text-primary-foreground transition-colors hover:bg-primary/90`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
