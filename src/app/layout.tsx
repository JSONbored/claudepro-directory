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
import { connection } from 'next/server';
import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import './globals.css';
import { Toaster } from 'sonner';
import { AnnouncementBanner } from '@/src/components/layout/announcement-banner';
import { Footer } from '@/src/components/layout/footer';
import { Navigation } from '@/src/components/layout/navigation';
import { PostCopyEmailProvider } from '@/src/components/providers/post-copy-email-provider';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { FooterNewsletterBar } from '@/src/components/shared/footer-newsletter-bar';
import { PerformanceOptimizer } from '@/src/components/shared/performance-optimizer';
import { PwaInstallTracker } from '@/src/components/shared/pwa-install-tracker';
import { StructuredData } from '@/src/components/shared/structured-data';
import { UmamiScript } from '@/src/components/shared/umami-script';
import { OrganizationStructuredData } from '@/src/components/structured-data/organization-schema';
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
  const homeMetadata = generatePageMetadata('/');

  return {
    ...homeMetadata,
    metadataBase: new URL(APP_CONFIG.url),
    authors: [{ name: APP_CONFIG.author, url: `${APP_CONFIG.url}/about` }],
    openGraph: {
      ...homeMetadata.openGraph,
      locale: 'en_US',
      // OG images now generated via unified /api/og endpoint (included in homeMetadata)
    },
    twitter: {
      ...homeMetadata.twitter,
      creator: '@JSONbored',
      // Twitter images now generated via unified /api/og endpoint (included in homeMetadata)
    },
    alternates: {
      ...homeMetadata.alternates,
      types: {
        // OpenAPI 3.1.0 Specification for AI Discovery (RFC 9727)
        'application/openapi+json': '/openapi.json',
        // API Catalog for RFC 9727 Compliant Discovery
        'application/json': '/.well-known/api-catalog',
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
  // Opt-out of static generation for every page so the CSP nonce can be applied
  await connection();

  // Get CSP nonce for inline scripts
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans`}>
      <head>
        {/* PWA Manifest - Next.js generates at /manifest from src/app/manifest.ts */}
        <link rel="manifest" href="/manifest" />

        {/* iOS Safari PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClaudePro" />
        <link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png" />

        {/* Theme Color for Mobile Browsers */}
        <meta name="theme-color" content="#000000" />

        {/* API Discovery Metadata for AI Crawlers (RFC 9727) */}
        <meta name="api-spec" content="/openapi.json" />
        <meta name="api-version" content="1.0.0" />
        <meta name="api-catalog" content="/.well-known/api-catalog" />

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
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          {...(nonce ? { nonce } : {})}
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
                <AnnouncementBanner />
                <Navigation />
                {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
                <main id="main-content" className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </ErrorBoundary>
            <Toaster />
            <FooterNewsletterBar />
          </PostCopyEmailProvider>
        </ThemeProvider>
        <PerformanceOptimizer />
        <Analytics />
        <SpeedInsights />
        {/* Umami Analytics - Privacy-focused analytics (production only) */}
        {/* Suspense boundary for analytics - streams after critical content */}
        <Suspense fallback={null}>{await UmamiScript()}</Suspense>
        {/* PWA Install Tracking - Tracks PWA installation events */}
        <PwaInstallTracker />
        {/* Service Worker Registration for PWA Support */}
        {/* suppressHydrationWarning: Browsers remove nonce attribute after execution (security feature), causing harmless hydration warning */}
        <script
          src="/scripts/service-worker-init.js"
          nonce={nonce}
          defer
          suppressHydrationWarning
        />
      </body>
    </html>
  );
}
