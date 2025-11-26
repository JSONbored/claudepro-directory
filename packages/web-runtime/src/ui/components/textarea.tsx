import { DIMENSIONS, STATE_PATTERNS } from '../constants.ts';
import { cn } from '../utils.ts';
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
        `flex ${DIMENSIONS.TEXTAREA_SM} w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_CURSOR}`,
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
