'use client';

/**
 * Dialog Component
 * Centered modal dialog built on Radix UI Dialog primitive with Motion.dev animations
 * Used for modals, confirmations, and centered overlays
 *
 * Features:
 * - Motion.dev entry/exit animations (Phase 1.4 - October 2025)
 * - Spring physics for natural feel
 * - Backdrop blur with fade animation
 * - Content scale + slide with spring easing
 * - Automatic prefers-reduced-motion support
 */

import { logger } from '../../entries/core.ts';
import { getAnimationConfig } from '../../config/client-defaults.ts';
import { X } from '../../icons.tsx';
import { POSITION_PATTERNS, STATE_PATTERNS, UI_CLASSES } from '../constants.ts';
import { cn } from '../utils.ts';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useEffect, useState } from 'react';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
  ref?: React.RefObject<React.ElementRef<typeof DialogPrimitive.Overlay> | null>;
}) => (
  <DialogPrimitive.Overlay ref={ref} asChild={true} {...props}>
    <motion.div
      className={cn(
        `${POSITION_PATTERNS.FIXED_INSET} z-50 bg-black/80 backdrop-blur-sm`,
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    />
  </DialogPrimitive.Overlay>
);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof DialogPrimitive.Content> | null>;
}) => {
  const [springSmooth, setSpringSmooth] = useState({
    type: 'spring' as const,
    stiffness: 300,
    damping: 25,
  });

  useEffect(() => {
    getAnimationConfig()
      .then((result) => {
        if (!result) return;
        const config = result;
        setSpringSmooth({
          type: 'spring' as const,
          stiffness: config['animation.spring.smooth.stiffness'],
          damping: config['animation.spring.smooth.damping'],
        });
      })
      .catch((error) => {
        logger.warn('[Animation] Failed to load config', {
          err: error,
          category: 'animation',
          component: 'DialogContent',
          recoverable: true,
        });
      });
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} asChild={true} {...props}>
        <motion.div
          className={cn(
            `${POSITION_PATTERNS.FIXED_CENTER} z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg`,
            className
          )}
          initial={{ opacity: 0, scale: 0.95, y: '-48%' }}
          animate={{ opacity: 1, scale: 1, y: '-50%' }}
          exit={{ opacity: 0, scale: 0.95, y: '-48%' }}
          transition={springSmooth}
        >
          {children}
          <DialogPrimitive.Close
            className={cn(
              POSITION_PATTERNS.ABSOLUTE_TOP_RIGHT_OFFSET_XL,
              'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100',
              STATE_PATTERNS.FOCUS_RING_OFFSET,
              STATE_PATTERNS.DISABLED_STANDARD,
              'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
            )}
          >
            <X className={UI_CLASSES.ICON_SM} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> & {
  ref?: React.RefObject<React.ElementRef<typeof DialogPrimitive.Title> | null>;
}) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(UI_CLASSES.HEADING_H5, 'leading-none tracking-tight', className)}
    {...props}
  />
);
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> & {
  ref?: React.RefObject<React.ElementRef<typeof DialogPrimitive.Description> | null>;
}) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(UI_CLASSES.TEXT_BODY_SM, 'text-muted-foreground', className)}
    {...props}
  />
);
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
