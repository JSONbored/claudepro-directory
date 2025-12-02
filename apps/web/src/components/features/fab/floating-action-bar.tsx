'use client';

/**
 * Enhanced Floating Action Bar with Speed Dial Menu
 *
 * Features:
 * - Always visible (no scroll-to-hide)
 * - Backdrop overlay when expanded
 * - Close on outside click
 * - Keyboard shortcut (F key to toggle)
 * - Pulse animation on first visit
 * - Mobile bottom bar layout
 * - Context-aware actions (detail pages)
 */

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import {
  animate,
  backdrop,
  bgColor,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  shadow,
  shadowColor,
  size,
  stack,
  textColor,
  weight,
  zLayer,
  squareSize,
} from '@heyclaude/web-runtime/design-system';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePinboardDrawer } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';
import { createDetailPageActions, createMainFABConfig, createSpeedDialActions } from './fab-config';
import { SpeedDialItem } from './speed-dial-item';

interface FloatingActionBarProps {
  /** Feature flags controlling which FAB actions to show */
  fabFlags: {
    showSubmit: boolean;
    showSearch: boolean;
    showScrollToTop: boolean;
    showNotifications: boolean;
    showPinboard: boolean;
  };
}

const FIRST_VISIT_KEY = 'fab_seen';

export function FloatingActionBar({ fabFlags }: FloatingActionBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const { openDrawer: openPinboardDrawer } = usePinboardDrawer();

  // Notification state
  const { unreadCount, openSheet: openNotificationSheet, flags } = useNotificationsContext();

  // Copy to clipboard hook for context actions
  const { copy: copyToClipboard } = useCopyToClipboard();

  // Check if on a detail page (for context-aware actions)
  // Pattern: /category/slug (e.g., /mcp/heyclaude-mcp)
  const isDetailPage = /^\/[^/]+\/[^/]+$/.test(pathname) && !pathname.startsWith('/api/');

  // Check for first visit to show pulse animation
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    try {
      const hasSeen = localStorage.getItem(FIRST_VISIT_KEY);
      if (!hasSeen) {
        setShowPulse(true);
        // Stop pulse after 5 seconds
        timer = setTimeout(() => {
          setShowPulse(false);
          localStorage.setItem(FIRST_VISIT_KEY, 'true');
        }, 5000);
      }
    } catch {
      // localStorage not available
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    // Small delay to prevent immediate close on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isExpanded]);

  // Keyboard shortcut (F key to toggle)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // F key or ? key to toggle FAB
      if (event.key === 'f' || event.key === 'F' || event.key === '?') {
        event.preventDefault();
        setIsExpanded((prev) => !prev);
      }

      // Escape to close
      if (event.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  // Main FAB config (Create button)
  const mainFAB = createMainFABConfig(() => {
    try {
      setIsExpanded(false);
      router.push('/submit');
    } catch (error) {
      const normalized = normalizeError(error, '[FloatingActionBar] Error navigating to /submit');
      logger.error('[FloatingActionBar] Error navigating to /submit', normalized);
    }
  });

  // Speed dial actions config
  const speedDialActions = createSpeedDialActions(
    unreadCount,
    () => {
      try {
        setIsExpanded(false);
        openNotificationSheet();
      } catch (error) {
        const normalized = normalizeError(
          error,
          '[FloatingActionBar] Error opening notification sheet'
        );
        logger.error('[FloatingActionBar] Error opening notification sheet', normalized);
      }
    },
    () => {
      try {
        setIsExpanded(false);
        router.push('/submit');
      } catch (error) {
        const normalized = normalizeError(error, '[FloatingActionBar] Error navigating to /submit');
        logger.error('[FloatingActionBar] Error navigating to /submit', normalized);
      }
    },
    () => {
      try {
        setIsExpanded(false);
        openPinboardDrawer();
      } catch (error) {
        const normalized = normalizeError(
          error,
          '[FloatingActionBar] Error opening pinboard drawer'
        );
        logger.error('[FloatingActionBar] Error opening pinboard drawer', normalized);
      }
    },
    {
      ...fabFlags,
      showNotifications: fabFlags.showNotifications && flags.enableFab,
    }
  );

  // Context-aware actions for detail pages
  const detailPageActions = isDetailPage
    ? createDetailPageActions(
        // Copy link handler
        async () => {
          try {
            const url = window.location.href;
            await copyToClipboard(url);
            toasts.raw.success('Link copied!', {
              description: 'Paste anywhere to share this page.',
            });
            setIsExpanded(false);
          } catch (error) {
            const normalized = normalizeError(error, '[FAB] Error copying link');
            logger.warn('[Clipboard] Copy link failed', {
              err: normalized,
              category: 'clipboard',
              component: 'FloatingActionBar',
              recoverable: true,
              userRetryable: true,
            });
          }
        },
        // Share handler
        async () => {
          try {
            const url = window.location.href;
            const title = document.title;
            
            if (navigator.share) {
              await navigator.share({ title, url });
              toasts.raw.success('Shared!', {
                description: 'Link sent via the share sheet.',
              });
            } else {
              await copyToClipboard(url);
              toasts.raw.success('Link copied!', {
                description: 'Native share unavailable, link copied instead.',
              });
            }
            setIsExpanded(false);
          } catch (error) {
            // User cancelled share - not an error
            if (error instanceof DOMException && error.name === 'AbortError') {
              return;
            }
            const normalized = normalizeError(error, '[FAB] Error sharing');
            logger.error('[FAB] Error sharing', normalized);
          }
        }
      )
    : [];

  // Combine context-aware actions with standard actions
  const allActions = [...detailPageActions, ...speedDialActions];

  // Filter speed dial actions based on `show` property
  const visibleActions = allActions.filter((action) => action.show !== false);

  // Toggle speed dial expansion
  const toggleExpanded = useCallback(() => {
    try {
      setIsExpanded((prev) => !prev);
      // Stop pulse on first interaction
      if (showPulse) {
        setShowPulse(false);
        try {
          localStorage.setItem(FIRST_VISIT_KEY, 'true');
        } catch {
          // localStorage not available
        }
      }
    } catch (error) {
      const normalized = normalizeError(error, '[FloatingActionBar] Error toggling expansion');
      logger.error('[FloatingActionBar] Error toggling expansion', normalized);
    }
  }, [showPulse]);

  // Main FAB icon component
  const MainIcon = mainFAB.icon;

  return (
    <>
      {/* Backdrop overlay when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 ${zLayer.overlay} bg-background/60 ${backdrop.sm}`}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div
        ref={fabRef}
        className={cn(
          `fixed ${zLayer.modal}`,
          // Desktop: Bottom right corner
          'right-6 bottom-6',
          // Mobile: Full-width bottom bar when expanded
          'max-md:right-0 max-md:bottom-0 max-md:left-0',
          isExpanded && 'max-md:px-4 max-md:pb-4'
        )}
      >
        {/* Speed Dial Items (expand upward on desktop) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                marginBottom.compact, stack.compact,
                // Mobile: Horizontal row above main button
                `max-md:${marginBottom.tight} max-md:flex-row max-md:flex-wrap max-md:justify-center max-md:${gap.compact}`,
                // Mobile expanded: card background
                `max-md:${radius['2xl']} max-md:bg-card/95 max-md:${padding.compact} max-md:${shadow.lg} max-md:backdrop-blur-md`
              )}
            >
              {visibleActions.map((action, index) => (
                <SpeedDialItem
                  key={action.id}
                  {...action}
                  delay={index * 0.05}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <div className={`flex ${justify.end} max-md:justify-center`}>
          <motion.button
            onClick={toggleExpanded}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 17,
            }}
            className={cn(
              `relative flex ${squareSize.touch2xl} ${alignItems.center} ${justify.center} ${radius.full}`,
              `bg-accent ${textColor.accentForeground}`,
              `${shadowColor.accent} ${shadow.lg}`,
              'backdrop-blur-md will-change-transform',
              'hover:bg-accent/90',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background',
              // Pulse animation for first visit
              showPulse && animate.pulse
            )}
            aria-label={isExpanded ? 'Close quick actions (press F or Escape)' : 'Open quick actions (press F)'}
            aria-expanded={isExpanded}
            type="button"
          >
            {/* Main FAB Icon with rotation animation when expanded */}
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
              }}
            >
              <MainIcon className={iconSize.lg} aria-hidden="true" />
            </motion.div>

            {/* Notification badge */}
            {unreadCount > 0 && !isExpanded && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 20,
                }}
                className={`-right-1 -top-1 absolute flex h-5 min-w-5 ${alignItems.center} ${justify.center} ${radius.full} bg-destructive ${padding.xMicro} ${weight.bold} ${size['2xs']} ${textColor.destructive}-foreground ${shadow.md}`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}

            {/* Pulse ring animation */}
            {showPulse && (
              <span className={`absolute inset-0 animate-ping ${radius.full} bg-accent/40`} />
            )}
          </motion.button>
        </div>

        {/* Keyboard hint (desktop only, when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`${marginTop.compact} text-center ${muted.default} ${size.xs} max-md:hidden`}
            >
              Press <kbd className={`rounded ${bgColor.muted} ${padding.xSnug} ${padding.yHair} font-mono ${size['2xs']}`}>F</kbd> or{' '}
              <kbd className={`rounded ${bgColor.muted} ${padding.xSnug} ${padding.yHair} font-mono ${size['2xs']}`}>Esc</kbd> to close
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
