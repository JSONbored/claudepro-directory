/**
 * Preferences Settings Page
 * Allows users to manage their account preferences including language, timezone, date format, email frequency, content filters, and accessibility preferences
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Clock, Eye, Globe, Mail, Palette } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';

import { PreferencesForm } from './preferences-form';

export const metadata: Metadata = {
  description:
    'Manage your account preferences including language, timezone, email frequency, and accessibility settings',
  title: 'Preferences | Account Settings',
};

/**
 * Render the Preferences Settings page that lets an authenticated user manage their account preferences.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Preferences Settings page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function PreferencesSettingsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/settings/preferences',
    operation: 'PreferencesSettingsPage',
    route: '/account/settings/preferences',
  });

  const { user } = await getAuthenticatedUser({
    context: 'PreferencesSettingsPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'PreferencesSettingsPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'PreferencesSettingsPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Preferences</h1>
        <p className="text-muted-foreground text-base">
          Customize your account preferences including language, timezone, email frequency, and
          accessibility settings.
        </p>
      </div>

      {/* Language & Region */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription className="text-sm">
            Set your preferred language, timezone, and date format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm section="language" />
        </CardContent>
      </Card>

      {/* Email Preferences */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription className="text-sm">
            Control how often you receive emails and what types of notifications you get.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm section="email" />
        </CardContent>
      </Card>

      {/* Content Filters */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5" />
            Content Filters
          </CardTitle>
          <CardDescription className="text-sm">
            Customize what content you see and how it's displayed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm section="content" />
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Palette className="h-5 w-5" />
            Accessibility
          </CardTitle>
          <CardDescription className="text-sm">
            Adjust accessibility settings to improve your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm section="accessibility" />
        </CardContent>
      </Card>
    </div>
  );
}
