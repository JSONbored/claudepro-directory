import { cn } from '../utils.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import { textarea } from '../../design-system/styles/forms.ts';
import { size, muted } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { display, padding, width } from '../../design-system/styles/layout.ts';
import { bgColor } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import { borderColor } from '../../design-system/styles/colors.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import { cursor } from '../../design-system/styles/interactive.ts';
import type * as React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  ref?: React.RefObject<HTMLTextAreaElement | null>;
  error?: boolean;
  errorId?: string;
}

const Textarea = ({ className, ref, error, errorId, ...props }: TextareaProps) => {
  return (
    <textarea
      className={cn(
        `${display.flex} ${textarea.sm} ${width.full} ${radius.md} ${border.default} ${borderColor.input} ${bgColor.background} ${padding.xCompact} ${padding.yCompact} ${size.sm} ring-offset-background placeholder:${muted.default} ${focusRing.default} disabled:${opacityLevel[50]} disabled:${cursor.notAllowed}`,
        error && 'border-destructive focus-visible:ring-destructive',
        className as string | undefined
      )}
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={errorId || undefined}
      {...props}
    />
  );
};
Textarea.displayName = 'Textarea';

export { Textarea };
