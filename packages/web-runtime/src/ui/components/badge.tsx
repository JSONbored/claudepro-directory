import { cn } from '../utils.ts';
import { cva, type VariantProps } from 'class-variance-authority';
import { hoverBg, transition } from '../../design-system/styles/interactive.ts';
import { size, weight } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { display, alignItems, padding } from '../../design-system/styles/layout.ts';
import { textColor, bgColor } from '../../design-system/styles/colors.ts';
import type * as React from 'react';

const badgeVariants = cva(
  `${display.inlineFlex} ${alignItems.center} ${radius.full} border ${padding.xBetween} ${padding.yHair} ${size.xs} ${weight.semibold} ${transition.colors} focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`,
  {
    variants: {
      variant: {
        default: `border-transparent ${bgColor.primary} ${textColor.primaryForeground} ${hoverBg.primaryVeryStrong}`,
        secondary:
          `border-transparent ${bgColor.secondary} ${textColor.secondaryForeground} ${hoverBg.secondaryVeryStrong}`,
        destructive:
          `border-transparent ${bgColor.destructive} ${textColor.destructiveForeground} ${hoverBg.destructiveVeryStrong}`,
        outline: textColor.foreground,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
