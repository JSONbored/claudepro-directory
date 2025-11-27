/**
 * 500 Error Page - Server Error
 * 
 * This page is shown when a server error occurs (500 status code).
 * Next.js will automatically use this page for server errors.
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logClientError,
} from '@heyclaude/web-runtime/logging/client';
import { UI_CLASSES, Button, Card } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ServerError() {
  useEffect(() => {
    const requestId = generateRequestId();
    const route = globalThis.location.pathname;
    const operation = 'ServerErrorPage';
    const module = 'apps/web/src/app/500';
    const serverError = new Error('Server error (500)');
    logClientError('Server error page displayed', serverError, operation, {
      requestId,
      route,
      module,
      userAgent: globalThis.navigator.userAgent,
      url: globalThis.location.href,
      segment: 'global',
      statusCode: 500,
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-12 w-12 text-destructive" aria-hidden="true" />
            </div>
          </div>
          <h1 className="mb-2 font-bold text-2xl">Server Error</h1>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Our team has been notified and is working on a fix.
          </p>
        </div>

        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Button onClick={() => globalThis.location.reload()} size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={ROUTES.HOME}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
