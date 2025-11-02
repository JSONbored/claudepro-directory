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

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account');

export default async function AccountDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's bookmark count
  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get user profile - Optimized: Select only needed columns (4/21 = 81% reduction)
  const { data: profile } = await supabase
    .from('users')
    .select('name, reputation_score, tier, created_at')
    .eq('id', user.id)
    .single();

  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile?.name || 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reputation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-2xl">🏆</span>
              <span className="text-3xl font-bold">{profile?.reputation_score || 0}</span>
            </div>
            <p className={'text-xs text-muted-foreground mt-2'}>Total points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bookmark className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{bookmarkCount || 0}</span>
            </div>
            <p className={'text-xs text-muted-foreground mt-2'}>Saved items</p>
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
            <p className={'text-xs text-muted-foreground mt-2'}>Membership level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{accountAge}</span>
            </div>
            <p className={'text-xs text-muted-foreground mt-2'}>Days active</p>
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
