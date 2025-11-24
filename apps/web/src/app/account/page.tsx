import { hashUserId, logger, normalizeError } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getAccountDashboard,
  getAuthenticatedUser,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Bookmark, Calendar } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account');
}

/**
 * Dynamic Rendering Required
 *
 * This page must use dynamic rendering because it imports from @heyclaude/web-runtime
 * which transitively imports feature-flags/flags.ts. The Vercel Flags SDK's flags/next
 * module contains module-level code that calls server functions, which cannot be
 * executed during static site generation.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const dynamic = 'force-dynamic';

export default async function AccountDashboard() {
  const { user } = await getAuthenticatedUser({ context: 'AccountDashboard' });

  if (!user) {
    logger.warn('AccountDashboard: unauthenticated access attempt detected', undefined, {
      route: '/account',
      timestamp: new Date().toISOString(),
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to view your dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hash user ID for privacy-compliant logging (GDPR/CCPA)
  const userIdHash = hashUserId(user.id);

  let dashboardData: Awaited<ReturnType<typeof getAccountDashboard>> = null;
  try {
    dashboardData = await getAccountDashboard(user.id);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load account dashboard data');
    logger.error('AccountDashboard: getAccountDashboard threw', normalized, {
      userIdHash,
    });
  }

  if (!dashboardData) {
    const normalized = normalizeError(
      'Dashboard data is null',
      'AccountDashboard: dashboard data is null'
    );
    logger.error('AccountDashboard: dashboard data is null', normalized, {
      userIdHash,
    });
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Dashboard unavailable</CardTitle>
            <CardDescription>
              We couldn&apos;t load your account data. Please refresh the page or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild={true}>
              <Link href={ROUTES.HOME}>Go to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { bookmark_count, profile } = dashboardData;

  const bookmarkCount = bookmark_count;
  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bookmark className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{bookmarkCount || 0}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Saved items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tier</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const tier = profile?.tier;
              return (
                <UnifiedBadge
                  variant="base"
                  style={tier === 'pro' ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Free'}
                </UnifiedBadge>
              );
            })()}
            <p className={'mt-2 text-muted-foreground text-xs'}>Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-bold text-3xl">{accountAge}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">
            • View your <NavLink href={ROUTES.ACCOUNT_ACTIVITY}>contribution history</NavLink> and
            earn badges
          </p>
          <p className="text-sm">
            • Browse the <NavLink href={ROUTES.HOME}>directory</NavLink> and bookmark your favorite
            configurations
          </p>
          <p className="text-sm">
            • View your <NavLink href={ROUTES.ACCOUNT_LIBRARY}>library</NavLink> with saved
            bookmarks and collections
          </p>
          <p className="text-sm">
            • Update your profile in <NavLink href={ROUTES.ACCOUNT_SETTINGS}>settings</NavLink>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
