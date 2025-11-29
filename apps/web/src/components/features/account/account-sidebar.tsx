/**
 * Account Sidebar Server Component
 * Fetches user settings and sponsorships for sidebar navigation
 * Wrapped in Suspense by parent layout for non-blocking data fetching
 */

import type { User } from '@supabase/supabase-js';
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
  User as UserIcon,
} from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { UI_CLASSES, Button, Card } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';

interface AccountSidebarProps {
  user: User;
  userNameMetadata: string | null;
  userImageMetadata: string | null;
}

export async function AccountSidebar({
  user,
  userNameMetadata,
  userImageMetadata,
}: AccountSidebarProps) {
  // Generate request-scoped logger for sidebar data fetching
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'AccountSidebar',
    route: '/account',
    module: 'apps/web/src/components/features/account/account-sidebar',
    userId: user.id, // Automatically hashed by redaction
  });

  // Fetch sponsorships in parallel with settings (they don't depend on each other)
  const sponsorshipsPromise = getUserSponsorships(user.id);

  let settings: Awaited<ReturnType<typeof getUserSettings>> = null;
  let profile: NonNullable<Awaited<ReturnType<typeof getUserSettings>>>['user_data'] = null;
  try {
    settings = await getUserSettings(user.id);
    if (settings) {
      profile = settings.user_data;
    } else {
      reqLogger.warn('AccountSidebar: getUserSettings returned null');
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings in account sidebar');
    reqLogger.error('AccountSidebar: getUserSettings threw', normalized);
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
        reqLogger.warn('AccountSidebar: getUserSettings returned null after ensureUserRecord');
      }
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to ensure user record or reload settings in account sidebar'
      );
      reqLogger.error('AccountSidebar: ensureUserRecord or getUserSettings threw', normalized);
    }
  }

  // Await sponsorships (fetched in parallel)
  let sponsorships: Awaited<ReturnType<typeof getUserSponsorships>> = [];
  try {
    sponsorships = await sponsorshipsPromise;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user sponsorships in account sidebar');
    reqLogger.error('AccountSidebar: getUserSponsorships threw', normalized);
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
    <Card className="h-fit p-4 md:col-span-1">
      <div className="mb-6 flex items-center gap-3 border-b pb-4">
        {profile?.image ? (
          <Image
            src={profile.image}
            alt={`${profile.name ?? 'User'}'s avatar`}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <UserIcon className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium">{profile?.name ?? userNameMetadata}</p>
          <p className={UI_CLASSES.TEXT_XS_MUTED}>{user.email ?? ''}</p>
          {profile?.slug ? (
            <Link href={`/u/${profile.slug}`} className="text-accent text-xs hover:underline">
              View Profile
            </Link>
          ) : null}
        </div>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button variant="ghost" className="w-full justify-start text-sm">
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
    </Card>
  );
}
