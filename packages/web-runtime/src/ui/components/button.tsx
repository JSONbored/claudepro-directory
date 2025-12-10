'use client';

/**
 * Button Component
 *
 * shadcn/ui button primitive with Motion.dev micro-interactions
 *
 * Features:
 * - Hover scale effect (desktop)
 * - Tap feedback (mobile)
 * - Ripple effect on click (Material Design)
 * - Spring physics for natural feel
 * - Respects disabled state
 * - Works with all variants (default, destructive, outline, secondary, ghost, link)
 */

import { cn } from '../../ui/utils.ts';
import { STATE_PATTERNS, UI_CLASSES } from '../../ui/constants.ts';
import { MICROINTERACTIONS } from '../../ui/design-tokens/index.ts';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { AnimatePresence, motion } from 'motion/react';
import type * as React from 'react';
import { useCallback, useState } from 'react';

interface RippleType {
  x: number;
  y: number;
  size: number;
  id: number;
}

const buttonVariants = cva(
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_STANDARD} [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default: 'bg-accent text-accent-foreground hover:bg-accent/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: `border border-input bg-background ${STATE_PATTERNS.HOVER_BG_DEFAULT} ${STATE_PATTERNS.HOVER_TEXT_ACCENT}`,
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: `${STATE_PATTERNS.HOVER_BG_DEFAULT} ${STATE_PATTERNS.HOVER_TEXT_ACCENT}`,
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: `h-10 ${UI_CLASSES.CONTAINER_PADDING_SM}`,
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

  // Skip animations if asChild (for Link wrappers, TooltipTrigger, etc.)
  // This prevents hydration mismatches when Button is used with Radix UI components
  if (asChild) {
    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref} 
        {...props}
      />
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
            initial={MICROINTERACTIONS.ripple.initial}
            animate={MICROINTERACTIONS.ripple.animate}
            exit={{ opacity: 0 }}
            transition={MICROINTERACTIONS.ripple.transition}
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
      whileHover={MICROINTERACTIONS.button.hover}
      whileTap={MICROINTERACTIONS.button.tap}
      transition={MICROINTERACTIONS.button.transition}
      style={{ display: 'inline-block' }}
    >
      {buttonElement}
    </motion.div>
  );
};
Button.displayName = 'Button';

export { Button, buttonVariants };
