'use client';

import { cn, DIMENSIONS } from '@heyclaude/web-runtime/ui';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import type * as React from 'react';

const Separator = ({
  className,
  orientation = 'horizontal',
  decorative = true,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof SeparatorPrimitive.Root>>;
}) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal'
        ? `${DIMENSIONS.DIVIDER} w-full`
        : `h-full ${DIMENSIONS.DIVIDER.replace('h-', 'w-')}`,
      className
    )}
    {...props}
  />
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
