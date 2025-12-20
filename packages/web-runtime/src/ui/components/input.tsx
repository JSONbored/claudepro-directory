'use client';

import { DURATION } from '../../design-system/index.ts';
import { cn } from '../utils.ts';
import { motion } from 'motion/react';
import * as React from 'react';
import { forwardRef } from 'react';
import { useBoolean } from '../../hooks/use-boolean.ts';

export interface InputProps extends React.ComponentProps<'input'> {
  error?: boolean;
  errorId?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorId, onFocus, onBlur, ...props }, ref) => {
    const {
      value: isFocused,
      setTrue: setIsFocusedTrue,
      setFalse: setIsFocusedFalse,
    } = useBoolean();

    return (
      <div className="relative">
        {/* Beautiful orange glow effect on focus - HeyClaude brand color */}
        {isFocused && (
          <motion.div
            className="from-accent/60 via-accent/40 to-accent/20 absolute -inset-0.5 -z-10 rounded-md bg-gradient-to-r blur-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATION.quick }}
          />
        )}
        <input
          type={type}
          className={cn(
            'border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring relative flex h-12 w-full rounded-md border px-3 py-2 text-base transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            // Beautiful orange focus border and ring
            isFocused &&
              !error &&
              'border-accent/60 focus-visible:ring-accent/30 focus-visible:ring-2',
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
