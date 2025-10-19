import type * as React from 'react';

import { cn } from '@/src/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.RefObject<HTMLInputElement | null>;
  error?: boolean;
  errorId?: string;
}

const Input = ({ className, type, ref, error, errorId, ...props }: InputProps) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        error && 'border-destructive focus-visible:ring-destructive',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={errorId || undefined}
      {...props}
    />
  );
};
Input.displayName = 'Input';

export { Input };
