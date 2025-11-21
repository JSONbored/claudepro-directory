'use client';

import { useEffect } from 'react';
import { logger } from '@/src/lib/logger';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log critical global errors with digest for Vercel observability
    const normalized = normalizeError(error, 'Global error boundary triggered');
    logger.fatal('Global error boundary triggered', normalized, {
      errorDigest: error.digest || 'no-digest',
      digestAvailable: Boolean(error.digest),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : '',
      timestamp: new Date().toISOString(),
      global: true,
    });
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div className={'flex min-h-screen flex-col items-center justify-center p-4 font-sans'}>
          <div className={'max-w-md rounded-lg border border-border bg-card p-8 text-center'}>
            <h2 className="mb-4 font-bold text-2xl text-destructive">Application Error</h2>
            <p className="mb-6 text-muted-foreground">
              A critical error occurred. Please refresh the page or try again later.
            </p>
            <button
              type="button"
              onClick={reset}
              className={`cursor-pointer rounded-md border-none bg-primary ${UI_CLASSES.CONTAINER_PADDING_SM} text-base text-primary-foreground transition-colors hover:bg-primary/90`}
            >
              Reset Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
