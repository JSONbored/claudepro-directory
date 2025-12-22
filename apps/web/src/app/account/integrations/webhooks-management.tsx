'use client';

/**
 * Webhooks Management Component
 * Allows users to create and manage webhook endpoints
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, ToggleField, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { Webhook, Plus, Trash2, ExternalLink } from '@heyclaude/web-runtime/icons';

interface WebhooksManagementProps {
  userId: string;
}

interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: string;
}

export function WebhooksManagement({ userId }: WebhooksManagementProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const runLoggedAsync = useLoggedAsync({
    scope: 'WebhooksManagement',
    defaultMessage: 'Webhook operation failed',
    defaultRethrow: false,
  });

  const availableEvents = [
    'content.created',
    'content.updated',
    'job.created',
    'job.updated',
    'submission.created',
    'submission.updated',
  ];

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) {
      toasts.error('Please enter a webhook URL');
      return;
    }

    if (selectedEvents.length === 0) {
      toasts.error('Please select at least one event type');
      return;
    }

    setIsCreating(true);
    await runLoggedAsync(async () => {
      // TODO: Implement webhook creation via server action
      toasts.info('Webhook creation is not yet implemented. Please contact support.');
      setNewWebhookUrl('');
      setSelectedEvents([]);
    });
    setIsCreating(false);
  };

  const handleDeleteWebhook = async (webhookId: string) => {
    await runLoggedAsync(async () => {
      // TODO: Implement webhook deletion via server action
      toasts.info('Webhook deletion is not yet implemented. Please contact support.');
    });
  };

  return (
    <div className="space-y-4">
      {/* Create New Webhook */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Create New Webhook</h3>
        <div className="space-y-3">
          <FormField label="Webhook URL" required>
            <input
              type="url"
              value={newWebhookUrl}
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </FormField>

          <div>
            <p className="font-medium text-sm mb-2">Event Types</p>
            <div className="grid gap-2 md:grid-cols-2">
              {availableEvents.map((event) => (
                <ToggleField
                  key={event}
                  label={event}
                  checked={selectedEvents.includes(event)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedEvents([...selectedEvents, event]);
                    } else {
                      setSelectedEvents(selectedEvents.filter((e) => e !== event));
                    }
                  }}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleCreateWebhook} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Webhook'}
          </Button>
        </div>
      </div>

      {/* Existing Webhooks */}
      {webhooks.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          <p>No webhooks configured yet.</p>
          <p className="mt-2">
            Create a webhook to receive real-time notifications about account events.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium text-sm">{webhook.url}</p>
                    {webhook.active ? (
                      <span className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-full px-2 py-0.5 text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Events: {webhook.events.join(', ')}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Created: {new Date(webhook.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted rounded-lg border border-border p-4">
        <p className="font-medium text-sm mb-2">Webhook Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn about webhook events and payloads in our{' '}
          <a href="/docs/webhooks" className="text-accent hover:underline">
            webhook documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}

