import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './sugar-high.css';

import { type Database } from '@heyclaude/database-types';
import { COMPONENT_FLAGS } from '@heyclaude/web-runtime/config/unified-config';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { fontFamily } from '@heyclaude/web-runtime/design-system';
import { ComponentConfigContextProvider } from '@heyclaude/web-runtime/hooks';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata, getLayoutData } from '@heyclaude/web-runtime/server';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { mapComponentCardConfig } from '@heyclaude/web-runtime/utils/component-card-config';
import { type Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import localFont from 'next/font/local';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps as NextThemesProps } from 'next-themes';
import { type ReactNode } from 'react';
import { Suspense } from 'react';
import { Toaster } from 'sonner';

import { PostCopyEmailProvider } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Pulse } from '@/src/components/core/infra/pulse';
import { PulseCannon } from '@/src/components/core/infra/pulse-cannon';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { LayoutContent } from '@/src/components/core/layout/root-layout-wrapper';
import { NotificationToastHandler } from '@/src/components/features/notifications/notification-toast-handler';
import { NotificationsProvider } from '@/src/components/providers/notifications-provider';

/**
 * Wrapper around the next-themes ThemeProvider that provides correct children typing for React 19.
 *
 * Ensures the provider accepts a ReactNode `children` prop while forwarding all other ThemeProvider props to the underlying next-themes provider.
 *
 * @param children - Rendered React nodes placed inside the theme provider
 * @param props - All other ThemeProvider props forwarded to the underlying next-themes provider
 * @returns The rendered ThemeProvider element
 *
 * @see NextThemesProvider
 */
function ThemeProvider({ children, ...props }: NextThemesProps & { children: ReactNode }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// Component config is now static

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
    revalidate: 86_400,
    tags: ['homepage-metadata'],
  }
);

async function getHomeMetadata() {
  return getCachedHomeMetadata();
}

// Generate homepage metadata from centralized registry
export async function generateMetadata(): Promise<Metadata> {
  // Note: This metadata fetch is intentional in layout for site-wide SEO
  // The data is cached and shared across all pages
  // eslint-disable-next-line architectural-rules/no-blocking-operations-in-layouts -- Site-wide metadata, cached and necessary for SEO
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

/**
 * Root application layout that renders the HTML shell and global providers.
 *
 * Renders the full document structure (html/head/body), wraps page content with
 * theme, notification, and layout providers, and mounts site-wide UI elements
 * (toasts, pulses, service-worker initialization). Fetches layout data (announcements
 * and navigation) in a non-blocking manner, falling back to DEFAULT_LAYOUT_DATA on
 * failure and logging errors without preventing render. Uses a per-request
 * requestId for scoped logging and is configured for static rendering to enable
 * SSG-friendly behavior.
 *
 * @param children - Page content rendered inside the layout
 *
 * @see getLayoutData
 * @see DEFAULT_LAYOUT_DATA
 * @see generateRequestId
 */

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Generate single requestId for this layout request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'RootLayout',
    route: '/',
    module: 'apps/web/src/app/layout',
  });

  // Fetch layout data (announcements and navigation)
  const [layoutDataResult] = await Promise.allSettled([getLayoutData()]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled' ? layoutDataResult.value : DEFAULT_LAYOUT_DATA;

  // Log any failures for monitoring (but don't block render)
  // eslint-disable-next-line architectural-rules/no-hardcoded-enum-values -- PromiseSettledResult status is a standard JavaScript value, not a database enum
  if (layoutDataResult.status === 'rejected') {
    const normalized = normalizeError(layoutDataResult.reason, 'Failed to load layout data');
    reqLogger.error('RootLayout: layout data fetch failed', normalized, {
      source: 'root-layout',
    });
  }

  // Get component card config from unified-config
  const componentCardConfig = mapComponentCardConfig(COMPONENT_FLAGS);

  return (
    <html
      lang="en"
      suppressHydrationWarning
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
      <body className={fontFamily.sans}>
        {/* Suspense boundary for structured data - streams after initial HTML */}
        <Suspense fallback={null}>
          <StructuredData route="/" />
        </Suspense>
        <ComponentConfigContextProvider value={componentCardConfig}>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="dark"
            enableSystem
            storageKey="claudepro-theme"
            disableTransitionOnChange={false}
            enableColorScheme={false}
          >
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
          </ThemeProvider>
        </ComponentConfigContextProvider>
        {/* Pulse Cannon - Unified pulse loading system (loads after page idle) */}
        {/* Zero initial bundle impact - all pulse services lazy-loaded */}
        <PulseCannon />
        {/* PWA Pulse - PWA installation and launch events */}
        <Pulse variant="pwa-install" />
        <Pulse variant="pwa-launch" />
        {/* Service Worker Registration for PWA Support */}
        <script src="/scripts/service-worker-init.js" defer />
      </body>
    </html>
  );
}