'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Search route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'SearchErrorBoundary', {
      segment: 'search',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Search error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Search is temporarily unavailable"
      description="We couldn't complete your search just now. Please retry or explore the home page."
      resetText="Retry search"
      onReset={reset}
      links={[
        { href: '/search', label: 'Open search', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
