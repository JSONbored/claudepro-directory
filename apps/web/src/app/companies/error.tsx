'use client';

import { logger, normalizeError } from '@heyclaude/web-runtime';
import { useEffect } from 'react';
import { SegmentErrorFallback } from '@/src/components/core/infra/segment-error-fallback';

export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const normalized = normalizeError(error, 'Companies route rendering failed');
    logger.error('CompaniesErrorBoundary: companies listing crashed', normalized, {
      segment: 'companies',
      ...(error.digest && { digest: error.digest }),
    });
  }, [error]);

  return (
    <SegmentErrorFallback
      title="Companies are unavailable"
      description="We couldn't load the companies directory right now. Please try again shortly or head back to the home page."
      resetText="Retry companies"
      onReset={reset}
      links={[
        { href: '/companies', label: 'Browse companies', variant: 'default' },
        { href: '/', label: 'Back to home', variant: 'outline' },
      ]}
      error={error}
    />
  );
}
