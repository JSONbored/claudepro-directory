'use client';

import { ANIMATION_CONSTANTS, STATE_PATTERNS } from '../constants.ts';
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
            `relative flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT} file:border-0 file:bg-transparent file:font-medium file:text-foreground file:text-sm placeholder:text-muted-foreground ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_CURSOR} md:text-sm`,
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
