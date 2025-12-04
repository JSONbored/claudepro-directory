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

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background overflow-hidden">{children}</div>;
}
