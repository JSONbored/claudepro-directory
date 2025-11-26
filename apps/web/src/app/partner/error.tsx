'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function PartnerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Partner route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'PartnerErrorBoundary', {
      segment: 'partner',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Partner error boundary triggered', normalized, logContext);
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
