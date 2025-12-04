import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserIdentitiesData,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
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
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
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
  // Using userId directly - redaction will automatically hash it via hashUserIdCensor
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction automatically hashes this via hashUserIdCensor
  });

  userLogger.info('ConnectedAccountsPage: authentication successful', {
    section: 'authentication',
  });

  // Section: Identities Data Fetch
  // CRITICAL: Call data function directly instead of action to avoid cookies() in unstable_cache() error
  let identitiesData: Awaited<ReturnType<typeof getUserIdentitiesData>>;
  try {
    identitiesData = await getUserIdentitiesData(user.id);
    userLogger.info('ConnectedAccountsPage: identities data loaded', {
      section: 'identities-data-fetch',
      hasData: Boolean(identitiesData),
    });
  } catch (error) {
    const normalized = normalizeError(error, 'getUserIdentitiesData invocation failed');
    userLogger.error('ConnectedAccountsPage: getUserIdentitiesData threw', normalized, {
      section: 'identities-data-fetch',
    });
    // getUserIdentitiesData returns { identities: [] } on error, not null
    identitiesData = { identities: [] };
  }

  const pageHeader = (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Connected Accounts</h1>
      <p className="text-muted-foreground">Manage your OAuth provider connections</p>
    </div>
  );

  // Check if identities array is empty (not null check - identitiesData is always an object)
  if (!identitiesData?.identities || identitiesData.identities.length === 0) {
    userLogger.info('ConnectedAccountsPage: no OAuth identities found', {
      section: 'identities-data-fetch',
    });
  }

  const identities = identitiesData?.identities ?? [];
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
    <div className="space-y-6">
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
