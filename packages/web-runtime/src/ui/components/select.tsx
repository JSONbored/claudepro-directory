'use client';

import { Check, ChevronDown, ChevronUp } from '../../icons.tsx';
import {
  DIMENSIONS,
  POSITION_PATTERNS,
  STATE_PATTERNS,
  UI_CLASSES,
} from '../constants.ts';
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
      `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground ${STATE_PATTERNS.FOCUS_OUTLINE} ${STATE_PATTERNS.DISABLED_CURSOR} [&>span]:line-clamp-1`,
      error && 'border-destructive focus:ring-destructive',
      className
    )}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={errorId || undefined}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild={true}>
      <ChevronDown className={`${UI_CLASSES.ICON_SM} opacity-50`} aria-hidden="true" />
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
    <ChevronUp className={UI_CLASSES.ICON_SM} />
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
    <ChevronDown className={UI_CLASSES.ICON_SM} />
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
        `data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-96 ${DIMENSIONS.MIN_W_BUTTON} overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=open]:animate-in`,
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
          'p-1',
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
    className={cn('py-1.5 pr-2 pl-8 font-semibold text-sm', className)}
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
      `relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none ${STATE_PATTERNS.HOVER_BG_DEFAULT} ${STATE_PATTERNS.HOVER_TEXT_ACCENT} data-disabled:pointer-events-none data-disabled:opacity-50`,
      className
    )}
    {...props}
  >
    <span
      className={`${POSITION_PATTERNS.ABSOLUTE_LEFT_ICON} flex h-3.5 w-3.5 items-center justify-center`}
    >
      <SelectPrimitive.ItemIndicator>
        <Check className={UI_CLASSES.ICON_SM} />
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
