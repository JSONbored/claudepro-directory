import type { Metadata } from "next";
import { GeistMono, GeistSans } from "geist/font";
import type { ReactNode } from "react";
import Script from "next/script";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { JsonLd } from "@/components/json-ld";
import { IntentEventReporter } from "@/components/intent-event-reporter";
import { NewsletterPrompt } from "@/components/newsletter-prompt";
import { RelaunchPrompt } from "@/components/relaunch-prompt";
import { ToastProvider } from "@/components/ui/toast-provider";
import { siteConfig } from "@/lib/site";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
} from "@heyclaude/registry/seo";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  title: {
    default: `${siteConfig.name} | Claude Directory`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    title: `${siteConfig.name} | Claude Directory`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `/api/og?title=${encodeURIComponent(`${siteConfig.name} | Claude Directory`)}&description=${encodeURIComponent(siteConfig.description)}`,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Claude directory`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Claude Directory`,
    description: siteConfig.description,
    images: [
      `/api/og?title=${encodeURIComponent(`${siteConfig.name} | Claude Directory`)}&description=${encodeURIComponent(siteConfig.description)}`,
    ],
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const siteJsonLd = [
    buildOrganizationJsonLd({
      siteUrl: siteConfig.url,
      name: siteConfig.name,
      githubUrl: siteConfig.githubUrl,
      twitterUrl: siteConfig.twitterUrl,
      discordUrl: siteConfig.discordUrl,
    }),
    buildWebsiteJsonLd({
      siteUrl: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
    }),
  ];

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased">
        <JsonLd data={siteJsonLd} />
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            const stored = localStorage.getItem("heyclaude-theme");
            document.documentElement.classList.toggle("dark", stored !== "light");
          } catch {
            document.documentElement.classList.add("dark");
          }`}
        </Script>
        <Script
          id="umami-analytics"
          src="https://umami.heyclau.de/script.js"
          data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
          strategy="lazyOnload"
        />
        <ToastProvider>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
          <NewsletterPrompt />
          <RelaunchPrompt />
          <IntentEventReporter />
        </ToastProvider>
      </body>
    </html>
  );
}
