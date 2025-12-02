'use client';

import { Check, ChevronDown, ChevronUp } from '../../icons.tsx';
import { iconSize } from '../../design-system/styles/icons.ts';
import { absolute } from '../../design-system/styles/position.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import { minWidth, padding } from '../../design-system/styles/layout.ts';
import { size } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
import { cn } from '../utils.ts';
import * as SelectPrimitive from '@radix-ui/react-select';
import type * as React from 'react';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

export interface SelectTriggerProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>, 'ref'> {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Trigger> | null>;
  error?: boolean;
  errorId?: string;
}

const SelectTrigger = ({
  className,
  children,
  ref,
  error,
  errorId,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Trigger> | null>;
  error?: boolean;
  errorId?: string;
}) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      `flex h-10 w-full items-center justify-between ${radius.md} border border-input bg-background px-3 py-2 ${size.sm} ring-offset-background placeholder:text-muted-foreground ${focusRing.outline} disabled:opacity-50 disabled:cursor-not-allowed [&>span]:line-clamp-1`,
      error && 'border-destructive focus:ring-destructive',
      className
    )}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={errorId || undefined}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild={true}>
      <ChevronDown className={`${iconSize.sm} opacity-50`} aria-hidden="true" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.ScrollUpButton> | null>;
}) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className={iconSize.sm} />
  </SelectPrimitive.ScrollUpButton>
);
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.ScrollDownButton> | null>;
}) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className={iconSize.sm} />
  </SelectPrimitive.ScrollDownButton>
);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = ({
  className,
  children,
  position = 'popper',
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Content> | null>;
}) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        `data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 ${minWidth.button} overflow-hidden ${radius.md} border bg-popover text-popover-foreground ${shadow.md} data-[state=closed]:animate-out data-[state=open]:animate-in`,
        position === 'popper' &&
          'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          padding.micro,
          position === 'popper' &&
            'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Label> | null>;
}) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(`py-1.5 pr-2 pl-8 font-semibold ${size.sm}`, className)}
    {...props}
  />
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Item> | null>;
}) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      `relative flex w-full cursor-default select-none items-center ${radius.sm} py-1.5 pr-2 pl-8 ${size.sm} outline-none hover:bg-accent/10 hover:text-accent data-disabled:pointer-events-none data-disabled:opacity-50`,
      className
    )}
    {...props}
  >
    <span
      className={`${absolute.leftIcon} flex h-3.5 w-3.5 items-center justify-center`}
    >
      <SelectPrimitive.ItemIndicator>
        <Check className={iconSize.sm} />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Separator> | null>;
}) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
