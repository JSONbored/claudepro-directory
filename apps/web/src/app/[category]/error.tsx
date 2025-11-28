'use client';

import { logClientErrorBoundary } from '@heyclaude/web-runtime/logging/client';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

/**
 * Error boundary component for the category route that logs the client-side error and renders a category-specific fallback UI.
 *
 * Logs the provided error via the client-side error boundary logger on mount or when the `error` changes, and renders a SegmentErrorFallback with navigation and retry actions.
 *
 * @param error - The caught error; may include an optional `digest` property used for error correlation.
 * @param reset - Callback invoked to retry or reset the failing route (passed to the fallback's reset action).
 * @returns The JSX element rendering the category error fallback UI.
 *
 * @see logClientErrorBoundary
 * @see SegmentErrorFallback
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