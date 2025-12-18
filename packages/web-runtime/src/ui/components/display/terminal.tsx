'use client';

import { DURATION } from '../../../design-system/index.ts';
import { cn } from '../../utils.ts';
import { useBoolean } from '../../../hooks/use-boolean.ts';
import { useInterval } from '../../../hooks/use-interval.ts';
import { useTimeout } from '../../../hooks/use-timeout.ts';
import { type MotionProps, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({ children, delay = 0, className, ...props }: AnimatedSpanProps) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: DURATION.default, delay: delay / 1000 }}
    className={cn('grid font-normal text-sm tracking-tight', className)}
    {...props}
  >
    {children}
  </motion.div>
);

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = 'span',
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== 'string') {
    throw new Error('TypingAnimation: children must be a string. Received:');
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState<string>('');
  const { value: started, setTrue: setStartedTrue } = useBoolean();
  const [typingIndex, setTypingIndex] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);

  // Reset when children change
  useEffect(() => {
    setTypingIndex(0);
    setDisplayedText('');
  }, [children]);

  // Use useTimeout for initial delay
  useTimeout(() => {
    setStartedTrue();
  }, delay);

  // Use useInterval for typing animation
  useInterval(() => {
    if (!started) return;
    if (typingIndex < children.length) {
      setDisplayedText(children.substring(0, typingIndex + 1));
      setTypingIndex((prev) => prev + 1);
    }
  }, started && typingIndex < children.length ? duration : null);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn('font-normal text-sm tracking-tight', className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
}

export const Terminal = ({ children, className }: TerminalProps) => {
  return (
    <div
      className={cn(
        'z-0 w-full overflow-hidden rounded-xl border border-border bg-background',
        className
      )}
    >
      <div className="flex flex-col gap-y-2 border-border border-b p-4">
        <div className="flex flex-row gap-x-2">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <div className="h-2 w-2 rounded-full bg-green-500" />
        </div>
      </div>
      <pre className="overflow-x-auto p-4">
        <code className="grid gap-y-1">{children}</code>
      </pre>
    </div>
  );
};
