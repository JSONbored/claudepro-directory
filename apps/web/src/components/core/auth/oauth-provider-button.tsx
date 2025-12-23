/**
 * OAuth button - Circular icon style with white GitHub icon
 */

'use client';

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/supabase/browser';
import { DiscordBrandIcon, GithubBrandIcon, GoogleBrandIcon } from '@heyclaude/web-runtime/icons';
import { logClientError, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useCallback } from 'react';

interface OAuthProviderButtonProps {
  className?: string;
  newsletterOptIn?: boolean;
  provider: 'discord' | 'github' | 'google';
  redirectTo?: string | undefined;
}

const PROVIDER_CONFIG = {
  github: {
    icon: GithubBrandIcon,
    label: 'GitHub',
  },
  google: {
    icon: GoogleBrandIcon,
    label: 'Google',
  },
  discord: {
    icon: DiscordBrandIcon,
    label: 'Discord',
  },
} as const;

/**
 * Renders a circular OAuth sign-in button for a given provider and initiates the Supabase OAuth flow when clicked.
 *
 * Clicking the button constructs a callback URL including `newsletter` and optional `next` query parameters,
 * triggers Supabase OAuth sign-in for the selected provider, shows a loading state while redirecting, and displays
 * a toast error if sign-in fails.
 *
 * @param provider - OAuth provider to use (`'discord' | 'github' | 'google'`)
 * @param redirectTo - Optional path to navigate to after authentication (added as the `next` query parameter on the callback URL)
 * @param className - Optional additional className applied to the outer button
 * @param newsletterOptIn - When `true`, appends `newsletter=true` to the callback URL; otherwise `newsletter=false`
 *
 * @see createSupabaseBrowserClient
 * @see PROVIDER_CONFIG
 */
export function OAuthProviderButton({
  provider,
  redirectTo,
  className,
  newsletterOptIn = false,
}: OAuthProviderButtonProps) {
  const { value: loading, setTrue: setLoadingTrue, setFalse: setLoadingFalse } = useBoolean();
  const shouldReduceMotion = useReducedMotion();
  const supabase = createSupabaseBrowserClient();

  const config = PROVIDER_CONFIG[provider];
  const IconComponent = config.icon;

  const handleSignIn = useCallback(async () => {
    setLoadingTrue();

    const callbackUrl = new URL(`${globalThis.location.origin}/auth/callback`);
    callbackUrl.searchParams.set('newsletter', newsletterOptIn ? 'true' : 'false');
    if (redirectTo) {
      callbackUrl.searchParams.set('next', redirectTo);
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      // Log error for observability
      const normalized = normalizeError(error, 'OAuth sign-in failed');
      logClientError('OAuth sign-in failed', normalized, 'OAuthProviderButton.handleSignIn', {
        component: 'OAuthProviderButton',
        action: 'sign-in',
        provider,
        redirectTo: redirectTo ?? undefined,
        newsletterOptIn,
        category: 'auth',
      });

      // Show error toast with "Retry" button
      toasts.raw.error(`Sign in failed: ${error.message}`, {
        action: {
          label: 'Retry',
          onClick: () => {
            handleSignIn();
          },
        },
      });
      setLoadingFalse();
    }
  }, [provider, redirectTo, newsletterOptIn, supabase]);

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className={cn(
        'flex flex-col items-center gap-4 px-6',
        loading && 'cursor-wait opacity-60',
        className
      )}
    >
      {/* Circular icon button */}
      <motion.div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full border bg-foreground/5',
          'border-color-border-focus',
          loading && 'cursor-wait'
        )}
        {...(loading || shouldReduceMotion
          ? {}
          : {
              whileHover: {
                ...MICROINTERACTIONS.iconButton.hover,
                scale: 1.05, // Preserve exact original scale (design token is 1.1, but original was 1.05)
                backgroundColor: 'var(--foreground) / 0.1', // Use theme foreground with opacity
              },
            })}
        transition={MICROINTERACTIONS.iconButton.transition}
      >
        {loading ? (
          <motion.div
            className="h-7 w-7 rounded-full border-2 border-white/20 border-t-white/80"
            animate={shouldReduceMotion ? {} : { rotate: 360 }}
            transition={
              shouldReduceMotion
                ? {}
                : { duration: DURATION.long, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }
            }
          />
        ) : (
          <div className="text-foreground h-7 w-7">
            <IconComponent className="block h-7 w-7" />
          </div>
        )}
      </motion.div>

      {/* Label below */}
      <span className="text-foreground text-sm font-medium">
        {loading ? 'Signing in...' : config.label}
      </span>
    </button>
  );
}
