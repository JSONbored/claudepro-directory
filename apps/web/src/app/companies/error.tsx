'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Companies route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'CompaniesErrorBoundary', {
      segment: 'companies',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Companies error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Companies are unavailable"
      description="We couldn't load the companies directory right now. Please try again shortly or head back to the home page."
      resetText="Retry companies"
      onReset={reset}
      links={[
        { href: '/companies', label: 'Browse companies', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
