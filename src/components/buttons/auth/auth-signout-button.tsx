'use client';

/**
 * Auth Sign-Out Button
 * Signs user out and redirects to homepage
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/primitives/button';
import { LogOut } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { ButtonStyleProps } from '../shared/button-types';

export type AuthSignOutButtonProps = ButtonStyleProps;

export function AuthSignOutButton({
  size = 'sm',
  buttonVariant = 'ghost',
  className,
  disabled = false,
}: AuthSignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

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
      variant={buttonVariant}
      className={className}
    >
      <LogOut className={UI_CLASSES.ICON_SM_LEADING} />
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
