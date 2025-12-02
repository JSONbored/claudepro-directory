/**
 * Auth Route Group Layout
 *
 * Minimal layout wrapper for authentication pages.
 * The split-screen layout and viewport handling is now managed
 * by the SplitAuthLayout component within each auth page.
 *
 * Features:
 * - No navigation or footer (clean auth UI)
 * - Passthrough container for split-screen auth pages
 * - Overflow handling for full-viewport experience
 */

import { bgColor, overflow } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';

/**
 * Minimal layout wrapper for authentication pages that provides full-viewport overflow handling and applies the design-system background.
 *
 * @param children - React node(s) to render inside the layout container
 * @returns A div element wrapping `children` with `overflow.hidden` and `bgColor.background` classes applied
 *
 * @see {@link @heyclaude/web-runtime/design-system#bgColor}
 * @see {@link @heyclaude/web-runtime/design-system#overflow}
 * @see {@link @heyclaude/web-runtime/ui#cn}
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className={cn(overflow.hidden, bgColor.background)}>{children}</div>;
}