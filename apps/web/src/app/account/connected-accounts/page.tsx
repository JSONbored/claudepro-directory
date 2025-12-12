import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserIdentitiesData,
} from '@heyclaude/web-runtime/data';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { SignInButton } from '@/src/components/core/auth/sign-in-button';
import { ConnectedAccountsClient } from '@/src/components/features/account/connected-accounts-client';

import Loading from './loading';

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
 * Render the Connected Accounts page that displays the user's linked OAuth identities or a sign-in prompt when unauthenticated.
 *
 * This server component defers non-deterministic operations to request time (calls `connection()`), creates a request-scoped logger, and mounts the client/content renderer inside a Suspense boundary.
 *
 * @returns The page React element containing the header and an "OAuth Providers" card populated with the authenticated user's identities, or a sign-in prompt if no user is authenticated.
 *
 * @see getAuthenticatedUser
 * @see getUserIdentitiesData
 * @see ConnectedAccountsClient
 * @see ROUTES.LOGIN
 */
export default async function ConnectedAccountsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConnectedAccountsPageContent />
    </Suspense>
  );
}

/**
 * Renders the Connected Accounts page content, enforcing authentication, fetching the user's
 * OAuth identities, and presenting either a sign-in prompt or the connected accounts UI.
 *
 * Performs server-side authentication via getAuthenticatedUser and retrieves identity data with
 * getUserIdentitiesData; on fetch failure it falls back to an empty identities list so the page
 * can still render.
 *
 * @returns A React element containing either a sign-in prompt when no user is authenticated or
 *   the Connected Accounts UI populated with the user's OAuth identities.
 *
 * @see getAuthenticatedUser
 * @see getUserIdentitiesData
 * @see ConnectedAccountsClient
 */
async function ConnectedAccountsPageContent() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  const operation = 'ConnectedAccountsPage';
  const route = ROUTE;
  const modulePath = 'apps/web/src/app/account/connected-accounts/page';

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: modulePath,
    operation,
    route,
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'ConnectedAccountsPage' });

  if (!user) {
    reqLogger.info(
      {
        outcome: 'unauthenticated',
        section: 'data-fetch',
      },
      'ConnectedAccountsPage: page render completed (unauthenticated)'
    );
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your connected accounts.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInButton
              redirectTo="/account/connected-accounts"
              valueProposition="Sign in to manage your connected accounts"
            >
              Go to login
            </SignInButton>
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

  userLogger.info({ section: 'data-fetch' }, 'ConnectedAccountsPage: authentication successful');

  // Section: Identities Data Fetch
  // Call the data function directly to leverage its built-in caching ('use cache: private')
  let identitiesData: Awaited<ReturnType<typeof getUserIdentitiesData>>;
  try {
    identitiesData = await getUserIdentitiesData(user.id);
    userLogger.info(
      { hasData: Boolean(identitiesData), section: 'data-fetch' },
      'ConnectedAccountsPage: identities data loaded'
    );
  } catch (error) {
    const normalized = normalizeError(error, 'getUserIdentitiesData invocation failed');
    userLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'ConnectedAccountsPage: getUserIdentitiesData threw'
    );
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
    userLogger.info({ section: 'data-fetch' }, 'ConnectedAccountsPage: no OAuth identities found');
  }

  // Final summary log
  userLogger.info(
    { identitiesCount: identities.length, section: 'data-fetch' },
    'ConnectedAccountsPage: page render completed'
  );

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
