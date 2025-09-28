/**
 * Get the base URL for the application based on environment
 * Centralizes URL generation to avoid hardcoded localhost references
 */

/**
 * Get the base URL for the current environment
 */
export function getBaseUrl(): string {
  // Check for explicitly set URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Production URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Development or local environment
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

/**
 * Get a full URL path for the application
 */
export function getFullUrl(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || !!process.env.VERCEL_URL;
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' && !process.env.VERCEL_URL;
}

/**
 * Get display URL for user-facing messages
 * Shows localhost in dev, actual domain in production
 */
export function getDisplayUrl(path?: string): string {
  if (isDevelopment()) {
    const port = process.env.PORT || '3000';
    const base = `http://localhost:${port}`;
    return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
  }

  // In production, use the actual domain or a placeholder
  const domain = process.env.NEXT_PUBLIC_DOMAIN || 'your-domain.com';
  const base = `https://${domain}`;
  return path ? `${base}${path.startsWith('/') ? path : `/${path}`}` : base;
}

/**
 * Get URLs for various environments
 */
export const urls = {
  development: () => getDisplayUrl(),
  production: () =>
    process.env.NEXT_PUBLIC_DOMAIN
      ? `https://${process.env.NEXT_PUBLIC_DOMAIN}`
      : 'https://your-domain.com',
  guides: () => getDisplayUrl('/guides'),
  agents: () => getDisplayUrl('/agents'),
  api: (endpoint: string) => getFullUrl(`/api/${endpoint}`),
};
