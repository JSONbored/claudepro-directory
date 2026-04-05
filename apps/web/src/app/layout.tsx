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
    default: `${siteConfig.name} | Claude Directory`,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
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
          strategy="afterInteractive"
        />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
