import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from 'sonner';
import { Footer } from '@/src/components/layout/footer';
import { Navigation } from '@/src/components/layout/navigation';
import { ErrorBoundary } from '@/src/components/shared/error-boundary';
import { PerformanceOptimizer } from '@/src/components/shared/performance-optimizer';
import { StructuredData } from '@/src/components/shared/structured-data';
import { UmamiScript } from '@/src/components/shared/umami-script';
import { WebVitals } from '@/src/components/shared/web-vitals';
import { OrganizationStructuredData } from '@/src/components/structured-data/organization-schema';
import { APP_CONFIG } from '@/src/lib/constants';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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
      ...homeMetadata.twitter,
      creator: '@JSONbored',
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
        { url: '/assets/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/assets/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
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
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />

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
        {await StructuredData({ type: 'website' })}
        {await OrganizationStructuredData()}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          {...(nonce ? { nonce } : {})}
        >
          <ErrorBoundary>
            <a
              href="#main-content"
              className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:${UI_CLASSES.Z_50} focus:px-4 focus:${UI_CLASSES.PY_2} focus:bg-primary focus:text-primary-foreground ${UI_CLASSES.ROUNDED_MD}`}
            >
              Skip to main content
            </a>
            <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background flex flex-col`}>
              <Navigation />
              {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
        <PerformanceOptimizer />
        <Analytics />
        <WebVitals />
        {/* Umami Analytics - Privacy-focused analytics (production only) */}
        {await UmamiScript()}
        {/* Service Worker Registration for PWA Support */}
        <script
          src="/scripts/service-worker-init.js"
          integrity="sha384-0tKKFTk8IlkGOHQjqC00b0Xn/MEUQcn73JljDRsW34lCFxSqKEUZwBNKSp9N/AM/"
          crossOrigin="anonymous"
          nonce={nonce}
          defer
        />
      </body>
    </html>
  );
}
