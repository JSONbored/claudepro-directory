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
 * Enhanced with Motion.dev (Phase 1.5 - October 2025):
 * - Avatar scale animation on hover
 * - Cascade animations (uses DropdownMenu stagger)
 * - Smooth spring physics
 *
 * @module components/layout/user-menu
 */

import type { User } from '@supabase/supabase-js';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/primitives/avatar';
import { Button } from '@/src/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/primitives/dropdown-menu';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { Activity, BookOpen, LogOut, Settings, User as UserIcon } from '@/src/lib/icons';
import { createClient } from '@/src/lib/supabase/client';
import {
  ANIMATION_CONSTANTS,
  DIMENSIONS,
  POSITION_PATTERNS,
  UI_CLASSES,
} from '@/src/lib/ui-constants';
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
      <div className={`flex items-center ${className}`}>
        <Skeleton size="lg" width="lg" rounded="full" className={UI_CLASSES.ICON_XL} />
      </div>
    );
  }

  // Signed out state - show sign in button
  if (!user) {
    return (
      <div className={className}>
        <Link
          href="/login"
          className={`group relative flex items-center gap-1.5 px-2 py-1 font-medium ${UI_CLASSES.TEXT_XS} ${UI_CLASSES.TEXT_NAV} no-underline ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
          aria-label="Sign in"
        >
          <UserIcon className={UI_CLASSES.ICON_XS} />
          <span className="relative hidden lg:inline">
            Sign In
            <span
              className={`${POSITION_PATTERNS.ABSOLUTE_BOTTOM_LEFT} ${DIMENSIONS.UNDERLINE} w-0 bg-accent ${ANIMATION_CONSTANTS.CSS_TRANSITION_SLOW} group-hover:w-full`}
              aria-hidden="true"
            />
          </span>
        </Link>
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
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={ANIMATION_CONSTANTS.SPRING_DEFAULT}
          >
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full p-0 hover:ring-2 hover:ring-accent/30"
              aria-label={`User menu for ${displayName}`}
            >
              <Avatar className={UI_CLASSES.ICON_XL}>
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || 'User avatar'} />}
                <AvatarFallback className="bg-accent/20 font-semibold text-accent text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={`${DIMENSIONS.DROPDOWN_SM} sm:${DIMENSIONS.DROPDOWN_MD}`}
          align="end"
          forceMount
        >
          {/* User Info */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col">
              <p className="font-medium text-sm leading-none">{displayName}</p>
              <p className="mt-1 text-muted-foreground text-xs leading-none">{user.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation Links */}
          <DropdownMenuItem asChild>
            <Link href="/account/settings">
              <Settings className={UI_CLASSES.ICON_SM_LEADING} />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/account/library">
              <BookOpen className={UI_CLASSES.ICON_SM_LEADING} />
              <span>Library</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/account/activity">
              <Activity className={UI_CLASSES.ICON_SM_LEADING} />
              <span>Activity</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={signingOut}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className={UI_CLASSES.ICON_SM_LEADING} />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
