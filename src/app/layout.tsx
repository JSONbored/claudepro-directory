import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './sugar-high.css';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

const NotificationToastHandler = dynamic(
  () =>
    import('@/src/components/features/notifications/notification-toast-handler').then((mod) => ({
      default: mod.NotificationToastHandler,
    })),
  {
    loading: () => null,
  }
);

import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { PostCopyEmailProvider } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Pulse } from '@/src/components/core/infra/pulse';
import { PulseCannon } from '@/src/components/core/infra/pulse-cannon';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { LayoutContent } from '@/src/components/core/layout/root-layout-wrapper';
import { NotificationsProvider } from '@/src/components/providers/notifications-provider';
import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { getLayoutData } from '@/src/lib/data/layout/data';
import { getLayoutFlags } from '@/src/lib/data/layout/flags';
import { getHomeMetadata } from '@/src/lib/data/seo/homepage';

// Self-hosted fonts - no external requests, faster FCP, GDPR compliant
const inter = localFont({
  src: '../fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  display: 'optional',
  preload: true,
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
  weight: '100 900',
});

const geist = localFont({
  src: '../fonts/GeistVF.woff2',
  variable: '--font-geist',
  display: 'optional',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  weight: '100 900',
});

const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  display: 'optional',
  preload: true,
  fallback: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  weight: '100 900',
});

// Generate homepage metadata from centralized registry
export async function generateMetadata(): Promise<Metadata> {
  const homeMetadata = await getHomeMetadata();

  return {
    ...homeMetadata,
    metadataBase: new URL(APP_CONFIG.url),
    authors: [{ name: APP_CONFIG.author, url: `${APP_CONFIG.url}/about` }],
    openGraph: {
      ...homeMetadata.openGraph,
      locale: 'en_US',
      // Static OG image served from /og-images/og-image.webp (included in homeMetadata)
    },
    twitter: {
      ...homeMetadata.twitter,
      creator: '@JSONbored',
      // Static OG image served from /og-images/og-image.webp (included in homeMetadata)
    },
    alternates: {
      ...homeMetadata.alternates,
      types: {
        // LLMs.txt for AI-Optimized Plain Text Content (llmstxt.org)
        'text/plain': '/llms.txt',
      },
    },
    icons: {
      icon: [
        { url: '/assets/icons/claudepro-directory-icon.ico' },
        {
          url: '/assets/icons/favicon-16x16.png',
          sizes: '16x16',
          type: 'image/png',
        },
        {
          url: '/assets/icons/favicon-32x32.png',
          sizes: '32x32',
          type: 'image/png',
        },
      ],
      shortcut: '/assets/icons/claudepro-directory-icon.ico',
      apple: '/assets/icons/apple-touch-icon.png',
      other: [
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          url: '/assets/icons/icon-192.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '512x512',
          url: '/assets/icons/icon-512.png',
        },
      ],
    },
    manifest: '/manifest.webmanifest',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch layout data and flags in parallel using Promise.allSettled
  // This ensures graceful degradation if one fails (partial success handling)
  const [layoutDataResult, layoutFlagsResult] = await Promise.allSettled([
    getLayoutData(),
    getLayoutFlags(),
  ]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled'
      ? layoutDataResult.value
      : {
          announcement: null,
          navigationData: {
            primary: [],
            secondary: [],
            actions: [],
          },
        };

  // Extract layout flags with fallbacks
  const layoutFlags =
    layoutFlagsResult.status === 'fulfilled'
      ? layoutFlagsResult.value
      : {
          useFloatingActionBar: false,
          fabSubmitAction: false,
          fabSearchAction: false,
          fabScrollToTop: false,
          fabNotifications: false,
          notificationsProvider: true,
          notificationsSheet: true,
          notificationsToasts: true,
          footerDelayVariant: '30s' as const,
          ctaVariant: 'value_focused' as const,
          notificationsEnabled: true,
          notificationsSheetEnabled: true,
          notificationsToastsEnabled: true,
          fabNotificationsEnabled: false,
        };

  // Log any failures for monitoring (but don't block render)
  if (layoutDataResult.status === 'rejected') {
    const normalized = normalizeError(layoutDataResult.reason, 'Failed to load layout data');
    logger.error('RootLayout: layout data fetch failed', normalized, {
      source: 'root-layout',
    });
  }

  if (layoutFlagsResult.status === 'rejected') {
    const normalized = normalizeError(layoutFlagsResult.reason, 'Failed to load layout flags');
    logger.error('RootLayout: layout flags fetch failed', normalized, {
      source: 'root-layout',
    });
  }

  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${inter.variable} ${geist.variable} ${geistMono.variable} font-sans`}
    >
      <head>
        {/* Viewport for responsive design */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />

        {/* PWA Manifest - Next.js generates at /manifest.webmanifest from src/app/manifest.ts */}
        {/* Manifest link is automatically injected by Next.js metadata API (line 109) */}

        {/* iOS Safari PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClaudePro" />
        <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" />

        {/* Theme Color for Mobile Browsers */}
        <meta name="theme-color" content="#000000" />

        {/* Strategic Resource Hints - Only for confirmed external connections */}

        {/* DNS Prefetch for faster resolution */}
        <link rel="dns-prefetch" href="https://umami.claudepro.directory" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />

        {/* Preconnect for critical third-party resources */}
        <link rel="preconnect" href="https://umami.claudepro.directory" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
      </head>
      <body className="font-sans">
        {/* Suspense boundary for structured data - streams after initial HTML */}
        <Suspense fallback={null}>
          <StructuredData route="/" />
        </Suspense>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={true}
          storageKey="claudepro-theme"
          disableTransitionOnChange={false}
          enableColorScheme={false}
        >
          <PostCopyEmailProvider>
            <NotificationsProvider
              flags={{
                enableNotifications: layoutFlags.notificationsEnabled,
                enableSheet: layoutFlags.notificationsSheetEnabled,
                enableToasts: layoutFlags.notificationsToastsEnabled,
                enableFab: layoutFlags.fabNotificationsEnabled,
              }}
            >
              <ErrorBoundary>
                <LayoutContent
                  announcement={layoutData.announcement}
                  navigationData={layoutData.navigationData}
                  useFloatingActionBar={layoutFlags.useFloatingActionBar}
                  fabFlags={{
                    showSubmit: layoutFlags.fabSubmitAction,
                    showSearch: layoutFlags.fabSearchAction,
                    showScrollToTop: layoutFlags.fabScrollToTop,
                    showNotifications: layoutFlags.fabNotificationsEnabled,
                  }}
                  footerDelayVariant={layoutFlags.footerDelayVariant}
                  ctaVariant={layoutFlags.ctaVariant}
                >
                  {children}
                </LayoutContent>
              </ErrorBoundary>
              <Toaster />
              <NotificationToastHandler />
              {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
            </NotificationsProvider>
          </PostCopyEmailProvider>
        </ThemeProvider>
        {/* Pulse Cannon - Unified pulse loading system (loads after page idle) */}
        {/* Zero initial bundle impact - all pulse services lazy-loaded */}
        <PulseCannon />
        {/* PWA Pulse - PWA installation and launch events */}
        <Pulse variant="pwa-install" />
        <Pulse variant="pwa-launch" />
        {/* Service Worker Registration for PWA Support */}
        <script src="/scripts/service-worker-init.js" defer={true} />
      </body>
    </html>
  );
}
