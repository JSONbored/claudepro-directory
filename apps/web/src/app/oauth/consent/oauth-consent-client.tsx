'use client';

/**
 * OAuth Consent Client Component
 *
 * Client-side component for handling OAuth consent UI and user interactions.
 * Displays client information, requested scopes, and handles approve/deny actions.
 */

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { Button, UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { AlertCircle, CheckCircle2, ExternalLink, Shield, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OAuthConsentClientProps {
  authDetails: {
    client: {
      client_id: string;
      name: string;
    };
    redirect_uri: string;
    scopes?: null | string[];
  };
  authorizationId: string;
}

/**
 * Client component for OAuth consent screen.
 *
 * Displays client information, requested scopes, and handles user approval/denial.
 * @param root0
 * @param root0.authorizationId
 * @param root0.authDetails
 */
export function OAuthConsentClient({ authDetails, authorizationId }: OAuthConsentClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<null | string>(null);

  // Use useLoggedAsync for consistent error logging in async operations
  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'OAuth operation failed',
    scope: 'OAuthConsentClient',
  });

  // Create Supabase browser client for client-side operations
  // This client handles cookies automatically for authentication
  // NOTE: Data fetching (auth.oauth.approveAuthorization/denyAuthorization) is done in event handlers
  // (handleApprove/handleDeny), not during render, so this is compliant with architectural rules
  const supabase = createSupabaseBrowserClient();

  const handleApprove = async () => {
    setIsProcessing(true);
    setError(null);

    await runLoggedAsync(
      async () => {
        const { data, error: approveError } =
          await supabase.auth.oauth.approveAuthorization(authorizationId);

        if (approveError !== null) {
          const errorMessage =
            approveError instanceof Error
              ? approveError.message
              : typeof approveError === 'string'
                ? approveError
                : 'Failed to approve authorization';
          setError(errorMessage);
          setIsProcessing(false);
          return;
        }

        if (!data) {
          setError('No data returned from authorization approval');
          setIsProcessing(false);
          return;
        }

        // Log successful approval (useLoggedAsync handles error logging)

        // Redirect to the client's redirect URI with authorization code
        const redirectTo = data.redirect_url;
        if (redirectTo) {
          globalThis.location.href = redirectTo;
        } else {
          setError('No redirect URL provided');
          setIsProcessing(false);
        }
      },
      {
        context: {
          authorizationId,
          clientId: authDetails.client.client_id,
        },
        rethrow: false,
      }
    );
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    setError(null);

    await runLoggedAsync(
      async () => {
        const { data, error: denyError } =
          await supabase.auth.oauth.denyAuthorization(authorizationId);

        if (denyError !== null) {
          const errorMessage =
            denyError instanceof Error
              ? denyError.message
              : typeof denyError === 'string'
                ? denyError
                : 'Failed to deny authorization';
          setError(errorMessage);
          setIsProcessing(false);
          return;
        }

        if (!data) {
          // If no redirect, go back to home
          router.push('/');
          return;
        }

        // Log successful denial (useLoggedAsync handles error logging)

        // Redirect to the client's redirect URI with error
        const redirectTo = data.redirect_url;
        if (redirectTo) {
          globalThis.location.href = redirectTo;
        } else {
          // If no redirect, go back to home
          router.push('/');
        }
      },
      {
        context: {
          authorizationId,
          clientId: authDetails.client.client_id,
        },
        rethrow: false,
      }
    );
  };

  const scopes = authDetails.scopes ?? [];
  const hasScopes = scopes.length > 0;

  // Map scope names to user-friendly descriptions
  const scopeDescriptions: Record<string, string> = {
    email: 'Access your email address',
    'mcp:resources': 'Access MCP resources on your behalf',
    'mcp:tools': 'Access MCP tools on your behalf',
    openid: 'Access your basic profile information',
    phone: 'Access your phone number',
    profile: 'Access your profile information (name, picture)',
  };

  return (
    <div className="mx-auto flex min-h-[400px] max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 text-center">
        <div className="flex items-center justify-center">
          <Shield aria-hidden="true" className="text-accent h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold">Authorize Application</h1>
        <p className="text-muted-foreground text-base">
          An application is requesting access to your account
        </p>
      </div>

      <div className="border-border bg-card flex flex-col gap-6 rounded-lg border p-6">
        {/* Client Information */}
        <div className="flex flex-col gap-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <span>{authDetails.client.name}</span>
            </h2>
            <UnifiedBadge className="text-xs" style="secondary" variant="base">
              OAuth Client
            </UnifiedBadge>
          </div>

          <div className="text-muted-foreground flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
              <span className="font-medium">Redirect URI:</span>
              <span className="font-mono text-xs break-all">{authDetails.redirect_uri}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Client ID:</span>
              <span className="font-mono text-xs break-all">{authDetails.client.client_id}</span>
            </div>
          </div>
        </div>

        {/* Requested Permissions */}
        {hasScopes ? (
          <div className="border-border bg-muted/30 flex flex-col gap-3 rounded-md border p-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span>Requested Permissions</span>
            </h3>
            <ul className="flex list-none flex-col gap-1">
              {scopes.map((scope) => (
                <li className="flex items-start gap-2" key={scope}>
                  <CheckCircle2
                    aria-hidden="true"
                    className="text-accent mt-0.5 h-4 w-4 flex-shrink-0"
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-semibold">{scope}</span>
                    {scopeDescriptions[scope] ? (
                      <span className="text-muted-foreground mt-1 block">
                        {scopeDescriptions[scope]}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Error Message */}
        {error ? (
          <div className="border-destructive/20 bg-destructive/10 flex items-start gap-2 rounded-md border p-4">
            <AlertCircle
              aria-hidden="true"
              className="text-destructive mt-0.5 h-5 w-5 flex-shrink-0"
            />
            <div className="flex flex-1 flex-col gap-1">
              <p className="text-destructive text-sm font-semibold">Error</p>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          <Button
            className="flex-1 transition-colors"
            disabled={isProcessing}
            onClick={() => {
              void handleDeny();
            }}
            size="lg"
            variant="outline"
          >
            <XCircle aria-hidden="true" className="mr-2 h-4 w-4" />
            Deny
          </Button>
          <Button
            className="hover:bg-accent/20 flex-1 transition-colors"
            disabled={isProcessing}
            onClick={() => {
              void handleApprove();
            }}
            size="lg"
            variant="default"
          >
            <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Approve'}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="bg-muted/20 mt-4 flex items-start gap-2 rounded-md p-3">
          <Shield
            aria-hidden="true"
            className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0"
          />
          <p className="text-muted-foreground text-xs">
            You can revoke access to this application at any time from your{' '}
            <Link className="hover:text-foreground underline" href="/account/connected-accounts">
              account settings
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
