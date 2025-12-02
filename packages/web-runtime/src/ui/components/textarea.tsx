import { cn } from '../utils.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import { textarea } from '../../design-system/styles/forms.ts';
import { size } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
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
        `flex ${textarea.sm} w-full ${radius.md} border border-input bg-background px-3 py-2 ${size.sm} ring-offset-background placeholder:text-muted-foreground ${focusRing.default} disabled:opacity-50 disabled:cursor-not-allowed`,
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
