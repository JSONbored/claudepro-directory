import Script from 'next/script';

// Client-safe environment check - doesn't trigger server env validation
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Umami Analytics Script Component
 *
 * Performance optimized with:
 * - Next.js Script component with afterInteractive strategy
 * - Loads after page is interactive (better than defer)
 * - Automatic script deduplication
 * - Production-only rendering
 * - SRI integrity hash for security
 * - External script whitelisted in CSP (no nonce needed)
 */
export function UmamiScript() {
  // Only load analytics in production
  if (!isProduction) {
    return null;
  }

  return (
    <Script
      strategy="afterInteractive"
      src="https://umami.claudepro.directory/script.js"
      data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
      integrity="sha384-gW+82edTiLqRoEvPbT3xKDCYZ5M02YXbW4tA3gbojZWiiMYNJZb4YneJrS4ri3Rn"
      crossOrigin="anonymous"
    />
  );
}
