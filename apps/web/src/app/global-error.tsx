'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
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
          <div className="border-border bg-card max-w-md rounded-lg border p-8 text-center">
            <h2 className="text-destructive mb-4 text-2xl font-bold">Application Error</h2>
            <p className="text-muted-foreground mb-6">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`bg-primary cursor-pointer rounded-md border-none ${UI_CLASSES.CONTAINER_PADDING_SM} text-primary-foreground hover:bg-primary/90 text-base transition-colors`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
