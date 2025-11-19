/**
 * Account Layout - Protected dashboard layout with sidebar navigation.
 */

import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthSignOutButton } from '@/src/components/core/buttons/auth/auth-signout-button';
import { Button } from '@/src/components/primitives/ui/button';
import { Card } from '@/src/components/primitives/ui/card';
import { ensureUserRecord } from '@/src/lib/actions/user.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserSettings, getUserSponsorships } from '@/src/lib/data/account/user-data';
import {
  Activity,
  Bookmark,
  Briefcase,
  Home,
  Plug,
  Send,
  Settings,
  TrendingUp,
  User,
} from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthenticatedUser({
    requireUser: true,
    context: 'AccountLayout',
  });
  if (!user) redirect('/login');

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.expires_at) {
    const expiresIn = session.expires_at - Math.floor(Date.now() / 1000);
    if (expiresIn < 3600) {
      await supabase.auth.refreshSession();
    }
  }

  const userNameMetadata =
    user.user_metadata?.['full_name'] ?? user.user_metadata?.['name'] ?? user.email ?? null;
  const userImageMetadata =
    user.user_metadata?.['avatar_url'] ?? user.user_metadata?.['picture'] ?? null;

  let settings: Awaited<ReturnType<typeof getUserSettings>> = null;
  let profile: NonNullable<Awaited<ReturnType<typeof getUserSettings>>>['user_data'] | null = null;
  try {
    settings = await getUserSettings(user.id);
    if (settings) {
      profile = settings.user_data ?? null;
    } else {
      logger.warn('AccountLayout: getUserSettings returned null', { userId: user.id });
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings in account layout');
    logger.error('AccountLayout: getUserSettings threw', normalized, { userId: user.id });
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
        logger.warn('AccountLayout: getUserSettings returned null after ensureUserRecord', {
          userId: user.id,
        });
      }
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to ensure user record or reload settings in account layout'
      );
      logger.error('AccountLayout: ensureUserRecord or getUserSettings threw', normalized, {
        userId: user.id,
      });
    }
  }

  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>> = [];
  try {
    sponsorships = await getUserSponsorships(user.id);
    if (!sponsorships) {
      logger.warn('AccountLayout: getUserSponsorships returned null', { userId: user.id });
      sponsorships = [];
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships in account layout');
    logger.error('AccountLayout: getUserSponsorships threw', normalized, { userId: user.id });
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
    { name: 'Connected Accounts', href: '/account/connected-accounts', icon: Plug },
  ];

  return (
    <div className={'min-h-screen bg-background'}>
      <div className={'border-b px-4 py-4'}>
        <div className={'container mx-auto flex items-center justify-between'}>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
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
                <p className={UI_CLASSES.TEXT_XS_MUTED}>{user.email}</p>
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
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
