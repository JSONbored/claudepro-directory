'use client';

/**
 * OAuth Account Linking Client Component
 * Handles the client-side linkIdentity() call for linking OAuth providers
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { isValidProvider, validateNextParameter  } from '@heyclaude/web-runtime';
import {
  alignItems,
  animate,
  bgColor,
  display,
  iconSize,
  justify,
  marginBottom,
  marginX,
  maxWidth,
  minHeight,
  muted,
  padding,
  radius,
  stack,
  textAlign,
  textColor,
  width,
} from '@heyclaude/web-runtime/design-system';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2 } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logClientError,
  logClientWarn,
} from '@heyclaude/web-runtime/logging/client';
import { Button ,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle } from '@heyclaude/web-runtime/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';

// Force dynamic rendering - auth callback pages should never be cached
export const dynamic = 'force-dynamic';

/**
 * Renders the client-side OAuth account linking page that validates the provider and either
 * redirects the user into the provider's OAuth flow or shows an error and redirects to login.
 *
 * @param params - A promise resolving to an object with the OAuth provider slug (e.g., `{ provider: 'github' }`).
 * @returns The component's rendered JSX showing a linking/loading UI or an error UI with navigation back to connected accounts.
 *
 * @see isValidProvider
 * @see validateNextParameter
 * @see useAuthenticatedUser
 * @see supabaseClient.auth.linkIdentity
 */
export default function OAuthLinkCallbackPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const router = useRouter();
  const searchParameters = useSearchParams();
  const resolvedParameters = use(params);
  const [status, setStatus] = useState<'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState<null | string>(null);
  const [provider, setProvider] = useState<null | string>(null);
  const hasAttempted = useRef<boolean>(false);
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    supabaseClient,
  } = useAuthenticatedUser({ context: 'OAuthLinkCallback' });

  useEffect(() => {
    let mounted = true;
    let redirectTimeoutId: null | ReturnType<typeof setTimeout> = null;

    // Use shared validation utility to prevent open redirects
    // Matches server-side validation in route handlers

    async function handleLink() {
      // Prevent duplicate OAuth linking attempts (e.g., from Strict Mode re-mounts)
      if (hasAttempted.current) {
        return;
      }

      // Wait for auth to load before proceeding
      if (isAuthLoading) {
        return;
      }

      // Mark as attempted before proceeding
      hasAttempted.current = true;

      // Generate single requestId for this client-side operation
      const requestId = generateRequestId();
      const operation = 'OAuthLinkCallback';
      const route = `/auth/link/${resolvedParameters.provider}/callback`;
      const module = 'apps/web/src/app/(auth)/auth/link/[provider]/callback/page';

      try {
        // Get provider from params
        const rawProvider = resolvedParameters.provider;

        if (!isValidProvider(rawProvider)) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage('Invalid OAuth provider');
          setProvider(rawProvider);
          return;
        }

        setProvider(rawProvider);

        // Check if user is authenticated
        if (!(isAuthenticated && user)) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage('You must be signed in to link an account. Redirecting to login...');
          logClientWarn('OAuth link callback: user not authenticated', undefined, operation, {
            requestId,
            route,
            module,
            provider: rawProvider,
          });
          // Guard redirect with mounted check and store timeout ID for cleanup
          redirectTimeoutId = setTimeout(() => {
            if (!mounted) return; // Don't redirect if component unmounted
            const next = validateNextParameter(searchParameters.get('next'), '/account/connected-accounts');
            router.push(
              `/login?redirect=${encodeURIComponent(`/auth/link/${rawProvider}?next=${encodeURIComponent(next)}`)}`
            );
          }, 2000);
          return;
        }

        // Get the next redirect URL with validation
        // Validate 'next' parameter to prevent open redirects (matches server-side validation)
        const next = validateNextParameter(searchParameters.get('next'), '/account/connected-accounts');
        const callbackUrl = new URL(`${globalThis.location.origin}/auth/callback`);
        callbackUrl.searchParams.set('next', next);
        callbackUrl.searchParams.set('link', 'true'); // Flag to indicate this is a linking flow

        // Call linkIdentity() to initiate OAuth flow
        const { data, error } = await supabaseClient.auth.linkIdentity({
          provider: rawProvider,
          options: {
            redirectTo: callbackUrl.toString(),
          },
        });

        if (error) {
          if (!mounted) return;
          logClientError('OAuth link callback: linkIdentity failed', error, operation, {
            requestId,
            route,
            module,
            provider: rawProvider,
          });
          setStatus('error');
          setErrorMessage(normalizeError(error, 'Failed to link account. Please try again.').message);
          return;
        }

        // If we get a URL, redirect to it (OAuth provider)
        if (data.url) {
          globalThis.location.href = data.url;
          return;
        }

        // If no URL returned, something went wrong
        if (!mounted) return;
        setStatus('error');
        setErrorMessage('Unexpected response from OAuth provider. Please try again.');
      } catch (caughtError) {
        if (!mounted) return;
        logClientError('OAuth link callback: unexpected error', caughtError, operation, {
          requestId,
          route,
          module,
          provider: resolvedParameters.provider,
        });
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }

    handleLink().catch(() => {
      // Error already handled in handleLink
    });

    return () => {
      mounted = false;
      // Clear any pending redirect timeout on unmount
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId);
        redirectTimeoutId = null;
      }
    };
  }, [
    resolvedParameters.provider,
    router,
    searchParameters,
    isAuthLoading,
    isAuthenticated,
    user,
    supabaseClient,
  ]);

  if (status === 'loading') {
    return (
      <div className={`${display.flex} ${minHeight.screen} ${alignItems.center} ${justify.center} ${padding.default}`}>
        <Card className={`${width.full} ${maxWidth.md}`}>
          <CardHeader className={textAlign.center}>
            <CardTitle>Linking Account</CardTitle>
            <CardDescription>
              Please wait while we redirect you to {provider ?? 'the provider'}...
            </CardDescription>
          </CardHeader>
          <CardContent className={`${display.flex} ${alignItems.center} ${justify.center} ${padding.yRelaxed}`}>
            <Loader2 className={`${iconSize.xl} ${animate.spin} ${muted.default}`} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // status can only be 'error' at this point (TypeScript narrows the type)
  return (
    <div className={`${display.flex} ${minHeight.screen} ${alignItems.center} ${justify.center} ${padding.default}`}>
      <Card className={`${width.full} ${maxWidth.md}`}>
        <CardHeader className={textAlign.center}>
          <div
            className={`${marginX.auto} ${marginBottom.default} ${display.flex} ${iconSize['3xl']} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor['destructive/10']}`}
          >
            <AlertCircle className={`${iconSize.lg} ${textColor.destructive}`} />
          </div>
          <CardTitle>Account Linking Failed</CardTitle>
          <CardDescription>
            {errorMessage ?? 'An error occurred while linking your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className={stack.compact}>
          <Button type="button" onClick={() => router.push('/account/connected-accounts')}>
            Return to Connected Accounts
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}