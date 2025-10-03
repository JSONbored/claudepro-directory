import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
// biome-ignore lint/nursery/noUnresolvedImports: Next.js font export exists (verified)
import { Inter } from 'next/font/google';
// biome-ignore lint/nursery/noUnresolvedImports: Next.js server export exists (verified)
import { connection } from 'next/server';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from 'sonner';
import { Navigation } from '@/components/layout/navigation';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { PerformanceOptimizer } from '@/components/shared/performance-optimizer';
import { StructuredData } from '@/components/shared/structured-data';
import { UmamiScript } from '@/components/shared/umami-script';
import { WebVitals } from '@/components/shared/web-vitals';
import { OrganizationStructuredData } from '@/components/structured-data/organization-schema';
import { APP_CONFIG, SEO_CONFIG } from '@/lib/constants';
import { UI_CLASSES } from '@/lib/ui-constants';

// Configure Inter font with optimizations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
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

export const metadata: Metadata = {
  metadataBase: new URL(APP_CONFIG.url),
  title: SEO_CONFIG.titleTemplate.replace('%s', SEO_CONFIG.defaultTitle),
  description: SEO_CONFIG.defaultDescription,
  keywords: SEO_CONFIG.keywords.join(', '),
  authors: [{ name: APP_CONFIG.author, url: `${APP_CONFIG.url}/about` }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${APP_CONFIG.url}/`,
    siteName: APP_CONFIG.name,
    title: SEO_CONFIG.titleTemplate.replace('%s', SEO_CONFIG.defaultTitle),
    description: SEO_CONFIG.defaultDescription,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${APP_CONFIG.name} - Community Configurations`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO_CONFIG.titleTemplate.replace('%s', SEO_CONFIG.defaultTitle),
    description: SEO_CONFIG.defaultDescription,
    // Next.js automatically uses opengraph-image if no twitter-image is specified
    creator: '@JSONbored',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: `${APP_CONFIG.url}/`,
    types: {
      // OpenAPI 3.1.0 Specification for AI Discovery (RFC 9727)
      'application/openapi+json': '/openapi.json',
      // API Catalog for RFC 9727 Compliant Discovery
      'application/json': '/.well-known/api-catalog',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '192x192',
        url: '/icon-192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/icon-512.png',
      },
    ],
  },
  manifest: '/manifest.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt-out of static generation for every page so the CSP nonce can be applied
  await connection();

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} font-sans`}>
      <head>
        {/* Critical Resource Preloading for optimal network chain */}
        <link
          rel="preload"
          href="/_next/static/css/app/layout.css"
          as="style"
          crossOrigin="anonymous"
        />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* iOS Safari PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClaudePro" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

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
        <StructuredData type="website" />
        <OrganizationStructuredData />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ErrorBoundary>
            <a
              href="#main-content"
              className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:${UI_CLASSES.Z_50} focus:px-4 focus:${UI_CLASSES.PY_2} focus:bg-primary focus:text-primary-foreground ${UI_CLASSES.ROUNDED_MD}`}
            >
              Skip to main content
            </a>
            <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
              <Navigation />
              {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
              <main id="main-content">{children}</main>
            </div>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
        <PerformanceOptimizer />
        <Analytics />
        <WebVitals />
        {/* Umami Analytics - Privacy-focused analytics (production only) */}
        <UmamiScript />
        {/* Service Worker Registration for PWA Support */}
        <script
          src="/scripts/service-worker-init.js"
          integrity="sha384-0tKKFTk8IlkGOHQjqC00b0Xn/MEUQcn73JljDRsW34lCFxSqKEUZwBNKSp9N/AM/"
          crossOrigin="anonymous"
          defer
        />
      </body>
    </html>
  );
}
