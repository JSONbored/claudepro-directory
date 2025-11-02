import Image from 'next/image';
import Link from 'next/link';
import { ProfileEditForm, RefreshProfileButton } from '@/src/components/forms/profile-edit-form';
import { Button } from '@/src/components/primitives/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';

/**
 * Settings Page - User profile and account management.
 */

import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

// Force dynamic rendering - requires authentication
export const dynamic = 'force-dynamic';

export const metadata = generatePageMetadata('/account/settings');

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileResult, { data: userData }] = await Promise.all([
    // Optimized: Select only needed columns (10/16 = 38% reduction)
    supabase
      .from('profiles')
      .select(
        'display_name, bio, work, website, social_x_link, interests, profile_public, follow_email, created_at, reputation_score'
      )
      .eq('id', user.id)
      .single(),
    supabase.from('users').select('slug, name, image, tier').eq('id', user.id).single(),
  ]);

  // Cast to partial profile type (form only uses selected fields)
  const profile = profileResult.data as Database['public']['Tables']['profiles']['Row'] | null;

  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      follow_email: true,
      profile_public: true,
    } as Database['public']['Tables']['profiles']['Insert']);
  }

  if (!userData) {
    await supabase.from('users').upsert({
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    } as Database['public']['Tables']['users']['Insert']);
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={'text-sm font-medium'}>Email</p>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <div>
              <p className={'text-sm font-medium'}>Member Since</p>
              <p className="text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className={'text-sm font-medium'}>Reputation</p>
              <p className="text-muted-foreground">{profile.reputation_score} points</p>
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
          {userData?.image && (
            <div className="flex items-center gap-4">
              <Image
                src={userData.image}
                alt={`${userData.name || 'User'}'s avatar`}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
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
