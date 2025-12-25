import { defineConfig } from 'tsup';

/**
 * tsup Configuration for @heyclaude/mcp-server
 *
 * Bundles the package for standalone npm publishing:
 * - Bundles @heyclaude/data-layer, @heyclaude/database-types, @heyclaude/shared-runtime
 * - Keeps @modelcontextprotocol/sdk and zod as external dependencies
 * - Generates ESM output (package.json has "type": "module")
 * - Generates TypeScript declaration files
 */

export default defineConfig({
  // Entry points - all exported modules
  entry: [
    'src/index.ts',
    'src/server/node-server.ts',
    'src/cli.ts',
    'src/adapters/api-proxy.ts',
    'src/adapters/cloudflare-worker.ts',
    'src/mcp/tools/categories.ts',
    'src/mcp/tools/detail.ts',
    'src/mcp/tools/featured.ts',
    'src/mcp/tools/popular.ts',
    'src/mcp/tools/recent.ts',
    'src/mcp/tools/search.ts',
    'src/mcp/tools/trending.ts',
    'src/mcp/tools/index.ts',
    'src/types/runtime.ts',
    'src/lib/env-config.ts',
    'src/lib/env-utils.ts',
    'src/lib/errors.ts',
    'src/lib/logger-utils.ts',
    'src/lib/platform-formatters.ts',
    'src/lib/schemas.ts',
    'src/lib/storage-utils.ts',
    'src/lib/usage-hints.ts',
    'src/lib/utils.ts',
    'src/middleware/rate-limit.ts',
    'src/middleware/request-deduplication.ts',
    'src/cache/cache-headers.ts',
    'src/cache/kv-cache.ts',
    'src/observability/metrics.ts',
    'src/routes/health.ts',
    'src/routes/oauth-authorize.ts',
    'src/routes/oauth-metadata.ts',
    'src/routes/oauth-token.ts',
    'src/routes/oauth/shared.ts',
    'src/routes/openapi.ts',
    'src/mcp/server.ts',
    'src/mcp/resources/index.ts',
    'src/mcp/prompts/index.ts',
  ],
  
  // Output format - ESM only (package.json has "type": "module")
  format: ['esm'],
  
  // Generate TypeScript declaration files separately (avoids memory issues)
  // Types are generated via "pnpm type-check" which runs tsc
  dts: false,
  
  // Bundle dependencies (inline @heyclaude/* packages)
  bundle: true,
  
  // External dependencies (keep as npm dependencies, don't bundle)
  external: [
    '@modelcontextprotocol/sdk',
    'zod',
    // Node.js built-ins
    'node:http',
    'node:fs',
    'node:fs/promises',
    'node:path',
    'node:url',
    'node:stream',
    'node:util',
    'node:crypto',
    'node:buffer',
    'node:events',
  ],
  
  // Don't bundle these workspace packages (they'll be bundled into the output)
  // This means tsup will follow imports and inline the code
  noExternal: [
    '@heyclaude/data-layer',
    '@heyclaude/database-types',
    '@heyclaude/shared-runtime',
  ],
  
  // Output directory
  outDir: 'dist',
  
  // Don't clean - we clean manually in build script before tsup runs
  // This preserves .d.ts files if types are generated first
  clean: false,
  
  // Enable tree shaking
  treeshake: true,
  
  // Generate source maps
  sourcemap: true,
  
  // Splitting disabled (single bundle per entry)
  splitting: false,
  
  // Minify (optional, can disable for better debugging)
  minify: false,
  
  // Target Node.js 18+ (matches package.json engines)
  target: 'node18',
  
  // Platform
  platform: 'node',
  
  // TypeScript config
  tsconfig: './tsconfig.json',
  
  // Output file extension
  outExtension() {
    return {
      js: '.js', // ESM uses .js extension (package.json "type": "module" handles it)
    };
  },
});

