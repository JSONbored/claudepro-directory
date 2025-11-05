import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';
import { ROUTES } from '@/src/lib/constants/routes';
import { Bookmark, Calendar } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account');

export default async function AccountDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Consolidated RPC: 2 queries → 1 (50% reduction)
  const { data: dashboardData } = await supabase.rpc('get_account_dashboard', {
    p_user_id: user.id,
  });

  // Type assertion to database-generated Json type
  type DashboardResponse = {
    bookmark_count: number;
    profile: Pick<Tables<'users'>, 'name' | 'reputation_score' | 'tier' | 'created_at'>;
  };

  const { bookmark_count, profile } = (dashboardData || {
    bookmark_count: 0,
    profile: {
      name: null,
      reputation_score: null,
      tier: null,
      created_at: new Date().toISOString(),
    },
  }) as unknown as DashboardResponse;

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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reputation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-2xl">🏆</span>
              <span className="font-bold text-3xl">{profile?.reputation_score || 0}</span>
            </div>
            <p className={'mt-2 text-muted-foreground text-xs'}>Total points</p>
          </CardContent>
        </Card>

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
            <UnifiedBadge
              variant="base"
              style={profile?.tier === 'pro' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {profile?.tier
                ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                : 'Free'}
            </UnifiedBadge>
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
            • View your{' '}
            <a href={ROUTES.ACCOUNT_ACTIVITY} className="text-primary hover:underline">
              contribution history
            </a>{' '}
            and earn badges
          </p>
          <p className="text-sm">
            • Browse the{' '}
            <a href={ROUTES.HOME} className="text-primary hover:underline">
              directory
            </a>{' '}
            and bookmark your favorite configurations
          </p>
          <p className="text-sm">
            • View your{' '}
            <a href={ROUTES.ACCOUNT_LIBRARY} className="text-primary hover:underline">
              library
            </a>{' '}
            with saved bookmarks and collections
          </p>
          <p className="text-sm">
            • Update your profile in{' '}
            <a href={ROUTES.ACCOUNT_SETTINGS} className="text-primary hover:underline">
              settings
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
