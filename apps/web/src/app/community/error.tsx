'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for community routes.
 * 
 * Logs errors using client-side logging utilities and displays
 * a user-friendly error fallback UI.
 * 
 * @see {@link logClientErrorBoundary} - Client-side error logging utility
 */
export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Community error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'community',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Community page unavailable"
      description="The community hub hit an unexpected issue. Please try again or jump back to the directory."
      resetText="Retry community"
      onReset={reset}
      links={[{ href: '/', label: 'Back to home', variant: 'outline' }]}
      error={error}
    />
  );
}
