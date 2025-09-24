import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from 'sonner';
import { Navigation } from '@/components/navigation';
import { PerformanceOptimizer } from '@/components/performance-optimizer';
import { StructuredData } from '@/components/structured-data';
import { WebVitals } from './components/web-vitals';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://claudepro.directory'),
  title: 'Claude Pro Directory - Community Configurations for Claude AI',
  description:
    'Discover and share the best Claude AI configurations, MCP servers, agents, rules, commands, and hooks. The ultimate community-driven directory for Claude Pro users.',
  keywords:
    'Claude AI, MCP servers, AI agents, Claude rules, Claude commands, Claude hooks, Model Context Protocol, prompt engineering, AI configurations, Claude Pro',
  authors: [{ name: 'JSONbored', url: 'https://github.com/JSONbored' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://claudepro.directory/',
    siteName: 'Claude Pro Directory',
    title: 'Claude Pro Directory - Community Configurations for Claude AI',
    description:
      'Explore 50+ Claude configurations including agents, MCP servers, rules, commands, and hooks. Free and open source.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Claude Pro Directory - Community Configurations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Pro Directory - Community Configurations for Claude AI',
    description:
      'Explore 50+ Claude configurations including agents, MCP servers, rules, commands, and hooks. Free and open source.',
    images: ['/twitter-image'],
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
    canonical: 'https://claudepro.directory/',
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
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get nonce from headers for CSP
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || '';

  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/site.webmanifest" />

        {/* iOS Safari PWA Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ClaudePro" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme Color for Mobile Browsers */}
        <meta name="theme-color" content="#000000" />

        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://umami.claudepro.directory" />
        <link rel="dns-prefetch" href="https://umami.claudepro.directory" />
        <link rel="preconnect" href="https://vitals.vercel-insights.com" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        <link rel="dns-prefetch" href="https://va.vercel-scripts.com" />
      </head>
      <body className="font-sans">
        <StructuredData type="website" />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
          >
            Skip to main content
          </a>
          <div className="min-h-screen bg-background">
            <Navigation />
            {/* biome-ignore lint/correctness/useUniqueElementIds: Static ID required for skip navigation accessibility */}
            <main id="main-content">{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
        <PerformanceOptimizer />
        <Analytics />
        <WebVitals />
        <Script strategy="afterInteractive" nonce={nonce}>
          {`
            // Register service worker only on client side
            if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/service-worker.js')
                  .then(function(registration) {
                    console.log('ServiceWorker registration successful:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('ServiceWorker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
        {/* Umami Analytics - Privacy-focused analytics (production only) */}
        {process.env.NODE_ENV === 'production' && (
          <Script
            src="https://umami.claudepro.directory/script.js"
            data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
            strategy="lazyOnload"
            nonce={nonce}
          />
        )}
      </body>
    </html>
  );
}
