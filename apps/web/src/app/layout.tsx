import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './sugar-high.css';

import { getComponentCardConfig } from '@heyclaude/web-runtime/config/static-configs';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { ComponentConfigContextProvider } from '@heyclaude/web-runtime/hooks';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getLayoutData,
  DEFAULT_LAYOUT_DATA,
} from '@heyclaude/web-runtime/server';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';

import { PostCopyEmailProvider } from '@/src/components/core/infra/providers/email-capture-modal-provider';
import { Pulse } from '@/src/components/core/infra/pulse';
import { PulseCannon } from '@/src/components/core/infra/pulse-cannon';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { LayoutContent } from '@/src/components/core/layout/root-layout-wrapper';
import { Toaster } from '@/src/components/primitives/feedback/sonner';

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

/**
 * Get cached homepage metadata
 *
 * Uses 'use cache' to cache homepage metadata for 24 hours.
 * This data is public and same for all users, so it can be cached at build time.
 */
async function getCachedHomeMetadata(): Promise<Metadata> {
  'use cache';
  cacheLife({ stale: 43_200, revalidate: 86_400, expire: 172_800 }); // 12hr stale, 24hr revalidate, 48hr expire
  cacheTag('homepage-metadata');

  return generatePageMetadata('/');
}

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

/**
 * Simple server component fallback for Suspense
 * Does not use any client-side hooks to avoid blocking during prerendering
 */
function LayoutFallback({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}

/**
 * Server component wrapper that fetches layout data and passes it to LayoutContent
 * Wrapped in Suspense to avoid blocking the layout render
 */
async function LayoutDataWrapper({ children }: { children: React.ReactNode }) {
  const [layoutDataResult] = await Promise.allSettled([getLayoutData()]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled' ? layoutDataResult.value : DEFAULT_LAYOUT_DATA;

  // Log any failures for monitoring (but don't block render)
  // eslint-disable-next-line architectural-rules/no-hardcoded-enum-values -- PromiseSettledResult status is a standard JavaScript value, not a database enum
  if (layoutDataResult.status === 'rejected') {
    // Generate requestId for logging (after data access, so Date.now() is allowed)
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'RootLayout',
      route: '/',
      module: 'apps/web/src/app/layout',
    });
    // logger.error() normalizes errors internally, so pass raw error
    // Convert unknown error to Error | string for TypeScript
    const errorForLogging: Error | string =
      layoutDataResult.reason instanceof Error
        ? layoutDataResult.reason
        : String(layoutDataResult.reason);
    reqLogger.error('RootLayout: layout data fetch failed', errorForLogging, {
      source: 'root-layout',
    });
  }

  return (
    <LayoutContent
      announcement={layoutData.announcement}
      navigationData={layoutData.navigationData}
    >
      {children}
    </LayoutContent>
  );
}

/**
 * Application root layout that renders the global HTML scaffold and top-level providers.
 *
 * Renders HTML/head/body with global meta, font variables, theme and notification providers, and layout content. Layout data (announcements and navigation) is fetched non-blockingly; on failure the component falls back to DEFAULT_LAYOUT_DATA and logs the error. The layout is statically rendered (no server actions or headers) and uses static component configuration.
 *
 * @param children - Page content to be rendered inside the layout
 * @returns The root HTML element for the application layout
 *
 * @see getLayoutData
 * @see DEFAULT_LAYOUT_DATA
 * @see generateRequestId
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get component card config from static defaults
  const componentCardConfig = getComponentCardConfig();

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
      <body className="font-sans">
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
              <ErrorBoundary>
                <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
                  <LayoutDataWrapper>{children}</LayoutDataWrapper>
                </Suspense>
              </ErrorBoundary>
              <Toaster />
              {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
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
