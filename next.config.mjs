import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Only import bundle analyzer when needed
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? (await import('@next/bundle-analyzer')).default({ enabled: true })
  : (config) => config;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standard output for Vercel and traditional deployments
  // Uncomment for Docker/serverless: output: 'standalone',

  // Disable powered by header for security and smaller response size
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Enable React strict mode for better development warnings
  reactStrictMode: true,
  
  eslint: {
    // Disable ESLint during builds since we use Biome/Ultracite
    ignoreDuringBuilds: true,
  },
  typescript: {
    // We handle TypeScript checking separately
    ignoreBuildErrors: false,
  },
  images: {
    // Image formats - AVIF first for better compression
    formats: ['image/avif', 'image/webp'],
    // Minimize Largest Contentful Paint (LCP)
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
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
    // Device sizes for responsive images (optimized for common viewports)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for the sizes prop (optimized for icons and thumbnails)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Disable static imports for smaller bundle
    disableStaticImages: false,
    // Content Security Policy
    contentDispositionType: 'inline',
    // Danger: allow SVG (we trust our sources)
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
  
  // File tracing optimization (stable in Next.js 15)
  outputFileTracingExcludes: {
    // Exclude cache and development files from all serverless functions
    '/*': [
      '.next/cache/**/*',
      '.next/trace',
      '.git/**/*',
      'node_modules/@types/**/*',
      'node_modules/typescript/**/*',
    ],
    // Specific exclusions for guide pages
    '/guides/**': [
      './docs/**/*',
      './scripts/**/*',
    ]
  },

  experimental: {
    // Note: optimizeCss disabled due to deprecated critters dependency in Next.js 15.5.x
    // CSS optimization handled by TailwindCSS v4 and PostCSS instead
    // optimizeCss: true,
    // React Compiler disabled - causes CSP eval() errors in production
    // Not needed for content-heavy sites with limited interactivity
    reactCompiler: false,
    webVitalsAttribution: ['CLS', 'FCP', 'FID', 'INP', 'LCP', 'TTFB'],
    gzipSize: true,
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'fuse.js',
      // Add all Radix UI packages for aggressive tree-shaking
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
    ],
    scrollRestoration: true,
    cssChunking: 'strict',
  },

  // SWC minification is now the default in Next.js 15
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Strip specific data attributes in production to reduce HTML size
    reactRemoveProperties: process.env.NODE_ENV === 'production' ? {
      properties: ['^data-test'],
    } : false,
    // Note: Dead code elimination is handled by SWC by default in Next.js 15
  },
  
  // Advanced webpack optimizations for better Core Web Vitals
  webpack: (config, { dev, isServer, webpack }) => {
    // Add Radix UI tree-shaking alias optimization
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Tree-shaking is now handled by optimizePackageImports in experimental config
      };
    }

    // Fix webpack cache serialization warning for production builds
    // Use memory cache to avoid serialization of large strings
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: 'memory',
        maxGenerations: 1,
      });
    }

    // Exclude template files from production builds
    if (!dev) {
      // Use webpack's IgnorePlugin to completely exclude template files
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /-template\.(json|mdx|ts|tsx)$/,
          contextRegExp: /\/(content|seo\/templates)\//,
        })
      );
    }

    // Optimize bundle splitting for better LCP
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            // React and core libraries
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react',
              priority: 20,
              chunks: 'all',
              enforce: true,
            },
            // Radix UI components - split into smaller chunks for better tree-shaking
            radixCore: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/](react-primitive|react-compose-refs|react-context|react-id|react-slot|react-use-.*|react-portal)[\\/]/,
              name: 'radix-core',
              priority: 19,
              chunks: 'all',
              enforce: true,
            },
            radixComponents: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/](?!react-primitive|react-compose-refs|react-context|react-id|react-slot|react-use-|react-portal)/,
              name(module) {
                // Create separate chunks for each Radix component for maximum tree-shaking
                const match = module.context.match(/@radix-ui[\\/](react-[^\\/]+)/);
                if (match) {
                  const componentName = match[1].replace('react-', '');
                  // Group related components together
                  if (['dialog', 'alert-dialog', 'popover', 'hover-card'].includes(componentName)) {
                    return 'radix-dialogs';
                  }
                  if (['dropdown-menu', 'context-menu', 'menubar', 'navigation-menu'].includes(componentName)) {
                    return 'radix-menus';
                  }
                  if (['select', 'checkbox', 'radio-group', 'switch', 'slider'].includes(componentName)) {
                    return 'radix-forms';
                  }
                  return `radix-${componentName}`;
                }
                return 'radix-misc';
              },
              priority: 18,
              chunks: 'async',
              maxSize: 50000, // Keep Radix chunks small for better tree-shaking
            },
            // Lucide icons (large icon library)
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide',
              priority: 15,
              chunks: 'all',
            },
            // Tremor charts (only loaded when needed)
            tremor: {
              test: /[\\/]node_modules[\\/]@tremor[\\/]/,
              name: 'tremor',
              priority: 12,
              chunks: 'async',
            },
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/](?!react|react-dom|scheduler|@radix-ui|lucide-react|@tremor)[\\/]/,
              name(module, chunks, cacheGroupKey) {
                // Create separate chunks for large vendors
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)?.[1];
                if (packageName && ['next', 'framer-motion', '@vercel'].includes(packageName.split('/')[0])) {
                  return `vendors-${packageName.split('/')[0]}`;
                }
                return 'vendors';
              },
              priority: 10,
              chunks: 'all',
              maxSize: 200000,
            },
            // Application content chunks
            content: {
              test: /[\\/]generated[\\/]/,
              name: 'content',
              priority: 8,
              chunks: 'all',
              maxSize: 150000, // Smaller content chunks for better caching
            },
            // Common application code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              reuseExistingChunk: true,
              maxSize: 200000,
            },
          },
        },
      };

      // Enhanced tree shaking and optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      config.optimization.providedExports = true;
      config.optimization.innerGraph = true;

      // Aggressive module optimization for Radix UI
      config.optimization.realContentHash = true;
      config.optimization.moduleIds = 'deterministic';

      // Minimize main thread blocking with improved runtime chunk handling
      config.optimization.runtimeChunk = {
        name: entrypoint => `runtime-${entrypoint.name}`,
      };

      // Improve module concatenation for smaller bundles
      config.optimization.concatenateModules = true;

      // Add tree-shaking hints for Radix UI
      config.module.rules.push({
        test: /node_modules\/@radix-ui/,
        sideEffects: false,
      });

      // Add performance hints for production builds
      config.performance = {
        hints: 'warning',
        maxEntrypointSize: 512000, // 500KB
        maxAssetSize: 512000, // 500KB
        assetFilter: (assetFilename) => {
          // Only check JS and CSS files for performance
          return /\.(js|css)$/.test(assetFilename);
        },
      };

      // Add bundle analyzer for ANALYZE builds
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = webpack;
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze/client.html',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: './analyze/stats.json',
          })
        );
      }
    }

    // Preload critical resources
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname, './'),
    };

    return config;
  },

  // Headers for caching only - security headers handled by Nosecone in middleware.ts
  async headers() {
    return [
      // Cache-Control headers only (no security headers to avoid conflicts with Nosecone)
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=14400, stale-while-revalidate=86400' // 4 hours cache, 24 hours stale
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, Accept'
          },
        ],
      },
      {
        source: '/static-api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, stale-while-revalidate=86400, immutable' // 1 year cache for pre-generated APIs
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, Accept'
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
        source: '/scripts/service-worker-init.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400' // 1 hour cache
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
      {
        source: '/(agents|mcp|rules|commands|hooks|guides)/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400' // 1 hour cache for content pages
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding'
          },
        ],
      },
      {
        source: '/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, stale-while-revalidate=3600' // 30 min cache for search page
          },
        ],
      },
      {
        source: '/trending',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=1800' // 5 min cache for trending
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800' // 1 day cache for sitemap
          },
          {
            key: 'Content-Type',
            value: 'application/xml'
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800' // 1 day cache for robots.txt
          },
          {
            key: 'Content-Type',
            value: 'text/plain'
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);