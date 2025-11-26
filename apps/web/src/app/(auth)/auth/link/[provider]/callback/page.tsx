/**
 * OAuth Account Linking Client Component
 * Handles the client-side linkIdentity() call for linking OAuth providers
 */

'use client';

import { isValidProvider } from '@heyclaude/web-runtime';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
import { AlertCircle, Loader2 } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';


import { Button } from '@/src/components/primitives/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

export default function OAuthLinkCallbackPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const router = useRouter();
  const searchParameters = useSearchParams();
  const resolvedParameters = use(params);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const hasAttempted = useRef<boolean>(false);
  const {
    user,
    isAuthenticated,
    isLoading: isAuthLoading,
    supabaseClient,
  } = useAuthenticatedUser({ context: 'OAuthLinkCallback' });

  useEffect(() => {
    let mounted = true;

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
      const baseLogContext = createWebAppContextWithId(
        requestId,
        `/auth/link/${resolvedParameters.provider}/callback`,
        'OAuthLinkCallback'
      );

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
        const logContext = { ...baseLogContext, provider: rawProvider };

        // Check if user is authenticated
        if (!(isAuthenticated && user)) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage('You must be signed in to link an account. Redirecting to login...');
          logger.warn('OAuth link callback: user not authenticated', undefined, logContext);
          setTimeout(() => {
            // Validate 'next' parameter to prevent open redirects
            const nextParameter = searchParameters.get('next') ?? '/account/connected-accounts';
            const isValidRedirect =
              nextParameter.startsWith('/') &&
              !nextParameter.startsWith('//') &&
              !nextParameter.startsWith('/\\') &&
              !nextParameter.includes('@');
            const next = isValidRedirect ? nextParameter : '/account/connected-accounts';
            router.push(
              `/login?redirect=${encodeURIComponent(`/auth/link/${rawProvider}?next=${encodeURIComponent(next)}`)}`
            );
          }, 2000);
          return;
        }

        // Get the next redirect URL with validation
        // Validate 'next' parameter to prevent open redirects (matches server-side validation)
        const nextParameter = searchParameters.get('next') ?? '/account/connected-accounts';
        const isValidRedirect =
          nextParameter.startsWith('/') &&
          !nextParameter.startsWith('//') &&
          !nextParameter.startsWith('/\\') &&
          !nextParameter.includes('@');
        const next = isValidRedirect ? nextParameter : '/account/connected-accounts';
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
          const normalized = normalizeError(error, 'Failed to link OAuth provider');
          logger.error('OAuth link callback: linkIdentity failed', normalized, {
            ...logContext,
            errorMessage: error.message,
          });
          setStatus('error');
          setErrorMessage(error.message || 'Failed to link account. Please try again.');
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
      } catch (error) {
        if (!mounted) return;
        const normalized = normalizeError(error, 'OAuth link callback threw');
        logger.error('OAuth link callback: unexpected error', normalized, baseLogContext);
        setStatus('error');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }

    handleLink().catch(() => {
      // Error already handled in handleLink
    });

    return () => {
      mounted = false;
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
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Linking Account</CardTitle>
            <CardDescription>
              Please wait while we redirect you to {provider ?? 'the provider'}...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className={`${UI_CLASSES.ICON_XL} animate-spin text-muted-foreground`} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div
              className={
                'mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10'
              }
            >
              <AlertCircle className={`${UI_CLASSES.ICON_LG} text-destructive`} />
            </div>
            <CardTitle>Account Linking Failed</CardTitle>
            <CardDescription>
              {errorMessage ?? 'An error occurred while linking your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
            <Button type="button" onClick={() => router.push('/account/connected-accounts')}>
              Return to Connected Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
