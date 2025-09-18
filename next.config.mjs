import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for smaller deployments
  output: 'standalone',
  
  // Disable powered by header for security and smaller response size
  poweredByHeader: false,
  
  // Enable compression
  compress: true,
  
  eslint: {
    // Disable ESLint during builds since we use Biome/Ultracite
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We handle TypeScript checking separately
    ignoreBuildErrors: false,
  },
  images: {
    // Image formats
    formats: ['image/avif', 'image/webp'],
    // Allow all HTTPS images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for the sizes prop
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Turbopack-specific optimizations
  turbopack: {
    // Module resolution aliases for cleaner imports
    resolveAlias: {
      '@components': './components',
      '@lib': './lib',
      '@hooks': './hooks',
      '@types': './types',
      '@utils': './lib/utils',
      '@content': './content',
      '@generated': './generated',
    },
  },
  
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=59'
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);