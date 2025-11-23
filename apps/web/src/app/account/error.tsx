'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
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
    logger.error('AccountErrorBoundary: account route crashed', normalized, {
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
