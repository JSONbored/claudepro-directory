import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
if (!process.env.BROWSERSLIST_CONFIG) {
  process.env.BROWSERSLIST_CONFIG = resolve(__dirname, '../../config/tools/browserslist');
}

let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    const bundleAnalyzer = (await import('@next/bundle-analyzer')).default;
    withBundleAnalyzer = bundleAnalyzer({ enabled: true });
  } catch {
    // Bundle analyzer not installed - continue without it
  }
}

/**
 * Next.js 16.0.2 configuration with Turbopack, React Compiler, and optimized caching
 *
 * Middleware migration: Completed - using proxy.ts (Next.js 16 convention)
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  reactCompiler: true,
  cacheComponents: false,
  transpilePackages: [
    '@heyclaude/web-runtime',
    '@heyclaude/shared-runtime',
    '@heyclaude/data-layer',
    '@heyclaude/database-types',
  ],
  // Exclude packages that shouldn't be bundled
  serverExternalPackages: ['@imagemagick/magick-wasm'],
  cacheLife: {
    minutes: { stale: 300, revalidate: 60, expire: 3600 },
    quarter: { stale: 900, revalidate: 300, expire: 7200 },
    half: { stale: 1800, revalidate: 600, expire: 10800 },
    hours: { stale: 3600, revalidate: 900, expire: 86400 },
    stable: { stale: 21600, revalidate: 3600, expire: 604800 },
    static: { stale: 86400, revalidate: 21600, expire: 2592000 },
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    remotePatterns: [
      { protocol: 'https', hostname: 'github.com' },
      { protocol: 'https', hostname: '*.githubusercontent.com' },
      { protocol: 'https', hostname: 'claudepro.directory' },
      { protocol: 'https', hostname: 'www.claudepro.directory' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'hgtjdifxfapoltfflowc.supabase.co' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    disableStaticImages: false,
    contentDispositionType: 'inline',
    // SVG handling: enabled with strict CSP for defense-in-depth
    // Trust model: We only use next/image with SVGs from trusted sources:
    // - Internal assets (self-hosted)
    // - GitHub/GitHubusercontent (for repository avatars/icons - trusted content)
    // - Supabase storage (our own controlled content)
    // - Googleusercontent (OAuth provider avatars - trusted)
    // Note: SVGs in <img> tags are sandboxed by browsers and cannot execute scripts,
    // and our CSP further restricts what can be loaded. We do NOT use next/image
    // with untrusted user-controlled SVGs from these domains.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy:
      "default-src 'none'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';",
  },

  turbopack: {
    resolveAlias: {
      '@': './',
      '@components': './components',
      '@lib': './lib',
      '@hooks': './hooks',
      '@types': './types',
      '@utils': './lib/utils',
      '@content': './content',
      '@generated': './generated',
      // Stub out edge function image manipulation code for web bundle
      '@heyclaude/shared-runtime/src/image/manipulation': resolve(__dirname, './src/lib/stubs/image-manipulation-stub.ts'),
    },
  },

  outputFileTracingExcludes: {
    '/*': [
      '.next/cache/**/*',
      '.next/trace',
      '.git/**/*',
      'node_modules/@types/**/*',
      'node_modules/typescript/**/*',
      'scripts/**/*',
      'config/tools/**/*',
      '__tests__/**/*',
      'tests/**/*',
      '*.test.*',
      // Exclude edge function image manipulation code
      '**/packages/shared-runtime/src/image/manipulation.ts',
      '**/node_modules/@imagemagick/**/*',
      '*.spec.*',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    '/guides/**': ['./docs/**/*', './scripts/**/*'],
  },
  // Optimize output file tracing for standalone builds
  // Only include essential files to reduce bundle size
  outputFileTracingIncludes: {
    '/': [
      'packages/web-runtime/src/**/*',
      'packages/shared-runtime/src/**/*',
      'packages/data-layer/src/**/*',
      'packages/database-types/dist/**/*',
      'packages/web-runtime/src/config/generated-config.ts',
      'packages/web-runtime/src/data/config/category/category-config.generated.ts',
    ],
  },

  experimental: {
    turbopackFileSystemCacheForDev: true,
    staticGenerationMaxConcurrency: 32,
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    serverComponentsHmrCache: true,
    inlineCss: true,
    serverActions: {
      // Normalize VERCEL_URL to extract hostname and include it explicitly for preview deployments.
      // Note: Next.js does not support wildcard patterns (*.vercel.app) in allowedOrigins.
      allowedOrigins: (() => {
        if (!process.env.VERCEL_URL) {
          return undefined;
        }
        const origins = ['claudepro.directory', 'www.claudepro.directory'];
        // Normalize VERCEL_URL to extract hostname (e.g., "project-abc123.vercel.app")
        try {
          const vercelUrl = process.env.VERCEL_URL;
          // VERCEL_URL can be a full URL or just hostname
          const hostname = vercelUrl.startsWith('http')
            ? new URL(vercelUrl).hostname
            : vercelUrl;
          // Validate hostname before adding (trim, non-empty)
          if (hostname && hostname.trim() && !origins.includes(hostname)) {
            origins.push(hostname.trim());
          }
        } catch (error) {
          // If VERCEL_URL parsing fails, log warning and skip (origins already has production domains)
          // Use console.warn as fallback (config files can use console, and we avoid async imports in sync context)
          if (process.env.NODE_ENV === 'development') {
            console.warn('[next.config] Failed to parse VERCEL_URL:', process.env.VERCEL_URL, error);
          }
        }
        return origins;
      })(),
      bodySizeLimit: '1mb',
    },
    cssChunking: 'strict',
    scrollRestoration: true,
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
    gzipSize: true,
    optimizePackageImports: [
      'lucide-react',
      'embla-carousel-react',
      'sonner',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      '@vercel/analytics',
      '@vercel/speed-insights',
      'next-themes',
      'react-error-boundary',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'motion',
      'zustand',
      'react-share',
      'next-safe-action',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-popover',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'cmdk',
      'devalue',
      'dompurify',
      'sanitize-html',
    ],
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    reactRemoveProperties:
      process.env.NODE_ENV === 'production' ? { properties: ['^data-test'] } : false,
  },

  webpack: (config, { dev, webpack, isServer }) => {
    if (!dev) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /-template\.(json|mdx|ts|tsx)$/,
          contextRegExp: /\/(content|seo\/templates)\//,
        })
      );
    }

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'node:crypto': false,
        'node:zlib': false,
        crypto: false,
        zlib: false,
        'node:async_hooks': false,
        async_hooks: false,
      };
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, './'),
      // Stub out edge function image manipulation code for web bundle
      '@heyclaude/shared-runtime/src/image/manipulation': resolve(__dirname, './src/lib/stubs/image-manipulation-stub.ts'),
    };

    // Ignore edge function dependencies
    if (!isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@imagemagick\/magick-wasm$/,
        })
      );
    }

    return config;
  },
  async redirects() {
    return [
      // HTTP to HTTPS redirect for non-www domain
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http',
          },
          {
            type: 'host',
            value: 'claudepro.directory',
          },
        ],
        destination: 'https://claudepro.directory/:path*',
        permanent: true,
      },
      // WWW to non-www canonical redirect (handles all www variants)
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.claudepro.directory',
          },
        ],
        destination: 'https://claudepro.directory/:path*',
        permanent: true,
      },
      // /guides/workflows subcategory redirect
      {
        source: '/guides/workflows/:path*',
        destination: '/guides/:path*',
        permanent: true,
      },
      {
        source:
          '/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug',
        destination: '/guides/:slug',
        permanent: true,
      },
      {
        source:
          '/guides/:subcategory(comparisons|troubleshooting|tutorials|use-cases)/:slug/llms.txt',
        destination: '/guides/:slug/llms.txt',
        permanent: true,
      },
      {
        source: '/for-you',
        destination: '/trending',
        permanent: true,
      },
      {
        source: '/board',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/board/new',
        destination: '/community',
        permanent: true,
      },
      {
        source: '/ph-bundle',
        destination: '/',
        permanent: true,
      },
      {
        source: '/ph-waitlist',
        destination: '/',
        permanent: true,
      },
      // Gallery & Embed Cleanup - Redirect removed features
      {
        source: '/gallery',
        destination: '/trending',
        permanent: true,
      },
      {
        source: '/gallery/:category',
        destination: '/:category',
        permanent: true,
      },
      {
        source: '/embed/:category/:slug',
        destination: '/:category/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=14400, stale-while-revalidate=86400' },
          { key: 'Vary', value: 'Accept-Encoding, Accept' },
        ],
      },
      {
        source: '/static-api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable',
          },
          { key: 'Vary', value: 'Accept-Encoding, Accept' },
        ],
      },
      {
        source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff2?)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      {
        source: '/scripts/service-worker-init.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/(agents|mcp|rules|commands|hooks|guides)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
          { key: 'Vary', value: 'Accept-Encoding' },
        ],
      },
      {
        source: '/search',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=1800, stale-while-revalidate=3600' },
        ],
      },
      {
        source: '/trending',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=1800' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'Content-Type', value: 'text/plain' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
          { key: 'Content-Type', value: 'application/manifest+json' },
        ],
      },
      {
        source: '/service-worker.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },

  async rewrites() {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgtjdifxfapoltfflowc.supabase.co';
    // Unified public-api monolith (formerly data-api)
    // WARNING: These rewrites depend on the public-api Supabase edge function being deployed.
    // If the public-api function (and its internal routes /content, /sitemap.xml, /feeds, plus category exports)
    // is not already deployed and wired up, these endpoints will return 404s.
    // Ensure deployment before merging changes to this section.
    //
    // To verify public-api function exists and rewrites are configured correctly, run:
    //   ./scripts/verify-public-api-rewrites.sh
    const publicApi = `${supabaseUrl}/functions/v1/public-api`;
    const contentApi = `${publicApi}/content`;

    return [
      // Sitemap.xml - proxy to edge function
      {
        source: '/sitemap.xml',
        destination: `${publicApi}/sitemap.xml`,
      },
      { source: '/rss.xml', destination: `${publicApi}/feeds?type=rss` },
      { source: '/atom.xml', destination: `${publicApi}/feeds?type=atom` },
      {
        source: '/changelog/rss.xml',
        destination: `${publicApi}/feeds?type=rss&category=changelog`,
      },
      {
        source: '/changelog/atom.xml',
        destination: `${publicApi}/feeds?type=atom&category=changelog`,
      },
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/rss.xml',
        destination: `${publicApi}/feeds?type=rss&category=:category`,
      },
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/atom.xml',
        destination: `${publicApi}/feeds?type=atom&category=:category`,
      },

      // LLMs.txt rewrites → public-api content routes
      { source: '/llms.txt', destination: `${contentApi}/sitewide?format=llms-txt` },
      {
        source: '/changelog/llms.txt',
        destination: `${contentApi}/changelog?format=llms-changelog`,
      },
      {
        source: '/changelog/:slug/llms.txt',
        destination: `${contentApi}/changelog/:slug?format=llms-entry`,
      },
      {
        source: '/tools/config-recommender/llms.txt',
        destination: `${contentApi}/tools/config-recommender?format=llms-tool`,
      },
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/llms.txt',
        destination: `${contentApi}/:category?format=llms-category`,
      },
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/:slug/llms.txt',
        destination: `${contentApi}/:category/:slug?format=llms-txt`,
      },

      // JSON API rewrites → public-api content routes
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/:slug.json',
        destination: `${contentApi}/:category/:slug?format=json`,
      },

      // Markdown export rewrites → public-api content routes
      {
        source:
          '/:category(agents|commands|hooks|mcp|rules|skills|statuslines|collections|guides)/:slug.md',
        destination: `${contentApi}/:category/:slug?format=markdown`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
