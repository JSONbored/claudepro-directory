/**
 * OAuth button - Circular icon style with white GitHub icon
 */

'use client';

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { DiscordBrandIcon, GithubBrandIcon, GoogleBrandIcon } from '@heyclaude/web-runtime/icons';
import { ANIMATION_CONSTANTS, cn, toasts } from '@heyclaude/web-runtime/ui';
import { weight ,size    } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { useState } from 'react';

interface OAuthProviderButtonProps {
  provider: 'github' | 'google' | 'discord';
  redirectTo?: string | undefined;
  className?: string;
  newsletterOptIn?: boolean;
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

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
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
        'flex flex-col items-center ${gap.comfortable} ${padding.xComfortable}',
        loading && 'cursor-wait opacity-60',
        className
      )}
    >
      {/* Circular icon button */}
      <div
        className={cn(
          `flex h-16 w-16 items-center justify-center rounded-full border bg-white/5 ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} hover:scale-105 hover:bg-white/10`,
          loading && 'cursor-wait'
        )}
        style={{ borderColor: 'oklch(74% 0.2 35 / 0.3)' }}
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
      </div>

      {/* Label below */}
      <span className={`${weight.medium} text-foreground ${size.sm}`}>
        {loading ? 'Signing in...' : config.label}
      </span>
    </button>
  );
}
