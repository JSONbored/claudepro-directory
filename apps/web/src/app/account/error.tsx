'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
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
    const normalized = normalizeError(error, 'Account segment rendering failed');
    // Client-side error boundary - no requestId needed (not part of server request)
    logger.error('AccountErrorBoundary: account route crashed', normalized, {
      operation: 'AccountErrorBoundary',
      segment: 'account',
      ...(error.digest && { digest: error.digest }),
    });
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
