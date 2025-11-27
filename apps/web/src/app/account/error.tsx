'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for account routes.
 * Logs errors using the standardized client-side error boundary logging utility.
 */
export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Account error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'account',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Account dashboard unavailable"
      description="We hit an unexpected issue while loading your account. Please try again or head back home."
      resetText="Retry dashboard"
      onReset={reset}
      links={[
        { href: '/account', label: 'Go to dashboard', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
