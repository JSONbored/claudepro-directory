'use client';

import { cn } from '../utils.ts';
import { height, width, flexGrow } from '../../design-system/styles/layout.ts';
import { borderColor } from '../../design-system/styles/colors.ts';
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
      `${flexGrow.shrink0} ${borderColor.border}`,
      orientation === 'horizontal'
        ? `${height.divider} ${width.full}`
        : `${height.full} w-[1px]`,
      className
    )}
    {...props}
  />
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
