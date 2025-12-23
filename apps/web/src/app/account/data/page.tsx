/**
 * Data & Privacy Page
 * Allows users to manage their data, export data (GDPR), delete account, and manage privacy settings
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Cookie, Download, Shield, Trash2 } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';

import { AccountDeletionForm } from './account-deletion-form';
import { CookiePreferences } from './cookie-preferences';
import { DataExportForm } from './data-export-form';
import { PrivacySettings } from './privacy-settings';

export const metadata: Metadata = {
  description:
    'Manage your data, privacy settings, and account deletion. Export your data or delete your account.',
  title: 'Data & Privacy | Account Settings',
};

/**
 * Render the Data & Privacy page that lets an authenticated user manage their data and privacy settings.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Data & Privacy page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function DataPrivacyPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/data',
    operation: 'DataPrivacyPage',
    route: '/account/data',
  });

  const { user } = await getAuthenticatedUser({
    context: 'DataPrivacyPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'DataPrivacyPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'DataPrivacyPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Data & Privacy</h1>
        <p className="text-muted-foreground text-base">
          Manage your data, privacy settings, and account information. Export your data or delete
          your account.
        </p>
      </div>

      {/* Data Export */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription className="text-sm">
            Download a copy of all your account data in JSON format (GDPR compliant).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExportForm userId={user.id} />
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription className="text-sm">
            Control how your data is used and who can see your information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrivacySettings userId={user.id} />
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </CardTitle>
          <CardDescription className="text-sm">
            Manage your cookie preferences and tracking settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CookiePreferences />
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-xl">
            <Trash2 className="h-5 w-5" />
            Delete Account
          </CardTitle>
          <CardDescription className="text-sm">
            Permanently delete your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountDeletionForm userEmail={user.email ?? ''} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
