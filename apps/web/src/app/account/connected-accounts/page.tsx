import { getUserIdentities } from '@heyclaude/web-runtime';
import { generatePageMetadata, getAuthenticatedUser } from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { spaceY, muted, marginBottom, weight , size } from '@heyclaude/web-runtime/design-system';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Link from 'next/link';

import { ConnectedAccountsClient } from '@/src/components/features/account/connected-accounts-client';

/**
 * Dynamic Rendering Required
 * Authenticated user connections
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ROUTE = '/account/connected-accounts';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata(ROUTE);
}

export default async function ConnectedAccountsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const operation = 'ConnectedAccountsPage';
  const route = ROUTE;
  const module = 'apps/web/src/app/account/connected-accounts/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module,
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'ConnectedAccountsPage' });

  if (!user) {
    reqLogger.warn('ConnectedAccountsPage: unauthenticated access attempt detected', {
      section: 'authentication',
    });
    reqLogger.info('ConnectedAccountsPage: page render completed (unauthenticated)', {
      section: 'page-render',
      outcome: 'unauthenticated',
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your connected accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  userLogger.info('ConnectedAccountsPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Identities Data Fetch
  let result: Awaited<ReturnType<typeof getUserIdentities>> | { data: null; serverError: string };
  try {
    result = await getUserIdentities();
    userLogger.info('ConnectedAccountsPage: identities data loaded', {
      section: 'identities-data-fetch',
      hasData: !!result.data,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'getUserIdentities invocation failed');
    userLogger.error('ConnectedAccountsPage: getUserIdentities threw', normalized, {
      section: 'identities-data-fetch',
    });
    result = { data: null, serverError: normalized.message };
  }

  const pageHeader = (
    <div>
      <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Connected Accounts</h1>
      <p className={muted.default}>Manage your OAuth provider connections</p>
    </div>
  );

  if (!result.data || result.serverError) {
    if (result.serverError) {
      const normalized = normalizeError(result.serverError, 'Connected accounts server error');
      userLogger.error('ConnectedAccountsPage: getUserIdentities returned serverError', normalized);
    } else {
      userLogger.warn('ConnectedAccountsPage: getUserIdentities returned no data');
    }

    // Use generic error message for user-facing display to prevent leaking
    // internal implementation details. Detailed errors are logged server-side.
    const errorMessage = 'Failed to load connected accounts. Please try again later.';

    userLogger.info('ConnectedAccountsPage: page render completed (error)', {
      section: 'page-render',
      outcome: result.serverError ? 'server-error' : 'no-data',
    });

    return (
      <div className={spaceY.relaxed}>
        {pageHeader}
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Connected accounts unavailable</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT_SETTINGS}>Go to settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const identities = result.data.identities;
  if (identities.length === 0) {
    userLogger.info('ConnectedAccountsPage: no OAuth identities found', {
      section: 'identities-data-fetch',
    });
  }

  // Final summary log
  userLogger.info('ConnectedAccountsPage: page render completed', {
    section: 'page-render',
    identitiesCount: identities.length,
  });

  return (
    <div className={spaceY.relaxed}>
      {pageHeader}

      <Card>
        <CardHeader>
          <CardTitle>OAuth Providers</CardTitle>
          <CardDescription>
            Link multiple accounts to sign in with any provider. Your data stays unified across all
            login methods.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConnectedAccountsClient identities={identities} />
        </CardContent>
      </Card>
    </div>
  );
}
