'use client';

/**
 * Webhooks Management Component
 * Allows users to create and manage webhook endpoints
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { ExternalLink, Plus, Trash2, Webhook } from '@heyclaude/web-runtime/icons';
import { Button, FormField, toasts, ToggleField } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

interface WebhooksManagementProps {
  userId: string;
}

interface WebhookConfig {
  active: boolean;
  createdAt: string;
  events: string[];
  id: string;
  secret?: string;
  url: string;
}

export function WebhooksManagement({ userId }: WebhooksManagementProps) {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'Webhook operation failed',
    defaultRethrow: false,
    scope: 'WebhooksManagement',
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
      <div className="border-border bg-card rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Create New Webhook</h3>
        <div className="space-y-3">
          <FormField required label="Webhook URL">
            <input
              className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onChange={(e) => setNewWebhookUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              type="url"
              value={newWebhookUrl}
            />
          </FormField>

          <div>
            <p className="mb-2 text-sm font-medium">Event Types</p>
            <div className="grid gap-2 md:grid-cols-2">
              {availableEvents.map((event) => (
                <ToggleField
                  checked={selectedEvents.includes(event)}
                  key={event}
                  label={event}
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

          <Button disabled={isCreating} onClick={handleCreateWebhook}>
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
            <div className="border-border bg-card rounded-lg border p-4" key={webhook.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="text-muted-foreground h-4 w-4" />
                    <p className="text-sm font-medium">{webhook.url}</p>
                    {webhook.active ? (
                      <span className="bg-success-bg text-success rounded-full px-2 py-0.5 text-xs font-medium">
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
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted border-border rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">Webhook Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn about webhook events and payloads in our{' '}
          <a className="text-accent hover:underline" href="/docs/webhooks">
            webhook documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}
