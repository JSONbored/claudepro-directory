'use client';

import { Search } from '../../icons.tsx';
import { cn } from '../utils.ts';
import { DIMENSIONS } from '../constants.ts';
import type { DialogProps } from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Command as CommandPrimitive } from 'cmdk';
import type * as React from 'react';
import { useEffect } from 'react';
import { logClientInfo } from '@heyclaude/web-runtime/logging/client';
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
      'flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground',
      className
    )}
    {...props}
  />
);
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, open, onOpenChange, ...props }: DialogProps) => {
  // DEBUG: Log command dialog state
  useEffect(() => {
    logClientInfo(
      '[CommandDialog] State changed',
      'CommandDialog.stateChange',
      {
        component: 'CommandDialog',
        action: 'state-change',
        category: 'navigation',
        open: open ?? false,
        hasOnOpenChange: Boolean(onOpenChange),
      }
    );
  }, [open, onOpenChange]);

  // CRITICAL: Ensure open is explicitly boolean (Radix UI requires this)
  const isOpen = open === true;

  // Build dialog props - only include onOpenChange if provided (exactOptionalPropertyTypes)
  const dialogProps: DialogProps = {
    ...props,
    open: isOpen,
  };
  if (onOpenChange) {
    dialogProps.onOpenChange = onOpenChange;
  }

  return (
    <Dialog {...dialogProps}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
          <DialogDescription>
            Type a command or search for items using the keyboard
          </DialogDescription>
        </VisuallyHidden>
        <Command className="[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group]]:px-2 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3">
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
}) => (
  <div className={'flex items-center border-b px-3'} cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  </div>
);

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.List> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.List>>;
}) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(`${DIMENSIONS.DROPDOWN_MAX} overflow-y-auto overflow-x-hidden`, className)}
    {...props}
  />
);

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Empty>>;
}) => <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />;

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
      'overflow-hidden p-1 text-foreground **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground **:[[cmdk-group-heading]]:text-xs',
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
    className={cn('-mx-1 h-px bg-border', className)}
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
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected='true']:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
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
