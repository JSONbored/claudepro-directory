/**
 * MFA Settings Page
 * Allows users to manage their multi-factor authentication settings
 */

import { Shield } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
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
import { redirect } from 'next/navigation';

import { MFAFactorsListClient } from './mfa-factors-list-client';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication | Account Settings',
  description: 'Manage your two-factor authentication settings',
};

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

export default async function MFASettingsPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger
  const reqLogger = logger.child({
    requestId,
    operation: 'MFASettingsPage',
    route: '/account/settings/mfa',
    module: 'apps/web/src/app/account/settings/mfa',
  });

  const { user } = await getAuthenticatedUser({
    requireUser: true,
    context: 'MFASettingsPage',
  });

  if (!user) {
    reqLogger.info('MFASettingsPage: user not authenticated, redirecting to login');
    redirect('/login');
  }

  reqLogger.info('MFASettingsPage: rendered for authenticated user', {
    userIdHash: user.id, // userId is automatically hashed by redaction
  });

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
