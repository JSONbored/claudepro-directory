'use client';

/**
 * Theme Toggle with Layout Animation
 * 
 * A toggle switch component using Motion.dev layout animations.
 * Features smooth spring-based layout transitions when toggling between light/dark themes.
 * 
 * Uses Claude orange (accent color) for the toggle background when active to match brand identity.
 * 
 * @module web-runtime/ui/components/theme/theme-toggle-layout
 */

import { SPRING } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface ThemeToggleLayoutProps {
  /** Whether the toggle is checked (dark mode) */
  checked: boolean;
  /** Callback when toggle state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Optional className for styling */
  className?: string;
  /** Optional aria-label for accessibility */
  'aria-label'?: string;
}

/**
 * Theme Toggle with Layout Animation
 * 
 * Uses Motion.dev layout animations for smooth toggle transitions.
 * The handle smoothly animates between left (light) and right (dark) positions.
 * The container background changes from muted (light) to accent orange (dark).
 */
export function ThemeToggleLayout({
  checked,
  onCheckedChange,
  className,
  'aria-label': ariaLabel,
}: ThemeToggleLayoutProps) {
  const [isOn, setIsOn] = useState(checked);

  // Sync with external checked prop
  useEffect(() => {
    setIsOn(checked);
  }, [checked]);

  const toggleSwitch = () => {
    const newValue = !isOn;
    setIsOn(newValue);
    onCheckedChange(newValue);
  };

  return (
    <motion.button
      type="button"
      onClick={toggleSwitch}
      className={cn(
        'relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        // Background color: muted when off (light), accent orange when on (dark)
        isOn ? 'bg-accent' : 'bg-muted',
        className
      )}
      style={{
        justifyContent: isOn ? 'flex-end' : 'flex-start',
      }}
      aria-label={ariaLabel || `Switch to ${isOn ? 'light' : 'dark'} mode`}
      aria-checked={isOn}
      role="switch"
    >
      <motion.div
        className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
        layout
        transition={SPRING.snappy}
      />
    </motion.button>
  );
}
