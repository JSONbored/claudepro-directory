'use client';

import { DURATION } from '../../design-system/index.ts';
import { cn } from '../utils.ts';
import { motion } from 'motion/react';
import * as React from 'react';
import { forwardRef } from 'react';
import { useBoolean } from '@heyclaude/web-runtime/hooks';

export interface InputProps extends React.ComponentProps<'input'> {
  error?: boolean;
  errorId?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorId, onFocus, onBlur, ...props }, ref) => {
    const { value: isFocused, setTrue: setIsFocusedTrue, setFalse: setIsFocusedFalse } = useBoolean();

    return (
      <div className="relative">
        {/* Beautiful orange glow effect on focus - HeyClaude brand color */}
        {isFocused && (
          <motion.div
            className="absolute -inset-0.5 -z-10 rounded-md bg-gradient-to-r from-accent/60 via-accent/40 to-accent/20 blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATION.quick }}
          />
        )}
        <input
          type={type}
          className={cn(
            'relative flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background transition-all duration-200 ease-out file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed md:text-sm',
            // Beautiful orange focus border and ring
            isFocused && !error && 'border-accent/60 focus-visible:ring-accent/30 focus-visible:ring-2',
            error && 'border-destructive focus-visible:ring-destructive',
            className
          )}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={errorId || undefined}
          onFocus={(e) => {
            setIsFocusedTrue();
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocusedFalse();
            onBlur?.(e);
          }}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
