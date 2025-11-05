'use client';

/**
 * Button Component
 *
 * shadcn/ui button primitive with Motion.dev micro-interactions (Phase 1.2 - October 2025)
 *
 * Features:
 * - Hover scale effect (desktop)
 * - Tap feedback (mobile)
 * - Ripple effect on click (Material Design)
 * - Spring physics for natural feel
 * - Respects disabled state
 * - Works with all variants (default, destructive, outline, secondary, ghost, link)
 */

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useState } from 'react';

import { cn } from '@/src/lib/utils';

interface RippleType {
  x: number;
  y: number;
  size: number;
  id: number;
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground hover:bg-accent/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = ({
  className,
  variant,
  size,
  asChild = false,
  disabled = false,
  ref,
  onClick,
  ...props
}: ButtonProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const [ripples, setRipples] = useState<RippleType[]>([]);

  const addRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple: RippleType = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!(disabled || asChild)) {
        addRipple(event);
      }
      onClick?.(event);
    },
    [addRipple, onClick, disabled, asChild]
  );

  const Comp = asChild ? Slot : 'button';

  // Skip animations if asChild (for Link wrappers, etc.)
  if (asChild) {
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }

  // Button element with ripple
  const buttonElement = (
    <Comp
      className={cn(buttonVariants({ variant, size, className }), 'relative overflow-hidden')}
      ref={ref}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {props.children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="pointer-events-none absolute rounded-full bg-white/30"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </Comp>
  );

  // Wrap with motion animations if button is enabled
  if (disabled) {
    return <div style={{ display: 'inline-block' }}>{buttonElement}</div>;
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      style={{ display: 'inline-block' }}
    >
      {buttonElement}
    </motion.div>
  );
};
Button.displayName = 'Button';

export { Button };
