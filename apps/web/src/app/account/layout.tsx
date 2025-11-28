/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 */

import { ensureUserRecord } from '@heyclaude/web-runtime/actions';
import { getUserSettings, getUserSponsorships } from '@heyclaude/web-runtime/data';
import {
  Activity,
  Bookmark,
  Briefcase,
  Home,
  Plug,
  Send,
  Settings,
  Shield,
  TrendingUp,
  User,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { UI_CLASSES, Button , Card  } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AccountMFAGuard } from '@/src/components/core/auth/account-mfa-guard';
import { AuthSignOutButton } from '@/src/components/core/buttons/auth/auth-signout-button';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthenticatedUser({
    requireUser: true,
    context: 'AccountLayout',
  });
  if (!user) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Generate single requestId for this layout request
  const requestId = generateRequestId();
  // Create request-scoped child logger to avoid race conditions
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const reqLogger = logger.child({
    requestId,
    operation: 'AccountLayout',
    route: '/account',
    module: 'apps/web/src/app/account/layout',
    userId: user.id, // Redaction will automatically hash this
  });

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

  // Type-safe access to user_metadata (Record<string, unknown> from Supabase)
  const userMetadata = user.user_metadata;
  const fullName = typeof userMetadata['full_name'] === 'string' ? userMetadata['full_name'] : null;
  const name = typeof userMetadata['name'] === 'string' ? userMetadata['name'] : null;
  const avatarUrl = typeof userMetadata['avatar_url'] === 'string' ? userMetadata['avatar_url'] : null;
  const picture = typeof userMetadata['picture'] === 'string' ? userMetadata['picture'] : null;
  const userNameMetadata = fullName ?? name ?? user.email ?? null;
  const userImageMetadata = avatarUrl ?? picture ?? null;

  // Fetch sponsorships in parallel with settings (they don't depend on each other)
  const sponsorshipsPromise = getUserSponsorships(user.id);

  let settings: Awaited<ReturnType<typeof getUserSettings>> = null;
  let profile: NonNullable<Awaited<ReturnType<typeof getUserSettings>>>['user_data'] = null;
  try {
    settings = await getUserSettings(user.id);
    if (settings) {
      profile = settings.user_data;
    } else {
      reqLogger.warn('AccountLayout: getUserSettings returned null');
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings in account layout');
    reqLogger.error('AccountLayout: getUserSettings threw', normalized);
  }

  if (!profile) {
    try {
      await ensureUserRecord({
        id: user.id,
        email: user.email ?? null,
        name: userNameMetadata,
        image: userImageMetadata,
      });
      settings = await getUserSettings(user.id);
      if (settings) {
        profile = settings.user_data ?? null;
      } else {
        reqLogger.warn('AccountLayout: getUserSettings returned null after ensureUserRecord');
      }
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to ensure user record or reload settings in account layout'
      );
      reqLogger.error('AccountLayout: ensureUserRecord or getUserSettings threw', normalized);
    }
  }

  // Await sponsorships (fetched in parallel)
  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>> = [];
  try {
    sponsorships = await sponsorshipsPromise;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships in account layout');
    reqLogger.error('AccountLayout: getUserSponsorships threw', normalized);
    sponsorships = [];
  }

  const hasSponsorships = sponsorships.length > 0;

  const navigation = [
    { name: 'Dashboard', href: '/account', icon: Home },
    { name: 'Activity', href: '/account/activity', icon: Activity },
    { name: 'Library', href: '/account/library', icon: Bookmark },
    { name: 'Jobs', href: '/account/jobs', icon: Briefcase },
    { name: 'Submissions', href: '/account/submissions', icon: Send },
    ...(hasSponsorships
      ? [{ name: 'Sponsorships', href: '/account/sponsorships', icon: TrendingUp }]
      : []),
    { name: 'Settings', href: '/account/settings', icon: Settings },
    { name: 'Two-Factor Auth', href: '/account/settings/mfa', icon: Shield },
    { name: 'Connected Accounts', href: '/account/connected-accounts', icon: Plug },
  ];

  return (
    <div className={'min-h-screen bg-background'}>
      <div className={'border-b px-4 py-4'}>
        <div className={'container mx-auto flex items-center justify-between'}>
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} group`}>
            <Link href="/" className="transition-colors-smooth group-hover:text-accent">
              ← Back to Directory
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {profile?.slug && (
              <Link href={`/u/${profile.slug}`} className="text-sm">
                View Profile
              </Link>
            )}
            <AuthSignOutButton />
          </div>
        </div>
      </div>

      <div className={'container mx-auto px-4 py-8'}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="h-fit p-4 md:col-span-1">
            <div className={'mb-6 flex items-center gap-3 border-b pb-4'}>
              {profile?.image ? (
                <Image
                  src={profile.image}
                  alt={`${profile.name ?? 'User'}'s avatar`}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                  priority={true}
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <User className="h-6 w-6" />
                </div>
              )}
              <div>
                <p className="font-medium">{profile?.name ?? userNameMetadata}</p>
                <p className={UI_CLASSES.TEXT_XS_MUTED}>{user.email ?? ''}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button variant="ghost" className={'w-full justify-start text-sm'}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>
          </Card>
          <div className="md:col-span-3">
            <AccountMFAGuard>{children}</AccountMFAGuard>
          </div>
        </div>
      </div>
    </div>
  );
}
