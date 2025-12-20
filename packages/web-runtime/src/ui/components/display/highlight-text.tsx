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
        // CRITICAL: Use exact highlight color #F0704A at 100% opacity (like logo)
        // Background gradient that expands from left to right
        backgroundImage: 'linear-gradient(to right, #F0704A, #F0704A)',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
        // Padding for the highlight effect
        padding: '0.125rem 0.375rem',
        borderRadius: '0.375rem',
        // Text color should be white (like logo - white lettering on orange)
        color: '#FFFFFF',
        ...props.style,
      }}
      className={cn('relative inline-block', className)}
      {...props}
    >
      {text}
    </motion.span>
  );
}

export { HighlightText, type HighlightTextProps };
