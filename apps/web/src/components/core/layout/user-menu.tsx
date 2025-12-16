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
  Skeleton,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  MagneticButton,
  NavigationHoverCard,
  NavigationHoverCardContent,
  NavigationHoverCardTrigger,
  cn,
} from '@heyclaude/web-runtime/ui';
import { optimizeAvatarUrl } from '@heyclaude/web-runtime/utils/optimize-avatar-url';
import { MICROINTERACTIONS, iconSize, padding, marginBottom, paddingBottom, gap, paddingX, paddingY, spaceY, marginTop, paddingTop, weight, size, truncate, muted, tracking, cluster } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const { value: signingOut, setTrue: setSigningOutTrue, setFalse: setSigningOutFalse } = useBoolean();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const { user, status, supabaseClient } = useAuthenticatedUser({
    context: 'UserMenu',
  });
  const loading = status === 'loading';
  const supabase = supabaseClient;

  const handleSignOut = useCallback(async () => {
    setSigningOutTrue();

    try {
      // Use 'local' scope to only sign out from current device
      // Users can sign out from all devices via account settings if needed
      const { error } = await supabase.auth.signOut({ scope: 'local' });

      if (error) {
        // Show error toast with "Retry" button
        toasts.raw.error(`Sign out failed: ${error.message}`, {
          action: {
            label: 'Retry',
            onClick: () => {
              handleSignOut();
            },
          },
        });
      } else {
        toasts.success.signedOut();
        router.push('/');
        router.refresh();
      }
    } catch (error) {
      // Show error toast with "Retry" button
      toasts.raw.error('An unexpected error occurred', {
        action: {
          label: 'Retry',
          onClick: () => {
            handleSignOut();
          },
        },
      });
    } finally {
      setSigningOutFalse();
    }
  }, [supabase, router, setSigningOutTrue, setSigningOutFalse]);

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
        <MagneticButton>
          <Button
            asChild
            variant="default"
            size="sm"
            className={`${weight.semibold} shadow-sm bg-color-newsletter-bg text-color-newsletter-text`}
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
            whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.iconButton.hover}
            whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.iconButton.tap}
            transition={MICROINTERACTIONS.iconButton.transition}
          >
            <Button
              variant="ghost"
              className={`hover:ring-accent/30 relative h-8 w-8 rounded-full ${padding.default} hover:ring-2`}
              aria-label={`User menu for ${displayName}`}
            >
              <Avatar className={iconSize.xl}>
                {avatarUrl ? (
                  <AvatarImage 
                    src={optimizeAvatarUrl(avatarUrl, 32) ?? avatarUrl} 
                    alt={displayName || 'User avatar'} 
                  />
                ) : null}
                <AvatarFallback className={`bg-accent/20 text-accent ${size.sm} ${weight.semibold}`}>
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </motion.div>
        </NavigationHoverCardTrigger>

        <NavigationHoverCardContent align="end" className={`w-72 ${padding.default}`} sideOffset={8}>
          {/* User Header with Avatar */}
          <div className={cn(cluster.compact, marginBottom.default, paddingBottom.default, 'border-b border-border')}>
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage 
                  src={optimizeAvatarUrl(avatarUrl, 48) ?? avatarUrl} 
                  alt={displayName || 'User avatar'} 
                />
              ) : null}
              <AvatarFallback className={`bg-accent/20 text-accent ${size.base} ${weight.semibold}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`${size.sm} ${weight.semibold} ${truncate.single}`}>{displayName}</p>
              <p className={`${size.xs} text-muted-foreground ${truncate.single}`}>{user.email}</p>
            </div>
          </div>

          {/* Dashboard Link */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
            transition={MICROINTERACTIONS.colorTransition.default}
            className={`${marginBottom.compact}`}
          >
            <Link
              href="/account"
              className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
            >
              <User className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
              <span className={`flex-1 ${size.sm} ${weight.medium}`}>Dashboard</span>
            </Link>
          </motion.div>

          {/* My Content Section */}
          <div className={marginBottom.compact}>
            <div className={cn(paddingX.compact, 'py-1.5', marginBottom.tight)}>
              <p className={cn(size['2xs'], weight.semibold, muted.default, 'opacity-70 uppercase', tracking.wide)}>
                My Content
              </p>
            </div>
            <div className={`${spaceY.default}.5`}>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/library"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <BookOpen className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Library</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/bookmarks"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <Bookmark className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Bookmarks</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/submissions"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <Rocket className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Submissions</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/activity"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <Activity className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Activity</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Manage Section */}
          <div className={marginBottom.compact}>
            <div className={cn(paddingX.compact, 'py-1.5', marginBottom.tight)}>
              <p className={cn(size['2xs'], weight.semibold, muted.default, 'opacity-70 uppercase', tracking.wide)}>
                Manage
              </p>
            </div>
            <div className={`${spaceY.default}.5`}>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/companies"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <Building className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Companies</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/jobs"
                  className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
                >
                  <Briefcase className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                  <span className={`flex-1 ${size.sm}`}>Jobs</span>
                </Link>
              </motion.div>
            </div>
          </div>

          <div className={`${marginTop.compact} ${paddingTop.tight} border-t border-border`}>
            <motion.div
              whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
              transition={MICROINTERACTIONS.colorTransition.default}
              className={`${marginBottom.compact}`}
            >
              <Link
                href="/account/settings"
                className={cn(cluster.compact, paddingX.compact, paddingY.tight, 'rounded-md group/item')}
              >
                <Settings className="h-4 w-4 text-muted-foreground group-hover/item:text-accent transition-colors" />
                <span className={`flex-1 ${size.sm}`}>Settings</span>
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
              className={`flex items-center ${gap.compact} ${paddingX.compact} ${paddingY.tight} rounded-md group/item w-full text-left text-destructive`}
            >
              <LogOut className="h-4 w-4 group-hover/item:text-destructive transition-colors" />
              <span className={`flex-1 ${size.sm}`}>{signingOut ? 'Signing out...' : 'Sign out'}</span>
            </motion.button>
          </div>
        </NavigationHoverCardContent>
      </NavigationHoverCard>
    </div>
  );
}
