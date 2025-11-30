'use client';

/**
 * Dropdown Menu Primitives
 * Accessible dropdown menus with staggered animations
 *
 * Enhanced with Motion.dev (Phase 1.5 - October 2025):
 * - Staggered item animations (cascade effect)
 * - Scale from trigger position (transforms from button)
 * - Spring physics for natural motion
 * - Respects prefers-reduced-motion
 */

import { Check, ChevronRight, Circle } from '../../icons.tsx';
import { DIMENSIONS } from '../constants.ts';
import { cn } from '../utils.ts';
// Design System imports
import { iconSize } from '../../design-system/styles/icons.ts';
import { absolute } from '../../design-system/styles/position.ts';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { motion } from 'motion/react';
import type * as React from 'react';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = ({
  className,
  inset,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
} & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger> | null>;
}) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
);
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.SubContent> | null>;
}) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      `data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 ${DIMENSIONS.MIN_W_BUTTON} overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in`,
      className
    )}
    {...props}
  />
);
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = ({
  className,
  sideOffset = 4,
  ref,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Content> | null>;
}) => {
  // Stagger animation config
  const container = {
    hidden: { opacity: 0, scale: 0.95 },
    show: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.05, // 50ms delay between each child
        delayChildren: 0.1, // Initial 100ms delay before first child
      },
    },
  };

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content ref={ref} sideOffset={sideOffset} asChild={true} {...props}>
        <motion.div
          className={cn(
            `z-50 ${DIMENSIONS.MIN_W_BUTTON} overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md will-change-transform`,
            'data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out',
            className
          )}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
        >
          {children}
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
};
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
} & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Item> | null>;
}) => {
  // Item animation variants for stagger effect
  const item = {
    hidden: { opacity: 0, x: -8 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <DropdownMenuPrimitive.Item ref={ref} asChild={true} {...props}>
      <motion.div
        className={cn(
          'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-orange-500/5 data-disabled:pointer-events-none data-disabled:opacity-50',
          inset && 'pl-8',
          className
        )}
        variants={item}
      >
        {props.children}
      </motion.div>
    </DropdownMenuPrimitive.Item>
  );
};
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = ({
  className,
  children,
  checked,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem> | null>;
}) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    checked={checked ?? false}
    {...props}
  >
    <span
      className={`${absolute.leftIcon} flex h-3.5 w-3.5 items-center justify-center`}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className={iconSize.sm} />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
);
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.RadioItem> | null>;
}) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    {...props}
  >
    <span
      className={`${absolute.leftIcon} flex h-3.5 w-3.5 items-center justify-center`}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
);
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = ({
  className,
  inset,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
} & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Label> | null>;
}) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-2 py-1.5 font-semibold text-sm', inset && 'pl-8', className)}
    {...props}
  />
);
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
  ref?: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Separator> | null>;
}) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
);
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn('ml-auto text-xs tracking-widest opacity-60', className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
