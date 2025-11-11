// Dynamic imports for Vercel monitoring tools
// Load at page bottom to avoid blocking initial render (30KB bundle, 50-100ms TTI gain)
const Analytics = (await import('@vercel/analytics/next').catch(() => ({ Analytics: () => null })))
  .Analytics;

const SpeedInsights = (
  await import('@vercel/speed-insights/next').catch(() => ({ SpeedInsights: () => null }))
).SpeedInsights;

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
import { PostCopyEmailProvider } from '@/src/components/core/infra/providers/post-copy-email-provider';
import { PwaInstallTracker } from '@/src/components/core/infra/pwa-install-tracker';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { getActiveAnnouncement } from '@/src/components/core/layout/announcement-banner-server';
import { LayoutContent } from '@/src/components/core/layout/layout-content';

import { UmamiScript } from '@/src/components/core/shared/umami-script';
import { APP_CONFIG } from '@/src/lib/constants';
import { featureFlags } from '@/src/lib/flags';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

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
  // Fetch announcement data server-side using anonymous client (ISR-safe)
  const announcement = await getActiveAnnouncement();

  // Fetch feature flags server-side for A/B testing and gradual rollouts
  const useFloatingActionBar = await featureFlags.floatingActionBar();

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
              <LayoutContent
                announcement={announcement}
                useFloatingActionBar={useFloatingActionBar}
              >
                {children}
              </LayoutContent>
            </ErrorBoundary>
            <Toaster />
            <NotificationToastHandler />
            {/* Newsletter capture is conditionally rendered in LayoutContent for non-auth pages */}
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
