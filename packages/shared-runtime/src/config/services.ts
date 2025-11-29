import { z } from 'zod';

import { getEnvVar } from '../env.ts';

/**
 * Default site URL fallback
 */
// eslint-disable-next-line architectural-rules/no-hardcoded-urls
const DEFAULT_SITE_URL = 'https://claudepro.directory';

/**
 * External Services & CDN URLs
 * Centralized external service URLs for CSP, middleware, and integrations
 * Used in proxy.ts CSP headers, OAuth configs, and API integrations
 */
const externalServicesSchema = z.object({
  // Analytics & Monitoring
  umami: z.object({
    analytics: z.string().url(),
  }),
  vercel: z.object({
    scripts: z.string(),
    toolbar: z.string().url(),
  }),
  betterstack: z.object({
    status: z.string().url(),
  }),

  // OAuth Providers
  github: z.object({
    site: z.string().url(),
    userContent: z.string(),
    api: z.string().url(),
  }),
  google: z.object({
    accounts: z.string().url(),
  }),

  // Backend Services
  supabase: z.object({
    pattern: z.string(),
  }),

  // Main Domain
  app: z.object({
    main: z.string().url(),
    www: z.string().url(),
  }),
});

export const EXTERNAL_SERVICES = externalServicesSchema.parse({
  // Analytics & Monitoring
  umami: {
    analytics: 'https://umami.claudepro.directory',
  },
  vercel: {
    scripts: 'https://*.vercel-scripts.com',
    toolbar: 'https://vercel.live',
  },
  betterstack: {
    status: 'https://status.claudepro.directory',
  },

  // OAuth Providers
  github: {
    site: 'https://github.com',
    userContent: 'https://*.githubusercontent.com',
    api: 'https://api.github.com',
  },
  google: {
    accounts: 'https://accounts.google.com',
  },

  // Backend Services
  supabase: {
    pattern: 'https://*.supabase.co',
  },

  // Main Domain
  app: (() => {
    const siteUrl = getEnvVar('NEXT_PUBLIC_SITE_URL') ?? DEFAULT_SITE_URL;
    const wwwUrl = (() => {
      if (siteUrl.startsWith('http://www.') || siteUrl.startsWith('https://www.')) {
        return siteUrl;
      }
      // Only add www. if there's no subdomain (naked domain)
      const match = siteUrl.match(/^(https?:\/\/)([^/]+)/);
      if (match?.[1] && match[2]) {
        const protocol = match[1];
        const domain = match[2];
        // Check if domain has subdomain by counting dots (simple heuristic)
        // If 2+ dots, likely has subdomain; if 1 dot, naked domain
        const dotCount = domain.split('.').length - 1;
        return dotCount === 1 ? `${protocol}www.${domain}` : siteUrl;
      }
      return siteUrl;
    })();
    return {
      main: siteUrl,
      www: wwwUrl,
    };
  })(),
});
