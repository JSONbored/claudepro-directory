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
        'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
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
