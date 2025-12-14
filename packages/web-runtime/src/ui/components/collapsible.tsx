'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { motion } from 'motion/react';
import { SPRING, DURATION } from '../../design-system/index.ts';
import { LayoutGroup } from './motion/layout-group.tsx';
import { cn } from '../utils.ts';
import { useBoolean } from '@heyclaude/web-runtime/hooks';
import * as React from 'react';

const Collapsible = ({ children, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) => (
  <LayoutGroup>
    <CollapsiblePrimitive.Root {...props}>
      {children}
    </CollapsiblePrimitive.Root>
  </LayoutGroup>
);

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>) => {
  // Use data-state attribute from Radix to determine if open (for layoutDependency)
  // Radix sets data-state="open" when content is visible
  const { value: isOpen, setValue: setIsOpen } = useBoolean();
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!contentRef.current) return;
    const observer = new MutationObserver(() => {
      const state = contentRef.current?.getAttribute('data-state');
      setIsOpen(state === 'open');
    });
    observer.observe(contentRef.current, { attributes: true, attributeFilter: ['data-state'] });
    // Initial check
    const state = contentRef.current.getAttribute('data-state');
    setIsOpen(state === 'open');
    return () => observer.disconnect();
  }, [setIsOpen]);
  
  return (
    <CollapsiblePrimitive.CollapsibleContent {...props} asChild>
      <motion.div
        ref={contentRef}
        layout
        layoutDependency={isOpen}
        className={cn('overflow-hidden', className)}
        initial={false}
        animate={{
          height: 'auto',
          opacity: 1,
        }}
        exit={{
          height: 0,
          opacity: 0,
        }}
        transition={{
          layout: SPRING.smooth,
          height: SPRING.smooth,
          opacity: {
            duration: DURATION.fast,
            ease: 'easeOut',
          },
        }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    </CollapsiblePrimitive.CollapsibleContent>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
