'use client';

import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useEffect } from 'react';

import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const normalized = normalizeError(error, 'Account segment rendering failed');
    const logContext = createWebAppContextWithId(requestId, route, 'AccountErrorBoundary', {
      segment: 'account',
      ...(error.digest && { digest: error.digest }),
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
    });
    logger.error('Account error boundary triggered', normalized, logContext);
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Account dashboard unavailable"
      description="We hit an unexpected issue while loading your account. Please try again or head back home."
      resetText="Retry dashboard"
      onReset={reset}
      links={[
        { href: '/account', label: 'Go to dashboard', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
