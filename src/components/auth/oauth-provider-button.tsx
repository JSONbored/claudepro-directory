/**
 * OAuth button - icon + label with loading states
 */

'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import { Chrome, DiscordIcon, Github } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

interface OAuthProviderButtonProps {
  provider: 'github' | 'google' | 'discord';
  redirectTo?: string | undefined;
  size?: 'default' | 'lg';
  className?: string;
}

const PROVIDER_CONFIG = {
  github: {
    icon: Github,
    label: 'GitHub',
    brandColor: 'hover:bg-foreground/5',
  },
  google: {
    icon: Chrome,
    label: 'Google',
    brandColor: 'hover:bg-blue-500/5',
  },
  discord: {
    icon: DiscordIcon,
    label: 'Discord',
    brandColor: 'hover:bg-discord/10',
  },
} as const;

export function OAuthProviderButton({
  provider,
  redirectTo,
  size = 'lg',
  className,
}: OAuthProviderButtonProps) {
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
    // If successful, OAuth redirect happens automatically
  };

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Button
        onClick={handleSignIn}
        disabled={loading}
        size={size}
        variant="outline"
        className={cn(
          'w-full gap-3 font-medium transition-all duration-200',
          config.brandColor,
          loading && 'cursor-wait opacity-60',
          className
        )}
      >
        {loading ? (
          <>
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-muted-foreground border-t-foreground"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
            <span>Signing in...</span>
          </>
        ) : (
          <>
            <IconComponent className="h-5 w-5" />
            <span>Continue with {config.label}</span>
          </>
        )}
      </Button>
    </motion.div>
  );
}
