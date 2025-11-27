import type { PagePropsWithSearchParams } from '@heyclaude/web-runtime/core';
import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { AlertCircle } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
} from '@heyclaude/web-runtime/logging/server';
import { UI_CLASSES, Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

const AUTH_CODE_ERROR_PATH = ROUTES.AUTH_AUTH_CODE_ERROR;

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(AUTH_CODE_ERROR_PATH);
}

export default async function AuthCodeError(properties: PagePropsWithSearchParams) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'AuthCodeErrorPage';
  const route = AUTH_CODE_ERROR_PATH;
  const module = 'apps/web/src/app/(auth)/auth-code-error/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  const searchParameters = await properties.searchParams;

  const rawCode = searchParameters?.['code'];
  const rawProvider = searchParameters?.['provider'];
  const rawMessage = searchParameters?.['message'];

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
        <div
          className={
            'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'
          }
        >
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in. This could be due to an invalid or expired link.
        </CardDescription>
      </CardHeader>
      <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
        <Button asChild={true}>
          <Link href={ROUTES.LOGIN}>Try Again</Link>
        </Button>
        <Button variant="outline" asChild={true}>
          <Link href={ROUTES.HOME}>Return Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
