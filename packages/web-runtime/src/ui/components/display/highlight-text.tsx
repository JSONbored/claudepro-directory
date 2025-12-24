'use client';

import { DURATION } from '../../../design-system/index.ts';
import { cn } from '../../utils.ts';
import {
  type HTMLMotionProps,
  motion,
  type Transition,
  type UseInViewOptions,
  useInView,
} from 'motion/react';
import * as React from 'react';

type HighlightTextProps = HTMLMotionProps<'span'> & {
  text: string;
  inView?: boolean;
  inViewMargin?: UseInViewOptions['margin'];
  inViewOnce?: boolean;
  transition?: Transition;
};

function HighlightText({
  ref,
  text,
  className,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  transition = { duration: DURATION.maximum, ease: 'easeInOut' },
  ...props
}: HighlightTextProps) {
  const localRef = React.useRef<HTMLSpanElement>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLSpanElement);

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;

  return (
    <motion.span
      ref={localRef}
      data-slot="highlight-text"
      initial={{
        backgroundSize: '0% 100%',
      }}
      animate={isInView ? { backgroundSize: '100% 100%' } : {}}
      transition={transition}
      style={{
        // Dynamic: Background gradient animation (Framer Motion controlled)
        backgroundImage: 'linear-gradient(to right, var(--claude-orange), var(--claude-orange))',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        // Dynamic: Text color from theme (CSS variable)
        color: 'var(--primary-foreground)', // White text on primary/orange background
        ...props.style,
      }}
      className={cn('relative inline-block inline px-1.5 py-0.5 rounded-sm', className)}
      {...props}
    >
      {text}
    </motion.span>
  );
}

export { HighlightText, type HighlightTextProps };
