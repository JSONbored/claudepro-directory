/**
 * 500 Error Page - Server Error
 *
 * This page is shown when a server error occurs (500 status code).
 * Next.js will automatically use this page for server errors.
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  responsive,
  muted,
  marginBottom,
  weight,
  size,
  padding,
  minHeight,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { AlertCircle, Home, RefreshCw } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logClientError } from '@heyclaude/web-runtime/logging/client';
import { Button, Card } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Display a client-side 500 Server Error page and provide actions to reload the page or go to home.
 *
 * On mount, logs a structured client-side error containing requestId, route, module, userAgent, url, segment, and statusCode 500.
 *
 * @returns The Server Error page JSX element.
 *
 * @see generateRequestId
 * @see logClientError
 * @see ROUTES.HOME
 */
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
    <div
      className={`flex ${minHeight.screen} bg-background items-center justify-center ${padding.xDefault}`}
    >
      <Card className={`w-full ${maxWidth.lg} ${padding.relaxed} text-center`}>
        <div className={marginBottom.comfortable}>
          <div className={`${marginBottom.default} flex justify-center`}>
            <div className={`bg-destructive/10 rounded-full ${padding.compact}`}>
              <AlertCircle className="text-destructive h-12 w-12" aria-hidden="true" />
            </div>
          </div>
          <h1 className={`${marginBottom.tight} ${weight.bold} ${size['2xl']}`}>Server Error</h1>
          <p className={muted.default}>
            We encountered an error while processing your request. Our team has been notified and is
            working on a fix.
          </p>
        </div>

        <div className={responsive.smRowGap}>
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