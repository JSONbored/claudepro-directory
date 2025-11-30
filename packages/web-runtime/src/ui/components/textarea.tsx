import { DIMENSIONS } from '../constants.ts';
import { cn } from '../utils.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
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
        `flex ${DIMENSIONS.TEXTAREA_SM} w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground ${focusRing.default} disabled:opacity-50 disabled:cursor-not-allowed`,
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
