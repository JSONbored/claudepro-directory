'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for changelog routes.
 * 
 * Logs errors using client-side logging utilities and displays
 * a user-friendly error fallback UI.
 * 
 * @see {@link logClientErrorBoundary} - Client-side error logging utility
 */
export default function ChangelogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Changelog error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'changelog-page',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Changelog temporarily unavailable"
      description="We couldn’t load the release notes right now. Please retry or head back home."
      resetText="Retry changelog"
      onReset={reset}
      links={[
        { href: '/changelog', label: 'View changelog', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
