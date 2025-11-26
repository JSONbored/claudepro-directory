'use client';

import { Constants } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function StatuslinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Statuslines route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'StatuslinesErrorBoundary', {
      segment: Constants.public.Enums.content_category[5], // 'statuslines'
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Statuslines error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Statuslines unavailable"
      description="We couldn’t load the statuslines gallery right now. Please try again or browse the home page."
      resetText="Retry statuslines"
      onReset={reset}
      links={[
        { href: '/statuslines', label: 'View statuslines', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
