import { createClient } from '@/src/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Bookmark, Calendar } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account Dashboard - ClaudePro Directory',
  description: 'Manage your ClaudePro account and view your activity',
};

export default async function AccountDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's bookmark count
  const { count: bookmarkCount } = await supabase
    .from('bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  const accountAge = profile?.created_at 
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Welcome back, {profile?.name || 'User'}!
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Saved configurations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Account Age</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{accountAge}</span>
            </div>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Days as member
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={UI_CLASSES.TEXT_SM}>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary" className="mt-2">
              {profile?.status === 'active' ? '✓ Active' : 'Inactive'}
            </Badge>
            <p className={`${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_MUTED_FOREGROUND} mt-2`}>
              Account status
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
            • Browse the <a href="/" className="text-primary hover:underline">directory</a> and bookmark your favorite configurations
          </p>
          <p className={UI_CLASSES.TEXT_SM}>
            • View your <a href="/account/bookmarks" className="text-primary hover:underline">saved bookmarks</a>
          </p>
          <p className={UI_CLASSES.TEXT_SM}>
            • Update your profile in <a href="/account/settings" className="text-primary hover:underline">settings</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
