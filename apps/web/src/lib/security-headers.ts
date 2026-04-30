const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  process.env.NODE_ENV === "production" ? "" : "'unsafe-eval'",
  "https://umami.heyclau.de",
  "https://challenges.cloudflare.com",
]
  .filter(Boolean)
  .join(" ");

const SECURITY_HEADERS = {
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com https://img.shields.io https://umami.heyclau.de https://challenges.cloudflare.com",
    "frame-src https://challenges.cloudflare.com",
    "form-action 'self' https://github.com",
    "manifest-src 'self'",
  ].join("; "),
  "cross-origin-opener-policy": "same-origin",
  "permissions-policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
} as const;

export function applySecurityHeaders(headers: Headers) {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return headers;
}

export function getSecurityHeaders() {
  return Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
    key,
    value,
  }));
}
