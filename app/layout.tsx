import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Toaster } from 'sonner';
import { Navigation } from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
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
      'Explore 1000+ Claude configurations including agents, MCP servers, rules, commands, and hooks. Free and open source.',
    images: [
      {
        url: 'https://claudepro.directory/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Claude Pro Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude Pro Directory - Community Configurations for Claude AI',
    description:
      'Explore 1000+ Claude configurations including agents, MCP servers, rules, commands, and hooks. Free and open source.',
    images: ['https://claudepro.directory/og-image.png'],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <div className="min-h-screen bg-background">
            <Navigation />
            <main>{children}</main>
          </div>
          <Toaster />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
