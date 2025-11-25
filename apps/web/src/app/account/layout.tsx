/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 */

import { ensureUserRecord } from '@heyclaude/web-runtime/actions';
import {
  createWebAppContextWithId,
  generateRequestId,
  hashUserId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
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
import { createSupabaseServerClient, getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AccountMFAGuard } from '@/src/components/core/auth/account-mfa-guard';
import { AuthSignOutButton } from '@/src/components/core/buttons/auth/auth-signout-button';
import { Button } from '@/src/components/primitives/ui/button';
import { Card } from '@/src/components/primitives/ui/card';

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
  const userIdHash = hashUserId(user.id);
  const logContext = createWebAppContextWithId(requestId, '/account', 'AccountLayout', {
    userIdHash,
  });

  if (session?.expires_at) {
    const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresIn < 3600) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        const normalized = normalizeError(refreshError, 'Session refresh failed');
        logger.warn('AccountLayout: session refresh failed', undefined, {
          ...logContext,
          error: normalized.message,
        });
        // Continue with existing session - user may need to re-authenticate on next request
      } else if (refreshData.session) {
        logger.debug('AccountLayout: session refreshed successfully', logContext);
      }
    }
  }

  const userNameMetadata =
    user.user_metadata?.['full_name'] ?? user.user_metadata?.['name'] ?? user.email ?? null;
  const userImageMetadata =
    user.user_metadata?.['avatar_url'] ?? user.user_metadata?.['picture'] ?? null;

  // Fetch sponsorships in parallel with settings (they don't depend on each other)
  const sponsorshipsPromise = getUserSponsorships(user.id);

  let settings: Awaited<ReturnType<typeof getUserSettings>> = null;
  let profile: NonNullable<Awaited<ReturnType<typeof getUserSettings>>>['user_data'] | null = null;
  try {
    settings = await getUserSettings(user.id);
    if (settings) {
      profile = settings.user_data ?? null;
    } else {
      logger.warn('AccountLayout: getUserSettings returned null', undefined, logContext);
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings in account layout');
    logger.error('AccountLayout: getUserSettings threw', normalized, logContext);
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
        logger.warn(
          'AccountLayout: getUserSettings returned null after ensureUserRecord',
          undefined,
          logContext
        );
      }
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to ensure user record or reload settings in account layout'
      );
      logger.error(
        'AccountLayout: ensureUserRecord or getUserSettings threw',
        normalized,
        logContext
      );
    }
  }

  // Await sponsorships (fetched in parallel)
  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>> = [];
  try {
    sponsorships = await sponsorshipsPromise;
    if (!sponsorships) {
      logger.warn('AccountLayout: getUserSponsorships returned null', undefined, logContext);
      sponsorships = [];
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships in account layout');
    logger.error('AccountLayout: getUserSponsorships threw', normalized, logContext);
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
                  alt={`${profile.name || 'User'}'s avatar`}
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
                <p className="font-medium">{profile?.name || userNameMetadata}</p>
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
