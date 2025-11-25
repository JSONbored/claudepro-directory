/**
 * OAuth Account Linking Client Component
 * Handles the client-side linkIdentity() call for linking OAuth providers
 */

'use client';

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { AlertCircle, Loader2 } from '@heyclaude/web-runtime/icons';
import { UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';

const VALID_PROVIDERS = ['github', 'google', 'discord'] as const;
type ValidProvider = (typeof VALID_PROVIDERS)[number];

function isValidProvider(provider: string): provider is ValidProvider {
  return VALID_PROVIDERS.includes(provider as ValidProvider);
}

export default function OAuthLinkCallbackPage({
  params,
}: {
  params: Promise<{ provider: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function handleLink() {
      // Generate single requestId for this client-side operation
      const requestId = generateRequestId();
      const baseLogContext = createWebAppContextWithId(
        requestId,
        `/auth/link/${resolvedParams.provider}/callback`,
        'OAuthLinkCallback'
      );

      try {
        // Get provider from params
        const rawProvider = resolvedParams.provider;

        if (!isValidProvider(rawProvider)) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage('Invalid OAuth provider');
          setProvider(rawProvider);
          return;
        }

        setProvider(rawProvider);
        const logContext = { ...baseLogContext, provider: rawProvider };

        const supabase = createSupabaseBrowserClient();

        // Check if user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          if (!mounted) return;
          setStatus('error');
          setErrorMessage('You must be signed in to link an account. Redirecting to login...');
          logger.warn('OAuth link callback: user not authenticated', undefined, logContext);
          setTimeout(() => {
            const next = searchParams.get('next') ?? '/account/connected-accounts';
            router.push(
              `/login?redirect=${encodeURIComponent(`/auth/link/${rawProvider}?next=${encodeURIComponent(next)}`)}`
            );
          }, 2000);
          return;
        }

        // Get the next redirect URL
        const next = searchParams.get('next') ?? '/account/connected-accounts';
        const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
        callbackUrl.searchParams.set('next', next);
        callbackUrl.searchParams.set('link', 'true'); // Flag to indicate this is a linking flow

        // Call linkIdentity() to initiate OAuth flow
        const { data, error } = await supabase.auth.linkIdentity({
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
        if (data?.url) {
          window.location.href = data.url;
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
  }, [resolvedParams.provider, router, searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Linking Account</CardTitle>
            <CardDescription>
              Please wait while we redirect you to {provider || 'the provider'}...
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
              {errorMessage || 'An error occurred while linking your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent className={UI_CLASSES.FLEX_COL_GAP_2}>
            <button
              type="button"
              onClick={() => router.push('/account/connected-accounts')}
              className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90"
            >
              Return to Connected Accounts
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
