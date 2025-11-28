'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * User Segment Error Boundary
 * 
 * Client-side error boundary for user profile routes.
 * Logs errors using standardized client-side error boundary logging.
 * 
 * @see {@link @heyclaude/web-runtime/logging/client.logClientErrorBoundary | logClientErrorBoundary} - Error boundary logging utility
 */
export default function UserSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In client components, window is always defined
    const route = globalThis.location.pathname;
    const componentStack = error.stack ?? '';
    
    logClientErrorBoundary(
      'User segment error boundary triggered',
      error,
      route,
      componentStack,
      {
        errorDigest: error.digest ?? 'no-digest',
        digestAvailable: Boolean(error.digest),
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'user-profile',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Profile unavailable"
      description="We couldn’t load this profile right now. Please retry or explore the community instead."
      resetText="Retry profile"
      onReset={reset}
      links={[
        { href: '/community', label: 'Browse community', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
