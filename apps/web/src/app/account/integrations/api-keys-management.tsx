'use client';

/**
 * API Keys Management Component
 * Allows users to create, view, and revoke API keys
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Copy, Eye, EyeOff, Key, Trash2 } from '@heyclaude/web-runtime/icons';
import { Button, FormField, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

interface ApiKeysManagementProps {
  userId: string;
}

interface ApiKey {
  createdAt: string;
  id: string;
  keyPrefix: string;
  lastUsed?: string;
  name: string;
}

export function ApiKeysManagement({ userId }: ApiKeysManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'API key operation failed',
    defaultRethrow: false,
    scope: 'ApiKeysManagement',
  });

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toasts.error('Please enter a name for the API key');
      return;
    }

    setIsCreating(true);
    await runLoggedAsync(async () => {
      // TODO: Implement API key creation via server action
      // For now, show placeholder
      toasts.info('API key generation is not yet implemented. Please contact support.');
      setNewKeyName('');
    });
    setIsCreating(false);
  };

  const handleCopyKey = (keyId: string) => {
    // TODO: Get full key value (only shown once on creation)
    toasts.info('API key copying is not yet implemented');
  };

  const handleRevokeKey = async (keyId: string) => {
    await runLoggedAsync(async () => {
      // TODO: Implement API key revocation via server action
      toasts.info('API key revocation is not yet implemented. Please contact support.');
    });
  };

  return (
    <div className="space-y-4">
      {/* Create New Key */}
      <div className="border-border bg-card rounded-lg border p-4">
        <h3 className="mb-3 text-sm font-semibold">Create New API Key</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormField className="min-w-0 flex-1" label="Key Name">
            <input
              className="border-input bg-background ring-offset-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
              type="text"
              value={newKeyName}
            />
          </FormField>
          <Button
            className="w-full sm:mt-0 sm:w-auto"
            disabled={isCreating}
            onClick={handleCreateKey}
          >
            {isCreating ? 'Creating...' : 'Create Key'}
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          API keys provide programmatic access to your account. Keep them secure and never share
          them publicly.
        </p>
      </div>

      {/* Existing Keys */}
      {apiKeys.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          <p>No API keys created yet.</p>
          <p className="mt-2">
            Create an API key to get started with programmatic access to your account data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <div
              className="border-border bg-card flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              key={key.id}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Key className="text-muted-foreground h-4 w-4 shrink-0" />
                  <p className="truncate text-sm font-medium">{key.name}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs break-all">
                  {key.keyPrefix}••••••••••••••••
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsed
                    ? ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`
                    : null}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  aria-label="Copy API key"
                  onClick={() => handleCopyKey(key.id)}
                  size="sm"
                  variant="ghost"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  aria-label="Revoke API key"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRevokeKey(key.id)}
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
        <p className="mb-2 text-sm font-medium">API Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn how to use API keys in our{' '}
          <a className="text-accent hover:underline" href="/docs/api">
            API documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}
