/**
 * Shared security headers builder
 * Provides consistent security headers across Node/Next and Deno edge runtimes
 */

export interface SecurityHeadersOptions {
  contentTypeOptions?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN';
  permissionsPolicy?: string;
  referrerPolicy?:
    | 'no-referrer'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  xssProtection?: boolean;
}

const DEFAULT_OPTIONS: Required<SecurityHeadersOptions> = {
  contentTypeOptions: true,
  frameOptions: 'DENY',
  permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  referrerPolicy: 'strict-origin-when-cross-origin',
  xssProtection: true,
};

/**
 * Build baseline security headers for HTTP responses
 */
export function buildSecurityHeaders(options: SecurityHeadersOptions = {}): Record<string, string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const headers: Record<string, string> = {};

  // Validate and set X-Frame-Options: only allow DENY or SAMEORIGIN
  // ALLOW-FROM is deprecated and requires a URI parameter, so we reject it
  // Since frameOptions type only allows 'DENY' | 'SAMEORIGIN', we can safely use it directly
  const frameOption = opts.frameOptions === 'SAMEORIGIN' ? 'SAMEORIGIN' : 'DENY';
  headers['X-Frame-Options'] = frameOption;

  if (opts.contentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  if (opts.xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  // referrerPolicy always has a value from defaults
  headers['Referrer-Policy'] = opts.referrerPolicy;

  if (opts.permissionsPolicy) {
    headers['Permissions-Policy'] = opts.permissionsPolicy;
  }

  return headers;
}
