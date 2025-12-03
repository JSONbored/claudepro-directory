'use client';

/**
 * Sheet Primitives
 * Accessible slide-out panels with drag-to-dismiss gestures
 *
 * Enhanced with Motion.dev (Phase 1.5 - October 2025):
 * - Drag-to-dismiss gestures with spring physics
 * - Velocity-based dismissal (quick swipe to close)
 * - Directional constraints (only drag in dismiss direction)
 * - Snap-back animation if drag insufficient
 * - Respects prefers-reduced-motion
 */

import { animation } from '../../design-system/tokens.ts';
import { X } from '../../icons.tsx';
import { cn } from '../utils.ts';
// Design System imports
import { iconSize } from '../../design-system/styles/icons.ts';
import { stack, gap, padding, display, flexDir, justify, spaceX, height, inset, position, width, responsive } from '../../design-system/styles/layout.ts';
import { bgColor, textColor, textAlign, textAlignResponsive } from '../../design-system/styles/colors.ts';
import { size, weight, muted } from '../../design-system/styles/typography.ts';
import { fixed, absolute } from '../../design-system/styles/position.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow, zLayer, opacityLevel } from '../../design-system/styles/effects.ts';
import { maxWidth } from '../../design-system/styles/layout.ts';
import { transition, hoverOpacity, focusRing } from '../../design-system/styles/interactive.ts';
import { pointerEvents } from '../../design-system/styles/layout.ts';
import { ring } from '../../design-system/styles/effects.ts';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useDragControls } from 'motion/react';
import type * as React from 'react';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay> & {
  ref?: React.RefObject<React.ElementRef<typeof SheetPrimitive.Overlay> | null>;
}) => (
  <SheetPrimitive.Overlay
    className={cn(
      `data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 ${fixed.inset} ${zLayer.modal} ${bgColor.blackOverlay} will-change-opacity data-[state=closed]:animate-out data-[state=open]:animate-in`,
      className
    )}
    {...props}
    ref={ref}
  />
);
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  `${position.fixed} ${zLayer.modal} ${gap.comfortable} ${bgColor.background} ${padding.comfortable} ${shadow.lg} transition ease-in-out will-change-transform contain-paint data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500`,
  {
    variants: {
      side: {
        top: `${inset.x0} ${inset.top0} border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top`,
        bottom:
          `${inset.x0} ${inset.bottom0} border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom`,
        left: `${inset.y0} ${inset.left0} ${height.full} ${width.threeQuarters} border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left ${maxWidth.smSm}`,
        right:
          `${inset.y0} ${inset.right0} ${height.full} ${width.threeQuarters}  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right ${maxWidth.smSm}`,
      },
    },
    defaultVariants: {
      side: 'right',
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

/** Spring animation config from unified config */
const springSmooth = animation.spring.smooth;

const SheetContent = ({
  side = 'right',
  className,
  children,
  ref,
  ...props
}: SheetContentProps & {
  ref?: React.RefObject<React.ElementRef<typeof SheetPrimitive.Content> | null>;
}) => {
  // Drag controls for gesture handling
  const dragControls = useDragControls();

  // Ensure side has a default value for type safety
  const sheetSide = side || 'right';

  // Drag configuration based on side
  const dragConfig = {
    top: {
      drag: 'y' as const,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0, bottom: 0.2 },
    },
    bottom: {
      drag: 'y' as const,
      dragConstraints: { top: 0, bottom: 0 },
      dragElastic: { top: 0.2, bottom: 0 },
    },
    left: {
      drag: 'x' as const,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: { left: 0, right: 0.2 },
    },
    right: {
      drag: 'x' as const,
      dragConstraints: { left: 0, right: 0 },
      dragElastic: { left: 0.2, right: 0 },
    },
  }[sheetSide];

  // Handle drag end - dismiss if dragged far enough or velocity is high
  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }
  ) => {
    const threshold = 150; // pixels
    const velocityThreshold = 500; // pixels per second

    const shouldDismiss =
      (sheetSide === 'right' &&
        (info.offset.x > threshold || info.velocity.x > velocityThreshold)) ||
      (sheetSide === 'left' &&
        (info.offset.x < -threshold || info.velocity.x < -velocityThreshold)) ||
      (sheetSide === 'bottom' &&
        (info.offset.y > threshold || info.velocity.y > velocityThreshold)) ||
      (sheetSide === 'top' && (info.offset.y < -threshold || info.velocity.y < -velocityThreshold));

    if (shouldDismiss) {
      // Trigger close via Radix's context
      const closeButton = document.querySelector('[data-radix-sheet-close]') as HTMLButtonElement;
      closeButton?.click();
    }
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content ref={ref} asChild={true} {...props}>
        <motion.div
          className={cn(sheetVariants({ side: sheetSide }), className)}
          drag={dragConfig.drag}
          dragControls={dragControls}
          dragConstraints={dragConfig.dragConstraints}
          dragElastic={dragConfig.dragElastic}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          transition={springSmooth}
        >
          {children}
          <SheetPrimitive.Close
            data-radix-sheet-close={true}
            className={`${absolute.topRightOffsetXl} ${radius.sm} ${opacityLevel[70]} ${ring.offsetBackground} ${transition.opacity} ${hoverOpacity.full} ${focusRing.default} disabled:${pointerEvents.none} data-[state=open]:${bgColor.secondary}`}
          >
            <X className={iconSize.sm} />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </motion.div>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
};
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(stack.tight, textAlign.center, textAlignResponsive.smLeft, className)}
    {...props}
  />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(`${display.flex} ${flexDir.colReverse} ${responsive.smRow} ${justify.end} ${spaceX.compact}`, className)}
    {...props}
  />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title> & {
  ref?: React.RefObject<React.ElementRef<typeof SheetPrimitive.Title> | null>;
}) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn(`${weight.semibold} ${textColor.foreground} ${size.lg}`, className)}
    {...props}
  />
);
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description> & {
  ref?: React.RefObject<React.ElementRef<typeof SheetPrimitive.Description> | null>;
}) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn(`${muted.default} ${size.sm}`, className)}
    {...props}
  />
);
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
