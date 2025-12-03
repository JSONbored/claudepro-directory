/**
 * MFA Settings Page
 * Allows users to manage their multi-factor authentication settings
 */

import { hashUserId } from '@heyclaude/shared-runtime';
import { iconSize, spaceY, cluster, marginTop, muted, weight, size } from '@heyclaude/web-runtime/design-system';
import { Shield } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import { redirect } from 'next/navigation';


import { MFAFactorsListClient } from './mfa-factors-list-client';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication | Account Settings',
  description: 'Manage your two-factor authentication settings',
};

// Force dynamic rendering for auth-protected pages
export const dynamic = 'force-dynamic';

/**
 * Server-side page that renders the MFA settings UI and enforces authenticated access.
 *
 * Fetches the authenticated user for the current request and redirects to `/login` when no user is present.
 * Generates a per-request requestId and a request-scoped logger before rendering.
 *
 * @returns The JSX for the MFA settings page containing an MFA factors management card and an informational "How it works" card.
 *
 * @see getAuthenticatedUser
 * @see MFAFactorsListClient
 * @see generateRequestId
 * @see logger
 * @see redirect
 */
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

  const userIdHash = hashUserId(user.id);
  reqLogger.info('MFASettingsPage: rendered for authenticated user', {
    userIdHash,
  });

  return (
    <div className={spaceY.relaxed}>
      <div>
        <h1 className={`${weight.bold} ${size['3xl']}`}>Two-Factor Authentication</h1>
        <p className={`${marginTop.compact} ${muted.default}`}>
          Add an extra layer of security to your account with two-factor authentication.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={cluster.compact}>
            <Shield className={iconSize.sm} />
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
        <CardContent className={muted.sm}>
          <ul className={`list-disc list-inside ${spaceY.compact}`}>
            <li>Scan the QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
            <li>Enter the 6-digit code from your app when signing in</li>
            <li>You can enroll multiple factors as backups</li>
            <li>Keep at least one factor active to maintain access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}