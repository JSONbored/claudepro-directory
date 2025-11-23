'use client';

import { cn, STATE_PATTERNS } from '@heyclaude/web-runtime';
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
      `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${STATE_PATTERNS.FOCUS_RING} focus-visible:ring-offset-background ${STATE_PATTERNS.DISABLED_CURSOR} data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`,
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
      )}
    />
  </SwitchPrimitives.Root>
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
