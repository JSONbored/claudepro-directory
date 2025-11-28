/**
 * Shared security headers builder
 * Provides consistent security headers across Node/Next and Deno edge runtimes
 */

export interface SecurityHeadersOptions {
  frameOptions?: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  contentTypeOptions?: boolean;
  xssProtection?: boolean;
  referrerPolicy?:
    | 'no-referrer'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'unsafe-url';
  permissionsPolicy?: string;
}

const DEFAULT_OPTIONS: Required<SecurityHeadersOptions> = {
  frameOptions: 'DENY',
  contentTypeOptions: true,
  xssProtection: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
};

/**
 * Build baseline security headers for HTTP responses
 */
export function buildSecurityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const headers: Record<string, string> = {};

  if (opts.frameOptions) {
    headers['X-Frame-Options'] = opts.frameOptions;
  }

  if (opts.contentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  if (opts.xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  if (opts.referrerPolicy) {
    headers['Referrer-Policy'] = opts.referrerPolicy;
  }

  if (opts.permissionsPolicy) {
    headers['Permissions-Policy'] = opts.permissionsPolicy;
  }

  return headers;
}
