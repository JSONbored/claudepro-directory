/**
 * Billing Page
 * Allows users to manage their plan/tier, view usage stats, billing history, and payment methods
 */

import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getUserCompleteData } from '@heyclaude/web-runtime/data/account';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { CreditCard, Receipt, TrendingUp, Zap } from '@heyclaude/web-runtime/icons';
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

import { CurrentPlanCard } from './current-plan-card';
import { UsageStats } from './usage-stats';
import { BillingHistory } from './billing-history';

export const metadata: Metadata = {
  description: 'Manage your plan, view usage statistics, and billing history',
  title: 'Billing | Account Settings',
};

/**
 * Render the Billing page that lets an authenticated user manage their plan and view billing information.
 *
 * If no authenticated user is found, the function redirects to `/login`. A request-scoped logger is created for the page request.
 *
 * @returns The JSX for the Billing page.
 *
 * @see getAuthenticatedUser
 * @see redirect
 */
export default async function BillingPage() {
  'use cache: private';
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/account/billing',
    operation: 'BillingPage',
    route: '/account/billing',
  });

  const { user } = await getAuthenticatedUser({
    context: 'BillingPage',
    requireUser: true,
  });

  if (!user) {
    reqLogger.error(
      {
        err: new Error('User is null'),
        section: 'data-fetch',
      },
      'BillingPage: user is null despite requireUser: true'
    );
    redirect(ROUTES.LOGIN);
  }

  // Get user data for tier information
  const userData = await getUserCompleteData(user.id);
  const tier = userData?.user_settings?.user_data?.tier ?? 'free';

  reqLogger.info(
    {
      section: 'data-fetch',
      userIdHash: user.id, // userId is automatically hashed by redaction
      tier,
    },
    'BillingPage: rendered for authenticated user'
  );

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-base">
          Manage your plan, view usage statistics, and billing history.
        </p>
      </div>

      {/* Current Plan */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription className="text-sm">
            Your current subscription tier and plan details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentPlanCard tier={tier} />
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <TrendingUp className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription className="text-sm">
            View your account usage and limits for the current billing period.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageStats userId={user.id} userData={userData} />
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Receipt className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription className="text-sm">
            View your past invoices and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingHistory userId={user.id} />
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription className="text-sm">
            Manage your payment methods and billing information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm">
            Payment method management is not yet available. Please contact support to update your payment information.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

