/**
 * Newsletter Management Page
 *
 * Allows users to view and manage their newsletter subscription preferences,
 * including topic subscriptions (Resend Topics).
 */

import { serializeForClient } from '@heyclaude/shared-runtime';
import { getAuthenticatedUser } from '@heyclaude/web-runtime/auth/get-authenticated-user';
import { getNewsletterSubscriptionByEmail } from '@heyclaude/web-runtime/data/newsletter';
import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';

import {
  NewsletterManagementClient,
  type SerializedNewsletterSubscription,
} from '@/src/components/features/account/newsletter/newsletter-management-client';
import { NewsletterManagementSkeleton } from '@/src/components/features/account/newsletter/newsletter-management-skeleton';

/***
 * Get newsletter subscription data for the authenticated user
 * Also fetches current topics from Resend to ensure accuracy
 * @param {string} email
 */
async function getSubscriptionData(email: string) {
  'use cache: private';
  // User-specific data: 1min stale, 5min revalidate, 30min expire
  cacheLife({ expire: 1800, revalidate: 300, stale: 60 });
  cacheTag(`newsletter-subscription-${email}`);

  const subscription = await getNewsletterSubscriptionByEmail(email);

  // If subscription exists and has a Resend contact ID, fetch current topics from Resend
  if (subscription?.resend_contact_id) {
    try {
      const resendModule = await import('@heyclaude/web-runtime/integrations/resend');
      const resend = resendModule.getResendClient();
      // getContactTopics is exported from resend module
      const currentTopics = await resendModule.getContactTopics(
        resend,
        subscription.resend_contact_id
      );

      // Update subscription with current topics from Resend (source of truth)
      return {
        ...subscription,
        resend_topics: currentTopics,
      } as typeof subscription;
    } catch (error) {
      // If fetching from Resend fails, return subscription with database topics
      // The database topics may be slightly out of date, but better than failing entirely
      const { logger, normalizeError } = await import('@heyclaude/web-runtime/logging/server');
      const normalized = normalizeError(error, 'Failed to fetch current topics from Resend');
      logger.warn(
        { contactId: subscription.resend_contact_id, email, err: normalized },
        'Failed to fetch current topics from Resend, using database topics'
      );
    }
  }

  return subscription;
}

/**
 * Newsletter Management Page
 *
 * Displays user's newsletter subscription status and allows management of topic preferences.
 */
export default async function NewsletterManagementPage() {
  // Authentication is required (account layout enforces this, but we check here for email)
  const result = await getAuthenticatedUser({
    context: 'NewsletterManagementPage',
    requireUser: true,
  });
  const user = result.user!;
  const userEmail = user.email;

  if (!userEmail) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Newsletter Management</h1>
        <p className="text-muted-foreground">
          Unable to load newsletter preferences. Please ensure your account has an email address.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Newsletter Preferences</h1>
        <p className="text-muted-foreground text-base">
          Manage your newsletter subscription and email preferences.
        </p>
      </div>

      <Suspense fallback={<NewsletterManagementSkeleton />}>
        <NewsletterSubscriptionContent email={userEmail} />
      </Suspense>
    </div>
  );
}

/**
 * Newsletter Subscription Content
 *
 * Fetches and displays subscription data
 * @param root0
 * @param root0.email
 */
async function NewsletterSubscriptionContent({ email }: { email: string }) {
  const subscription = await getSubscriptionData(email);

  // Serialize subscription data for client component (Next.js requires JSON-serializable props)
  const serializedSubscription = subscription
    ? (serializeForClient(subscription) as SerializedNewsletterSubscription)
    : null;

  return <NewsletterManagementClient email={email} subscription={serializedSubscription} />;
}
