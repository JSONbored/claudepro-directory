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
 *
 * Research: October 2025 best practices for auth pages
 * - Mobile-first viewport containment (iOS Safari support)
 * - min-h-screen as fallback (100vh equivalent)
 * - min-h-dvh for modern browsers (accounts for mobile browser chrome)
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center px-4 py-8">
      {children}
    </div>
  );
}
