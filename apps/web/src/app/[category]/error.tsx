'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CategoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Category listing route failed');
    const logContext = createWebAppContextWithId(requestId, route, 'CategoryErrorBoundary', {
      segment: 'category',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Category error boundary triggered', normalized, logContext);
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
