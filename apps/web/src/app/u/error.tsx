'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function UserSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.window.location.pathname;
    const normalized = normalizeError(error, 'User profile route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'UserSegmentErrorBoundary', {
      segment: 'user-profile',
      ...(error.digest ? { digest: error.digest } : {}),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('User segment error boundary triggered', normalized, logContext);
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
