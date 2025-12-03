'use client';

import { Check, ChevronDown, ChevronUp } from '../../icons.tsx';
import { iconSize } from '../../design-system/styles/icons.ts';
import { absolute } from '../../design-system/styles/position.ts';
import { focusRing, hoverBg } from '../../design-system/styles/interactive.ts';
import { minWidth, padding, display, alignItems, justify, paddingTop, paddingBottom, marginY, marginX, height, width, paddingRight, paddingLeft, position, userSelect, maxHeight, overflow } from '../../design-system/styles/layout.ts';
import { size, muted, weight } from '../../design-system/styles/typography.ts';
import { bgColor, textColor, borderColor } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow, zLayer, opacityLevel } from '../../design-system/styles/effects.ts';
import { cursor } from '../../design-system/styles/interactive.ts';
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
      `${display.flex} ${height.input} ${width.full} ${alignItems.center} ${justify.between} ${radius.md} border ${borderColor.input} ${bgColor.background} ${padding.xCompact} ${padding.yCompact} ${size.sm} ring-offset-background placeholder:${muted.default} ${focusRing.outline} disabled:${opacityLevel[50]} disabled:${cursor.notAllowed} [&>span]:line-clamp-1`,
      error && 'border-destructive focus:ring-destructive',
      className
    )}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={errorId || undefined}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild={true}>
      <ChevronDown className={`${iconSize.sm} ${opacityLevel[50]}`} aria-hidden="true" />
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
    className={cn(`${display.flex} ${cursor.default} ${alignItems.center} ${justify.center} ${paddingTop.tight} ${paddingBottom.tight}`, className)}
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
    className={cn(`${display.flex} ${cursor.default} ${alignItems.center} ${justify.center} ${paddingTop.tight} ${paddingBottom.tight}`, className)}
    {...props}
  >
    <ChevronDown className={iconSize.sm} />
  </SelectPrimitive.ScrollDownButton>
);
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = ({
  className,
  children,
  position: contentPosition = 'popper',
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof SelectPrimitive.Content> | null>;
}) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        `data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${position.relative} ${zLayer.modal} ${maxHeight[96]} ${minWidth.button} ${overflow.hidden} ${radius.md} ${border.default} ${bgColor.popover} ${textColor.popoverForeground} ${shadow.md} data-[state=closed]:animate-out data-[state=open]:animate-in`,
        contentPosition === 'popper' &&
          'data-[side=left]:-translate-x-1 data-[side=top]:-translate-y-1 data-[side=right]:translate-x-1 data-[side=bottom]:translate-y-1',
        className
      )}
      position={contentPosition}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          padding.micro,
          contentPosition === 'popper' &&
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
    className={cn(`${padding.ySnug} ${paddingRight.compact} ${paddingLeft.loose} ${weight.semibold} ${size.sm}`, className)}
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
      `${position.relative} ${display.flex} ${width.full} ${cursor.default} ${userSelect.none} ${alignItems.center} ${radius.sm} ${padding.ySnug} ${paddingRight.compact} ${paddingLeft.loose} ${size.sm} outline-none ${hoverBg.default} hover:${textColor.accent} data-disabled:pointer-events-none data-disabled:${opacityLevel[50]}`,
      className
    )}
    {...props}
  >
    <span
      className={`${absolute.leftIcon} ${display.flex} ${iconSize.xsPlus} ${alignItems.center} ${justify.center}`}
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
    className={cn(`${marginX.neg1} ${marginY.tight} ${height.px} ${bgColor.muted}`, className)}
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
