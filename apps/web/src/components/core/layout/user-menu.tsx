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
  BarChart,
  Bookmark,
  BookOpen,
  Briefcase,
  Building,
  DollarSign,
  FileText,
  HelpCircle,
  LogOut,
  Plug,
  Rocket,
  Settings,
  Shield,
  SlidersHorizontal,
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
import { MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';

interface UserMenuProps {
  className?: string;
}

export function UserMenu({ className }: UserMenuProps) {
  const {
    value: signingOut,
    setTrue: setSigningOutTrue,
    setFalse: setSigningOutFalse,
  } = useBoolean();
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
        <Skeleton size="lg" width="lg" rounded="full" className="h-8 w-8" />
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
            className="bg-color-newsletter-bg text-color-newsletter-text font-semibold shadow-sm"
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
              className="hover:ring-accent/30 relative h-8 w-8 rounded-full p-4 hover:ring-2"
              aria-label={`User menu for ${displayName}`}
            >
              <Avatar className="h-8 w-8">
                {avatarUrl ? (
                  <AvatarImage
                    src={optimizeAvatarUrl(avatarUrl, 32) ?? avatarUrl}
                    alt={displayName || 'User avatar'}
                  />
                ) : null}
                <AvatarFallback className="bg-accent/20 text-accent text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </motion.div>
        </NavigationHoverCardTrigger>

        <NavigationHoverCardContent align="end" className="w-[calc(100vw-2rem)] max-w-72 p-4 sm:w-72" sideOffset={8}>
          {/* User Header with Avatar */}
          <div className={cn('flex items-center gap-2', 'mb-4', 'pb-4', 'border-border border-b')}>
            <Avatar className="h-12 w-12">
              {avatarUrl ? (
                <AvatarImage
                  src={optimizeAvatarUrl(avatarUrl, 48) ?? avatarUrl}
                  alt={displayName || 'User avatar'}
                />
              ) : null}
              <AvatarFallback className="bg-accent/20 text-accent text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </div>

          {/* Dashboard Link */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
            transition={MICROINTERACTIONS.colorTransition.default}
            className="mb-2"
          >
            <Link
              href="/account"
              className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
            >
              <User className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
              <span className="flex-1 text-sm font-medium">Dashboard</span>
            </Link>
          </motion.div>

          {/* My Content Section */}
          <div className="mb-2">
            <div className={cn('px-3', 'py-1.5', 'mb-1')}>
              <p
                className={cn(
                  'text-[10px]',
                  'font-semibold',
                  'text-muted-foreground',
                  'uppercase opacity-70',
                  'tracking-wide'
                )}
              >
                My Content
              </p>
            </div>
            <div className="space-y-3.5">
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/library"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <BookOpen className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Library</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/bookmarks"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Bookmark className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Bookmarks</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/submissions"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Rocket className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Submissions</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/activity"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Activity className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Activity</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Manage Section */}
          <div className="mb-2">
            <div className={cn('px-3', 'py-1.5', 'mb-1')}>
              <p
                className={cn(
                  'text-[10px]',
                  'font-semibold',
                  'text-muted-foreground',
                  'uppercase opacity-70',
                  'tracking-wide'
                )}
              >
                Manage
              </p>
            </div>
            <div className="space-y-3.5">
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/companies"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Building className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Companies</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/jobs"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Briefcase className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Jobs</span>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Settings & Account Section */}
          <div className="mb-2">
            <div className={cn('px-3', 'py-1.5', 'mb-1')}>
              <p
                className={cn(
                  'text-[10px]',
                  'font-semibold',
                  'text-muted-foreground',
                  'uppercase opacity-70',
                  'tracking-wide'
                )}
              >
                Settings & Account
              </p>
            </div>
            <div className="space-y-3.5">
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/settings"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Settings className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Settings</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/settings/security"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Shield className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Security</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/settings/preferences"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <SlidersHorizontal className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Preferences</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/data"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <FileText className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Data & Privacy</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/billing"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <DollarSign className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Billing</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/analytics"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <BarChart className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Analytics</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/integrations"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <Plug className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Integrations</span>
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.05)' }}
                transition={MICROINTERACTIONS.colorTransition.default}
              >
                <Link
                  href="/account/support"
                  className={cn('flex items-center gap-2', 'px-3', 'py-2', 'group/item rounded-md')}
                >
                  <HelpCircle className="text-muted-foreground group-hover/item:text-accent h-4 w-4 transition-colors" />
                  <span className="flex-1 text-sm">Support</span>
                </Link>
              </motion.div>
            </div>
          </div>

          <div className="border-border mt-2 border-t pt-2">
            <motion.button
              onClick={handleSignOut}
              disabled={signingOut}
              {...(signingOut
                ? {}
                : {
                    whileHover: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                  })}
              transition={MICROINTERACTIONS.colorTransition.default}
              className="group/item text-destructive flex w-full items-center gap-2 rounded-md px-3 py-2 text-left"
            >
              <LogOut className="group-hover/item:text-destructive h-4 w-4 transition-colors" />
              <span className="flex-1 text-sm">{signingOut ? 'Signing out...' : 'Sign out'}</span>
            </motion.button>
          </div>
        </NavigationHoverCardContent>
      </NavigationHoverCard>
    </div>
  );
}
