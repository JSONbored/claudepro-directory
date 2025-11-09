/**
 * OAuth button - Circular icon style with white GitHub icon
 */

'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { DiscordBrandIcon, GithubBrandIcon, GoogleBrandIcon } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { ANIMATION_CONSTANTS } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

interface OAuthProviderButtonProps {
  provider: 'github' | 'google' | 'discord';
  redirectTo?: string | undefined;
  className?: string;
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

export function OAuthProviderButton({ provider, redirectTo, className }: OAuthProviderButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const config = PROVIDER_CONFIG[provider];
  const IconComponent = config.icon;

  const handleSignIn = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
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
      <span className="font-medium text-foreground text-sm">
        {loading ? 'Signing in...' : config.label}
      </span>
    </button>
  );
}
