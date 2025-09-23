// Only import bundle analyzer when needed
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (config) => config;

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
    // Allow images from trusted domains only
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: '*.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'claudepro.directory',
      },
      {
        protocol: 'https',
        hostname: 'www.claudepro.directory',
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
    // Optimize CSS - enables critical CSS extraction and better chunking
    optimizeCss: true,
    // Enable React Compiler for automatic optimization
    reactCompiler: true,
    // Enable aggressive optimization for better Core Web Vitals
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
    // Better memory management
    gzipSize: true,
    // Optimize package imports for better tree shaking
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'fuse.js'],
    // Scroll restoration
    scrollRestoration: true,
    // Enable CSS layer optimization for better chunking
    cssChunking: 'strict',
  },
  
  // Advanced webpack optimizations for better Core Web Vitals
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting for better LCP
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
              maxSize: 244000, // Keep chunks under 244KB for optimal loading
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 244000,
            },
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide',
              priority: 15,
              chunks: 'all',
            },
            content: {
              test: /[\\/]generated[\\/]/,
              name: 'content',
              priority: 8,
              chunks: 'all',
              maxSize: 200000, // Keep content chunks smaller
            },
          },
        },
      };

      // Tree shaking optimizations
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Minimize main thread blocking
      config.optimization.runtimeChunk = 'single';
    }

    // Preload critical resources
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './'),
    };

    return config;
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
          // Temporarily disable CSP in development to isolate homepage issue
          ...(process.env.NODE_ENV !== 'development' ? [{
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://umami.claudepro.directory https://va.vercel-scripts.com https://vercel.live",
              "style-src 'self' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' https://github.com https://*.githubusercontent.com https://claudepro.directory https://www.claudepro.directory data:",
              "connect-src 'self' https://umami.claudepro.directory https://vitals.vercel-insights.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "media-src 'self'"
            ].join('; ')
          }] : []),
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=14400, stale-while-revalidate=86400' // 4 hours cache, 24 hours stale
          },
        ],
      },
      {
        source: '/(.*)\\.(js|css|png|jpg|jpeg|gif|ico|svg|webp|avif|woff2?)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 year cache for static assets
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          },
        ],
      },
      {
        source: '/script.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400' // 1 week cache for analytics script
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable' // 1 year cache for Next.js static files
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);