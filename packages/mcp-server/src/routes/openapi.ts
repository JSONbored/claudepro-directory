/**
 * OpenAPI Spec Endpoint
 *
 * Serves the generated OpenAPI 3.1 specification for the MCP server.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

/**
 * Get the OpenAPI spec path (lazy evaluation to avoid import.meta.url issues)
 * In Cloudflare Workers, we can't read from filesystem, so this will return null
 */
function getOpenAPISpecPath(): string | null {
  try {
    // In Cloudflare Workers, import.meta.url may be undefined
    // We'll handle this gracefully by returning null
    if (typeof import.meta === 'undefined' || typeof import.meta.url === 'undefined') {
      return null;
    }
const __filename = fileURLToPath(import.meta.url);
// Calculate PROJECT_ROOT: from apps/workers/heyclaude-mcp/src/routes/ -> project root
let PROJECT_ROOT = join(__filename, '../../../../../');
if (!existsSync(join(PROJECT_ROOT, 'apps/workers/heyclaude-mcp'))) {
  PROJECT_ROOT = process.cwd();
}
    return join(PROJECT_ROOT, 'openapi-mcp.json');
  } catch {
    // If import.meta.url is unavailable, return null
    return null;
  }
}

/**
 * Handle OpenAPI spec request
 *
 * @returns OpenAPI spec response or 404 if not generated
 */
export async function handleOpenAPI(): Promise<Response> {
  try {
    const OPENAPI_SPEC_PATH = getOpenAPISpecPath();
    if (!OPENAPI_SPEC_PATH || !existsSync(OPENAPI_SPEC_PATH)) {
      return new Response(
        JSON.stringify({
          error: 'OpenAPI spec not found',
          message: 'Run `pnpm heyclaude-generate-mcp-openapi` to generate the spec',
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const spec = await readFile(OPENAPI_SPEC_PATH, 'utf-8');
    const parsed = JSON.parse(spec);

    return new Response(JSON.stringify(parsed, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Failed to read OpenAPI spec',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
