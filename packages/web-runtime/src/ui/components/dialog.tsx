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

import { X } from '../../icons.tsx';
import { POSITION_PATTERNS, STATE_PATTERNS, UI_CLASSES } from '../constants.ts';
import { cn } from '../utils.ts';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';
import { useCallback, useEffect, useRef } from 'react';

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
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      `${POSITION_PATTERNS.FIXED_INSET} z-[60]`,
      // Vercel's minimal backdrop
      'bg-black/50 backdrop-blur-sm', // Subtle blur
      'data-[state=closed]:animate-out data-[state=open]:animate-in',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=closed]:duration-200 data-[state=open]:duration-300',
      className
    )}
    {...props}
  />
);
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = ({
  className,
  children,
  ref: externalRef,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof DialogPrimitive.Content>>;
}) => {
  // Internal ref to apply transform directly to DOM (bypasses Radix style overrides)
  const internalRef = useRef<React.ElementRef<typeof DialogPrimitive.Content> | null>(null);
  
  // Combine refs: support both internal and external refs
  const combinedRef = useCallback((node: React.ElementRef<typeof DialogPrimitive.Content> | null) => {
    internalRef.current = node;
    if (externalRef) {
      if (typeof externalRef === 'function') {
        externalRef(node);
      } else {
        (externalRef as React.MutableRefObject<React.ElementRef<typeof DialogPrimitive.Content> | null>).current = node;
      }
    }
  }, [externalRef]);
  
  // CRITICAL FIX: Apply transform directly to DOM element after Radix applies its styles
  // This ensures the dialog is centered even if Radix overrides our inline styles
  // Use both useEffect (for initial mount) and a more aggressive observer (for style updates)
  useEffect(() => {
    const element = internalRef.current;
    if (!element) return;
    
    // Apply transform and z-index directly to DOM using setProperty with 'important' flag
    // This overrides Radix's inline styles which are applied via JavaScript
    const applyTransform = () => {
      if (element && element.isConnected) {
        // Use setProperty with 'important' flag to override Radix's styles
        // This is the proper way to set !important styles in JavaScript
        element.style.setProperty('transform', 'translate(-50%, -50%)', 'important');
        element.style.setProperty('top', '50%', 'important');
        element.style.setProperty('left', '50%', 'important');
        // CRITICAL: Ensure z-index is higher than overlay (z-[60]) to appear above blur
        element.style.setProperty('z-index', '100', 'important');
      }
    };
    
    // Apply immediately and repeatedly until it sticks
    applyTransform();
    const immediateInterval = setInterval(applyTransform, 10);
    
    // Clear immediate interval after 500ms (should be enough time for Radix to finish)
    setTimeout(() => {
      clearInterval(immediateInterval);
    }, 500);
    
    // Re-apply on any style changes (Radix may update styles during animations)
    const observer = new MutationObserver(() => {
      applyTransform();
    });
    
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
      attributeOldValue: false,
    });
    
    // Also observe child attribute changes (Radix may update child elements)
    if (element.parentElement) {
      observer.observe(element.parentElement, {
        attributes: true,
        attributeFilter: ['style'],
      });
    }
    
    return () => {
      clearInterval(immediateInterval);
      observer.disconnect();
    };
  }, []);
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={combinedRef}
        className={cn(
          // CRITICAL: Use fixed positioning with proper centering
          // Use !important variants to ensure transform classes aren't overridden by Radix UI
          // CRITICAL: z-index must be higher than overlay (z-[60]) to appear above blur
          'fixed top-[50%] left-[50%] !-translate-x-1/2 !-translate-y-1/2 !z-[100]',
          // Responsive width - prevents edge clipping on mobile
          'w-full max-w-[95vw] sm:max-w-lg',
          // Base styling
          'border bg-background shadow-lg rounded-lg',
          // Padding (default, can be overridden by className prop)
          'p-6',
          // Use data-state for visibility and animations (Radix sets this on Content)
          'data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          className
        )}
        style={{
          // CRITICAL FIX: Use inline styles as fallback to ensure centering works
          // Radix UI may override Tailwind classes, so inline styles ensure proper positioning
          // Note: useEffect above will ensure this is applied even if Radix overrides
          transform: 'translate(-50%, -50%)',
          top: '50%',
          left: '50%',
          // CRITICAL: z-index must be higher than overlay to appear above blur
          zIndex: 100,
          ...props.style,
        }}
        {...props}
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
