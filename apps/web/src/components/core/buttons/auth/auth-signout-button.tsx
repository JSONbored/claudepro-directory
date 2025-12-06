'use client';

/**
 * Auth Sign-Out Button
 * Signs user out and redirects to homepage
 */

import { normalizeError } from '@heyclaude/shared-runtime';
import { createSupabaseBrowserClient } from '@heyclaude/web-runtime/client';
import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
import { LogOut } from '@heyclaude/web-runtime/icons';
import { type ButtonStyleProps } from '@heyclaude/web-runtime/types/component.types';
import { toasts, UI_CLASSES, Button } from '@heyclaude/web-runtime/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const runLoggedAsync = useLoggedAsync({
    scope: 'AuthSignOutButton',
    defaultMessage: 'Sign out failed',
    defaultRethrow: false,
  });

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await runLoggedAsync(
        async () => {
          const { error } = await supabase.auth.signOut({ scope });

          if (error) {
            throw new Error(`Sign out failed: ${error.message}`);
          }

          toasts.success.signedOut();
          router.push('/');
          router.refresh();
        },
        {
          message: 'Sign out failed',
          context: { scope },
        }
      );
    } catch (error) {
      // Error already logged by useLoggedAsync
      toasts.error.authFailed(normalizeError(error, 'Sign out failed').message);
    } finally {
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
