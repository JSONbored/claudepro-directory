import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './shiki-code-blocks.css';

import { getComponentCardConfig } from '@heyclaude/web-runtime/config/static-configs';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { getLayoutData } from '@heyclaude/web-runtime/data/layout';
import { DEFAULT_LAYOUT_DATA } from '@heyclaude/web-runtime/data/layout/constants';
import { ComponentConfigContextProvider } from '@heyclaude/web-runtime/hooks/use-component-card-config';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { ErrorBoundary, LazyMotionProvider, MotionConfigProvider } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import localFont from 'next/font/local';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';

import { AuthModalProvider } from '@/src/components/core/auth/auth-modal-provider';
import { Pulse } from '@/src/components/core/infra/pulse';
import { PulseCannon } from '@/src/components/core/infra/pulse-cannon';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { WebVitalsReporter } from '@/src/components/core/infra/web-vitals-reporter';
import { LayoutContent } from '@/src/components/core/layout/root-layout-wrapper';
import { Toaster } from '@/src/components/primitives/feedback/sonner';

// Component config is now static

// Self-hosted fonts - no external requests, faster FCP, GDPR compliant
// OPTIMIZATION: Use 'swap' instead of 'optional' for faster text rendering (reduces LCP)
// 'swap' shows fallback immediately, then swaps to custom font when loaded
// OPTIMIZATION: Subset font weights to only used ones (400, 500, 600, 700) to reduce file size
const inter = localFont({
  display: 'swap', // Changed from 'optional' - shows text immediately with fallback, then swaps
  fallback: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Helvetica',
    'Arial',
    'sans-serif',
  ],
  preload: true,
  src: '../fonts/Inter-Variable.woff2',
  variable: '--font-inter',
  weight: '400 700', // Optimized: Only load weights 400, 500, 600, 700 (was 100-900)
});

// OPTIMIZATION: Lazy load Geist fonts (don't preload) - they're used less frequently
// Geist is used for headings, so it can load after initial render
const geist = localFont({
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  preload: false, // Optimized: Lazy load (was true) - Geist is secondary font
  src: '../fonts/GeistVF.woff2',
  variable: '--font-geist',
  weight: '400 700', // Optimized: Only load weights 400, 500, 600, 700 (was 100-900)
});

