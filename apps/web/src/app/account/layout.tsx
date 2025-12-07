/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 *
 * PPR Optimization:
 * - Layout structure (top bar, grid) renders immediately after authentication
 * - Sidebar streams in Suspense boundary (non-blocking)
 * - Sidebar data functions use 'use cache: private' for per-user caching:
 *   - getUserSettings() - cached with user-settings-{userId} tag
 *   - getUserSponsorships() - cached with user-sponsorships-{userId} tag
 * - Main content area streams independently via children prop
 *
 * Note: Authentication is required, so layout cannot be fully static.
 * However, the structure renders immediately while sidebar data streams.
 */

import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { AccountMFAGuard } from '@/src/components/core/auth/account-mfa-guard';
import { AuthSignOutButton } from '@/src/components/core/buttons/auth/auth-signout-button';
import { AccountSidebar } from '@/src/components/features/account/account-sidebar';
import { AccountSidebarSkeleton } from '@/src/components/features/account/account-sidebar-skeleton';

/**
 * Authentication and session management component
 * Wrapped in Suspense to avoid blocking layout render
 */
async function AccountAuthWrapper({ children }: { children: React.ReactNode }) {
  // Authentication check - required in layout for route protection
  // Wrap in try-catch to handle expected AuthSessionMissingError gracefully
  let user;
  try {
    const result = await getAuthenticatedUser({
      requireUser: true,
      context: 'AccountLayout',
    });
    user = result.user;
  } catch (error) {
    // AuthSessionMissingError is expected for unauthenticated users
    // Redirect to login instead of letting error bubble up
    const normalized = normalizeError(error, 'Authentication required');
    if (normalized.name === 'AuthSessionMissingError' || normalized.message?.includes('session')) {
      // Expected: user is not authenticated, redirect to login
      redirect('/login');
    }
    // Unexpected error: re-throw
    throw normalized;
  }

  if (!user) redirect('/login');

  // Session management - required for authentication
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Generate single requestId for this layout request (after connection() to allow Date.now())
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
  // Only refresh if session is near expiry (within 1 hour)
  if (session?.expires_at) {
    const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresIn < 3600) {
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
  const avatarUrl =
    typeof userMetadata['avatar_url'] === 'string' ? userMetadata['avatar_url'] : null;
  const picture = typeof userMetadata['picture'] === 'string' ? userMetadata['picture'] : null;
  const userNameMetadata = fullName ?? name ?? user.email ?? null;
  const userImageMetadata = avatarUrl ?? picture ?? null;

  return (
    <div className="bg-background min-h-screen">
      <div className="border-b px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} group`}>
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

/**
 * Renders the account dashboard layout and enforces user authentication for its children.
 *
 * This server component ensures a user is authenticated (redirecting to /login if not), attempts a session
 * refresh when the current session is near expiry, and derives user metadata (display name and avatar)
 * to pass to the sidebar. The layout renders a top navigation bar, a Suspense-wrapped sidebar (non-blocking),
 * and a main content area guarded by multi-factor authentication.
 *
 * Authentication and session management are wrapped in Suspense to avoid blocking the layout render.
 *
 * @param children - Content rendered inside the layout's main area
 * @returns The account layout element containing the top bar, Suspense-wrapped sidebar, and MFA-protected main content
 *
 * @see getAuthenticatedUser
 * @see createSupabaseServerClient
 * @see AccountSidebar
 * @see AccountSidebarSkeleton
 * @see AccountMFAGuard
 * @see AuthSignOutButton
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  return (
    <Suspense
      fallback={
        <div className="bg-background min-h-screen">
          <div className="border-b px-4 py-4">
            <div className="container mx-auto flex items-center justify-between">
              <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} group`}>
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
              <AccountSidebarSkeleton />
              <div className="md:col-span-3">{children}</div>
            </div>
          </div>
        </div>
      }
    >
      <AccountAuthWrapper>{children}</AccountAuthWrapper>
    </Suspense>
  );
}
