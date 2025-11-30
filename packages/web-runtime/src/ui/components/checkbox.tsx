'use client';

import { Check } from '../../icons.tsx';
import { cn } from '../utils.ts';
// Design System imports
import { iconSize } from '../../design-system/styles/icons.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type * as React from 'react';

const Checkbox = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof CheckboxPrimitive.Root>>;
}) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      `peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background ${focusRing.default} disabled:opacity-50 disabled:cursor-not-allowed data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`,
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <Check className={iconSize.sm} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
