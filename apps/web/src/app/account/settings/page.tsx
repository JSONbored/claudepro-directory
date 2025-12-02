/**
 * Settings Page - User profile and account management.
 */

import  { type Database } from '@heyclaude/database-types';
import { ensureUserRecord } from '@heyclaude/web-runtime/actions';
import {
  generatePageMetadata,
  getAuthenticatedUser,
  getUserSettings,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { between, spaceY, cluster, muted, marginBottom, weight ,size , gap , radius, squareSize } from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import {
  ProfileEditForm,
  RefreshProfileButton,
} from '@/src/components/core/forms/profile-edit-form';

/**
 * Dynamic Rendering Required
 * Authenticated user settings
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/account/settings');
}

/**
 * Render the account settings page for the authenticated user, handling data loading,
 * missing-user initialization, and appropriate fallback UIs for unauthenticated or error states.
 *
 * The component performs request-scoped logging, fetches the authenticated user and their
 * settings, attempts to initialize a missing user record, and renders profile editing,
 * account details, and profile-picture controls (or compact fallback cards when required).
 *
 * @returns A React element containing the settings UI or a fallback UI when the user is not
 * authenticated or settings/profile data cannot be loaded.
 *
 * @see generateRequestId
 * @see getAuthenticatedUser
 * @see getUserSettings
 * @see ensureUserRecord
 * @see ProfileEditForm
 * @see RefreshProfileButton
 * @see ROUTES
 */
export default async function SettingsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'SettingsPage',
    route: '/account/settings',
    module: 'apps/web/src/app/account/settings',
  });

  // Section: Authentication
  const { user } = await getAuthenticatedUser({ context: 'SettingsPage' });

  if (!user) {
    reqLogger.warn('SettingsPage: unauthenticated access attempt', {
      section: 'authentication',
      timestamp: new Date().toISOString(),
    });
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Sign in required</CardTitle>
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

  // Create new child logger with user context
  // Redaction automatically hashes userId/user_id/user.id fields (configured in logger/config.ts)
  const userLogger = reqLogger.child({
    userId: user.id, // Redaction will automatically hash this
  });

  // Section: Settings Data Fetch
  let settingsData: Database['public']['Functions']['get_user_settings']['Returns'] | null = null;
  try {
    settingsData = await getUserSettings(user.id);
    if (!settingsData) {
      userLogger.warn('SettingsPage: getUserSettings returned null', {
        section: 'settings-data-fetch',
      });
    }
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load user settings');
    userLogger.error('SettingsPage: getUserSettings threw', normalized, {
      section: 'settings-data-fetch',
    });
  }

  if (!settingsData) {
    return (
      <div className={spaceY.relaxed}>
        <Card>
          <CardHeader>
            <CardTitle className={`${size['2xl']}`}>Settings</CardTitle>
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
  let userData = settingsData.user_data;
  let profile = settingsData.profile;

  // Initialize user if missing (consolidated - no more profiles table)
  if (!userData) {
    userLogger.warn('SettingsPage: user_data missing, invoking ensureUserRecord');
    try {
      // Type-safe access to user_metadata (Record<string, unknown> from Supabase)
      const userMetadata = user.user_metadata;
      const fullName = typeof userMetadata['full_name'] === 'string' ? userMetadata['full_name'] : null;
      const name = typeof userMetadata['name'] === 'string' ? userMetadata['name'] : null;
      const avatarUrl = typeof userMetadata['avatar_url'] === 'string' ? userMetadata['avatar_url'] : null;
      const picture = typeof userMetadata['picture'] === 'string' ? userMetadata['picture'] : null;
      await ensureUserRecord({
        id: user.id,
        email: user.email ?? null,
        name: fullName ?? name ?? null,
        image: avatarUrl ?? picture ?? null,
      });
      const refreshed = await getUserSettings(user.id);
      if (refreshed) {
        userData = refreshed.user_data;
        profile = refreshed.profile;
      } else {
        userLogger.warn('SettingsPage: getUserSettings returned null after ensureUserRecord');
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to initialize user record');
      userLogger.error('SettingsPage: ensureUserRecord failed', normalized);
      // Leave userData/profile undefined so page can render fallback UI
    }
  }

  if (!profile) {
    // No error object available, only context
    userLogger.error(
      'SettingsPage: profile missing from getUserSettings response',
      new Error('Profile missing from response')
    );
    return (
      <div className={spaceY.relaxed}>
        <h1 className={`${weight.bold} ${size['3xl']}`}>Settings</h1>
        <p className="text-destructive">Unable to load profile. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${marginBottom.tight} ${weight.bold} ${size['3xl']}`}>Settings</h1>
        <p className={muted.default}>Manage your account settings and preferences</p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className={between.center}>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile details</CardDescription>
            </div>
            {userData?.slug ? <Link href={`/u/${userData.slug}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link> : null}
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
        <CardContent className={spaceY.comfortable}>
          <div className={`grid grid-cols-1 ${gap.comfortable} md:grid-cols-2`}>
            <div>
              <p className={`${weight.medium} ${size.sm}`}>Email</p>
              <p className={muted.default}>{user.email}</p>
            </div>
            <div>
              <p className={`${weight.medium} ${size.sm}`}>Member Since</p>
              <p className={muted.default}>
                {profile.created_at
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
        <CardContent className={spaceY.comfortable}>
          {userData?.image && typeof userData.image === 'string' ? <div className={cluster.comfortable}>
              <Image
                src={userData.image}
                alt={`${userData.name ?? 'User'}'s avatar`}
                width={64}
                height={64}
                className={`${squareSize.avatarXl} ${radius.full} object-cover`}
              />
              <div>
                <p className={size.sm}>
                  Synced from {user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                </p>
                <RefreshProfileButton
                  providerLabel={user.app_metadata.provider === 'github' ? 'GitHub' : 'Google'}
                />
              </div>
            </div> : null}
        </CardContent>
      </Card>
    </div>
  );
}