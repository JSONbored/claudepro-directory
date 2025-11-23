import { z } from 'zod';

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
  app: {
    main: 'https://claudepro.directory',
    www: 'https://www.claudepro.directory',
  },
});
