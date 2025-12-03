'use client';

import {
  padding,
  border,
  radius,
  marginBottom,
  muted,
  weight,
  size,
  minHeight,
} from '@heyclaude/web-runtime/design-system';
import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

/**
 * Top-level error boundary that logs unhandled client errors and renders a critical fallback UI.
 *
 * Logs the error with pathname, stack, user agent, and optional `digest` for observability, and displays a resettable error screen.
 *
 * @param props.error - The caught Error object; may include a `digest` string for grouping or observability.
 * @param props.reset - Callback invoked to reset the error boundary or application state.
 * @see {@link logClientErrorBoundary}
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
        <div
          className={`flex ${minHeight.screen} flex-col items-center justify-center ${padding.default} font-sans`}
        >
          <div
            className={`max-w-md ${radius.lg} ${border.default} bg-card ${padding.relaxed} text-center`}
          >
            <h2
              className={`${marginBottom.default} ${weight.bold} ${size['2xl']} text-destructive`}
            >
              Application Error
            </h2>
            <p className={`${marginBottom.comfortable} ${muted.default}`}>
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`bg-primary cursor-pointer rounded-md border-none ${padding.xDefault} ${size.base} text-primary-foreground hover:bg-primary/90 transition-colors`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
