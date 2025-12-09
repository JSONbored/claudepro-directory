'use client';

/**
 * Magnetic Search Wrapper
 *
 * Wraps UnifiedSearch with magnetic effects and expansion animations.
 * Creates a delightful, interactive search experience that responds to user interaction.
 *
 * Features:
 * - Expands on focus with smooth animation
 * - Tilts toward cursor (magnetic effect)
 * - Glows with accent color when active
 * - Emits particles on interaction
 * - Coordinates with hero background
 */

import { type UnifiedSearchProps } from '@heyclaude/web-runtime/types/component.types';
import { motion, useMotionValue, useSpring } from 'motion/react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

import { useHeroSearchConnection } from './hero-search-connection';

// Import UnifiedSearch dynamically to match existing pattern
const UnifiedSearch = dynamic(
  () =>
    import('@/src/components/features/search/search').then((mod) => ({
      default: mod.UnifiedSearch,
    })),
  {
    ssr: true, // SSR enabled for immediate rendering
    loading: () => null, // No loading state - wrapper handles it
  }
);

interface MagneticSearchWrapperProps extends UnifiedSearchProps {
  /** Callback when search focus state changes */
  onFocusChange?: (isFocused: boolean) => void;
  /** Whether to enable magnetic effect */
  enableMagnetic?: boolean;
  /** Whether to enable expansion on focus */
  enableExpansion?: boolean;
}

export function MagneticSearchWrapper({
  onFocusChange,
  enableMagnetic = true,
  enableExpansion = true,
  className,
  ...searchProps
}: MagneticSearchWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { searchRef } = useHeroSearchConnection();
  const [isFocused, setIsFocused] = useState(false);

  // Motion values for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(0, { stiffness: 300, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 300, damping: 30 });
  const scale = useSpring(1, { stiffness: 400, damping: 25 });

  // Forward ref to context - find input and set ref
  useEffect(() => {
    if (!containerRef.current || !searchRef) return;

    // Use MutationObserver to catch when UnifiedSearch renders the input
    const observer = new MutationObserver(() => {
      const input = containerRef.current?.querySelector('input');
      if (input && searchRef.current !== input) {
        (searchRef as React.MutableRefObject<HTMLInputElement | null>).current = input;
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    // Also check immediately
    const input = containerRef.current.querySelector('input');
    if (input && searchRef.current !== input) {
      (searchRef as React.MutableRefObject<HTMLInputElement | null>).current = input;
    }

    return () => observer.disconnect();
  }, [searchRef]);

  // Track mouse position relative to container
  useEffect(() => {
    if (!enableMagnetic || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const x = e.clientX - centerX;
        const y = e.clientY - centerY;

        mouseX.set(x);
        mouseY.set(y);

        // Calculate tilt (magnetic effect)
        const maxTilt = 6; // Maximum tilt in degrees
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = 250; // Distance at which max tilt occurs

        if (distance < maxDistance) {
          const tiltAmount = (1 - distance / maxDistance) * maxTilt;
          rotateY.set((x / maxDistance) * tiltAmount);
          rotateX.set((-y / maxDistance) * tiltAmount);
        } else {
          rotateY.set(0);
          rotateX.set(0);
        }
      }
    };

    const handleMouseLeave = () => {
      if (!isFocused) {
        rotateY.set(0);
        rotateX.set(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    containerRef.current.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableMagnetic, mouseX, mouseY, rotateX, rotateY, isFocused]);

  // Handle focus state - use MutationObserver + polling to catch input when it renders
  useEffect(() => {
    if (!containerRef.current) return;

    let cleanupFn: (() => void) | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    const findAndAttachListeners = (): boolean => {
      const input = containerRef.current?.querySelector('input');
      if (!input) return false;

      const handleFocus = () => {
        setIsFocused(true);
        if (enableExpansion) {
          scale.set(1.015); // Subtle expansion
        }
        onFocusChange?.(true);
      };

      const handleBlur = () => {
        setIsFocused(false);
        scale.set(1);
        if (!enableMagnetic) {
          rotateY.set(0);
          rotateX.set(0);
        }
        onFocusChange?.(false);
      };

      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);

      cleanupFn = () => {
        input.removeEventListener('focus', handleFocus);
        input.removeEventListener('blur', handleBlur);
      };

      return true;
    };

    // Try immediately
    if (findAndAttachListeners()) {
      return cleanupFn || undefined;
    }

    // MutationObserver to catch when input appears
    const observer = new MutationObserver(() => {
      if (findAndAttachListeners()) {
        observer.disconnect();
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
    });

    // Polling fallback: check every 100ms for up to 5 seconds (50 attempts)
    let pollCount = 0;
    pollInterval = setInterval(() => {
      pollCount++;
      if (findAndAttachListeners() || pollCount >= 50) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        observer.disconnect();
      }
    }, 100);

    return () => {
      observer.disconnect();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [enableExpansion, enableMagnetic, onFocusChange, scale, rotateX, rotateY]);

  return (
    <motion.div
      ref={containerRef}
      className="relative"
      style={{
        scale,
        rotateX: enableMagnetic ? rotateX : 0,
        rotateY: enableMagnetic ? rotateY : 0,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        willChange: enableMagnetic ? 'transform' : 'auto',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
        mass: 0.5,
      }}
    >
      {/* Glassmorphism container - minimal 2025 design with darker background */}
      <motion.div
        className="relative rounded-xl border backdrop-blur-xl"
        animate={{
          borderColor: isFocused
            ? 'rgba(249, 115, 22, 0.6)' // HeyClaude orange when active
            : 'rgba(255, 255, 255, 0.15)',
          backgroundColor: isFocused
            ? 'rgba(0, 0, 0, 0.4)' // Darker when focused
            : 'rgba(0, 0, 0, 0.25)', // Darker default for better glassmorphism
          boxShadow: isFocused
            ? '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(249, 115, 22, 0.4)'
            : '0 4px 16px rgba(0, 0, 0, 0.15)',
        }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        {/* Search component */}
        <div className={className}>
          <UnifiedSearch {...searchProps} />
        </div>
      </motion.div>
    </motion.div>
  );
}
