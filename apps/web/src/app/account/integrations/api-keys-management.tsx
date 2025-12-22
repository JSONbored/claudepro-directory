'use client';

/**
 * API Keys Management Component
 * Allows users to create, view, and revoke API keys
 */

import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { Button, FormField, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { Key, Copy, Trash2, Eye, EyeOff } from '@heyclaude/web-runtime/icons';

interface ApiKeysManagementProps {
  userId: string;
}

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsed?: string;
}

export function ApiKeysManagement({ userId }: ApiKeysManagementProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const runLoggedAsync = useLoggedAsync({
    scope: 'ApiKeysManagement',
    defaultMessage: 'API key operation failed',
    defaultRethrow: false,
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
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Create New API Key</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <FormField label="Key Name" className="flex-1 min-w-0">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production API Key"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </FormField>
          <Button onClick={handleCreateKey} disabled={isCreating} className="w-full sm:w-auto sm:mt-0">
            {isCreating ? 'Creating...' : 'Create Key'}
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          API keys provide programmatic access to your account. Keep them secure and never share them publicly.
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
              key={key.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="font-medium text-sm truncate">{key.name}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs break-all">
                  {key.keyPrefix}••••••••••••••••
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyKey(key.id)}
                  aria-label="Copy API key"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeKey(key.id)}
                  className="text-destructive hover:text-destructive"
                  aria-label="Revoke API key"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted rounded-lg border border-border p-4">
        <p className="font-medium text-sm mb-2">API Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn how to use API keys in our{' '}
          <a href="/docs/api" className="text-accent hover:underline">
            API documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}

