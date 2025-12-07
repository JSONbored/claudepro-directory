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
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ConnectedAccountsClient } from '@/src/components/features/account/connected-accounts-client';

/**
 * Dynamic Rendering Required
 * Authenticated user connections
 */

const ROUTE = '/account/connected-accounts';

/**
 * Create the page metadata for the Connected Accounts route.
 *
 * Used by Next.js to populate the page's head (title, description, open graph, etc.).
 *
 * @returns The Metadata object for the Connected Accounts page.
 * @see ROUTE
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata(ROUTE);
}

/**
 * Renders the Connected Accounts page for the current user, showing linked OAuth identities or a sign-in prompt when unauthenticated.
 *
 * @returns The page's React element containing the header and an OAuth providers card populated with the user's identities, or a sign-in prompt if no user is authenticated.
 *
 * @see getAuthenticatedUser
 * @see getUserIdentitiesData
 * @see ConnectedAccountsClient
 * @see ROUTES.LOGIN
 */
export default async function ConnectedAccountsPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();
  const operation = 'ConnectedAccountsPage';
  const route = ROUTE;
  const modulePath = 'apps/web/src/app/account/connected-accounts/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation,
    route,
    module: modulePath,
  });

  return (
    <Suspense fallback={<div className="space-y-6">Loading connected accounts...</div>}>
      <ConnectedAccountsPageContent reqLogger={reqLogger} />
    </Suspense>
  );
}

async function ConnectedAccountsPageContent({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
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
  // CRITICAL: Call data function directly instead of action to avoid cookies() access issues in Cache Components
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
    // Fallback to empty identities array on error
    identitiesData = { identities: [] };
  }

  const pageHeader = (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Connected Accounts</h1>
      <p className="text-muted-foreground">Manage your OAuth provider connections</p>
    </div>
  );

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
