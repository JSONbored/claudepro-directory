'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Submit Segment Error Boundary
 * 
 * Client-side error boundary for submission routes.
 * Logs errors using standardized client-side error boundary logging.
 * 
 * @see {@link @heyclaude/web-runtime/logging/client.logClientErrorBoundary | logClientErrorBoundary} - Error boundary logging utility
 */
export default function SubmitError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In client components, globalThis is always available
    const route = globalThis.location.pathname;
    const componentStack = error.stack ?? '';
    
    logClientErrorBoundary(
      'Submit error boundary triggered',
      error,
      route,
      componentStack,
      {
        errorDigest: error.digest ?? 'no-digest',
        digestAvailable: Boolean(error.digest),
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'submit',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Submission form unavailable"
      description="We couldn’t load the submission form right now. Please retry or return to the directory."
      resetText="Retry submission"
      onReset={reset}
      links={[
        { href: '/submit', label: 'Open submission form', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
