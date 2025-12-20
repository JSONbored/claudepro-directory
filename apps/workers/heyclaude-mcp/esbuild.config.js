/**
 * esbuild configuration for Cloudflare Workers
 * 
 * Marks agents/mcp as external since it's a Cloudflare runtime module
 * provided by the Workers runtime, not a bundled dependency.
 */

export default {
  external: ['agents/mcp'],
};
