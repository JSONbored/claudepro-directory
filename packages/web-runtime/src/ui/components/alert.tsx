import { cn } from '../utils.ts';
import { padding, paddingLeft, marginBottom, position, width } from '../../design-system/styles/layout.ts';
import { size, weight, leading, tracking } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { bgColor, textColor, borderColor } from '../../design-system/styles/colors.ts';
import { absolute } from '../../design-system/styles/position.ts';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';

const alertVariants = cva(
  `${position.relative} ${width.full} ${radius.lg} border ${padding.default} [&>svg~*]:${paddingLeft.relaxed} [&>svg+div]:translate-y-[-3px] [&>svg]:${absolute.topLeftOffsetXl} [&>svg]:${textColor.foreground}`,
  {
    variants: {
      variant: {
        default: `${bgColor.background} ${textColor.foreground}`,
        destructive:
          `${borderColor['destructive/50']} ${textColor.destructive} dark:${borderColor.destructive} [&>svg]:${textColor.destructive}`,
        warning:
          `${borderColor.orange200} ${bgColor.orange50} ${textColor.orange900} dark:${borderColor['orange200/20']} dark:${bgColor['orange950/30']} dark:${textColor.orange200} [&>svg]:${textColor.orange600} dark:[&>svg]:${textColor.orange400}`,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const Alert = ({
  className,
  variant,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    ref?: React.RefObject<HTMLDivElement | null>;
  }) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
);
Alert.displayName = 'Alert';

const AlertTitle = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => (
  <h5
    ref={ref}
    className={cn(`${marginBottom.tight} ${weight.medium} ${leading.none} ${tracking.tight}`, className)}
    {...props}
  />
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => <div ref={ref} className={cn(`${size.sm} [&_p]:${leading.relaxed}`, className)} {...props} />;
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
