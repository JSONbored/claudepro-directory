// Dynamic imports for Vercel monitoring tools
// Load at page bottom to avoid blocking initial render (30KB bundle, 50-100ms TTI gain)
const Analytics = (await import('@vercel/analytics/next').catch(() => ({ Analytics: () => null })))
  .Analytics;

const SpeedInsights = (
  await import('@vercel/speed-insights/next').catch(() => ({ SpeedInsights: () => null }))
).SpeedInsights;

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import './globals.css';
import './view-transitions.css';
import './micro-interactions.css';
import './starry-night.css';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

// Lazy load notification system (40-50KB, only needed on interaction)
// FAB, Sheet, and ToastHandler only render when user triggers notification
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

const NotificationToastHandler = dynamic(
  () =>
    import('@/src/components/features/notifications/notification-toast-handler').then((mod) => ({
      default: mod.NotificationToastHandler,
    })),
  {
    loading: () => null,
  }
);

import { ErrorBoundary } from '@/src/components/infra/error-boundary';
import { PostCopyEmailProvider } from '@/src/components/infra/providers/post-copy-email-provider';
import { PwaInstallTracker } from '@/src/components/infra/pwa-install-tracker';
import { OrganizationStructuredData } from '@/src/components/infra/structured-data/organization-schema';
import { AnnouncementBanner } from '@/src/components/layout/announcement-banner-server';
import { FloatingMobileSearch } from '@/src/components/layout/floating-mobile-search';
import { Navigation } from '@/src/components/layout/navigation';
import { BackToTopButton } from '@/src/components/shared/back-to-top-button';

// Lazy load footer component for better performance (5-10KB bundle reduction)
const Footer = dynamic(
  () => import('@/src/components/layout/footer').then((mod) => ({ default: mod.Footer })),
  {
    loading: () => null,
    ssr: true, // Still render on server for SEO
  }
);

import { StructuredData } from '@/src/components/shared/structured-data';
import { UmamiScript } from '@/src/components/shared/umami-script';
import { APP_CONFIG } from '@/src/lib/constants';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

// Configure Inter font with optimizations
const inter = Inter({
  subsets: ['latin'],
  display: 'optional', // Changed from 'swap' to 'optional' for better performance (zero layout shifts)
  variable: '--font-inter',
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
});

// Generate homepage metadata from centralized registry
export async function generateMetadata(): Promise<Metadata> {
  const homeMetadata = await generatePageMetadata('/');

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
  // REMOVED: await connection() to enable ISR/static generation
  // CSP now uses hash-based strategy instead of nonces (see middleware.ts)
  // This allows content pages to be pre-rendered and served from CDN edge

  const headersList = await headers();

  // Detect auth routes - hide navigation/footer for clean auth experience
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';
  const isAuthRoute = pathname.startsWith('/login') || pathname.includes('/(auth)/');

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans`}>
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
          {await StructuredData({ type: 'website' })}
          {await OrganizationStructuredData()}
        </Suspense>
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
              <a
                href="#main-content"
                className={
                  'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground rounded-md'
                }
              >
                Skip to main content
              </a>
              <div className={'min-h-screen bg-background flex flex-col'}>
                {!isAuthRoute && <AnnouncementBanner />}
                {!isAuthRoute && <Navigation />}
                {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                {!isAuthRoute && <Footer />}
                {!isAuthRoute && <FloatingMobileSearch />}
                {!isAuthRoute && <BackToTopButton />}
                {!isAuthRoute && <NotificationFAB />}
                {!isAuthRoute && <NotificationSheet />}
              </div>
            </ErrorBoundary>
            <Toaster />
            {!isAuthRoute && <NotificationToastHandler />}
            <UnifiedNewsletterCapture variant="footer-bar" source="footer" />
          </PostCopyEmailProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        {/* Umami Analytics - Privacy-focused analytics (production only) */}
        {/* Suspense boundary for analytics - streams after critical content */}
        <Suspense fallback={null}>{await UmamiScript()}</Suspense>
        {/* PWA Install Tracking - Tracks PWA installation events */}
        <PwaInstallTracker />
        {/* Service Worker Registration for PWA Support */}
        <script src="/scripts/service-worker-init.js" defer />
      </body>
    </html>
  );
}
