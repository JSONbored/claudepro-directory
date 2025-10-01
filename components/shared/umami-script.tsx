'use client';

import Script from 'next/script';

// Client-safe environment check - doesn't trigger server env validation
const isProduction = process.env.NODE_ENV === 'production';

export function UmamiScript() {
  // Only load analytics in production
  if (!isProduction) {
    return null;
  }

  return (
    <Script
      src="https://umami.claudepro.directory/script.js"
      data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
      strategy="lazyOnload"
    />
  );
}
