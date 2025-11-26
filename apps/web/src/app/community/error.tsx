'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Community route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'CommunityErrorBoundary', {
      segment: 'community',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Community error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Community page unavailable"
      description="The community hub hit an unexpected issue. Please try again or jump back to the directory."
      resetText="Retry community"
      onReset={reset}
      links={[{ href: '/', label: 'Back to home', variant: 'outline' }]}
      error={error}
    />
  );
}
