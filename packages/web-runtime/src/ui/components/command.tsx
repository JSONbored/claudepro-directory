'use client';

import { Search } from '../../icons.tsx';
import { cn } from '../utils.ts';
import { maxHeight, gap, padding, paddingLeft, paddingTop, display, flexDir, alignItems, overflow, position, marginRight, width, height, marginLeft, flexGrow, marginX } from '../../design-system/styles/layout.ts';
import { iconSize } from '../../design-system/styles/icons.ts';
import { size, weight, muted, tracking } from '../../design-system/styles/typography.ts';
import { bgColor, textColor, textAlign } from '../../design-system/styles/colors.ts';
import { borderBottom } from '../../design-system/styles/borders.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import { cursor } from '../../design-system/styles/interactive.ts';
import { userSelect, pointerEvents } from '../../design-system/styles/layout.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
import type { DialogProps } from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Command as CommandPrimitive } from 'cmdk';
import type * as React from 'react';
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
      `${display.flex} ${height.full} ${width.full} ${flexDir.col} ${overflow.hidden} ${radius.md} ${bgColor.popover} ${textColor.popoverForeground}`,
      className
    )}
    {...props}
  />
);
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className={`${overflow.hidden} ${padding.none} ${shadow.lg}`}>
        <VisuallyHidden>
          <DialogTitle>Command Menu</DialogTitle>
          <DialogDescription>
            Type a command or search for items using the keyboard
          </DialogDescription>
        </VisuallyHidden>
        <Command className={`[&_[cmdk-group]:not([hidden])_~[cmdk-group]]:${paddingTop.none} [&_[cmdk-input-wrapper]_svg]:${iconSize.sm} [&_[cmdk-input-wrapper]_svg]:${iconSize.sm} [&_[cmdk-item]_svg]:${iconSize.sm} [&_[cmdk-item]_svg]:${iconSize.sm} **:[[cmdk-group-heading]]:${padding.xTight} **:[[cmdk-group-heading]]:${weight.medium} **:[[cmdk-group-heading]]:${muted.default} **:[[cmdk-group]]:${padding.xTight} **:[[cmdk-input]]:${height.search} **:[[cmdk-item]]:${padding.xTight} **:[[cmdk-item]]:${padding.yDefault}`}>
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
  <div className={`${display.flex} ${alignItems.center} ${borderBottom.default} ${paddingLeft.default}`} cmdk-input-wrapper="">
    <Search className={`${marginRight.compact} ${iconSize.sm} ${flexGrow.shrink0} ${opacityLevel[50]}`} />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        `${display.flex} ${height.buttonLg} ${width.full} ${radius.md} ${bgColor.transparent} ${padding.yCompact} ${size.sm} outline-none placeholder:${muted.default} disabled:cursor-not-allowed disabled:${opacityLevel[50]}`,
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
    className={cn(`${maxHeight.dropdown} ${overflow.yAuto} ${overflow.xHidden}`, className)}
    {...props}
  />
);

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty> & {
  ref?: React.Ref<React.ElementRef<typeof CommandPrimitive.Empty>>;
}) => <CommandPrimitive.Empty ref={ref} className={`${padding.yComfortable} ${textAlign.center} ${size.sm}`} {...props} />;

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
      `${overflow.hidden} ${padding.micro} ${textColor.foreground} **:[[cmdk-group-heading]]:${padding.xTight} **:[[cmdk-group-heading]]:${padding.ySnug} **:[[cmdk-group-heading]]:${weight.medium} **:[[cmdk-group-heading]]:${muted.default} **:[[cmdk-group-heading]]:${size.xs}`,
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
    className={cn(`${marginX.neg1} ${height.px} ${bgColor.border}`, className)}
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
        `${position.relative} ${display.flex} ${cursor.default} ${userSelect.none} ${alignItems.center} ${gap.compact} ${radius.sm} ${paddingLeft.compact} ${padding.ySnug} ${size.sm} outline-none data-[disabled=true]:${pointerEvents.none} data-[selected='true']:${bgColor.accent} data-[selected=true]:${textColor.accentForeground} data-[disabled=true]:${opacityLevel[50]} [&_svg]:${pointerEvents.none} [&_svg]:size-4 [&_svg]:${flexGrow.shrink0}`,
      className
    )}
    {...props}
  />
);

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(`${marginLeft.auto} ${muted.default} ${size.xs} ${tracking.widest}`, className)}
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
