import { RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ProfileEditForm } from '@/src/components/features/profile/profile-edit-form';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import type { ProfileData } from '@/src/lib/schemas/profile.schema';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

export const metadata: Metadata = {
  title: 'Settings - ClaudePro Directory',
  description: 'Manage your account settings and preferences',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();

  if (!profile) return null;

  return (
    <div className={UI_CLASSES.SPACE_Y_6}>
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
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
        <CardContent className={UI_CLASSES.SPACE_Y_4}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Email</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{user.email}</p>
            </div>

            {profile.slug && (
              <div>
                <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Profile URL</p>
                <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>/u/{profile.slug}</p>
              </div>
            )}

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Member Since</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Tier</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>
                {profile.tier
                  ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)
                  : 'Free'}
              </p>
            </div>

            <div>
              <p className={`${UI_CLASSES.TEXT_SM} ${UI_CLASSES.FONT_MEDIUM}`}>Reputation</p>
              <p className={UI_CLASSES.TEXT_MUTED_FOREGROUND}>{profile.reputation_score} points</p>
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
                <p className={UI_CLASSES.TEXT_SM}>
                  Synced from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'} OAuth
                </p>
                <form action="/api/profile/refresh" method="POST" className="mt-2">
                  <Button type="submit" variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
