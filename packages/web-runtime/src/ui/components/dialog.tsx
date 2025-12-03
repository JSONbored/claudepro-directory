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

import { animation } from '../../design-system/tokens.ts';
import { X } from '../../icons.tsx';
import { cn } from '../utils.ts';
// Design System imports
import { iconSize } from '../../design-system/styles/icons.ts';
import { heading, body } from '../../design-system/styles/typography.ts';
import { fixed, absolute } from '../../design-system/styles/position.ts';
import { gap, padding, display, flexDir, displayResponsive, flexDirResponsive, justifyResponsive, spaceXResponsive, width, pointerEvents } from '../../design-system/styles/layout.ts';
import { focusRing, transition } from '../../design-system/styles/interactive.ts';
import { radius, radiusResponsive } from '../../design-system/styles/radius.ts';
import { shadow, zLayer, opacityLevel, backdrop } from '../../design-system/styles/effects.ts';
import { maxWidth } from '../../design-system/styles/layout.ts';
import { bgColor } from '../../design-system/styles/colors.ts';
import { textAlign, textAlignResponsive } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import { muted, leading, tracking } from '../../design-system/styles/typography.ts';
import { spaceY } from '../../design-system/styles/layout.ts';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { motion } from 'motion/react';
import type * as React from 'react';

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
        `${fixed.inset} ${zLayer.modal} ${bgColor.blackOverlay} ${backdrop.sm}`,
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

/** Spring animation config from unified config */
const springSmooth = animation.spring.smooth;

const DialogContent = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof DialogPrimitive.Content> | null>;
}) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content ref={ref} asChild={true} {...props}>
        <motion.div
          className={cn(
            `${fixed.center} ${zLayer.modal} ${display.grid} ${width.full} ${maxWidth.lg} ${gap.comfortable} ${border.default} ${bgColor.background} ${padding.comfortable} ${shadow.lg} ${radiusResponsive.smLg}`,
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
              absolute.topRightOffsetXl,
              `${radius.sm} ${opacityLevel[70]} ring-offset-background ${transition.opacity} hover:opacity-100`,
              focusRing.offset,
              `disabled:${opacityLevel[50]} disabled:${pointerEvents.none}`,
              `data-[state=open]:${bgColor.accent} data-[state=open]:${muted.default}`
            )}
          >
            <X className={iconSize.sm} />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
};
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn(`${spaceY.snug} ${textAlign.center} ${textAlignResponsive.smLeft}`, className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(`${display.flex} ${flexDir.colReverse} ${displayResponsive.smFlex} ${flexDirResponsive.smRow} ${justifyResponsive.smEnd} ${spaceXResponsive.smCompact}`, className)}
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
    className={cn(heading.h5, leading.none, tracking.tight, className)}
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
    className={cn(body.sm, muted.default, className)}
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
