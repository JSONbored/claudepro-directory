/**
 * Account Sidebar Server Component
 * Fetches user settings and sponsorships for sidebar navigation
 * Wrapped in Suspense by parent layout for non-blocking data fetching
 */

import { ensureUserRecord } from '@heyclaude/web-runtime/actions/user';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';
import {
  Activity,
  BarChart,
  Bookmark,
  Briefcase,
  CreditCard,
  FileText,
  Home,
  Key,
  Lock,
  Mail,
  Plug,
  Send,
  Settings,
  Shield,
  SlidersHorizontal,
  TrendingUp,
  User as UserIcon,
  HelpCircle,
} from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Card } from '@heyclaude/web-runtime/ui';
import { type User } from '@supabase/supabase-js';
import Image from 'next/image';
import Link from 'next/link';

import { AccountSidebarNav } from './account-sidebar-nav';

interface AccountSidebarProps {
  user: User;
  userImageMetadata: null | string;
  userNameMetadata: null | string;
}

export async function AccountSidebar({
  user,
  userNameMetadata,
  userImageMetadata,
}: AccountSidebarProps) {
  // Generate request-scoped logger for sidebar data fetching
  const reqLogger = logger.child({
    operation: 'AccountSidebar',
    route: '/account',
    module: 'apps/web/src/components/features/account/account-sidebar',
    userId: user.id, // Automatically hashed by redaction
  });

  // OPTIMIZATION: Use getUserCompleteData directly - single database call instead of two
  let completeData: Awaited<ReturnType<typeof getUserCompleteData>> | null = null;
  try {
    completeData = await getUserCompleteData(user.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user data in account sidebar');
    reqLogger.error({ err: normalized }, 'AccountSidebar: getUserCompleteData threw');
  }

  const settings = completeData?.user_settings ?? null;
  let profile = settings?.user_data ?? null;
  let sponsorships = completeData?.sponsorships ?? [];

  if (!profile) {
    try {
      await ensureUserRecord({
        id: user.id,
        email: user.email ?? null,
        name: userNameMetadata,
        image: userImageMetadata,
      });
      // Reload complete data after ensuring user record
      const refreshedData = await getUserCompleteData(user.id);
      if (refreshedData?.user_settings) {
        const refreshedSettings = refreshedData.user_settings;
        const refreshedProfile = refreshedSettings.user_data;
        if (refreshedProfile) {
          // Update local variables
          profile = refreshedProfile;
        } else {
          reqLogger.warn(
            {},
            'AccountSidebar: getUserCompleteData returned null user_data after ensureUserRecord'
          );
        }
      } else {
        reqLogger.warn(
          {},
          'AccountSidebar: getUserCompleteData returned null user_settings after ensureUserRecord'
        );
      }
    } catch (error) {
      const normalized = normalizeError(
        error,
        'Failed to ensure user record or reload data in account sidebar'
      );
      reqLogger.error(
        { err: normalized },
        'AccountSidebar: ensureUserRecord or getUserCompleteData threw'
      );
    }
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
    { name: 'Newsletter', href: '/account/newsletter', icon: Mail },
    { name: 'Settings', href: '/account/settings', icon: Settings },
    { name: 'Security', href: '/account/settings/security', icon: Lock },
    { name: 'Preferences', href: '/account/settings/preferences', icon: SlidersHorizontal },
    { name: 'Data & Privacy', href: '/account/data', icon: FileText },
    { name: 'Billing', href: '/account/billing', icon: CreditCard },
    { name: 'Analytics', href: '/account/analytics', icon: BarChart },
    { name: 'Integrations', href: '/account/integrations', icon: Key },
    { name: 'Support', href: '/account/support', icon: HelpCircle },
    { name: 'Two-Factor Auth', href: '/account/settings/mfa', icon: Shield },
    { name: 'Connected Accounts', href: '/account/connected-accounts', icon: Plug },
  ];

  // Determine image source - prefer OAuth metadata over database
  const imageSrc = userImageMetadata || profile?.image || null;

  return (
    <Card className="h-fit p-4 shadow-sm md:col-span-1 md:p-6">
      <div className="border-border/50 mb-4 flex items-center gap-2 border-b pb-3 md:mb-6 md:gap-3 md:pb-4">
        {imageSrc ? (
          <div className="relative">
            <Image
              src={imageSrc}
              alt={`${profile?.name ?? userNameMetadata ?? 'User'}'s avatar`}
              width={48}
              height={48}
              className="ring-border/50 hover:ring-accent/50 h-12 w-12 rounded-full object-cover ring-2 transition-all"
              unoptimized
              priority
            />
          </div>
        ) : (
          <div className="bg-accent/10 ring-border/50 flex h-12 w-12 items-center justify-center rounded-full ring-2">
            <UserIcon className="text-accent h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{profile?.name ?? userNameMetadata}</p>
          <p className="text-muted-foreground truncate text-xs">{user.email ?? ''}</p>
          {profile?.slug ? (
            <Link
              href={`/u/${profile.slug}`}
              className="text-accent mt-0.5 inline-block text-xs transition-colors hover:underline"
            >
              View Profile →
            </Link>
          ) : null}
        </div>
      </div>

      <AccountSidebarNav navigation={navigation} />
    </Card>
  );
}
