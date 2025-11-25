import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './sugar-high.css';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { unstable_cache } from 'next/cache';
import dynamicImport from 'next/dynamic';
import { Toaster } from 'sonner';

const NotificationToastHandler = dynamicImport(
  () =>
    import('@/src/components/features/notifications/notification-toast-handler').then((mod) => ({
      default: mod.NotificationToastHandler,
    })),
  {
    loading: () => null,
  }
);

import type { Database } from '@heyclaude/database-types';
import { isBuildTime } from '@heyclaude/web-runtime';
import { getComponentConfig } from '@heyclaude/web-runtime/actions';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { FeatureFlagsProvider } from '@heyclaude/web-runtime/feature-flags/provider';
import { generatePageMetadata, getLayoutData } from '@heyclaude/web-runtime/server';
import { ErrorBoundary } from '@/src/components/core/infra/error-boundary';
import { PostCopyEmailProvider } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Pulse } from '@/src/components/core/infra/pulse';
import { PulseCannon } from '@/src/components/core/infra/pulse-cannon';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { LayoutContent } from '@/src/components/core/layout/root-layout-wrapper';
import { ComponentConfigContextProvider } from '@/src/components/providers/component-config-context';
import {
  DEFAULT_COMPONENT_CARD_CONFIG,
  mapComponentCardConfig,
} from '@/src/components/providers/component-config-shared';
import { NotificationsProvider } from '@/src/components/providers/notifications-provider';

// CRITICAL: Lazy-load getLayoutFlags to prevent flags.ts from being analyzed during build
// Even though getLayoutFlags has build-time checks, Next.js's static analyzer might
// still traverse the import chain and see flags/next imports

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

const getCachedHomeMetadata = unstable_cache(
  async () => {
    return generatePageMetadata('/');
  },
  ['layout-home-metadata'],
  {
    revalidate: 86400,
    tags: ['homepage-metadata'],
  }
);

async function getHomeMetadata() {
  return getCachedHomeMetadata();
}

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

const DEFAULT_LAYOUT_DATA: {
  announcement: null;
  navigationData: Database['public']['Functions']['get_navigation_menu']['Returns'];
} = {
  announcement: null,
  navigationData: {
    primary: null,
    secondary: null,
    actions: null,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate single requestId for this layout request
  const requestId = generateRequestId();
  const logContext = createWebAppContextWithId(requestId, '/', 'RootLayout');

  // Fetch layout data
  // NOTE: Feature flags are handled via middleware (cookies) + client provider (context)
  // This allows RootLayout to remain Static/ISR compatible where possible.
  const [layoutDataResult] = await Promise.allSettled([getLayoutData()]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled' ? layoutDataResult.value : DEFAULT_LAYOUT_DATA;

  // Log any failures for monitoring (but don't block render)
  if (layoutDataResult.status === 'rejected') {
    const normalized = normalizeError(layoutDataResult.reason, 'Failed to load layout data');
    logger.error('RootLayout: layout data fetch failed', normalized, {
      ...logContext,
      source: 'root-layout',
    });
  }

  let componentCardConfig = DEFAULT_COMPONENT_CARD_CONFIG;
  if (isBuildTime()) {
    logger.info('RootLayout: build-time detected, using default component config');
  } else {
    try {
      const componentConfigResult = await getComponentConfig({});
      componentCardConfig = mapComponentCardConfig(componentConfigResult?.data ?? null);
      if (componentConfigResult?.serverError) {
        logger.warn('RootLayout: component config server error', undefined, {
          ...logContext,
          error: componentConfigResult.serverError,
        });
      }
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to load component config');
      logger.error('RootLayout: component config fallback to defaults', normalized, logContext);
    }
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
        <ComponentConfigContextProvider value={componentCardConfig}>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem={true}
            storageKey="claudepro-theme"
            disableTransitionOnChange={false}
            enableColorScheme={false}
          >
            <FeatureFlagsProvider initialFlags={null}>
              <PostCopyEmailProvider>
                <NotificationsProvider>
                  <ErrorBoundary>
                    <LayoutContent
                      announcement={layoutData.announcement}
                      navigationData={layoutData.navigationData}
                    >
                      {children}
                    </LayoutContent>
                  </ErrorBoundary>
                  <Toaster />
                  <NotificationToastHandler />
                  {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
                </NotificationsProvider>
              </PostCopyEmailProvider>
            </FeatureFlagsProvider>
          </ThemeProvider>
        </ComponentConfigContextProvider>
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
