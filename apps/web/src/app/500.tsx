/**
 * 500 Error Page - Server Error
 *
 * This page is shown when a server error occurs (500 status code).
 * Next.js will automatically use this page for server errors.
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { Button, Card, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Display a client-side 500 Server Error page and log a structured client-side error on mount.
 *
 * The component shows a centered card describing the server error and provides actions to reload the page or navigate home.
 *
 * @returns The server error page as a JSX element.
 *
 * @see logClientError
 * @see ROUTES.HOME
 */
export default function ServerError() {
  useEffect(() => {
    const route = globalThis.location.pathname;
    const operation = 'ServerErrorPage';
    const serverError = new Error('Server error (500)');
    const normalized = normalizeError(serverError, 'Server error page displayed');
    logClientError('[Error] Server error page displayed', normalized, operation, {
      action: 'display-error-page',
      category: 'error',
      component: 'ServerError',
      route,
      segment: 'global',
      statusCode: 500,
      url: globalThis.location.href,
      userAgent: globalThis.navigator.userAgent,
    });
  }, []);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-destructive/10 rounded-full p-3">
              <AlertCircle aria-hidden="true" className="text-destructive h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold">Server Error</h1>
          <p className="text-muted-foreground">
            We encountered an error while processing your request. Our team has been notified and is
            working on a fix.
          </p>
        </div>

        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <Button size="lg" onClick={() => globalThis.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button asChild size="lg" variant="outline">
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
