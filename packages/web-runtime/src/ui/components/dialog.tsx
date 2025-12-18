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
import { cn } from '../utils.ts';
import { useScrollLock } from '../../hooks/use-scroll-lock.ts';
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
      'fixed inset-0 z-[60]',
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
  
  // Scroll lock: Lock body scroll when dialog is open
  // Use manual control to sync with Radix's open state via data-state attribute
  const { lock, unlock } = useScrollLock({ autoLock: false });
  
  // Monitor data-state attribute to sync scroll lock with dialog open state
  useEffect(() => {
    const element = internalRef.current;
    if (!element) return;
    
    // Check initial state
    const isOpen = element.getAttribute('data-state') === 'open';
    if (isOpen) {
      lock();
    } else {
      unlock();
    }
    
    // Watch for state changes
    const observer = new MutationObserver(() => {
      const currentState = element.getAttribute('data-state');
      if (currentState === 'open') {
        lock();
      } else if (currentState === 'closed') {
        unlock();
      }
    });
    
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    });
    
    return () => {
      observer.disconnect();
      unlock(); // Ensure unlock on unmount
    };
  }, [lock, unlock]);
  
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
        element.style.setProperty('right', 'auto', 'important');
        element.style.setProperty('bottom', 'auto', 'important');
        element.style.setProperty('margin', '0', 'important');
        // CRITICAL: Ensure z-index is higher than overlay (z-[60]) to appear above blur
        element.style.setProperty('z-index', '100', 'important');
        element.style.setProperty('position', 'fixed', 'important');
      }
    };
    
    // Apply immediately and repeatedly until it sticks
    applyTransform();
    const immediateInterval = setInterval(applyTransform, 10);
    
    // Keep applying for longer (2 seconds) to ensure it sticks through all Radix animations
    setTimeout(() => {
      clearInterval(immediateInterval);
    }, 2000);
    
    // Re-apply on any style changes (Radix may update styles during animations)
    const observer = new MutationObserver(() => {
      applyTransform();
    });
    
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      attributeOldValue: false,
    });
    
    // Also observe child attribute changes (Radix may update child elements)
    if (element.parentElement) {
      observer.observe(element.parentElement, {
        attributes: true,
        attributeFilter: ['style', 'class'],
      });
    }
    
    // Watch for any style mutations on the element itself
    const styleObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          applyTransform();
        }
      }
    });
    
    styleObserver.observe(element, {
      attributes: true,
      attributeFilter: ['style'],
    });
    
    return () => {
      clearInterval(immediateInterval);
      observer.disconnect();
      styleObserver.disconnect();
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
          '!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !-translate-x-1/2 !-translate-y-1/2 !z-[100] !m-0',
          // CRITICAL FIX: Responsive width - never full width, always properly constrained
          // Mobile: viewport minus safe padding (1rem each side)
          // Desktop: auto width with max-width constraint (can be overridden by className prop for specific dialogs like command palette)
          'w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg',
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
          position: 'fixed',
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          margin: '0',
          // CRITICAL: z-index must be higher than overlay to appear above blur
          zIndex: 100,
          // Width is handled by className with responsive utilities and CSS
          ...props.style,
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className={cn(
            'absolute top-4 right-4',
            'rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:pointer-events-none',
            'data-[state=open]:bg-accent data-[state=open]:text-muted-foreground'
          )}
        >
          <X className="h-4 w-4" />
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
    className={cn('text-lg font-semibold leading-none tracking-tight', className)}
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
    className={cn('text-sm leading-normal text-muted-foreground', className)}
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
