import { cn } from '../utils.ts';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { size } from '../../design-system/styles/typography.ts';
import type * as React from 'react';

const labelVariants = cva(
  `${size.sm} font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`
);

const Label = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    ref?: React.RefObject<React.ElementRef<typeof LabelPrimitive.Root> | null>;
  }) => <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />;
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
