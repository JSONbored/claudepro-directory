'use client';

/**
 * Pinboard Drawer - Premium Motion.dev Animated Drawer
 *
 * Beautiful, modern pinboard with:
 * - Smooth slide-in animations with spring physics
 * - Staggered item animations
 * - Premium card hover effects
 * - Vercel/Linear/Raycast quality
 */

import { formatRelativeDate } from '@heyclaude/web-runtime/data/utils';
import { usePinboard } from '@heyclaude/web-runtime/hooks';
import { BookmarkMinus, BookmarkPlus } from '@heyclaude/web-runtime/icons';
import { logClientInfo, logClientWarn } from '@heyclaude/web-runtime/logging/client';
import {
  UI_CLASSES,
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  cn,
} from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, MICROINTERACTIONS } from '@heyclaude/web-runtime/design-system';
import { SHADOWS } from '@heyclaude/web-runtime/design-tokens';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import Link from 'next/link';
import { useEffect } from 'react';

export interface PinboardDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function PinboardDrawer({ open, onOpenChange }: PinboardDrawerProps) {
  // CRITICAL FIX: All hooks must be called unconditionally - NEVER return early before hooks
  // This prevents React's "Expected static flag was missing" error
  const { pinnedItems, isLoaded, unpinItem, clearAll } = usePinboard();
  const hasPins = pinnedItems.length > 0;
  const shouldReduceMotion = useReducedMotion();

  // CRITICAL: Ensure open is explicitly boolean (Radix UI requires this)
  const isOpen = open === true;

  // Log drawer state for debugging (only when open)
  useEffect(() => {
    if (!open) return;
    
    logClientInfo(
      '[PinboardDrawer] Render',
      'PinboardDrawer.render',
      {
        component: 'PinboardDrawer',
        action: 'render',
        category: 'navigation',
        open,
        isOpen,
        isLoaded,
        pinnedItemsCount: pinnedItems.length,
        hasOnOpenChange: Boolean(onOpenChange),
      }
    );
  }, [open, isOpen, isLoaded, pinnedItems.length, onOpenChange]);

