/**
 * Analytics Dashboard Page
 * Displays user analytics including profile views, engagement stats, and content performance
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { BarChart3, Eye, Heart, TrendingUp } from '@heyclaude/web-runtime/icons';
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

import { AnalyticsOverview } from './analytics-overview';
import { ContentPerformance } from './content-performance';
import { EngagementStats } from './engagement-stats';

export const metadata: Metadata = {
  description:
    'View your account analytics including profile views, engagement stats, and content performance',
  title: 'Analytics | Account Dashboard',
};

/**
 * Render the Analytics Dashboard page that displays user analytics and statistics.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Analytics Dashboard page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function AnalyticsPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/analytics',
    operation: 'AnalyticsPage',
    route: '/account/analytics',
  });

  const { user } = await getAuthenticatedUser({
    context: 'AnalyticsPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'AnalyticsPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  // Get user data for analytics
  const userData = await getUserCompleteData(user.id);

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
    },
    'AnalyticsPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-base">
          View your account analytics, engagement statistics, and content performance.
        </p>
      </div>

      {/* Analytics Overview */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5" />
            Overview
          </CardTitle>
          <CardDescription className="text-sm">
            Key metrics and statistics for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnalyticsOverview userData={userData} userId={user.id} />
        </CardContent>
      </Card>

      {/* Engagement Stats */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5" />
            Engagement Statistics
          </CardTitle>
          <CardDescription className="text-sm">
            Track how users interact with your content and profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EngagementStats userData={userData} userId={user.id} />
        </CardContent>
      </Card>

      {/* Content Performance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="h-5 w-5" />
            Content Performance
          </CardTitle>
          <CardDescription className="text-sm">
            See how your submissions and content are performing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContentPerformance userData={userData} userId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
