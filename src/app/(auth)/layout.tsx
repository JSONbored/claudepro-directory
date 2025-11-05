/**
 * Auth Route Group Layout
 *
 * Minimal layout for authentication pages without navigation and footer.
 * Uses viewport-contained design for no-scroll auth experience.
 *
 * Features:
 * - No navigation or footer (clean auth UI)
 * - Modern viewport units (dvh with vh fallback)
 * - Centered flexbox layout
 * - Responsive padding
 * - Explicit background color
 *
 * Research: October 2025 best practices for auth pages
 * - Mobile-first viewport containment (iOS Safari support)
 * - h-screen as fallback (100vh equivalent)
 * - h-[100dvh] for modern browsers (accounts for mobile browser chrome)
 * - CSS class order: h-screen first, then h-[100dvh] overrides for modern browsers
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[100dvh] h-screen items-center justify-center overflow-hidden bg-background px-4">
      {children}
    </div>
  );
}
