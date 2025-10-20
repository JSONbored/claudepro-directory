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
import { RefreshCw } from '@/src/lib/icons';
import type { ProfileData } from '@/src/lib/schemas/profile.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata = generatePageMetadata('/account/settings');

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile; if missing, initialize a minimal row to prevent blank page
  let { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email ?? null,
        name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
        image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (insertError) {
      // RLS policy might be blocking insert, try to fetch again
      const { data: refetch } = await supabase.from('users').select('*').eq('id', user.id).single();
      profile = refetch || null;
    } else {
      profile = inserted || null;
    }
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-4">
          We couldn't load your profile. This might be a database permissions issue.
        </p>
        <p className="text-sm text-muted-foreground">
          User ID: {user.id}
          <br />
          Email: {user.email}
        </p>
      </div>
    );
  }

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
            {profile.slug && (
              <Link href={`/u/${profile.slug}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ProfileEditForm profile={profile as ProfileData} />
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

            {profile.slug && (
              <div>
                <p className={'text-sm font-medium'}>Profile URL</p>
                <p className="text-muted-foreground">/u/{profile.slug}</p>
              </div>
            )}

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
              <p className={'text-sm font-medium'}>Tier</p>
              <p className="text-muted-foreground">
                {profile.tier
                  ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                  : 'Free'}
              </p>
            </div>

            <div>
              <p className={'text-sm font-medium'}>Reputation</p>
              <p className="text-muted-foreground">{profile.reputation_score} points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avatar from OAuth */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Your profile picture is synced from{' '}
            {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.image && (
            <div className="flex items-center gap-4">
              <Image
                src={profile.image}
                alt={profile.name || 'Profile'}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <p className="text-sm">
                  Synced from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'} OAuth
                </p>
                <div className="mt-2 flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <RefreshProfileButton
                    providerLabel={user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
