'use client';

import { ANIMATION_CONSTANTS, cn, STATE_PATTERNS } from '@heyclaude/web-runtime';
import { motion } from 'motion/react';
import type * as React from 'react';
import { useState } from 'react';

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
          className="-inset-0.5 -z-10 absolute rounded-md bg-linear-to-r from-accent/50 to-primary/50 blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
      <input
        type={type}
        className={cn(
          `relative flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_CURSOR} md:text-sm`,
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
