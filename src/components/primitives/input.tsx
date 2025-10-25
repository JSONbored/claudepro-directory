'use client';

import { motion } from 'motion/react';
import type * as React from 'react';
import { useState } from 'react';

import { cn } from '@/src/lib/utils';

export interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.RefObject<HTMLInputElement | null>;
  error?: boolean;
  errorId?: string;
}

const Input = ({ className, type, ref, error, errorId, onFocus, onBlur, ...props }: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      {/* Glow effect on focus - No layout shift, pure visual enhancement */}
      {isFocused && (
        <motion.div
          className="absolute -inset-0.5 bg-gradient-to-r from-accent/50 to-primary/50 rounded-md blur-sm -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <input
        type={type}
        className={cn(
          'relative flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200',
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={errorId || undefined}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
    </div>
  );
};
Input.displayName = 'Input';

export { Input };
