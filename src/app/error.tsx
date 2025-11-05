'use client';

import { useEffect } from 'react';
import { logger } from '@/src/lib/logger';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error with structured logging for better Vercel observability
    // The digest is critical for finding Server Component errors in Vercel logs
    logger.error('Application error boundary triggered', error, {
      errorDigest: error.digest || 'no-digest',
      digestAvailable: Boolean(error.digest),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : '',
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <div className={'flex min-h-screen flex-col items-center justify-center p-4'}>
      <div className={'max-w-md rounded-lg border border-border bg-card p-8 text-center'}>
        <h2 className="mb-4 font-bold text-2xl text-destructive">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. We've been notified and are working on a fix.
        </p>
        <button
          type="button"
          onClick={reset}
          className={
            'rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90'
          }
        >
          Try again
        </button>
      </div>
    </div>
  );
}
