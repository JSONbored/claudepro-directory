import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/data": path.resolve(__dirname, "./packages/data"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    cssMinify: true,
    reportCompressedSize: false, // Speed up build
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem (excluding react-syntax-highlighter)
            if ((id.includes('react') || id.includes('react-dom') || id.includes('react-router')) 
                && !id.includes('react-syntax-highlighter')) {
              return 'react-vendor';
            }
            // Syntax highlighter (large library) - force into its own chunk
            if (id.includes('react-syntax-highlighter') || id.includes('refractor') || id.includes('prismjs')) {
              return 'syntax-highlighter';
            }
            // UI libraries
            if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) {
              return 'ui-vendor';
            }
            // Analytics
            if (id.includes('@vercel/analytics')) {
              return 'analytics-vendor';
            }
            // Search and utilities
            if (id.includes('fuse.js') || id.includes('slugify')) {
              return 'utils-vendor';
            }
            // Everything else from node_modules
            return 'vendor';
          }
          // Split generated content by type
          if (id.includes('src/generated/')) {
            if (id.includes('-full.ts')) {
              // Full content files should be lazy loaded
              return undefined; // Let Vite handle lazy chunks
            }
            if (id.includes('-metadata.ts')) {
              return 'content-metadata';
            }
            if (id.includes('content.ts')) {
              return 'content-index';
            }
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.includes('vendor')) {
            return 'assets/[name]-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));