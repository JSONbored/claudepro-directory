import { headers } from 'next/headers';
import Script from 'next/script';

// Client-safe environment check - doesn't trigger server env validation
const isProduction = process.env.NODE_ENV === 'production';

export async function UmamiScript() {
  // Only load analytics in production
  if (!isProduction) {
    return null;
  }

  // Get the nonce from CSP header for strict-dynamic compatibility
  const headersList = await headers();
  const cspHeader = headersList.get('content-security-policy');
  const nonce = cspHeader?.match(/nonce-([a-zA-Z0-9+/=]+)/)?.[1];

  return (
    <Script
      src="https://umami.claudepro.directory/script.js"
      data-website-id="b734c138-2949-4527-9160-7fe5d0e81121"
      integrity="sha384-PFqUEdHVrSOSpICvHVdlcWE6pKB/vTQI0WLgkDWMdsDJDsIuRuK0hDO54xvpXSaT"
      crossOrigin="anonymous"
      strategy="afterInteractive"
      nonce={nonce}
    />
  );
}
