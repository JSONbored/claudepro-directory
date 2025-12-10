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

import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import {
  Activity,
  Bookmark,
  BookOpen,
  Briefcase,
  Building,
  LogOut,
  Rocket,
  Settings,
  User,
} from '@heyclaude/web-runtime/icons';
import {
  toasts,
  UI_CLASSES,
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  MagneticButton,
  NavigationHoverCard,
  NavigationHoverCardContent,
  NavigationHoverCardTrigger,
  MICROINTERACTIONS,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const { user, status, supabaseClient } = useAuthenticatedUser({
    context: 'UserMenu',
  });
  const loading = status === 'loading';
  const supabase = supabaseClient;

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
        <Skeleton size="lg" width="lg" rounded="full" className={UI_CLASSES.ICON_XL} />
      </div>
    );
  }

  // Signed out state - show sign in button
  if (!user) {
    return (
      <div className={className}>
        <MagneticButton>
          <Button
            asChild
            variant="default"
            size="sm"
            className="font-semibold shadow-sm"
            style={{ backgroundColor: '#F6F8F4', color: '#141816' }}
          >
            <Link href="/login" aria-label="Get started - Sign in with GitHub">
              <span>Get Started</span>
            </Link>
          </Button>
        </MagneticButton>
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
      <NavigationHoverCard openDelay={150} closeDelay={300}>
        <NavigationHoverCardTrigger asChild>
          <motion.div
            whileHover={MICROINTERACTIONS.iconButton.hover}
            whileTap={MICROINTERACTIONS.iconButton.tap}
            transition={MICROINTERACTIONS.iconButton.transition}
          >
            <Button
              variant="ghost"
              className="hover:ring-accent/30 relative h-8 w-8 rounded-full p-0 hover:ring-2"
              aria-label={`User menu for ${displayName}`}
            >
              <Avatar className={UI_CLASSES.ICON_XL}>
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName || 'User avatar'} />
                ) : null}
                <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </motion.div>
        </NavigationHoverCardTrigger>

        <NavigationHoverCardContent align="end" className="w-72 p-4" sideOffset={8}>
          {/* User Header with Avatar */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName || 'User avatar'} />
              ) : null}
              <AvatarFallback className="bg-accent/20 text-accent text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* Dashboard Link */}
          <motion.div
            whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
            transition={MICROINTERACTIONS.colorTransition.default}
            className="mb-2"
          >
            <Link
              href="/account"
              className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
            >
              <User className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
              <span className="flex-1 text-sm font-medium">Dashboard</span>
            </Link>
          </motion.div>

          {/* My Content Section */}
          <div className="mb-2">
            <div className="px-3 py-1.5 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                My Content
              </p>
            </div>
            <div className="space-y-0.5">
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/library"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Library</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/bookmarks"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <Bookmark className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Bookmarks</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/submissions"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <Rocket className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Submissions</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/activity"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <Activity className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Activity</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Manage Section */}
          <div className="mb-2">
            <div className="px-3 py-1.5 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Manage
              </p>
            </div>
            <div className="space-y-0.5">
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/companies"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <Building className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Companies</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/jobs"
                  className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className="flex-1 text-sm">Jobs</span>
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-border">
            <motion.div
              whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
              transition={MICROINTERACTIONS.colorTransition.default}
              className="mb-2"
            >
              <Link
                href="/account/settings"
                className="flex items-center gap-3 px-3 py-2 rounded-md group/item"
              >
                <Settings className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                <span className="flex-1 text-sm">Settings</span>
              </Link>
            </motion.div>

            <motion.button
              onClick={handleSignOut}
              disabled={signingOut}
              {...(signingOut
                ? {}
                : {
                    whileHover: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                  })}
              transition={MICROINTERACTIONS.colorTransition.default}
              className="flex items-center gap-3 px-3 py-2 rounded-md group/item w-full text-left text-destructive"
            >
              <LogOut className="h-4 w-4 group-hover/item:text-destructive transition-colors" />
              <span className="flex-1 text-sm">{signingOut ? 'Signing out...' : 'Sign out'}</span>
            </motion.button>
          </div>
        </NavigationHoverCardContent>
      </NavigationHoverCard>
    </div>
  );
}
