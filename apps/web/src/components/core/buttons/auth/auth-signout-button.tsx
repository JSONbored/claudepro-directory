'use client';

/**
 * Auth Sign-Out Button
 * Signs user out and redirects to homepage
 */

import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { LogOut } from '@heyclaude/web-runtime/icons';
import type { ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';

export type AuthSignOutScope = 'global' | 'local' | 'others';

export interface AuthSignOutButtonProps extends ButtonStyleProps {
  /**
   * Sign out scope:
   * - 'global' (default): Terminates all sessions for the user
   * - 'local': Only terminates the current session
   * - 'others': Terminates all sessions except the current one
   */
  scope?: AuthSignOutScope;
}

export function AuthSignOutButton({
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  scope = 'global',
}: AuthSignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut({ scope });

    if (error) {
      toasts.error.authFailed(`Sign out failed: ${error.message}`);
      setLoading(false);
    } else {
      toasts.success.signedOut();
      router.push('/');
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={disabled || loading}
      size={size}
      variant={variant}
      className={className}
    >
      <LogOut className={UI_CLASSES.ICON_SM_LEADING} />
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
