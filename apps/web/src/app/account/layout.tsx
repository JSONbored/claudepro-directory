/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 * Uses Suspense for non-blocking sidebar data fetching.
 */

import { cluster } from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { AccountMFAGuard } from '@/src/components/core/auth/account-mfa-guard';
import { AuthSignOutButton } from '@/src/components/core/buttons/auth/auth-signout-button';
import { AccountSidebar } from '@/src/components/features/account/account-sidebar';
import { AccountSidebarSkeleton } from '@/src/components/features/account/account-sidebar-skeleton';

/**
 * Server-side layout that renders the protected account dashboard with a sidebar and main content area.
 *
 * Performs authentication and session refresh checks, provides user metadata to the sidebar, and wraps
 * the main content with MFA protection.
 *
 * @param children - The content rendered in the main (protected) area of the account dashboard.
 * @returns A React element containing the account layout (header, sidebar, and protected main content).
 *
 * @see getAuthenticatedUser
 * @see createSupabaseServerClient
 * @see AccountSidebar
 * @see AccountMFAGuard
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Authentication check - required in layout for route protection
  // eslint-disable-next-line architectural-rules/no-blocking-operations-in-layouts -- Required for protected route authentication
  const { user } = await getAuthenticatedUser({
    requireUser: true,
    context: 'AccountLayout',
  });
  if (!user) redirect('/login');

  // Session management - required for authentication
  /* eslint-disable architectural-rules/no-blocking-operations-in-layouts */
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  /* eslint-enable architectural-rules/no-blocking-operations-in-layouts */

  // Generate single requestId for this layout request
  const requestId = generateRequestId();
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'AccountLayout',
    route: '/account',
    module: 'apps/web/src/app/account/layout',
    userId: user.id, // Automatically hashed by redaction
  });

  // Session refresh - required to maintain authentication
  if (session?.expires_at) {
    const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresIn < 3600) {
      // eslint-disable-next-line architectural-rules/no-blocking-operations-in-layouts -- Required for session refresh to maintain authentication
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        const normalized = normalizeError(refreshError, 'Session refresh failed');
        reqLogger.warn('AccountLayout: session refresh failed', {
          err: normalized,
        });
        // Continue with existing session - user may need to re-authenticate on next request
      } else if (refreshData.session) {
        reqLogger.debug('AccountLayout: session refreshed successfully');
      }
    }
  }

  // Extract user metadata for sidebar (non-blocking, passed as props)
  const userMetadata = user.user_metadata;
  const fullName = typeof userMetadata['full_name'] === 'string' ? userMetadata['full_name'] : null;
  const name = typeof userMetadata['name'] === 'string' ? userMetadata['name'] : null;
  const avatarUrl = typeof userMetadata['avatar_url'] === 'string' ? userMetadata['avatar_url'] : null;
  const picture = typeof userMetadata['picture'] === 'string' ? userMetadata['picture'] : null;
  const userNameMetadata = fullName ?? name ?? user.email ?? null;
  const userImageMetadata = avatarUrl ?? picture ?? null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className={`${cluster.compact} group`}>
            <Link href="/" className="transition-colors-smooth group-hover:text-accent">
              ← Back to Directory
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <AuthSignOutButton />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {/* Sidebar with Suspense - data fetching doesn't block page navigation */}
          <Suspense fallback={<AccountSidebarSkeleton />}>
            <AccountSidebar
              user={user}
              userNameMetadata={userNameMetadata}
              userImageMetadata={userImageMetadata}
            />
          </Suspense>
          
          <div className="md:col-span-3">
            <AccountMFAGuard>{children}</AccountMFAGuard>
          </div>
        </div>
      </div>
    </div>
  );
}