import { headers } from "next/headers";

// Client-safe environment check - doesn't trigger server env validation
const isProduction = process.env.NODE_ENV === "production";

/**
 * Umami Analytics Script Component
 *
 * Performance optimized with:
 * - Deferred loading (non-blocking)
 * - CSP nonce for security
 * - Production-only rendering
 * - SRI integrity hash
 */
export async function UmamiScript() {
  // Only load analytics in production
  if (!isProduction) {
    return null;
  }

  // Get the nonce from CSP header for strict-dynamic compatibility
  const headersList = await headers();
  const cspHeader = headersList.get("content-security-policy");
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

  return (
    <script
      defer
      src="https://umami.claudepro.directory/script.js"
      data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
      integrity="sha384-gW+82edTiLqRoEvPbT3xKDCYZ5M02YXbW4tA3gbojZWiiMYNJZb4YneJrS4ri3Rn"
      crossOrigin="anonymous"
      nonce={nonce}
    />
  );
}
