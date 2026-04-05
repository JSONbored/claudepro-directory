import type { Metadata } from "next";
import { GeistMono, GeistSans } from "geist/font";
import type { ReactNode } from "react";
import Script from "next/script";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { siteConfig } from "@/lib/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Claude Configs, MCP Servers, Skills, and Jobs`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: {
    canonical: siteConfig.url
  },
  openGraph: {
    type: "website",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Claude Configs, MCP Servers, Skills, and Jobs`,
    description: siteConfig.description
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Claude Configs, MCP Servers, Skills, and Jobs`,
    description: siteConfig.description
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="page-shell font-[family-name:var(--font-geist-sans)] text-[var(--ink)] antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`try {
            const stored = localStorage.getItem("heyclaude-theme");
            const theme = stored === "light" || stored === "dark" ? stored : "dark";
            document.documentElement.classList.toggle("dark", theme === "dark");
          } catch {
            document.documentElement.classList.add("dark");
          }`}
        </Script>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
