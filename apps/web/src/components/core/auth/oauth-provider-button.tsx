/**
 * OAuth button - Circular icon style with white GitHub icon
 */

'use client';

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { DiscordBrandIcon, GithubBrandIcon, GoogleBrandIcon } from '@heyclaude/web-runtime/icons';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowserClient();

  const config = PROVIDER_CONFIG[provider];
  const IconComponent = config.icon;

  const handleSignIn = async () => {
    setLoading(true);

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
      toasts.error.authFailed(`Sign in failed: ${error.message}`);
      setLoading(false);
    }
  };

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
          'flex h-16 w-16 items-center justify-center rounded-full border bg-white/5',
          loading && 'cursor-wait'
        )}
        style={{ borderColor: 'oklch(74% 0.2 35 / 0.3)' }}
        {...(loading
          ? {}
          : {
              whileHover: {
                ...MICROINTERACTIONS.iconButton.hover,
                scale: 1.05, // Preserve exact original scale (design token is 1.1, but original was 1.05)
                backgroundColor: 'rgba(255, 255, 255, 0.1)', // Preserve original hover background
              },
            })}
        transition={MICROINTERACTIONS.iconButton.transition}
      >
        {loading ? (
          <motion.div
            className="h-7 w-7 rounded-full border-2 border-white/20 border-t-white/80"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />
        ) : (
          <div style={{ width: '28px', height: '28px' }} className="text-foreground">
            <IconComponent style={{ width: '28px', height: '28px', display: 'block' }} />
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