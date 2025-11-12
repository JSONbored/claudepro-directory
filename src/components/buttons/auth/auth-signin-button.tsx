'use client';

/**
 * Auth Sign-In Button
 * OAuth authentication with GitHub/Google providers
 */

import { useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import { Chrome, Github } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export interface AuthSignInButtonProps extends ButtonStyleProps {
  provider: 'github' | 'google';
  redirectTo?: string;
}

export function AuthSignInButton({
  provider,
  redirectTo,
  size = 'default',
  buttonVariant = 'default',
  className,
  disabled = false,
}: AuthSignInButtonProps) {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null);
  const supabase = createClient();

  const handleSignIn = async () => {
    setLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''}`,
      },
    });

    if (error) {
      toasts.error.authFailed(`Sign in failed: ${error.message}`);
      setLoading(null);
    }
  };

  const icon = provider === 'github' ? Github : Chrome;
  const IconComponent = icon;

  return (
    <Button
      onClick={handleSignIn}
      disabled={disabled || loading !== null}
      size={size}
      variant={buttonVariant}
      className={cn('gap-2', className)}
    >
      {loading === provider ? (
        <>Signing in...</>
      ) : (
        <>
          <IconComponent className={UI_CLASSES.ICON_SM} />
          Sign in with {provider === 'github' ? 'GitHub' : 'Google'}
        </>
      )}
    </Button>
  );
}
