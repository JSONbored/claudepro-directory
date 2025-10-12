import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { Bookmark, Calendar } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = await generatePageMetadata('/account');

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

  // Get user profile
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();

  const accountAge = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>Welcome back, {profile?.name || 'User'}!</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Reputation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <span className="text-2xl">🏆</span>
              <span className="text-3xl font-bold">{profile?.reputation_score || 0}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Total points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Bookmarks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Bookmark className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{bookmarkCount || 0}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Saved items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={profile?.tier === 'pro' ? 'default' : 'secondary'} className="mt-2">
              {profile?.tier
                ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                : 'Free'}
            </Badge>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Membership level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{accountAge}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Days active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and features</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_2}>
          <p className={UI_CLASSES.TEXT_SM}>
            • View your{' '}
            <a href={ROUTES.ACCOUNT_ACTIVITY} className="text-primary hover:underline">
              contribution history
            </a>{' '}
            and earn badges
          </p>
          <p className={UI_CLASSES.TEXT_SM}>
            • Browse the{' '}
            <a href={ROUTES.HOME} className="text-primary hover:underline">
              directory
            </a>{' '}
            and bookmark your favorite configurations
          </p>
          <p className={UI_CLASSES.TEXT_SM}>
            • View your{' '}
            <a href={ROUTES.ACCOUNT_LIBRARY} className="text-primary hover:underline">
              library
            </a>{' '}
            with saved bookmarks and collections
          </p>
          <p className={UI_CLASSES.TEXT_SM}>
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
