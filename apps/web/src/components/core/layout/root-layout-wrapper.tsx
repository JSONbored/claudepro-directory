/**
 * Layout Content - Client Component for pathname-aware rendering
 * Extracts pathname-dependent rendering logic from root layout to maintain ISR compatibility
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { getLayoutFlags } from '@heyclaude/web-runtime/data';
import { useConfetti } from '@heyclaude/web-runtime/hooks';
import {
  logClientError,
  logClientWarn,
  normalizeError,
} from '@heyclaude/web-runtime/logging/client';
import { DIMENSIONS, toasts } from '@heyclaude/web-runtime/ui';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { AnnouncementBannerClient } from '@/src/components/core/layout/announcement-banner-client';
import { Navigation } from '@/src/components/core/layout/navigation';
import { CommandPaletteProvider } from '@/src/components/features/navigation/command-palette-provider';
import { PinboardDrawerProvider } from '@/src/components/features/navigation/pinboard-drawer-provider';
import { RecentlyViewedMobileTray } from '@/src/components/features/navigation/recently-viewed-mobile';

const Footer = dynamic(
  () => import('@/src/components/core/layout/footer').then((mod) => ({ default: mod.Footer })),
  {
    loading: () => null,
    ssr: true,
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

const NEWSLETTER_OPT_IN_COOKIE = 'newsletter_opt_in';
const NEWSLETTER_OPT_IN_SEEN_FLAG = 'newsletter_opt_in_seen';

const buildStorageErrorContext = (error: unknown) => {
  const normalized = normalizeError(error, 'Storage operation failed');
  return {
    error: normalized.message,
  };
};

type WindowWithCookieStore = typeof globalThis &
  Window & {
    cookieStore?: {
      delete?: (name: string) => Promise<void>;
    };
  };

async function clearNewsletterOptInCookie() {
  if (globalThis.window === undefined) return;

  const cookieStoreApi = (globalThis as WindowWithCookieStore).cookieStore;
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
  announcement: Database['public']['Tables']['announcements']['Row'] | null;
  children: React.ReactNode;
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
}

export function LayoutContent({ children, announcement, navigationData }: LayoutContentProps) {
  const pathname = usePathname();
  const { fireConfetti } = useConfetti();

  // Get static layout flags (no async operations)
  const layoutFlags = getLayoutFlags();

  // Get newsletter experiment variants from static flags
  const footerDelayVariant = layoutFlags.footerDelayVariant;
  const ctaVariant = layoutFlags.ctaVariant;

  // Convert variant to delay milliseconds
  const delayMs =
    footerDelayVariant === '10s' ? 10_000 : footerDelayVariant === '60s' ? 60_000 : 30_000;

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
      const normalized = normalizeError(error, 'Unable to read newsletter toast flag from sessionStorage');
      logClientWarn(
        '[Storage] Unable to read newsletter toast flag',
        normalized,
        'LayoutContent.readToastFlag',
        {
          component: 'LayoutContent',
          action: 'read-toast-flag',
          category: 'storage',
          ...buildStorageErrorContext(error),
        }
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
      const normalized = normalizeError(error, 'Unable to set newsletter toast flag');
      logClientWarn(
        '[Storage] Unable to set newsletter toast flag',
        normalized,
        'LayoutContent.setToastFlag',
        {
          component: 'LayoutContent',
          action: 'set-toast-flag',
          category: 'storage',
          ...buildStorageErrorContext(error),
        }
      );
    }

    toasts.raw.success("You're in!", {
      description: "We'll send the next Claude drop on Monday.",
    });

    // Check confetti enabled (static config)
    const confettiEnabled = checkConfettiEnabled();
    if (confettiEnabled) {
      fireConfetti('subtle');
    }

    clearNewsletterOptInCookie().catch((error) => {
      const normalized = normalizeError(error, 'Failed to clear newsletter opt-in cookie');
      logClientError(
        '[Storage] Failed to clear newsletter opt-in cookie',
        normalized,
        'LayoutContent.clearCookie',
        {
          component: 'LayoutContent',
          action: 'clear-cookie',
          category: 'storage',
          pathname,
          cookieName: NEWSLETTER_OPT_IN_COOKIE,
        }
      );
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
        className="focus:bg-primary focus:text-primary-foreground sr-only rounded-md focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>
      <CommandPaletteProvider>
        <PinboardDrawerProvider>
          <div className="bg-background flex min-h-screen flex-col">
            {announcement ? <AnnouncementBannerClient announcement={announcement} /> : null}
            <Navigation navigationData={navigationData} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <RecentlyViewedMobileTray />
          <NewsletterFooterBar source="footer" showAfterDelay={delayMs} ctaVariant={ctaVariant} />
          </div>
        </PinboardDrawerProvider>
      </CommandPaletteProvider>
    </>
  );
}
