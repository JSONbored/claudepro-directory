'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
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
    const normalized = normalizeError(error, 'User profile route rendering failed');
    logger.error('UserSegmentErrorBoundary: /u segment crashed', normalized, {
      segment: 'user-profile',
      ...(error.digest && { digest: error.digest }),
    });
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
