'use client';

import Script from 'next/script';

/**
 * Umami Analytics Provider
 * Following the official Umami + Next.js integration pattern
 *
 * This is the ONLY place where Umami script is loaded
 * All event tracking happens through window.umami once loaded
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const websiteId =
    process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || 'b734c138-2949-4527-9160-7fe5d0e81121';
  const scriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || 'https://umami.claudepro.directory/script.js';

  // Only load analytics in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!(isProduction && websiteId)) {
    return <>{children}</>;
  }

  return (
    <>
      <Script
        src={scriptUrl}
        data-website-id={websiteId}
        strategy="lazyOnload"
        data-domains="claudepro.directory"
      />
      {children}
    </>
  );
}
