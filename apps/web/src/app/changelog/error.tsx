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

export default function ChangelogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Changelog route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'ChangelogErrorBoundary', {
      segment: Constants.public.Enums.content_category[10], // 'changelog'
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Changelog error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Changelog temporarily unavailable"
      description="We couldn’t load the release notes right now. Please retry or head back home."
      resetText="Retry changelog"
      onReset={reset}
      links={[
        { href: '/changelog', label: 'View changelog', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
