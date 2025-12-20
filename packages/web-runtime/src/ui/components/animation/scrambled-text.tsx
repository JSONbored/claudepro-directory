'use client';

/**
 * Scrambled Text Component
 * Proximity-based text scrambling using GSAP's ScrambleTextPlugin
 *
 * Features:
 * - Proximity-based character scrambling
 * - Distance-based intensity
 * - Customizable scramble characters
 * - Performance optimized
 * - Responsive typography
 */

import { cn } from '../../utils.ts';
import { useEffect, useRef, type ReactNode } from 'react';
import { useReducedMotion } from '../../../hooks/motion/index.ts';

interface ScrambledTextProps {
  children: ReactNode;
  radius?: number;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrambledText({
  children,
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
  className,
  style,
}: ScrambledTextProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion || !containerRef.current) return;

    const container = containerRef.current;
    let charElements: HTMLSpanElement[] = [];
    let animationTimers: Array<() => void> = [];

    // Process text into character spans
    const processText = (): HTMLSpanElement[] => {
      const text = container.textContent || '';
      if (!text.trim()) return []; // Don't process if no text

      const chars = text.split('');

      // Create character spans
      const elements = chars.map((char, index) => {
        const span = document.createElement('span');
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.display = 'inline-block';
        span.style.position = 'relative';
        span.setAttribute('data-original', char);
        span.setAttribute('data-index', String(index));
        return span;
      });

      // Only replace if we have characters
      if (elements.length > 0) {
        container.innerHTML = '';
        elements.forEach((el) => container.appendChild(el));
        return elements;
      }
      return [];
    };

    // Delay to ensure React has rendered
    const timeoutId = setTimeout(() => {
      charElements = processText();
    }, 100);

    const handleMouseMove = (e: MouseEvent) => {
      // Re-process if charElements is empty (React might have re-rendered)
      if (charElements.length === 0) {
        charElements = processText();
      }

      // Clear existing animations
      animationTimers.forEach((cleanup) => cleanup());
      animationTimers = [];

      charElements.forEach((charEl) => {
        const rect = charEl.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const charCenterY = rect.top + rect.height / 2;

        const dx = e.clientX - charCenterX;
        const dy = e.clientY - charCenterY;
        const distance = Math.hypot(dx, dy);

        if (distance < radius) {
          const intensity = 1 - distance / radius;
          const originalChar = charEl.getAttribute('data-original') || '';

          // Scramble animation
          let scrambleInterval: NodeJS.Timeout;
          let unscrambleTimeout: NodeJS.Timeout;
          let frame = 0;
          const scrambleDuration = duration * intensity;
          const scrambleSpeed = speed / intensity;

          const scramble = () => {
            if (frame < scrambleDuration * 60) {
              const randomChar =
                scrambleChars[Math.floor(Math.random() * scrambleChars.length)] ?? '';
              charEl.textContent = randomChar;
              frame++;
              scrambleInterval = setTimeout(scramble, 1000 / 60 / scrambleSpeed);
            } else {
              // Unscramble back to original
              unscrambleTimeout = setTimeout(() => {
                charEl.textContent = originalChar;
              }, 100);
            }
          };

          scramble();

          animationTimers.push(() => {
            clearTimeout(scrambleInterval);
            clearTimeout(unscrambleTimeout);
            charEl.textContent = originalChar;
          });
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', handleMouseMove);
      animationTimers.forEach((cleanup) => cleanup());
    };
  }, [children, radius, duration, speed, scrambleChars, shouldReduceMotion]);

  return (
    <span ref={containerRef} className={cn(className)} style={style}>
      {children}
    </span>
  );
}
