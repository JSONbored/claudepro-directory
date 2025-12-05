/**
 * Minimal layout wrapper for authentication pages that provides a full-viewport container.
 *
 * Renders a passthrough container that applies background and overflow handling; navigation and footer are intentionally omitted.
 *
 * @param children - Child nodes to render inside the auth layout
 * @returns The layout element that wraps the provided `children`
 * @see SplitAuthLayout - component responsible for split-screen layout and viewport handling within auth pages
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-background overflow-hidden">{children}</div>;
}
