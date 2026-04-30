import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

await initOpenNextCloudflareForDev();

const devUnsafeEval =
  process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

const securityHeaders = [
  {
    key: "content-security-policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      `script-src 'self' 'unsafe-inline'${devUnsafeEval} https://umami.heyclau.de https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.github.com https://img.shields.io https://umami.heyclau.de https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "form-action 'self' https://github.com",
      "manifest-src 'self'",
    ].join("; "),
  },
  {
    key: "cross-origin-opener-policy",
    value: "same-origin",
  },
  {
    key: "permissions-policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), browsing-topics=()",
  },
  {
    key: "referrer-policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "strict-transport-security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "x-content-type-options",
    value: "nosniff",
  },
  {
    key: "x-frame-options",
    value: "DENY",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/favicon.svg",
        permanent: true,
      },
      {
        source: "/hero.jpg",
        destination: "/og-image.png",
        permanent: true,
      },
      {
        source: "/community",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/board",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/board/new",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/for-you",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/gallery",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/gallery/:category",
        destination: "/browse",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/browse",
        permanent: true,
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug",
        destination: "/guides/:slug",
        permanent: true,
      },
      {
        source:
          "/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug/llms.txt",
        destination: "/guides/:slug/llms.txt",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
