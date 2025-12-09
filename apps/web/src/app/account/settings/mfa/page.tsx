/**
 * MFA Settings Page
 * Allows users to manage their multi-factor authentication settings
 */

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Shield } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import {
  UI_CLASSES,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';

import { MFAFactorsListClient } from './mfa-factors-list-client';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication | Account Settings',
  description: 'Manage your two-factor authentication settings',
};

/**
 * Render the MFA Settings page that lets an authenticated user view and manage multi-factor authentication.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * Note: Suspense boundary removed - account layout already provides Suspense boundary.
 * Nested Suspense boundaries cause React errors with Dialog portals.
 *
 * @returns The JSX for the MFA Settings page, including an enrolled factors list and explanatory "How it works" content.
 *
 * @see getAuthenticatedUser
 * @see MFAFactorsListClient
 * @see redirect
 */
export default async function MFASettingsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'MFASettingsPage',
    route: '/account/settings/mfa',
    module: 'apps/web/src/app/account/settings/mfa',
  });
  // getAuthenticatedUser with requireUser: true throws when no user is present,
  // so the null check below is unreachable
  const { user } = await getAuthenticatedUser({
    requireUser: true,
    context: 'MFASettingsPage',
  });

  if (!user) {
    reqLogger.error(
      {
        section: 'data-fetch',
        err: new Error('User is null'),
      },
      'MFASettingsPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'MFASettingsPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground mt-2">
          Add an extra layer of security to your account with two-factor authentication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className={UI_CLASSES.ICON_SM} />
            MFA Factors
          </CardTitle>
          <CardDescription>
            Manage your enrolled authenticator devices. You can have multiple factors for backup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MFAFactorsListClient />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>Learn about two-factor authentication</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>
            • Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password,
            etc.)
          </p>
          <p>• Enter the 6-digit code from your app when signing in</p>
          <p>• You can enroll multiple factors as backups</p>
          <p>• Keep at least one factor active to maintain access</p>
        </CardContent>
      </Card>
    </div>
  );
}
