'use client';

/**
 * OAuth Apps Management Component
 * Allows users to view and manage OAuth applications
 */

import { ExternalLink, Plug, Trash2 } from '@heyclaude/web-runtime/icons';
import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';

interface OAuthAppsManagementProps {
  userId: string;
}

interface OAuthApp {
  clientId: string;
  createdAt: string;
  id: string;
  lastUsed?: string;
  name: string;
  redirectUri: string;
}

export function OAuthAppsManagement({ userId }: OAuthAppsManagementProps) {
  const [apps, setApps] = useState<OAuthApp[]>([]);

  const handleRevokeAccess = async (appId: string) => {
    // TODO: Implement OAuth app revocation via server action
    toasts.info('OAuth app revocation is not yet implemented. Please contact support.');
  };

  return (
    <div className="space-y-4">
      {apps.length === 0 ? (
        <div className="text-muted-foreground text-sm">
          <p>No OAuth applications connected.</p>
          <p className="mt-2">
            OAuth applications that have access to your account will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div
              className="border-border bg-card flex items-center justify-between rounded-lg border p-4"
              key={app.id}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Plug className="text-muted-foreground h-4 w-4" />
                  <p className="text-sm font-medium">{app.name}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">Client ID: {app.clientId}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Created: {new Date(app.createdAt).toLocaleDateString()}
                  {app.lastUsed
                    ? ` • Last used: ${new Date(app.lastUsed).toLocaleDateString()}`
                    : null}
                </p>
              </div>
              <Button
                className="text-destructive hover:text-destructive"
                size="sm"
                variant="ghost"
                onClick={() => handleRevokeAccess(app.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted border-border rounded-lg border p-4">
        <p className="mb-2 text-sm font-medium">OAuth Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn about OAuth integration in our{' '}
          <a className="text-accent hover:underline" href="/docs/oauth">
            OAuth documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}
