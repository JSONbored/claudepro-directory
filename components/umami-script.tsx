'use client';

import Script from 'next/script';
import { isProduction } from '@/lib/schemas/env.schema';

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
