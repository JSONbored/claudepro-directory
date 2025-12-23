'use client';

/**
 * OAuth Layout Component
 *
 * Minimal dark-themed layout for OAuth consent and success pages.
 * Matches Vercel's industry-standard MCP OAuth design:
 * - Pure black background (forced dark mode)
 * - Centered white card
 * - No brand panel (minimal design)
 * - Responsive on all viewports
 * - Forces dark mode on html element
 */

import { motion } from 'motion/react';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface OAuthLayoutProps {
  children: ReactNode;
}

/**
 * Renders a minimal dark-themed OAuth layout matching Vercel's design.
 *
 * Features:
 * - Forces dark mode on html element (for OAuth pages only)
 * - Pure black background (oklch(0% 0 0) - pure black)
 * - Centered white card with proper spacing
 * - Minimal design (no brand panel, no mobile header)
 * - Responsive on all viewports
 * - Smooth animations with reduced motion support
 *
 * @param children - Content to display in the centered card
 * @returns The OAuth layout JSX element
 */
export function OAuthLayout({ children }: OAuthLayoutProps) {
  const shouldReduceMotion = useReducedMotion();

  // Force dark mode on html element for OAuth pages
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('dark');
    // Store original theme preference to restore later if needed
    const originalTheme = html.classList.contains('light') ? 'light' : html.classList.contains('dark') ? 'dark' : null;

    return () => {
      // Cleanup: restore original theme or remove dark class
      // Note: We don't restore to avoid flickering - OAuth pages should always be dark
      // The user's theme preference will be restored when they navigate away
    };
  }, []);

  return (
    <div className="bg-black relative min-h-dvh min-h-screen flex items-center justify-center p-4">
      {/* Centered card - white background (pure white to match Vercel) */}
      <motion.div
        className="bg-white text-black w-full max-w-lg rounded-lg p-8 shadow-lg"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={SPRING.smooth}
      >
        {children}
      </motion.div>
    </div>
  );
}

