'use client';

import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Jobs route rendering failed');
    logger.error('JobsErrorBoundary: jobs listing crashed', normalized, {
      segment: 'jobs',
      ...(error.digest && { digest: error.digest }),
    });
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
