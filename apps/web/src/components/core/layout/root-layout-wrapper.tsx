/**
 * Layout Content - Client Component for pathname-aware rendering
 * Extracts pathname-dependent rendering logic from root layout to maintain ISR compatibility
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { logClientWarning, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/data';
import { DIMENSIONS, toasts } from '@heyclaude/web-runtime/ui';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AnnouncementBannerClient } from '@/src/components/core/layout/announcement-banner-client';
import { Navigation } from '@/src/components/core/layout/navigation';
import { useConfetti } from '@/src/hooks/use-confetti';

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
    import('@/src/components/features/growth/newsletter/newsletter-footer-bar').then((mod) => ({
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

const NEWSLETTER_OPT_IN_COOKIE = 'newsletter_opt_in';
const NEWSLETTER_OPT_IN_SEEN_FLAG = 'newsletter_opt_in_seen';

const buildStorageErrorContext = (error: unknown) => {
  const normalized = normalizeError(error, 'Storage operation failed');
  return {
    error: normalized.message,
  };
};

type WindowWithCookieStore = Window &
  typeof globalThis & {
    cookieStore?: {
      delete?: (name: string) => Promise<void>;
    };
  };

async function clearNewsletterOptInCookie() {
  if (typeof window === 'undefined') return;

  const cookieStoreApi = (window as WindowWithCookieStore).cookieStore;
  if (cookieStoreApi?.delete) {
    await cookieStoreApi.delete(NEWSLETTER_OPT_IN_COOKIE);
    return;
  }

  const response = await fetch('/api/newsletter-opt-in/clear', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to clear ${NEWSLETTER_OPT_IN_COOKIE} cookie: ${response.status} ${response.statusText}`
    );
  }
}

interface LayoutContentProps {
  children: React.ReactNode;
  announcement: Database['public']['Tables']['announcements']['Row'] | null;
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
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

    let hasSeenToast = false;
    try {
      hasSeenToast = sessionStorage.getItem(NEWSLETTER_OPT_IN_SEEN_FLAG) === 'true';
    } catch (error) {
      logger.warn(
        'LayoutContent: unable to read newsletter toast flag from sessionStorage',
        buildStorageErrorContext(error)
      );
    }

    if (hasSeenToast) return;

    const cookieMatch = document.cookie.match(/newsletter_opt_in=([^;]+)/);
    if (!cookieMatch) return;

    const value = cookieMatch[1];
    if (value !== 'success') return;

    try {
      sessionStorage.setItem(NEWSLETTER_OPT_IN_SEEN_FLAG, 'true');
    } catch (error) {
      logger.warn(
        'LayoutContent: unable to set newsletter toast flag',
        buildStorageErrorContext(error)
      );
    }

    toasts.raw.success("You're in!", {
      description: "We'll send the next Claude drop on Monday.",
    });

    checkConfettiEnabled({})
      .then((result) => {
        if (result?.data) {
          fireConfetti('subtle');
        }
        if (result?.serverError) {
          logClientWarning('LayoutContent: confetti check failed', new Error(result.serverError));
        }
      })
      .catch((error) => {
        logClientWarning('LayoutContent: confetti check failed', error, {
          component: 'LayoutContent',
          pathname,
        });
      });

    clearNewsletterOptInCookie().catch((error) => {
      const normalized = normalizeError(error, 'Failed to clear newsletter opt-in cookie');
      logger.error('LayoutContent: failed to clear newsletter opt-in cookie', normalized, {
        component: 'LayoutContent',
        pathname,
        cookieName: NEWSLETTER_OPT_IN_COOKIE,
      });
    });
  }, [fireConfetti, isAuthRoute, pathname]);

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
        <NewsletterFooterBar source="footer" showAfterDelay={delayMs} ctaVariant={ctaVariant} />
      </div>
    </>
  );
}
