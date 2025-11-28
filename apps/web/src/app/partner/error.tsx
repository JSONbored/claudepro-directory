'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for partner routes.
 * 
 * Logs errors using client-side logging utilities and displays
 * a user-friendly error fallback UI.
 * 
 * @see {@link logClientErrorBoundary} - Client-side error logging utility
 */
export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Partner error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'partner',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Partner page unavailable"
      description="We couldn’t load the partner details right now. Please retry or reach out later."
      resetText="Retry partner page"
      onReset={reset}
      links={[
        { href: '/partner', label: 'View partner options', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
