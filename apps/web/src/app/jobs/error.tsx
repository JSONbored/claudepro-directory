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

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Jobs route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'JobsErrorBoundary', {
      segment: Constants.public.Enums.content_category[9], // 'jobs'
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Jobs error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Jobs page unavailable"
      description="We ran into an issue loading the latest roles. Please retry or return to the home page."
      resetText="Retry jobs"
      onReset={reset}
      links={[
        { href: '/jobs', label: 'View jobs', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