// OPTIMIZATION: Lazy load Geist Mono (don't preload) - only used for code blocks
const geistMono = localFont({
  display: 'swap',
  fallback: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
  preload: false, // Optimized: Lazy load (was true) - Geist Mono is only for code
  src: '../fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  weight: '400 700', // Optimized: Only load weights 400, 500, 600, 700 (was 100-900)
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
  cacheLife('long');
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
  'use cache';
  // Note: This metadata fetch is intentional in layout for site-wide SEO
  // The data is cached and shared across all pages
  // eslint-disable-next-line architectural-rules/no-blocking-operations-in-layouts -- Site-wide metadata, cached and necessary for SEO
  const homeMetadata = await getHomeMetadata();

  return {
    ...homeMetadata,
    alternates: {
      ...homeMetadata.alternates,
      types: {
        // LLMs.txt for AI-Optimized Plain Text Content (llmstxt.org)
        'text/plain': '/llms.txt',
      },
    },
    authors: [{ name: APP_CONFIG.author, url: `${APP_CONFIG.url}/about` }],
    icons: {
      apple: '/assets/icons/apple-touch-icon.png',
      icon: [
        { url: '/assets/icons/claudepro-directory-icon.ico' },
        {
          sizes: '16x16',
          type: 'image/png',
          url: '/assets/icons/favicon-16x16.png',
        },
        {
          sizes: '32x32',
          type: 'image/png',
          url: '/assets/icons/favicon-32x32.png',
        },
      ],
      other: [
        {
          rel: 'icon',
          sizes: '192x192',
          type: 'image/png',
          url: '/assets/icons/icon-192.png',
        },
        {
          rel: 'icon',
          sizes: '512x512',
          type: 'image/png',
          url: '/assets/icons/icon-512.png',
        },
      ],
      shortcut: '/assets/icons/claudepro-directory-icon.ico',
    },
    manifest: '/manifest.webmanifest',
    metadataBase: new URL(APP_CONFIG.url),
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
      <main className="flex-1" id="main-content">
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
  'use cache';

  // Initialize Infisical secrets early (non-blocking, cached)
  // This ensures secrets are available for Prisma client and other services
  // Initialization is idempotent (cached), so safe to call on every request
  try {
    const cacheModule = await import('@heyclaude/shared-runtime/infisical/cache');
    // Trigger initialization (cached - only runs once)
    // Fire-and-forget: If it fails, env vars will fallback to process.env
    void cacheModule.initializeInfisicalSecrets();
  } catch {
    // Silently fail - fallback to process.env
    // Infisical initialization errors shouldn't break the app
  }
  const [layoutDataResult] = await Promise.allSettled([getLayoutData()]);

  // Extract layout data with fallbacks
  const layoutData =
    layoutDataResult.status === 'fulfilled' ? layoutDataResult.value : DEFAULT_LAYOUT_DATA;

  // Log any failures for monitoring (but don't block render)
  // eslint-disable-next-line architectural-rules/no-hardcoded-enum-values -- PromiseSettledResult status is a standard JavaScript value, not a database enum
  if (layoutDataResult.status === 'rejected') {
    const reqLogger = logger.child({
      module: 'apps/web/src/app/layout',
      operation: 'RootLayout',
      route: '/',
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
      suppressHydrationWarning
      className={`${inter.variable} ${geist.variable} ${geistMono.variable} font-sans`}
      lang="en"
    >
      <head>
        {/* Viewport for responsive design */}
        <meta content="width=device-width, initial-scale=1, maximum-scale=5" name="viewport" />

        {/* PWA Manifest - Next.js generates at /manifest.webmanifest from src/app/manifest.ts */}
        {/* Manifest link is automatically injected by Next.js metadata API (line 109) */}

        {/* iOS Safari PWA Support */}
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />
        <meta content="ClaudePro" name="apple-mobile-web-app-title" />
        <link href="/assets/icons/apple-touch-icon.png" rel="apple-touch-icon" />

        {/* Theme Color for Mobile Browsers */}
        <meta content="#000000" name="theme-color" />

        {/* Strategic Resource Hints - Only for confirmed external connections */}

        {/* DNS Prefetch for faster resolution */}
        <link href="https://umami.claudepro.directory" rel="dns-prefetch" />

        {/* Preconnect for critical third-party resources */}
        <link crossOrigin="anonymous" href="https://umami.claudepro.directory" rel="preconnect" />
      </head>
      <body className="font-sans">
        {/* Suspense boundary for structured data - streams after initial HTML */}
        <Suspense fallback={null}>
          <StructuredData route="/" />
        </Suspense>
        <ComponentConfigContextProvider value={componentCardConfig}>
          <ThemeProvider
            enableSystem
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange={true}
            enableColorScheme={false}
            storageKey="claudepro-theme"
          >
            <LazyMotionProvider>
              <MotionConfigProvider reducedMotion="user">
                <AuthModalProvider>
                  <ErrorBoundary>
                    <Suspense fallback={<LayoutFallback>{children}</LayoutFallback>}>
                      <LayoutDataWrapper>{children}</LayoutDataWrapper>
                    </Suspense>
                  </ErrorBoundary>
                  <Toaster />
                  {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
                </AuthModalProvider>
              </MotionConfigProvider>
            </LazyMotionProvider>
          </ThemeProvider>
        </ComponentConfigContextProvider>
        {/* Web Vitals Reporter - Tracks Core Web Vitals metrics */}
        <WebVitalsReporter />
        {/* Pulse Cannon - Unified pulse loading system (loads after page idle) */}
        {/* Zero initial bundle impact - all pulse services lazy-loaded */}
        <PulseCannon />
        {/* PWA Pulse - PWA installation and launch events */}
        <Pulse variant="pwa-install" />
        <Pulse variant="pwa-launch" />
        {/* Service Worker Registration for PWA Support */}
        <script defer src="/scripts/service-worker-init.js" />
      </body>
    </html>
  );
}
