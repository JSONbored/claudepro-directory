/**
 * Layout Content - Client Component for pathname-aware rendering
 * Extracts pathname-dependent rendering logic from root layout to maintain ISR compatibility
 */

'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AnnouncementBannerClient } from '@/src/components/core/layout/announcement-banner-client';
import { Navigation } from '@/src/components/core/layout/navigation';
import { useConfetti } from '@/src/hooks/use-confetti';
import { checkConfettiEnabled } from '@/src/lib/actions/feature-flags.actions';
import type { NavigationData } from '@/src/lib/data/navigation';
import { DIMENSIONS } from '@/src/lib/ui-constants';
import { toasts } from '@/src/lib/utils/toast.utils';
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

const NewsletterFooterBar = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter').then((mod) => ({
      default: mod.NewsletterFooterBar,
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
  navigationData: NavigationData;
  useFloatingActionBar?: boolean;
  fabFlags: {
    showSubmit: boolean;
    showSearch: boolean;
    showScrollToTop: boolean;
    showNotifications: boolean;
  };
  footerDelayVariant: '10s' | '30s' | '60s';
  ctaVariant: 'aggressive' | 'social_proof' | 'value_focused';
}

export function LayoutContent({
  children,
  announcement,
  navigationData,
  useFloatingActionBar = false,
  fabFlags,
  footerDelayVariant,
  ctaVariant,
}: LayoutContentProps) {
  const pathname = usePathname();
  const { fireConfetti } = useConfetti();

  // Convert variant to delay milliseconds
  const delayMs =
    footerDelayVariant === '10s' ? 10000 : footerDelayVariant === '60s' ? 60000 : 30000;

  // Auth route prefixes - Next.js strips route groups like (auth) from URLs
  const AUTH_ROUTE_PREFIXES = ['/login', '/auth-code-error', '/auth/'];
  const isAuthRoute = AUTH_ROUTE_PREFIXES.some((prefix) =>
    prefix.endsWith('/') ? pathname.startsWith(prefix) : pathname === prefix
  );

  useEffect(() => {
    if (isAuthRoute) return;

    const cookieMatch = document.cookie.match(/newsletter_opt_in=([^;]+)/);
    if (!cookieMatch) return;

    const value = cookieMatch[1];
    if (value !== 'success') return;

    // Remove cookie immediately to avoid duplicate toasts
    document.cookie = 'newsletter_opt_in=; Max-Age=0; Path=/';

    toasts.raw.success("You're in!", {
      description: "We'll send the next Claude drop on Monday.",
    });

    checkConfettiEnabled()
      .then((enabled) => {
        if (enabled) {
          fireConfetti('subtle');
        }
      })
      .catch(() => {
        // Silent fail - confetti is a nice-to-have
      });
  }, [fireConfetti, isAuthRoute]);

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
        <Navigation hideCreateButton={useFloatingActionBar} navigationData={navigationData} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        {/* Feature flag: Floating Action Bar (can be toggled on/off via Statsig) */}
        {useFloatingActionBar && <FloatingActionBar fabFlags={fabFlags} />}
        <NotificationSheet />
        <NewsletterFooterBar source="footer" showAfterDelay={delayMs} />
      </div>
    </>
  );
}
