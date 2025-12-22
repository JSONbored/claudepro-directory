'use client';

/**
 * OAuth Apps Management Component
 * Allows users to view and manage OAuth applications
 */

import { Button, toasts } from '@heyclaude/web-runtime/ui';
import { useState } from 'react';
import { Plug, Trash2, ExternalLink } from '@heyclaude/web-runtime/icons';

interface OAuthAppsManagementProps {
  userId: string;
}

interface OAuthApp {
  id: string;
  name: string;
  clientId: string;
  redirectUri: string;
  createdAt: string;
  lastUsed?: string;
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
              key={app.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium text-sm">{app.name}</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Client ID: {app.clientId}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Created: {new Date(app.createdAt).toLocaleDateString()}
                  {app.lastUsed && ` • Last used: ${new Date(app.lastUsed).toLocaleDateString()}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRevokeAccess(app.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-muted rounded-lg border border-border p-4">
        <p className="font-medium text-sm mb-2">OAuth Documentation</p>
        <p className="text-muted-foreground text-xs">
          Learn about OAuth integration in our{' '}
          <a href="/docs/oauth" className="text-accent hover:underline">
            OAuth documentation
          </a>
          .
        </p>
      </div>
    </div>
  );
}

