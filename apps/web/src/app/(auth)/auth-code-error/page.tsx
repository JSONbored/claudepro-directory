import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';

const AUTH_CODE_ERROR_PATH = ROUTES.AUTH_AUTH_CODE_ERROR;

/**
 * Generate page metadata for the authentication code error route.
 *
 * @returns The metadata object for the authentication code error page.
 * @see generatePageMetadata
 * @see AUTH_CODE_ERROR_PATH
 * @see {@link https://nextjs.org/docs/app/building-your-application/metadata Metadata (Next.js)}
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(AUTH_CODE_ERROR_PATH);
}

/**
 * Display an authentication error page when an authorization-code sign-in attempt fails.
 *
 * Reads `searchParams` for optional `code`, `provider`, and `message`, emits a redacted informational log entry, and renders a centered card offering actions to retry sign-in or return home.
 *
 * @param properties - Next.js page props containing `searchParams` with optional `code`, `provider`, and `message` query values
 * @returns The JSX element rendering the authentication error card with "Try Again" and "Return Home" actions
 *
 * @see ROUTES
 * @see generateRequestId
 * @see logger
 */
export default function AuthCodeError(properties: PagePropsWithSearchParams) {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
              <AlertCircle className="text-destructive h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">Authentication Error</CardTitle>
            <CardDescription>Loading error details...</CardDescription>
          </CardHeader>
          <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Try Again</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={ROUTES.HOME}>Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      }
    >
      <AuthCodeErrorContent searchParams={properties.searchParams ?? Promise.resolve({})} />
    </Suspense>
  );
}

/**
 * Renders an authentication error card based on URL query parameters.
 *
 * @param searchParams - A Promise that resolves to a record of query parameters where values may be strings or string arrays. The component extracts optional `code`, `provider`, and `message` keys; `code` and `provider` default to `"unknown"` when absent and `message` may be `undefined`.
 * @returns A JSX element containing an authentication error card with actions to retry login or return home.
 *
 * @see AUTH_CODE_ERROR_PATH
 */
async function AuthCodeErrorContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'AuthCodeErrorPage';
  const route = AUTH_CODE_ERROR_PATH;
  const modulePath = 'apps/web/src/app/(auth)/auth-code-error/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
  });

  const searchParameters = await searchParams;

  const rawCode = searchParameters['code'];
  const rawProvider = searchParameters['provider'];
  const rawMessage = searchParameters['message'];

  // Handle array or string, and ensure we get a string or default
  const code = (Array.isArray(rawCode) ? rawCode[0] : rawCode) ?? 'unknown';
  const provider = (Array.isArray(rawProvider) ? rawProvider[0] : rawProvider) ?? 'unknown';
  const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

  // Log page render (informational)
  reqLogger.info('AuthCodeErrorPage rendered', {
    // Redact sensitive code/provider values
    hasCode: Boolean(code && code !== 'unknown'),
    provider: provider === 'unknown' ? 'unknown' : 'redacted',
    hasMessage: Boolean(message),
    hasSearchParams: Boolean(searchParameters),
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="bg-destructive/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <AlertCircle className="text-destructive h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in. This could be due to an invalid or expired link.
        </CardDescription>
      </CardHeader>
      <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
        <Button asChild>
          <Link href={ROUTES.LOGIN}>Try Again</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.HOME}>Return Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}