'use client';

import { cn } from '../../utils.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { position, display, padding } from '../../../design-system/styles/layout.ts';
import { bgColor } from '../../../design-system/styles/colors.ts';
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
  transition = { duration: 2, ease: 'easeInOut' },
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
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'left center',
        display: 'inline',
      }}
      className={cn(
        `${position.relative} ${display.inlineBlock} ${radius.lg} ${bgColor.orange400} ${padding.xCompact} ${padding.yTight} dark:${bgColor['orange/50']}`,
        className
      )}
      {...props}
    >
      {text}
    </motion.span>
  );
}

export { HighlightText, type HighlightTextProps };
