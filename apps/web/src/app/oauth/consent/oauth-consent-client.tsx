'use client';

/**
 * OAuth Consent Client Component
 *
 * Client-side component for handling OAuth consent UI and user interactions.
 * Redesigned to match Vercel's industry-standard MCP OAuth design:
 * - Dark theme with minimal layout
 * - MCP logo display
 * - User account information
 * - Connected icons visual
 * - Clear permissions list
 * - Cancel/Allow buttons
 * - Terms and Privacy Policy links
 */

import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks/use-logged-async';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/supabase/browser';
import { Avatar, AvatarFallback, AvatarImage, Button, cn } from '@heyclaude/web-runtime/ui';
import { optimizeAvatarUrl } from '@heyclaude/web-runtime/utils/optimize-avatar-url';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OAuthConsentClientProps {
  authDetails: {
    client: {
      client_id: string;
      description?: null | string;
      name: string;
    };
    redirect_uri: string;
    resource?: null | string; // RFC 8707 resource parameter (MCP server URL)
    scopes?: null | string[];
  };
  authorizationId: string;
  user: {
    email: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * Client component for OAuth consent screen.
 *
 * Displays client information, requested scopes, and handles user approval/denial.
 * Matches Vercel's MCP OAuth design with dark theme and minimal layout.
 *
 * @param authDetails - OAuth authorization details from Supabase
 * @param authorizationId - Authorization ID for approve/deny operations
 * @param user - Current user information (email, name, avatar)
 */
export function OAuthConsentClient({
  authDetails,
  authorizationId,
  user,
}: OAuthConsentClientProps) {
  const router = useRouter();
  const {
    setFalse: setIsProcessingFalse,
    setTrue: setIsProcessingTrue,
    value: isProcessing,
  } = useBoolean();
  const [error, setError] = useState<null | string>(null);

  // Use useLoggedAsync for consistent error logging in async operations
  const runLoggedAsync = useLoggedAsync({
    defaultMessage: 'OAuth operation failed',
    scope: 'OAuthConsentClient',
  });

  // Create Supabase browser client for client-side operations
  const supabase = createSupabaseBrowserClient();

  const handleApprove = async () => {
    setIsProcessingTrue();
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
          setIsProcessingFalse();
          return;
        }

        if (!data) {
          setError('No data returned from authorization approval');
          setIsProcessingFalse();
          return;
        }

        // Redirect to success page first, then to client's redirect URI
        const redirectTo = data.redirect_url;
        if (redirectTo) {
          // Redirect to success page with redirect_uri parameter
          const successUrl = `/oauth/success?redirect_uri=${encodeURIComponent(redirectTo)}`;
          globalThis.location.href = successUrl;
        } else {
          setError('No redirect URL provided');
          setIsProcessingFalse();
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

  /**
   * Handle user denial of authorization.
   *
   * Flow:
   * 1. Calls Supabase's denyAuthorization which returns a redirect_url
   * 2. The redirect_url from Supabase automatically includes error=access_denied parameter
   *    per OAuth 2.1 specification
   * 3. Redirects user to client's redirect_uri with error parameter
   * 4. Client receives error=access_denied and can handle accordingly
   *
   * Error scenarios:
   * - If denyAuthorization fails: Shows error message, user can try again or close tab
   * - If no redirect_url: Shows message that authorization was denied, user can close tab
   */
  const handleDeny = async () => {
    setIsProcessingTrue();
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
          setIsProcessingFalse();
          return;
        }

        if (!data) {
          // If no redirect, show message and allow user to close tab
          setError('Authorization denied. You can close this tab.');
          setIsProcessingFalse();
          return;
        }

        // Redirect to the client's redirect URI with error parameter
        // Supabase's denyAuthorization automatically includes error=access_denied in the redirect URL
        // per OAuth 2.1 specification (RFC 6749 Section 4.1.2.1)
        const redirectTo = data.redirect_url;
        if (redirectTo) {
          // Redirect immediately - the redirect_url from Supabase already includes error=access_denied
          globalThis.location.href = redirectTo;
        } else {
          // If no redirect, show message and allow user to close tab
          setError('Authorization denied. You can close this tab.');
          setIsProcessingFalse();
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
    'mcp:resources':
      'Access MCP resources on your behalf (content exports, category data, sitewide data)',
    'mcp:tools':
      'Access MCP tools on your behalf (search, browse, submit content, manage bookmarks)',
    openid: 'Access your basic profile information',
    phone: 'Access your phone number',
    profile: 'Access your profile information (name, picture)',
  };

  // Determine if this is an MCP client request
  const isMcpClient =
    authDetails.resource?.includes('/mcp') ||
    authDetails.scopes?.some((scope) => scope.startsWith('mcp:')) ||
    false;

  // Generate user initials for avatar fallback
  const userInitials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex flex-col gap-6">
      {/* Header with MCP Logo */}
      <div className="flex flex-col items-center gap-4 text-center">
        {isMcpClient ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-300 bg-white p-2">
            <Image
              src="/partners/mcp.svg"
              alt="MCP"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-black">Authorize Application</h1>
          <p className="text-gray-600 text-sm">
            {authDetails.client.name} wants to access your account
          </p>
        </div>
      </div>

      {/* User Account Information */}
      <div className="border-gray-200 bg-gray-50 flex items-center gap-3 rounded-lg border p-4">
        <Avatar className="h-10 w-10">
          {user.avatarUrl ? (
            <AvatarImage
              src={optimizeAvatarUrl(user.avatarUrl, 40) ?? user.avatarUrl}
              alt={user.name}
            />
          ) : null}
          <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm font-medium text-black">{user.name}</p>
          <p className="text-xs text-gray-600">{user.email}</p>
        </div>
      </div>

      {/* Connected Icons Visual (MCP ↔ Claude Pro Directory) */}
      {isMcpClient ? (
        <div className="flex items-center justify-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white p-2">
            <Image
              src="/partners/mcp.svg"
              alt="MCP Client"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex h-0.5 w-12 items-center justify-center bg-gray-300">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-300 bg-white p-2">
            <Image
              src="/assets/icons/claudepro-directory-icon.svg"
              alt="Claude Pro Directory"
              width={32}
              height={32}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      ) : null}

      {/* Requested Permissions */}
      {hasScopes ? (
        <div className="border-gray-200 flex flex-col gap-3 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-black">This application will be able to:</h2>
          <ul className="flex list-none flex-col gap-3">
            {scopes.map((scope) => (
              <li className="flex items-start gap-3" key={scope}>
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-medium text-black">{scope}</span>
                  {scopeDescriptions[scope] ? (
                    <span className="text-xs text-gray-600">{scopeDescriptions[scope]}</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Error Message */}
      {error ? (
        <div className="border-red-200 bg-red-50 flex items-start gap-3 rounded-lg border p-4">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="text-sm font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          className="flex-1 bg-white text-black border-gray-300 hover:bg-gray-50"
          disabled={isProcessing}
          onClick={() => {
            void handleDeny();
          }}
          size="lg"
          variant="outline"
        >
          <XCircle aria-hidden="true" className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          className="flex-1 bg-black text-white hover:bg-gray-900"
          disabled={isProcessing}
          onClick={() => {
            void handleApprove();
          }}
          size="lg"
          variant="default"
        >
          <CheckCircle2 aria-hidden="true" className="mr-2 h-4 w-4" />
          {isProcessing ? 'Processing...' : 'Allow'}
        </Button>
      </div>

      {/* Terms and Privacy Policy Links */}
      <div className="flex items-center justify-center gap-4 border-t border-gray-200 pt-4">
        <Link
          className="text-xs text-gray-600 hover:text-black underline transition-colors"
          href="/terms"
        >
          Terms of Service
        </Link>
        <span className="text-gray-400 text-xs">•</span>
        <Link
          className="text-xs text-gray-600 hover:text-black underline transition-colors"
          href="/privacy"
        >
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}
