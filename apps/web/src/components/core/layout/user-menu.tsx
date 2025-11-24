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

import { logger } from '@heyclaude/web-runtime/core';
import { getAnimationConfig } from '@heyclaude/web-runtime/data';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  Activity,
  BookOpen,
  LogOut,
  Settings,
  User as UserIcon,
} from '@heyclaude/web-runtime/icons';
import { DIMENSIONS, toasts, UI_CLASSES } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/primitives/ui/avatar';
import { Button } from '@/src/components/primitives/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/primitives/ui/dropdown-menu';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [springDefault, setSpringDefault] = useState({
    type: 'spring' as const,
    stiffness: 400,
    damping: 17,
  });
  const router = useRouter();
  const { user, status, supabaseClient } = useAuthenticatedUser({
    context: 'UserMenu',
  });
  const loading = status === 'loading';
  const supabase = supabaseClient;

  useEffect(() => {
    getAnimationConfig()
      .then((result) => {
        if (!result) return;
        const config = result;
        setSpringDefault({
          type: 'spring' as const,
          stiffness: config['animation.spring.default.stiffness'],
          damping: config['animation.spring.default.damping'],
        });
      })
      .catch((error) => {
        logger.error('UserMenu: failed to load animation config', error);
      });
  }, []);

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
        <Button
          asChild={true}
          variant="ghost"
          size="sm"
          className="border-accent/20 bg-accent/10 font-medium text-accent text-xs hover:bg-accent hover:text-white"
        >
          <Link href="/login" aria-label="Get started - Sign in with GitHub">
            <UserIcon className={UI_CLASSES.ICON_XS_LEADING} />
            <span className="hidden lg:inline">Get Started</span>
          </Link>
        </Button>
      </div>
    );
  }

  // Signed in state - show user avatar and dropdown
  const userMetadata = user.user_metadata;
  const displayName =
    userMetadata?.['name'] || userMetadata?.['full_name'] || user.email?.split('@')[0];
  const avatarUrl = userMetadata?.['avatar_url'] || userMetadata?.['picture'];
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
        <DropdownMenuTrigger asChild={true}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={springDefault}
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
          forceMount={true}
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
          <DropdownMenuItem asChild={true}>
            <Link href="/account/settings">
              <Settings className={UI_CLASSES.ICON_SM_LEADING} />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild={true}>
            <Link href="/account/library">
              <BookOpen className={UI_CLASSES.ICON_SM_LEADING} />
              <span>Library</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild={true}>
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
