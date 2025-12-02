'use client';

import { cn } from '../utils.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import { iconSize } from '../../design-system/styles/icons.ts';
import { componentSize } from '../../design-system/styles/layout.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import type * as React from 'react';

const Switch = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  ref?: React.Ref<React.ElementRef<typeof SwitchPrimitives.Root>>;
}) => (
  <SwitchPrimitives.Root
    className={cn(
      `peer inline-flex ${componentSize.switch} shrink-0 cursor-pointer items-center ${radius.full} border-2 border-transparent transition-colors ${focusRing.default} focus-visible:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`,
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        `pointer-events-none block ${iconSize.md} ${radius.full} bg-background ${shadow.lg} ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0`
      )}
    />
  </SwitchPrimitives.Root>
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
