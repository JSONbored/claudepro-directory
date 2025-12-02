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
import { borderBottom, muted, iconSize, spaceY, cluster, weight, size, padding, radius, bgColor,
  justify,
  alignItems,
  marginBottom,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Button, Card } from '@heyclaude/web-runtime/ui';
import Image from 'next/image';
import Link from 'next/link';

interface AccountSidebarProps {
  user: User;
  userNameMetadata: string | null;
  userImageMetadata: string | null;
}

/**
 * Render the account sidebar for a signed-in user, fetching profile and sponsorship data.
 *
 * This React Server Component loads user settings (profile) and sponsorships. Settings and
 * sponsorships are fetched in parallel when possible; if settings are missing the component
 * attempts to create/ensure a user record and reload settings. Errors are normalized and logged,
 * and the UI falls back to safe defaults (no profile image, empty sponsorships) when data cannot be loaded.
 *
 * @param user - Authenticated Supabase user object for the current session
 * @param userNameMetadata - Name extracted from authentication metadata to use when profile name is absent
 * @param userImageMetadata - Image URL extracted from authentication metadata to use when profile image is absent
 * @returns The account sidebar element containing avatar, name/email, profile link (if present), and navigation
 *
 * @see getUserSettings
 * @see getUserSponsorships
 * @see ensureUserRecord
 */
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
    <Card className={`h-fit ${padding.default} md:col-span-1`}>
      <div className={`${marginBottom.comfortable} ${cluster.default} ${borderBottom.default} pb-4`}>
        {profile?.image ? (
          <Image
            src={profile.image}
            alt={`${profile.name ?? 'User'}'s avatar`}
            width={48}
            height={48}
            className={`${squareSize.avatarLg} ${radius.full} object-cover`}
            unoptimized
            priority
          />
        ) : (
          <div className={`flex ${squareSize.avatarLg} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor.accent}`}>
            <UserIcon className={iconSize.lg} />
          </div>
        )}
        <div className="flex-1">
          <p className={weight.medium}>{profile?.name ?? userNameMetadata}</p>
          <p className={`${muted.default} ${size.xs}`}>{user.email ?? ''}</p>
          {profile?.slug ? (
            <Link href={`/u/${profile.slug}`} className={`text-accent ${size.xs} hover:underline`}>
              View Profile
            </Link>
          ) : null}
        </div>
      </div>

      <nav className={spaceY.compact}>
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <Button variant="ghost" className={`w-full ${justify.start} ${size.sm}`}>
              <item.icon className={`mr-2 ${iconSize.sm}`} />
              {item.name}
            </Button>
          </Link>
        ))}
      </nav>
    </Card>
  );
}