'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.window.location.pathname;
    const normalized = normalizeError(error, 'Tools route rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'ToolsErrorBoundary', {
      segment: 'tools',
      ...(error.digest ? { digest: error.digest } : {}),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Tools error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Tools page unavailable"
      description="We couldn’t load the tools catalog right now. Please retry or check out the directory."
      resetText="Retry tools"
      onReset={reset}
      links={[
        { href: '/tools', label: 'View tools', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
