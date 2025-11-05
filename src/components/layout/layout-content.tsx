/**
 * Layout Content - Client Component for pathname-aware rendering
 * Extracts pathname-dependent rendering logic from root layout to maintain ISR compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AnnouncementBannerClient } from '@/src/components/layout/announcement-banner-client';
import { FloatingMobileSearch } from '@/src/components/layout/floating-mobile-search';
import { Navigation } from '@/src/components/layout/navigation';
import { BackToTopButton } from '@/src/components/shared/back-to-top-button';
import type { Tables } from '@/src/types/database.types';

const Footer = dynamic(
  () => import('@/src/components/layout/footer').then((mod) => ({ default: mod.Footer })),
  {
    loading: () => null,
    ssr: true,
  }
);

const NotificationFAB = dynamic(
  () =>
    import('@/src/components/features/notifications/notification-fab').then((mod) => ({
      default: mod.NotificationFAB,
    })),
  {
    loading: () => null,
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

interface LayoutContentProps {
  children: React.ReactNode;
  announcement: Tables<'announcements'> | null;
}

export function LayoutContent({ children, announcement }: LayoutContentProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/login') || pathname.includes('/(auth)/');

  // Auth routes: minimal wrapper with no height constraints for true fullscreen experience
  if (isAuthRoute) {
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
        {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
        <main id="main-content" className="w-full">
          {children}
        </main>
      </>
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
        <Navigation />
        {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <FloatingMobileSearch />
        <BackToTopButton />
        <NotificationFAB />
        <NotificationSheet />
        <UnifiedNewsletterCapture variant="footer-bar" source="footer" />
      </div>
    </>
  );
}
