import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/data": path.resolve(__dirname, "./packages/data"),
    },
  },
  build: {
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
            // Date/time libraries
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Other utilities
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
      },
    },
  },
}));