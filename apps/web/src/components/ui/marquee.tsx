'use client';

/**
 * Marquee Component
 *
 * A smooth, infinite scrolling marquee component for displaying logos, testimonials, or content.
 * Perfect for hero sections, partner showcases, and featured content displays.
 *
 * @example
 * ```tsx
 * <Marquee>
 *   <MarqueeContent pauseOnHover>
 *     <MarqueeItem>Logo 1</MarqueeItem>
 *     <MarqueeItem>Logo 2</MarqueeItem>
 *   </MarqueeContent>
 *   <MarqueeFade side="left" />
 *   <MarqueeFade side="right" />
 * </Marquee>
 * ```
 *
 * **When to use:**
 * - Partner/logo showcases: Display company logos
 * - Testimonial carousels: Rotating testimonials
 * - Featured content: Highlighted items
 * - Hero sections: Animated content displays
 *
 * **Key features:**
 * - Smooth infinite scrolling
 * - Pause on hover
 * - Gradient fade effects
 * - Auto-fill for seamless looping
 * - Customizable speed and direction
 */

import type { HTMLAttributes } from 'react';
import type { MarqueeProps as FastMarqueeProps } from 'react-fast-marquee';
import FastMarquee from 'react-fast-marquee';
import { cn } from '@heyclaude/web-runtime/ui';

export type MarqueeProps = HTMLAttributes<HTMLDivElement>;

export const Marquee = ({ className, ...props }: MarqueeProps) => (
  <div className={cn('relative w-full overflow-hidden', className)} {...(props as any)} />
);

export type MarqueeContentProps = FastMarqueeProps;

export const MarqueeContent = ({
  loop = 0,
  autoFill = true,
  pauseOnHover = true,
  ...props
}: MarqueeContentProps) => (
  <FastMarquee autoFill={autoFill} loop={loop} pauseOnHover={pauseOnHover} {...(props as any)} />
);

export type MarqueeFadeProps = HTMLAttributes<HTMLDivElement> & {
  side: 'left' | 'right';
};

export const MarqueeFade = ({ className, side, ...props }: MarqueeFadeProps) => (
  <div
    className={cn(
      'from-background absolute top-0 bottom-0 z-10 h-full w-24 to-transparent',
      side === 'left' ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l',
      className
    )}
    {...(props as any)}
  />
);

export type MarqueeItemProps = HTMLAttributes<HTMLDivElement>;

export const MarqueeItem = ({ className, ...props }: MarqueeItemProps) => (
  <div className={cn('mx-2 flex-shrink-0 object-contain', className)} {...(props as any)} />
);
