'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type * as React from 'react';
import { Check } from '@/src/lib/icons';
import { STATE_PATTERNS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

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
      `peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_CURSOR} data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`,
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <Check className={UI_CLASSES.ICON_SM} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
