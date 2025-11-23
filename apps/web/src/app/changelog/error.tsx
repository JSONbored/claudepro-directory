'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
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
    const normalized = normalizeError(error, 'Changelog route rendering failed');
    logger.error('ChangelogErrorBoundary: changelog segment crashed', normalized, {
      segment: 'changelog',
      ...(error.digest && { digest: error.digest }),
    });
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
