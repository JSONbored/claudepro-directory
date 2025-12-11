import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './sugar-high.css';

import { getComponentCardConfig } from '@heyclaude/web-runtime/config/static-configs';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { ComponentConfigContextProvider } from '@heyclaude/web-runtime/hooks';
import { logger } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getLayoutData,
  DEFAULT_LAYOUT_DATA,
} from '@heyclaude/web-runtime/server';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { connection } from 'next/server';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';

import { AuthModalProvider } from '@/src/components/core/auth/auth-modal-provider';
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
 * Retrieve the homepage metadata and cache it with server-side revalidation.
 *
 * Uses server cache controls to keep a shared, public copy of the homepage metadata
 * and to revalidate on the schedule configured by the cache utilities.
 *
 * @returns The generated `Metadata` for the homepage.
 *
 * @see generatePageMetadata
 * @see cacheLife
 * @see cacheTag
 */
async function getCachedHomeMetadata(): Promise<Metadata> {
  'use cache';
  // Use named 'metadata' profile: 12hr stale, 24hr revalidate, 48hr expire
  cacheLife('metadata');
  cacheTag('homepage-metadata');

  return generatePageMetadata('/');
}

/**
 * Retrieve the site's homepage metadata.
 *
 * Delegates to a cached server helper that returns the generated Metadata for the root path.
 * The cached helper applies cache lifetimes and tags for ISR (stale-while-revalidate and revalidation).
 *
 * @returns The generated Metadata object for the homepage.
 *
 * @see getCachedHomeMetadata
 * @see generatePageMetadata
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
function getHomeMetadata() {
  return getCachedHomeMetadata();
}

/**
 * Provide site-wide Metadata for Next.js by merging cached homepage metadata with app-specific defaults.
 *
 * Fetches cached homepage metadata (used across pages for SEO) and augments it with the application's
 * base URL, author info, Open Graph and Twitter defaults, alternates, icons, and manifest.
 *
 * @returns A `Metadata` object combining the cached homepage metadata with app-level defaults:
 *          base URL, authors, Open Graph (including locale), Twitter creator handle, alternates (including `text/plain`),
 *          favicons/icons, and the web manifest.
 *
 * @see getHomeMetadata
 * @see APP_CONFIG
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  // Note: This metadata fetch is intentional in layout for site-wide SEO
  // The data is cached and shared across all pages
  // We await connection() first to ensure non-deterministic operations are allowed
  // eslint-disable-next-line architectural-rules/no-blocking-operations-in-layouts -- Site-wide metadata, cached and necessary for SEO
  await connection();
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
 * Server-safe Suspense fallback that renders children inside a full-height column layout.
 *
 * @param children - Content to render inside the main content area while the parent Suspense is pending
 * @param children.children
 * @returns A wrapper element with a background and a full-height main region containing `children`
 *
 * @see LayoutDataWrapper
 * @see LayoutContent
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
 * Fetches layout data non-blockingly and renders LayoutContent around the provided children.
 *
 * This async server component attempts to retrieve layout data (announcements and navigation)
 * and passes that data to LayoutContent. If the fetch fails, it falls back to DEFAULT_LAYOUT_DATA
 * and logs the failure; it does not throw or block rendering.
 *
 * @param children - The content to render inside LayoutContent
 *
 * @param children.children
 * @see getLayoutData
 * @see DEFAULT_LAYOUT_DATA
 * @see LayoutContent
 
 * @returns {Promise<unknown>} Description of return value*/
async function LayoutDataWrapper({ children }: { children: React.ReactNode }) {
  // Await connection() first to ensure non-deterministic operations are allowed
  // This prevents "Uncached data was accessed outside of <Suspense>" errors
  await connection();
  const [layoutDataResult] = await Promise.allSettled([getLayoutData()]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled' ? layoutDataResult.value : DEFAULT_LAYOUT_DATA;

  // Log any failures for monitoring (but don't block render)
  // eslint-disable-next-line architectural-rules/no-hardcoded-enum-values -- PromiseSettledResult status is a standard JavaScript value, not a database enum
  if (layoutDataResult.status === 'rejected') {
    const reqLogger = logger.child({
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
    reqLogger.error(
      { err: errorForLogging, source: 'root-layout' },
      'RootLayout: layout data fetch failed'
    );
  }

  return <LayoutContent announcement={layoutData.announcement}>{children}</LayoutContent>;
}

/**
 * Application root layout that provides the global HTML scaffold, fonts, meta tags, theme and notification providers, and top-level UI plumbing.
 *
 * Layout data (announcements and navigation) is fetched non-blockingly; on failure the component falls back to DEFAULT_LAYOUT_DATA and logs the error. Fonts are self-hosted and manifest/icons are configured for PWA support.
 *
 * @param children - Page content to be rendered inside the layout
 * @returns The root HTML element representing the application's top-level layout
 *
 * @see getLayoutData
 * @see DEFAULT_LAYOUT_DATA
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

        {/* Preconnect for critical third-party resources */}
        <link rel="preconnect" href="https://umami.claudepro.directory" crossOrigin="anonymous" />
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
              <AuthModalProvider>
                <ErrorBoundary>
                  <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
                    <LayoutDataWrapper>{children}</LayoutDataWrapper>
                  </Suspense>
                </ErrorBoundary>
                <Toaster />
                {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
              </AuthModalProvider>
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
