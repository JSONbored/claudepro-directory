'use client';

/**
 * Newsletter Management Client Component
 *
 * Displays user's newsletter subscription status and allows management of topic preferences.
 */

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Switch,
} from '@heyclaude/web-runtime/ui';
import { CheckCircle, Mail, XCircle } from '@heyclaude/web-runtime/icons';
import { useState } from 'react';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { toasts } from '@heyclaude/web-runtime/ui';
import {
  updateTopicPreferencesAction,
  unsubscribeFromNewsletterAction,
} from '@heyclaude/web-runtime/actions/newsletter';
import { RESEND_TOPIC_IDS } from '@heyclaude/web-runtime/integrations/resend';

/**
 * Serialized newsletter subscription type (Prisma model serialized by Next.js)
 * Dates are converted to ISO strings, only includes fields we actually use
 */
export type SerializedNewsletterSubscription = {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced' | 'complained';
  confirmed: boolean;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
  resend_topics: string[] | null;
};

interface NewsletterManagementClientProps {
  subscription: SerializedNewsletterSubscription | null;
  email: string;
}

/**
 * Topic configuration with human-readable names and descriptions
 */
const TOPIC_CONFIG = [
  {
    id: RESEND_TOPIC_IDS.weekly_digest,
    name: 'Weekly Digest',
    description: 'Weekly summary of new content and updates',
  },
  {
    id: RESEND_TOPIC_IDS.agents_prompts,
    name: 'Agents & Prompts',
    description: 'New AI agents, prompts, and rules',
  },
  {
    id: RESEND_TOPIC_IDS.mcp_integrations,
    name: 'MCP Integrations',
    description: 'New MCP servers and integration updates',
  },
  {
    id: RESEND_TOPIC_IDS.commands_automation,
    name: 'Commands & Automation',
    description: 'Commands, hooks, and automation tools',
  },
  {
    id: RESEND_TOPIC_IDS.guides_tutorials,
    name: 'Guides & Tutorials',
    description: 'New guides, tutorials, and learning resources',
  },
  {
    id: RESEND_TOPIC_IDS.community_highlights,
    name: 'Community Highlights',
    description: 'Community features, contributions, and highlights',
  },
  {
    id: RESEND_TOPIC_IDS.job_board,
    name: 'Job Board',
    description: 'New job listings and career opportunities',
  },
  {
    id: RESEND_TOPIC_IDS.platform_updates,
    name: 'Platform Updates',
    description: 'Platform features, improvements, and announcements',
  },
] as const;

export function NewsletterManagementClient({
  subscription,
  email,
}: NewsletterManagementClientProps) {
  const currentTopics = subscription?.resend_topics || [];
  const [topicPreferences, setTopicPreferences] = useState<Record<string, boolean>>(() => {
    // Initialize with current topics as opted-in
    const prefs: Record<string, boolean> = {};
    TOPIC_CONFIG.forEach((topic) => {
      prefs[topic.id] = currentTopics.includes(topic.id);
    });
    return prefs;
  });

  const runLoggedAsync = useLoggedAsync({
    scope: 'NewsletterManagementClient',
    defaultMessage: 'Failed to update preferences',
  });

  const handleTopicToggle = async (topicId: string, enabled: boolean) => {
    // Optimistic update
    setTopicPreferences((prev) => ({ ...prev, [topicId]: enabled }));

    await runLoggedAsync(async () => {
      const result = await updateTopicPreferencesAction({
        topicIds: [topicId],
        optIn: enabled,
      });

      if (result?.serverError) {
        // Revert optimistic update on error
        setTopicPreferences((prev) => ({ ...prev, [topicId]: !enabled }));
        throw new Error(result.serverError);
      }

      toasts.raw.success('Preferences updated', {
        description: enabled
          ? 'You will receive emails for this topic'
          : 'You will no longer receive emails for this topic',
      });
    });
  };

  const handleUnsubscribe = async () => {
    if (!confirm('Are you sure you want to unsubscribe from all newsletter emails?')) {
      return;
    }

    await runLoggedAsync(async () => {
      const result = await unsubscribeFromNewsletterAction({});

      if (result?.serverError) {
        throw new Error(result.serverError);
      }

      toasts.raw.success('Unsubscribed', {
        description: 'You have been unsubscribed from all newsletter emails',
      });

      // Reload page to show updated subscription status
      window.location.reload();
    });
  };

  const isActive =
    subscription?.status === 'active' && subscription?.confirmed && !subscription?.unsubscribed_at;

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Subscription</CardTitle>
          <CardDescription>You are not subscribed to the newsletter.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Subscribe to receive updates about new content, features, and community highlights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isActive ? (
              <>
                <CheckCircle className="text-primary h-5 w-5" />
                Subscribed
              </>
            ) : (
              <>
                <XCircle className="text-muted-foreground h-5 w-5" />
                Not Subscribed
              </>
            )}
          </CardTitle>
          <CardDescription>
            {isActive
              ? 'You are receiving newsletter emails'
              : 'You are not currently receiving newsletter emails'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">Email:</span>
              <span className="text-muted-foreground">{email}</span>
            </div>
            {subscription.subscribed_at && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Subscribed:</span>
                <span className="text-muted-foreground">
                  {new Date(subscription.subscribed_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Topic Preferences */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preferences</CardTitle>
            <CardDescription>
              Choose which types of emails you'd like to receive. You can update these preferences
              at any time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {TOPIC_CONFIG.map((topic) => {
                const isEnabled = topicPreferences[topic.id] ?? false;
                return (
                  <div
                    key={topic.id}
                    className="flex items-start justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{topic.name}</div>
                      <div className="text-muted-foreground text-sm">{topic.description}</div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => handleTopicToggle(topic.id, checked)}
                      aria-label={`Toggle ${topic.name} emails`}
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unsubscribe Option */}
      {isActive && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Unsubscribe
            </CardTitle>
            <CardDescription>
              Unsubscribe from all newsletter emails. You can resubscribe at any time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleUnsubscribe}>
              Unsubscribe from All Emails
            </Button>
            <p className="text-muted-foreground mt-2 text-sm">
              This will unsubscribe you from all newsletter communications. You can resubscribe at
              any time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
