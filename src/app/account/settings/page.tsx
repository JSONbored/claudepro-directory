import Image from 'next/image';
import Link from 'next/link';
import {
  ProfileEditForm,
  RefreshProfileButton,
} from '@/src/components/core/forms/profile-edit-form';
import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

/**
 * Settings Page - User profile and account management.
 */

import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { GetUserSettingsReturn } from '@/src/types/database-overrides';


export const metadata = generatePageMetadata('/account/settings');

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Consolidated RPC: 2 parallel queries → 1 (50% reduction)
  const { data: settingsData } = await supabase.rpc('get_user_settings', {
    p_user_id: user.id,
  });

  // Type-safe RPC return using centralized type definition
  const settingsResult = settingsData as GetUserSettingsReturn;
  const userData = settingsResult?.user_data;
  const profile = settingsResult?.profile;

  // Initialize user if missing (consolidated - no more profiles table)
  if (!userData) {
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
      profile_public: true,
      follow_email: true,
    });
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 font-bold text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className={UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile details</CardDescription>
            </div>
            {userData?.slug && (
              <Link href={`/u/${userData.slug}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProfileEditForm profile={profile} />
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className={'font-medium text-sm'}>Email</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className={'font-medium text-sm'}>Member Since</p>
              <p className="text-muted-foreground">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Synced from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userData?.image && typeof userData.image === 'string' && (
            <div className="flex items-center gap-4">
              <Image
                src={userData.image}
                alt={`${userData.name || 'User'}'s avatar`}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
                priority
              />
              <div>
                <p className="text-sm">
                  Synced from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                </p>
                <RefreshProfileButton
                  providerLabel={user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
