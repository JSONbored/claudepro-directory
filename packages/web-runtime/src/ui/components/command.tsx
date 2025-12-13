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
import { SHADOWS } from '../../design-tokens/index.ts';

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
      'max-w-[640px] w-full p-2',
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
          // Vercel exact pattern: Remove DialogContent padding, CMDK handles its own
          'overflow-hidden p-0',
          // Vercel exact: max-width: 640px
          'max-w-[640px]',
          'w-[95vw] sm:w-full',
          // Vercel exact: border-radius: 12px (rounded-xl)
          'rounded-xl',
          // Vercel exact: border: 1px solid var(--gray6)
          'border border-border',
          // Vercel exact: background (dark mode: rgba(22, 22, 22, 0.7))
          'bg-background',
        )}
        style={{ 
          // Vercel exact: box-shadow: var(--cmdk-shadow)
          // Using semantic shadow token
          boxShadow: SHADOWS.elevation.dark.medium 
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
        // Vercel exact pattern: font-size: 17px, padding: 8px 8px 16px 8px
        'text-[17px]',
        'px-2 py-2 pb-4', // 8px 8px 16px 8px
        'border-b border-border mb-4', // border-bottom + margin-bottom: 16px
        'bg-transparent',
        'text-foreground',
        'outline-none',
        'rounded-none', // border-radius: 0
        'w-full',
        'placeholder:text-muted-foreground',
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
      // Vercel exact pattern:
      // height: 48px, border-radius: 8px, font-size: 14px, padding: 0 16px, gap: 8px
      'h-12', // 48px
      'rounded-lg', // 8px
      'text-sm', // 14px
      'px-4', // 0 16px
      'gap-2', // 8px
      'flex items-center',
      'cursor-pointer',
      'select-none',
      'outline-none',
      // Vercel transitions: transition: all 150ms ease, transition-property: none
      'transition-all duration-150 ease-out',
      // Selected state: background: var(--grayA3), color: var(--gray12)
      'data-[selected=true]:bg-accent/50 data-[selected=true]:text-foreground',
      // Disabled state: color: var(--gray8)
      'data-[disabled=true]:text-muted-foreground data-[disabled=true]:cursor-not-allowed',
      // Active state: transition-property: background, background: var(--gray4)
      'active:transition-[background] active:bg-accent/30',
      // Item spacing: & + [cmdk-item] { margin-top: 4px }
      '[&+&]:mt-1',
      // Icon styling: width: 18px; height: 18px
      '[&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:shrink-0',
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
