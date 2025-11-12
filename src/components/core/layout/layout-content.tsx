/**
 * Layout Content - Client Component for pathname-aware rendering
 * Extracts pathname-dependent rendering logic from root layout to maintain ISR compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AnnouncementBannerClient } from '@/src/components/core/layout/announcement-banner-client';
import { Navigation } from '@/src/components/core/layout/navigation';
import { DIMENSIONS } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database.types';

const Footer = dynamic(
  () => import('@/src/components/core/layout/footer').then((mod) => ({ default: mod.Footer })),
  {
    loading: () => null,
    ssr: true,
  }
);

const NotificationSheet = dynamic(
  () =>
    import('@/src/components/features/notifications/notification-sheet').then((mod) => ({
      default: mod.NotificationSheet,
    })),
  {
    loading: () => null,
  }
);

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => null,
  }
);

const FloatingActionBar = dynamic(
  () =>
    import('@/src/components/features/fab/floating-action-bar').then((mod) => ({
      default: mod.FloatingActionBar,
    })),
  {
    loading: () => null,
  }
);

interface LayoutContentProps {
  children: React.ReactNode;
  announcement: Tables<'announcements'> | null;
  useFloatingActionBar?: boolean;
}

export function LayoutContent({
  children,
  announcement,
  useFloatingActionBar = false,
}: LayoutContentProps) {
  const pathname = usePathname();

  // Auth route prefixes - Next.js strips route groups like (auth) from URLs
  const AUTH_ROUTE_PREFIXES = ['/login', '/auth-code-error', '/auth/'];
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) =>
    prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix
  );

  // Auth routes: minimal wrapper with no height constraints for true fullscreen experience
  if (isAuthRoute) {
    return (
      <main id="main-content" className={`${DIMENSIONS.FULL_VIEWPORT} w-full overflow-hidden`}>
        {children}
      </main>
    );
  }

  // Normal routes: full layout with navigation, footer, and all features
  return (
    <>
      <a
        href="#main-content"
        className={
          'sr-only rounded-md focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground'
        }
      >
        Skip to main content
      </a>
      <div className={'flex min-h-screen flex-col bg-background'}>
        {announcement && <AnnouncementBannerClient announcement={announcement} />}
        <Navigation hideCreateButton={useFloatingActionBar} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Feature flag: Floating Action Bar (can be toggled on/off via Statsig) */}
        {useFloatingActionBar && <FloatingActionBar />}
        <NotificationSheet />
        <UnifiedNewsletterCapture variant="footer-bar" source="footer" />
      </div>
    </>
  );
}
