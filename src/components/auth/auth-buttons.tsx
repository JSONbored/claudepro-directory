'use client';

/**
 * Auth Buttons Component
 * Sign in/out buttons with GitHub and Google OAuth
 *
 * Reuses existing UI components (Button, icons)
 */

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Chrome, Github, LogOut } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { toasts } from '@/src/lib/utils/toast.utils';

interface AuthButtonsProps {
  className?: string;
  redirectTo?: string;
}

export function AuthButtons({ className, redirectTo }: AuthButtonsProps) {
  const [loading, setLoading] = useState<'github' | 'google' | null>(null);
  const supabase = createClient();

  const handleSignIn = async (provider: 'github' | 'google') => {
    setLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
      },
    });

    if (error) {
      toasts.error.authFailed(`Sign in failed: ${error.message}`);
      setLoading(null);
    }
    // If successful, user will be redirected to OAuth provider
  };

  return (
    <div className={className}>
      <Button
        onClick={() => handleSignIn('github')}
        disabled={loading !== null}
        className="w-full mb-2"
      >
        {loading === 'github' ? (
          <>Signing in...</>
        ) : (
          <>
            <Github className="h-4 w-4 mr-2" />
            Sign in with GitHub
          </>
        )}
      </Button>

      <Button
        onClick={() => handleSignIn('google')}
        disabled={loading !== null}
        variant="outline"
        className="w-full"
      >
        {loading === 'google' ? (
          <>Signing in...</>
        ) : (
          <>
            <Chrome className="h-4 w-4 mr-2" />
            Sign in with Google
          </>
        )}
      </Button>
    </div>
  );
}

export function SignOutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toasts.error.authFailed(`Sign out failed: ${error.message}`);
    } else {
      toasts.success.signedOut();
      window.location.href = '/';
    }

    setLoading(false);
  };

  return (
    <Button onClick={handleSignOut} disabled={loading} variant="ghost" className={className}>
      <LogOut className="h-4 w-4 mr-2" />
      {loading ? 'Signing out...' : 'Sign out'}
    </Button>
  );
}
