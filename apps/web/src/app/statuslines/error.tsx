'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Statuslines Segment Error Boundary
 * 
 * Client-side error boundary for statuslines routes.
 * Logs errors using standardized client-side error boundary logging.
 * 
 * @see {@link @heyclaude/web-runtime/logging/client.logClientErrorBoundary | logClientErrorBoundary} - Error boundary logging utility
 */
export default function StatuslinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In client components, globalThis is always available
    const route = globalThis.location.pathname;
    const jsStackTrace = error.stack ?? ''; // Note: This is JS stack trace, not React component stack
    
    logClientErrorBoundary(
      'Statuslines error boundary triggered',
      error,
      route,
      jsStackTrace, // Note: This is JS stack trace, not React component stack
      {
        errorDigest: error.digest, // Allow undefined to match account/error.tsx pattern
        digestAvailable: Boolean(error.digest),
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'statuslines-page',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Statuslines unavailable"
      description="We couldn’t load the statuslines gallery right now. Please try again or browse the home page."
      resetText="Retry statuslines"
      onReset={reset}
      links={[
        { href: '/statuslines', label: 'View statuslines', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
