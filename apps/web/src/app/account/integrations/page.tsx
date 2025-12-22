/**
 * Integrations Page
 * Allows users to manage API keys, webhooks, OAuth apps, and integration settings
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Key, Webhook, Plug, Zap } from '@heyclaude/web-runtime/icons';
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

import { ApiKeysManagement } from './api-keys-management';
import { WebhooksManagement } from './webhooks-management';
import { OAuthAppsManagement } from './oauth-apps-management';
import { RateLimits } from './rate-limits';

export const metadata: Metadata = {
  description: 'Manage your API keys, webhooks, OAuth apps, and integration settings',
  title: 'Integrations | Account Settings',
};

/**
 * Render the Integrations page that lets an authenticated user manage their API integrations.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Integrations page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function IntegrationsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/integrations',
    operation: 'IntegrationsPage',
    route: '/account/integrations',
  });

  const { user } = await getAuthenticatedUser({
    context: 'IntegrationsPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'IntegrationsPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'IntegrationsPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground text-base">
          Manage your API keys, webhooks, OAuth applications, and integration settings.
        </p>
      </div>

      {/* API Keys */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription className="text-sm">
            Generate and manage API keys for programmatic access to your account data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApiKeysManagement userId={user.id} />
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Webhook className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription className="text-sm">
            Configure webhooks to receive real-time notifications about account events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebhooksManagement userId={user.id} />
        </CardContent>
      </Card>

      {/* OAuth Apps */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plug className="h-5 w-5" />
            OAuth Applications
          </CardTitle>
          <CardDescription className="text-sm">
            Manage OAuth applications that have access to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OAuthAppsManagement userId={user.id} />
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5" />
            Rate Limits
          </CardTitle>
          <CardDescription className="text-sm">
            View your current API rate limit usage and quotas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RateLimits userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}

