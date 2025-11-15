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

import { ensureUserRecord } from '@/src/lib/actions/user.actions';
import { getAuthenticatedUser } from '@/src/lib/auth/get-authenticated-user';
import { getUserSettings } from '@/src/lib/data/account/user-data';
import { ROUTES } from '@/src/lib/data/config/constants';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { GetUserSettingsReturn } from '@/src/types/database-overrides';

export const metadata = generatePageMetadata('/account/settings');

export default async function SettingsPage() {
  const { user } = await getAuthenticatedUser({ context: 'SettingsPage' });

  if (!user) {
    logger.warn('SettingsPage: unauthenticated access attempt');
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in required</CardTitle>
            <CardDescription>Please sign in to manage your account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={ROUTES.LOGIN}>Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User-scoped edge-cached RPC via centralized data layer
  let settingsData: GetUserSettingsReturn | null = null;
  try {
    const response = await getUserSettings(user.id);
    if (response) {
      settingsData = response as GetUserSettingsReturn;
    } else {
      logger.warn('SettingsPage: getUserSettings returned null', { userId: user.id });
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings');
    logger.error('SettingsPage: getUserSettings threw', normalized, { userId: user.id });
  }

  if (!settingsData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Settings</CardTitle>
            <CardDescription>
              We couldn&apos;t load your account settings. Please refresh or try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={ROUTES.ACCOUNT}>Back to dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Type-safe RPC return using centralized type definition
  const settingsResult = settingsData as GetUserSettingsReturn;
  const userData = settingsResult?.user_data;
  const profile = settingsResult?.profile;

  // Initialize user if missing (consolidated - no more profiles table)
  if (!userData) {
    logger.warn('SettingsPage: user_data missing, invoking ensureUserRecord', { userId: user.id });
    await ensureUserRecord({
      id: user.id,
      email: user.email ?? null,
      name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    });
  }

  if (!profile) {
    logger.error('SettingsPage: profile missing from getUserSettings response', undefined, {
      userId: user.id,
    });
    return (
      <div className="space-y-6">
        <h1 className="font-bold text-3xl">Settings</h1>
        <p className="text-destructive">Unable to load profile. Please try again later.</p>
      </div>
    );
  }

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