  // Defensive check: Ensure onOpenChange is provided
  if (!onOpenChange) {
    logClientWarn(
      '[PinboardDrawer] onOpenChange is required',
      undefined,
      'PinboardDrawer.missingOnOpenChange',
      {
        component: 'PinboardDrawer',
        action: 'missing-prop-check',
        category: 'navigation',
      }
    );
    // Return Sheet with open=false instead of null to maintain hook consistency
    return <Sheet open={false} onOpenChange={() => {}}><SheetContent side="right" /></Sheet>;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={cn(
          // Modern drawer pattern - similar to Vercel/Raycast side panels
          'w-full sm:max-w-[400px]',
          'overflow-y-auto',
          // Clean borders and rounded corners
          'rounded-l-xl', // 12px border-radius
          'border-l border-border',
          'bg-background',
        )}
        style={{ boxShadow: SHADOWS.elevation.dark.medium }}
      >
        <SheetHeader className={cn('mb-6 pb-4 border-b border-border/50')}>
          <SheetTitle className={cn('flex items-center gap-2 text-left text-lg font-semibold')}>
            <BookmarkPlus className={UI_CLASSES.ICON_SM_LEADING} />
            Pinned
          </SheetTitle>
          <SheetDescription className={cn('text-left text-sm text-muted-foreground mt-1')}>
            Your saved items for quick access
          </SheetDescription>
        </SheetHeader>

        {/* Compact header with count and clear action */}
        <div className={cn('flex items-center justify-between mb-4 text-xs text-muted-foreground')}>
          <span className={cn('font-medium')}>
            {hasPins ? `${pinnedItems.length} item${pinnedItems.length !== 1 ? 's' : ''}` : 'Empty'}
          </span>
          {hasPins ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAll}
              className={cn('text-xs h-7 px-2 hover:text-destructive')}
            >
              Clear all
            </Button>
          ) : null}
        </div>

        {/* Content area with compact spacing - Beautiful, modern design with staggered animations */}
        <div className={cn('space-y-3')}>
          {!isLoaded && (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={SPRING.smooth}
              className={cn('rounded-md border border-dashed border-border/60 p-3 space-y-2')}
            >
              <div className={cn('h-3 w-2/3 animate-pulse rounded bg-muted/60')} />
              <div className={cn('h-2.5 w-5/6 animate-pulse rounded bg-muted/40')} />
              <div className={cn('h-2.5 w-1/2 animate-pulse rounded bg-muted/30')} />
            </motion.div>
          )}

          {isLoaded && hasPins ? (
            <motion.ul 
              className={cn('space-y-2')}
              style={{ perspective: '1000px' }}
            >
              <AnimatePresence mode="popLayout">
                {pinnedItems.map((item, index) => (
                  <motion.li
                    key={`${item.category}-${item.slug}`}
                    initial={shouldReduceMotion ? {} : { opacity: 0, x: 32, scale: 0.95 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1, x: 0, scale: 1 }}
                    exit={shouldReduceMotion ? {} : { opacity: 0, x: 32, scale: 0.95 }}
                    transition={{
                      ...SPRING.smooth,
                      delay: index * STAGGER.tight, // Staggered entrance
                    }}
                    whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.card.hover}
                    whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.card.tap}
                    style={{ transformStyle: 'preserve-3d' }}
                    className={cn(
                      // Modern card pattern - clean, minimal
                      'rounded-lg', // 8px border-radius (matches Vercel items)
                      'border border-border',
                      'p-4', // 16px padding (comfortable spacing)
                      'bg-background',
                      'group',
                      'cursor-pointer',
                      'hover:bg-accent/50',
                      'transition-colors duration-150 ease-out', // Vercel's 150ms ease
                    )}
                  >
                    <div className={cn('flex items-start justify-between gap-3')}>
                      <div className={cn('flex-1 min-w-0')}>
                        <div className={cn('flex items-center gap-1.5 mb-1')}>
                          <p className={cn('text-xs text-muted-foreground uppercase tracking-wide truncate')}>
                            {item.category}
                            {item.typeName ? ` • ${item.typeName}` : ''}
                          </p>
                        </div>
                        <Link
                          href={`/${item.category}/${item.slug}`}
                          className={cn(
                            'block font-medium text-sm',
                            'hover:text-accent transition-colors duration-200',
                            'truncate mb-1'
                          )}
                          onClick={() => onOpenChange(false)}
                        >
                          {item.title}
                        </Link>
                        {item.description ? (
                          <p className={cn('text-muted-foreground text-xs line-clamp-1 mb-1')}>
                            {item.description}
                          </p>
                        ) : null}
                        <p className={cn('text-muted-foreground text-xs')}>
                          {formatRelativeDate(item.pinnedAt, { style: 'simple' })}
                        </p>
                      </div>
                      <motion.div
                        whileHover={shouldReduceMotion ? {} : MICROINTERACTIONS.button.hover}
                        whileTap={shouldReduceMotion ? {} : MICROINTERACTIONS.button.tap}
                        transition={MICROINTERACTIONS.button.transition}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => unpinItem(item.category, item.slug)}
                          aria-label={`Unpin ${item.title}`}
                          className={cn('h-7 w-7 flex-shrink-0', 'opacity-0 group-hover:opacity-100 transition-opacity duration-200')}
                        >
                          <BookmarkMinus className={cn('h-3.5 w-3.5')} />
                        </Button>
                      </motion.div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : null}

          {isLoaded && !hasPins ? (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, scale: 1 }}
              transition={SPRING.smooth}
              className={cn('rounded-md border border-dashed border-border/60 p-6 text-center')}
            >
              <p className={cn('font-medium mb-2')}>Nothing pinned yet</p>
              <p className={cn('text-muted-foreground text-sm')}>
                Pin items from detail pages to build your shortlist.
              </p>
            </motion.div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
