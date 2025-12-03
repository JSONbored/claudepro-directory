'use client';

import { cn } from '../../utils.ts';
import { padding, squareSize, grid, display, flexDir, gap, width, overflow } from '../../../design-system/styles/layout.ts';
import { size, weight, tracking } from '../../../design-system/styles/typography.ts';
import { bgColor, borderColor } from '../../../design-system/styles/colors.ts';
import { radius } from '../../../design-system/styles/radius.ts';
import { border, borderBottom } from '../../../design-system/styles/borders.ts';
import { zLayer } from '../../../design-system/styles/effects.ts';
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
    transition={{ duration: 0.3, delay: delay / 1000 }}
    className={cn(`${grid.base} ${weight.normal} ${size.sm} ${tracking.tight}`, className)}
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
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started]);

  return (
    <MotionComponent
      ref={elementRef}
      className={cn(`${weight.normal} ${size.sm} ${tracking.tight}`, className)}
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
        `${zLayer.base} ${width.full} ${overflow.hidden} ${radius.xl} ${border.default} ${borderColor.border} ${bgColor.background}`,
        className
      )}
    >
      <div className={`${display.flex} ${flexDir.col} ${gap.compact} ${borderColor.border} ${borderBottom.default} ${padding.default}`}>
        <div className={`${display.flex} ${flexDir.row} ${gap.compact}`}>
          <div className={`${squareSize.dotMd} ${radius.full} ${bgColor.red}`} />
          <div className={`${squareSize.dotMd} ${radius.full} ${bgColor.yellow}`} />
          <div className={`${squareSize.dotMd} ${radius.full} ${bgColor.green}`} />
        </div>
      </div>
      <pre className={`${overflow.xAuto} ${padding.default}`}>
        <code className={`${grid.base} ${gap.yTight}`}>{children}</code>
      </pre>
    </div>
  );
};
