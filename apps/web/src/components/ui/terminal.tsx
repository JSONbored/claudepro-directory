"use client";

/**
 * Terminal Component
 * 
 * A macOS-style terminal window component with animated text output.
 * Perfect for command-line demos, installation guides, and interactive tutorials.
 * 
 * @example
 * ```tsx
 * <Terminal>
 *   <AnimatedSpan delay={0}>$ npm install</AnimatedSpan>
 *   <AnimatedSpan delay={500}>Installing packages...</AnimatedSpan>
 *   <TypingAnimation duration={50} delay={1000}>
 *     Package installed successfully!
 *   </TypingAnimation>
 * </Terminal>
 * ```
 * 
 * **When to use:**
 * - Installation guides: Show command-line installation steps
 * - CLI tool demos: Demonstrate command-line interfaces
 * - Interactive tutorials: Step-by-step terminal commands
 * - Documentation: Terminal output examples
 * 
 * **Key features:**
 * - macOS-style window chrome (red/yellow/green dots)
 * - Animated text output
 * - Typing animation support
 * - Scrollable content area
 * - Responsive design
 */

import { cn } from '@heyclaude/web-runtime/ui';
import { useBoolean, useTimeout, useInterval } from '@heyclaude/web-runtime/hooks';
import { motion, type MotionProps } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { padding, stack, gap, radius } from "@heyclaude/web-runtime/design-system";

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedSpanProps) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay / 1000 }}
    className={cn("grid text-sm font-normal tracking-tight", className)}
    {...(props as any)}
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
  as: Component = "span",
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string. Received:");
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState<string>("");
  const { value: started, setTrue: setStartedTrue } = useBoolean();
  const elementRef = useRef<HTMLElement | null>(null);

  useTimeout(() => {
    setStartedTrue();
  }, delay);

  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    if (!started) {
      setTypingIndex(0);
      setDisplayedText('');
      return;
    }
    setTypingIndex(0);
    setDisplayedText('');
  }, [started, children]);

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
      className={cn("text-sm font-normal tracking-tight", className)}
      {...(props as any)}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
  /**
   * If true, wraps children in <pre><code> tags for simple terminal output.
   * If false, allows custom structure (e.g., interactive terminals with input areas).
   * @default true
   */
  wrapInPreCode?: boolean;
}

export const Terminal = ({ children, className, wrapInPreCode = true }: TerminalProps) => {
  return (
    <div
      className={cn(
        "z-0 h-full max-h-[400px] w-full max-w-lg rounded-xl border border-border bg-background",
        className,
      )}
    >
      <div className={cn(stack.compact, "border-b border-border", padding.default)}>
        <div className={cn("flex flex-row", gap.compact)}>
          <div className={`h-2 w-2 ${radius['full']} bg-red-500`}></div>
          <div className={`h-2 w-2 ${radius['full']} bg-yellow-500`}></div>
          <div className={`h-2 w-2 ${radius['full']} bg-green-500`}></div>
        </div>
      </div>
      {wrapInPreCode ? (
        <pre className={padding.default}>
          <code className={cn("grid overflow-auto", gap.tight)}>{children}</code>
        </pre>
      ) : (
        <div className={padding.default}>{children}</div>
      )}
    </div>
  );
};
