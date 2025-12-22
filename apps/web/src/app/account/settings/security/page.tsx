/**
 * Security Settings Page
 * Allows users to manage their account security settings including password, sessions, and security alerts
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Shield, Lock, Smartphone, AlertTriangle } from '@heyclaude/web-runtime/icons';
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

import { PasswordChangeForm } from './password-change-form';
import { ActiveSessionsList } from './active-sessions-list';
import { SecurityAlerts } from './security-alerts';

export const metadata: Metadata = {
  description: 'Manage your account security settings including password, active sessions, and security alerts',
  title: 'Security Settings | Account Settings',
};

/**
 * Render the Security Settings page that lets an authenticated user manage their account security.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Security Settings page, including password change, active sessions, and security alerts.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function SecuritySettingsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/settings/security',
    operation: 'SecuritySettingsPage',
    route: '/account/settings/security',
  });

  const { user } = await getAuthenticatedUser({
    context: 'SecuritySettingsPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'SecuritySettingsPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'SecuritySettingsPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground text-base">
          Manage your account security, password, and active sessions.
        </p>
      </div>

      {/* Password Change */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription className="text-sm">
            Update your account password. Use a strong, unique password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordChangeForm />
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Smartphone className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription className="text-sm">
            Manage devices and browsers where you're currently signed in. Sign out of any session you don't recognize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ActiveSessionsList userId={user.id} />
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5" />
            Security Alerts
          </CardTitle>
          <CardDescription className="text-sm">
            Recent security events and important account security information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecurityAlerts userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

