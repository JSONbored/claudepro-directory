/**
 * Card Components
 *
 * shadcn/ui card primitives for consistent card layouts
 */

import { cn } from '../../ui/utils.ts';
// Design System imports
import { stack, gap, grid, display, alignItems, padding, paddingBottom, paddingTop, self, rowSpan, colStart, rowStart, justifySelf, gridAutoRows, gridTemplateRows } from '../../design-system/styles/layout.ts';
import { size, weight, muted, leading } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
import { bgColor, textColor } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import type * as React from 'react';
import { memo } from 'react';

const Card = memo(function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        stack.loose,
        `${radius.xl} ${border.default} ${bgColor.card} ${padding.yRelaxed} ${textColor.cardForeground} ${shadow.sm}`,
        className
      )}
      {...props}
    />
  );
});

const CardHeader = memo(function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        `@container/card-header ${grid.base} ${gridAutoRows.min} ${gridTemplateRows.autoAuto} ${alignItems.start} ${gap.compact} ${padding.xRelaxed} has-data-[slot=card-action]:${grid.cardHeader} [.border-b]:${paddingBottom.relaxed}`,
        className
      )}
      {...props}
    />
  );
});

type CardTitleProps = React.ComponentProps<'div'> & {
  /**
   * The HTML element to render as (default: 'div')
   * Use 'h1', 'h2', 'h3', etc. for semantic heading hierarchy
   * @example <CardTitle as="h2">Title</CardTitle>
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
};

const CardTitle = memo(function CardTitle({
  className,
  as: Component = 'div',
  ...props
}: CardTitleProps) {
  return (
    <Component
      data-slot="card-title"
      className={cn(`${weight.semibold} ${leading.none}`, className)}
      {...props}
    />
  );
});

const CardDescription = memo(function CardDescription({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(`${muted.default} ${size.sm}`, className)}
      {...props}
    />
  );
});

const CardAction = memo(function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(`${colStart['2']} ${rowSpan['2']} ${rowStart['1']} ${self.start} ${justifySelf.end}`, className)}
      {...props}
    />
  );
});

const CardContent = memo(function CardContent({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn(padding.xRelaxed, className)} {...props} />;
});

const CardFooter = memo(function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(`${display.flex} ${alignItems.center} ${padding.xRelaxed} [.border-t]:${paddingTop.relaxed}`, className)}
      {...props}
    />
  );
});

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
