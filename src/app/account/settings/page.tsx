import { createClient } from '@/src/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - ClaudePro Directory',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div>
            <label className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Email</label>
            <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{user.email}</p>
          </div>
          
          <div>
            <label className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>User ID</label>
            <p className={`${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.TEXT_XS} font-mono`}>
              {user.id}
            </p>
          </div>

          {profile?.slug && (
            <div>
              <label className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Profile URL</label>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                /u/{profile.slug}
              </p>
            </div>
          )}

          <div>
            <label className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Member Since</label>
            <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>More Settings Coming Soon</CardTitle>
          <CardDescription>We're working on adding more customization options</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.SPACE_Y_2}`}>
            <li>• Profile customization (name, bio, avatar)</li>
            <li>• Email preferences</li>
            <li>• Notification settings</li>
            <li>• Privacy controls</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
