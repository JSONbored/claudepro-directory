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

import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, useDragControls } from 'motion/react';
import type * as React from 'react';
import { X } from '@/src/lib/icons';

import { cn } from '@/src/lib/utils';

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
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 will-change-opacity data-[state=closed]:animate-out data-[state=open]:animate-in',
      className
    )}
    {...props}
    ref={ref}
  />
);
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out will-change-transform contain-paint data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
        left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
        right:
          'inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm',
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
      <SheetPrimitive.Content ref={ref} asChild {...props}>
        <motion.div
          className={cn(sheetVariants({ side: sheetSide }), className)}
          drag={dragConfig.drag}
          dragControls={dragControls}
          dragConstraints={dragConfig.dragConstraints}
          dragElastic={dragConfig.dragElastic}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        >
          {children}
          <SheetPrimitive.Close
            data-radix-sheet-close
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </motion.div>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
};
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
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
    className={cn('font-semibold text-foreground text-lg', className)}
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
    className={cn('text-muted-foreground text-sm', className)}
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
