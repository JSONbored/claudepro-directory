'use client';

/**
 * User Menu Component
 * Auth-aware navigation menu with avatar dropdown
 *
 * Features:
 * - Supabase auth integration
 * - Graceful degradation (works without auth)
 * - Avatar dropdown with profile links
 * - Sign in/out functionality
 * - WCAG AA accessibility compliant
 *
 * @module components/layout/user-menu
 */

import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { Activity, BookOpen, LogOut, Settings, User as UserIcon } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Check auth state on mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch {
        // Fail silently - user menu will show sign in state
      } finally {
        setLoading(false);
      }
    };

    getUser().catch(() => {
      // Error already handled in try-catch
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toasts.error.authFailed(`Sign out failed: ${error.message}`);
      } else {
        toasts.success.signedOut();
        router.push('/');
        router.refresh();
      }
    } catch {
      toasts.error.serverError('An unexpected error occurred');
    } finally {
      setSigningOut(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`${UI_CLASSES.FLEX} ${UI_CLASSES.ITEMS_CENTER} ${className}`}>
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
      </div>
    );
  }

  // Signed out state - show sign in button
  if (!user) {
    return (
      <div className={className}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login')}
          className={UI_CLASSES.BUTTON_GHOST_ICON}
          aria-label="Sign in"
        >
          <UserIcon className="h-4 w-4" />
          <span className={`${UI_CLASSES.HIDDEN} lg:inline`}>Sign In</span>
        </Button>
      </div>
    );
  }

  // Signed in state - show user avatar and dropdown
  const userMetadata = user.user_metadata;
  const displayName = userMetadata?.name || userMetadata?.full_name || user.email?.split('@')[0];
  const avatarUrl = userMetadata?.avatar_url || userMetadata?.picture;
  const initials =
    displayName
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-accent/30"
            aria-label={`User menu for ${displayName}`}
          >
            <Avatar className="h-8 w-8">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || 'User avatar'} />}
              <AvatarFallback className="bg-accent/20 text-accent font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56" align="end" forceMount>
          {/* User Info */}
          <DropdownMenuLabel className="font-normal">
            <div className={UI_CLASSES.FLEX_COL}>
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation Links */}
          <DropdownMenuItem
            onClick={() => router.push('/account/settings')}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push('/account/library')}
            className="cursor-pointer"
          >
            <BookOpen className="mr-2 h-4 w-4" />
            <span>Library</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => router.push('/account/activity')}
            className="cursor-pointer"
          >
            <Activity className="mr-2 h-4 w-4" />
            <span>Activity</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={signingOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
