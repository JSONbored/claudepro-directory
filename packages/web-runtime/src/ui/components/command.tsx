'use client';

/**
 * Command Component - Premium CMDK with Motion.dev Animations
 *
 * Beautiful, modern command palette with:
 * - Premium 3D modal entrance animations (scale + slide)
 * - Backdrop blur with fade
 * - Staggered item animations
 * - Smooth microinteractions
 * - Vercel/Linear/Raycast quality
 */

import { cn } from '../utils.ts';
import type { DialogProps } from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import type * as React from 'react';
import { logClientWarn } from '@heyclaude/web-runtime/logging/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './dialog.tsx';

const Command = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive>>;
}) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      // Vercel exact pattern: max-width: 640px, padding: 8px, border-radius: 12px
      // CRITICAL: Width is constrained by parent DialogContent, so just use w-full
      'w-full p-2',
      'rounded-xl', // 12px = rounded-xl
      'overflow-hidden',
      'bg-background text-foreground',
      'border border-border', // 1px solid var(--gray6)
      'outline-none',
      className
    )}
    {...props}
  />
);
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, open, onOpenChange, ...props }: DialogProps) => {
  // CRITICAL FIX: Do NOT return null when closed
  // Radix UI Dialog needs to be in the DOM to manage portal, overlay, and animations
  // Radix UI will handle showing/hiding based on the `open` prop internally

  // Defensive check: Ensure children are defined
  if (!children) {
    logClientWarn(
      '[CommandDialog] children is not defined',
      undefined,
      'CommandDialog.missingChildren',
      {
        component: 'CommandDialog',
        action: 'missing-children-check',
        category: 'navigation',
      }
    );
    return null;
  }

  // Build dialog props - ensure open is boolean (Radix UI requires this)
  const dialogProps: DialogProps = {
    ...props,
    open: open === true, // Ensure boolean
  };
  if (onOpenChange) {
    dialogProps.onOpenChange = onOpenChange;
  }

  return (
    <Dialog {...dialogProps}>
      <DialogContent
        className={cn(
          // Premium command palette design - modern, beautiful, perfectly centered
          'overflow-hidden p-0',
          // CRITICAL FIX: Responsive width - never full width, always constrained
          // Mobile: viewport minus safe padding (1rem each side), Desktop: fixed 640px
          'w-[calc(100vw-2rem)] sm:w-[640px]',
          'max-w-[640px]', // Never exceed 640px on any breakpoint
          'rounded-2xl', // Slightly larger radius for premium feel
          'border border-border/80',
          'bg-background/95 backdrop-blur-xl', // Glass morphism effect
          'shadow-2xl', // Premium shadow
          // CRITICAL: Ensure proper centering - Dialog component handles this, but add explicit classes
          '!fixed !top-[50%] !left-[50%] !right-auto !bottom-auto !-translate-x-1/2 !-translate-y-1/2 !z-[100] !m-0',
        )}
        style={{ 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          // CRITICAL: Inline styles as fallback for centering (Dialog component should handle this, but ensure it works)
          position: 'fixed',
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          transform: 'translate(-50%, -50%)',
          margin: '0',
          zIndex: 100,
          // Width is handled by className with responsive utilities
        }}
      >
        <DialogTitle className="sr-only">Command Menu</DialogTitle>
        <DialogDescription className="sr-only">
          Type a command or search for items using the keyboard
        </DialogDescription>
        <Command
          className={cn(
            // Vercel exact pattern from SCSS
            // Group spacing: *:not([hidden]) + [cmdk-group] { margin-top: 8px }
            '[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:mt-2',
            // Icon sizing: width: 18px; height: 18px
            '[&_[cmdk-item]_svg]:w-[18px] [&_[cmdk-item]_svg]:h-[18px]'
          )}
        >
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Input>>;
}) => {
  return (
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        // Premium input design - clean, modern
        'text-base', // Slightly larger for better readability
        'px-4 py-3 pb-4',
        'border-b border-border/60 mb-4',
        'bg-transparent',
        'text-foreground',
        'outline-none',
        'rounded-none',
        'w-full',
        'placeholder:text-muted-foreground/70',
        'focus:border-border focus:placeholder:text-muted-foreground',
        'transition-colors duration-200',
        className
      )}
      {...props}
    />
  );
};

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.List>>;
}) => {
  return (
    <CommandPrimitive.List
      ref={ref}
      className={cn(
        // Vercel exact pattern: height: min(330px, calc(var(--cmdk-list-height))), max-height: 400px
        'h-[min(330px,var(--cmdk-list-height,auto))]',
        'max-h-[400px]',
        'overflow-y-auto overflow-x-hidden',
        'overscroll-contain',
        'transition-[height] duration-100 ease-out',
        className
      )}
      {...props}
    />
  );
};

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Empty>>;
}) => (
  <CommandPrimitive.Empty
    ref={ref}
    className={cn(
      // Vercel exact pattern: font-size: 14px, height: 48px
      'text-sm',
      'h-12',
      'flex items-center justify-center',
      'whitespace-pre-wrap',
      'text-muted-foreground',
    )}
    {...props}
  />
);

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Group>>;
}) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      'overflow-hidden text-foreground',
      // Vercel exact pattern: Group heading - font-size: 12px, padding: 0 8px, margin-bottom: 8px
      '[&_[cmdk-group-heading]]:text-xs',
      '[&_[cmdk-group-heading]]:px-2', // 0 8px
      '[&_[cmdk-group-heading]]:mb-2', // margin-bottom: 8px
      '[&_[cmdk-group-heading]]:select-none',
      '[&_[cmdk-group-heading]]:flex',
      '[&_[cmdk-group-heading]]:items-center',
      '[&_[cmdk-group-heading]]:text-muted-foreground',
      className
    )}
    {...props}
  />
);

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Separator>>;
}) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(
      // Vercel exact pattern: height: 1px, background: var(--gray5), margin: 4px 0
      'h-px',
      'bg-border',
      'my-1', // margin: 4px 0
      'w-full',
      className
    )}
    {...props}
  />
);
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Item>>;
}) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      // Premium command item design - beautiful, modern
      'h-11', // Slightly smaller for better density
      'rounded-lg',
      'text-sm',
      'px-3', // Tighter padding
      'gap-2.5',
      'flex items-center',
      'cursor-pointer',
      'select-none',
      'outline-none',
      'transition-all duration-200 ease-out',
      // Premium selected state with subtle glow
      'data-[selected=true]:bg-accent/60 data-[selected=true]:text-foreground',
      'data-[selected=true]:shadow-sm',
      // Disabled state
      'data-[disabled=true]:text-muted-foreground/50 data-[disabled=true]:cursor-not-allowed',
      // Active state with smooth transition
      'active:bg-accent/40 active:transition-colors',
      // Item spacing
      '[&+&]:mt-0.5',
      // Icon styling
      '[&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
      'data-[selected=true]:[&_svg]:text-foreground',
      className
    )}
    {...props}
  />
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn('ml-auto text-muted-foreground text-xs tracking-widest', className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = 'CommandShortcut';

// Export Command component (renamed to avoid conflict with Command icon from icons.tsx)
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
