'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for contact routes.
 * 
 * Logs errors using client-side logging utilities and displays
 * a user-friendly error fallback UI.
 * 
 * @see {@link logClientErrorBoundary} - Client-side error logging utility
 */
export default function ContactError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientErrorBoundary(
      'Contact error boundary triggered',
      error,
      globalThis.location.pathname,
      error.stack ?? '',
      {
        errorDigest: error.digest,
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'contact',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Contact page unavailable"
      description="We couldn't load the contact page right now. Please try again or use one of the alternative contact methods below."
      resetText="Retry contact"
      onReset={reset}
      links={[
        { href: '/contact', label: 'Go to contact', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
