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

import { getAnimationConfig } from '@heyclaude/web-runtime/data';
import { iconSize, iconLeading, marginTop, muted, weight ,size , padding } from '@heyclaude/web-runtime/design-system';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  Activity,
  BookOpen,
  LogOut,
  Settings,
  User as UserIcon,
} from '@heyclaude/web-runtime/icons';
import { DIMENSIONS, toasts } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import { Avatar, AvatarFallback, AvatarImage } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@heyclaude/web-runtime/ui';

interface UserMenuProps {
  className?: string;
}

/**
 * Renders an authentication-aware user menu: a loading skeleton while auth is pending, a "Get Started" sign-in prompt when no user is authenticated, or an avatar-triggered dropdown with account links and sign-out when a user is present.
 *
 * The component also handles the sign-out flow (scoped to the current device) and disables the sign-out control while the operation is in progress.
 *
 * @param className - Optional container className to apply to the root element
 * @returns The user menu UI element (JSX) appropriate for the current authentication state
 *
 * @see useAuthenticatedUser
 * @see toasts
 * @see getAnimationConfig
 */
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
    const config = getAnimationConfig();
    setSpringDefault({
      type: 'spring' as const,
      stiffness: config['animation.spring.default.stiffness'],
      damping: config['animation.spring.default.damping'],
    });
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);

    try {
      // Use 'local' scope to only sign out from current device
      // Users can sign out from all devices via account settings if needed
      const { error } = await supabase.auth.signOut({ scope: 'local' });

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
        <Skeleton size="lg" width="lg" rounded="full" className={iconSize.xl} />
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
          className={`border-accent/20 bg-accent/10 ${weight.medium} text-accent ${size.xs} hover:bg-accent hover:text-white`}
        >
          <Link href="/login" aria-label="Get started - Sign in with GitHub">
            <UserIcon className={iconLeading.xs} />
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
              className={`relative h-8 w-8 rounded-full ${padding.none} hover:ring-2 hover:ring-accent/30`}
              aria-label={`User menu for ${displayName}`}
            >
              <Avatar className={iconSize.xl}>
                {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || 'User avatar'} />}
                <AvatarFallback className={`bg-accent/20 ${weight.semibold} text-accent ${size.sm}`}>
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
              <p className={`${weight.medium} ${size.sm} leading-none`}>{displayName}</p>
              <p className={`${marginTop.tight} ${muted.default} ${size.xs} leading-none`}>{user.email}</p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Navigation Links */}
          <DropdownMenuItem asChild={true}>
            <Link href="/account/settings">
              <Settings className={iconLeading.sm} />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild={true}>
            <Link href="/account/library">
              <BookOpen className={iconLeading.sm} />
              <span>Library</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild={true}>
            <Link href="/account/activity">
              <Activity className={iconLeading.sm} />
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
            <LogOut className={iconLeading.sm} />
            <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}