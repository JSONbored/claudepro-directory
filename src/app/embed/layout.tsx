/**
 * Embed Layout - Minimal layout for iframe embedding
 *
 * Removes navigation, footer, and other chrome for clean embedding
 * Optimized for external site integration
 */

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
