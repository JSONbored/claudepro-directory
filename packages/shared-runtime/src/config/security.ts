import { APP_CONFIG } from '@heyclaude/shared-runtime';

export const SECURITY_CONFIG = {
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  trustedHostnames: {
    github: ['github.com', 'www.github.com'] as const,
    umami: ['umami.claudepro.directory'] as const,
    vercel: ['va.vercel-scripts.com'] as const,
  },
  allowedOrigins: [
    APP_CONFIG.url,
    'https://www.claudepro.directory',
    'https://dev.claudepro.directory',
  ] as const,
} as const;

export type SecurityConfig = typeof SECURITY_CONFIG;
