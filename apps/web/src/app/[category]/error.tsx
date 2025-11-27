'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Client-side error boundary for category routes.
 * Logs errors using the standardized client-side error boundary logging utility.
 */
export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const route = globalThis.location.pathname;
    // Note: error.stack is the JavaScript error stack trace, not React's component stack.
    // React component stack is unavailable in functional app-router error.tsx components.
    const errorStack = error.stack ?? '';
    
    logClientErrorBoundary(
      'Category error boundary triggered',
      error,
      route,
      errorStack,
      {
        errorDigest: error.digest ?? 'no-digest',
        digestAvailable: Boolean(error.digest),
        userAgent: globalThis.navigator.userAgent,
        url: globalThis.location.href,
        segment: 'category',
      }
    );
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Category unavailable"
      description="We couldn’t load this category right now. Please retry or browse the full directory."
      resetText="Retry category"
      onReset={reset}
      links={[
        { href: '/', label: 'Back to directory', variant: 'default' },
        { href: '/search', label: 'Go to search', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
