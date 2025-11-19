#!/usr/bin/env tsx

/**
 * Generate .mcpb Packages for MCP Servers (Database-First, Optimized)
 *
 * OPTIMIZATIONS:
 * 1. Uses official @anthropic-ai/mcpb CLI tool for validation and packaging
 * 2. Content hashing: Only rebuild if MCP server content/metadata actually changed
 * 3. Parallel processing: 5 concurrent uploads to Supabase Storage
 * 4. Deterministic bundles: Same content = same .mcpb file
 * 5. Memory-efficient: Temporary directories cleaned up after processing
 *
 * ARCHITECTURE:
 * - Creates temporary directory structure with all bundle files
 * - Generates manifest.json (v0.2 spec) with user_config for API keys
 * - Generates minimal Node.js MCP server wrapper (for HTTP-based servers)
 * - Uses `mcpb pack` CLI tool to create validated .mcpb file
 * - Uploads to Supabase Storage and updates database
 */

import { execSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/src/lib/logger';
import type { Database, Json } from '@/src/types/database.types';
import { computeHash, hasHashChanged, setHash } from '../utils/build-cache.js';
import { ensureEnvVars } from '../utils/env.js';

type McpRow = Database['public']['Tables']['content']['Row'] & { category: 'mcp' };

/**
 * Type for MCP metadata structure
 */
type McpMetadata = {
  requires_auth?: boolean;
  configuration?: {
    claudeDesktop?: {
      mcp?: Record<
        string,
        {
          url?: string;
          [key: string]: Json | undefined;
        }
      >;
      [key: string]: Json | undefined;
    };
    [key: string]: Json | undefined;
  };
  [key: string]: Json | undefined;
};

/**
 * Type for user config entry in manifest
 */
type UserConfigEntry = {
  type: string;
  title: string;
  description: string;
  required: boolean;
  sensitive: boolean;
};

const CONCURRENCY = 5; // Parallel uploads

// Load environment
await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

const SUPABASE_URL =
  process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'https://hgtjdifxfapoltfflowc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
  logger.warn(
    'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
    {
      script: 'generate-mcpb-packages',
      fallbackUrl: SUPABASE_URL,
    }
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Fetch all MCP servers from database
 */
async function loadAllMcpServersFromDatabase(): Promise<McpRow[]> {
  const { data, error } = await supabase
    .from('content')
    .select('*')
    .eq('category', 'mcp')
    .order('slug');

  if (error) {
    throw new Error(`Failed to fetch MCP servers from database: ${error.message}`);
  }

  return data as McpRow[];
}

/**
 * Extract user_config from MCP metadata
 * Looks for API keys, tokens, and other configuration in metadata
 */
function extractUserConfig(mcp: McpRow): Record<string, UserConfigEntry> {
  const userConfig: Record<string, UserConfigEntry> = {};
  const metadata = mcp.metadata as McpMetadata | null;

  if (!metadata) {
    return userConfig;
  }

  // Check if requires_auth is true
  const requiresAuth = metadata.requires_auth === true;

  if (requiresAuth) {
    // Extract common API key patterns from metadata
    // Most MCP servers need an API key or token

    // Try to infer API key name from server name or use generic
    const serverName = mcp.slug.replace(/-mcp-server$/, '').replace(/-mcp$/, '');
    const apiKeyName = `${serverName}_api_key` || 'api_key';

    userConfig[apiKeyName] = {
      type: 'string',
      title: `${mcp.title || mcp.slug} API Key`,
      description: `API key or token for ${mcp.title || mcp.slug}`,
      required: true,
      sensitive: true,
    };
  }

  return userConfig;
}

/**
 * Helper to create template variable strings for manifest.json
 * These are literal strings that will be in the generated JSON, not template literals
 */
function createTemplateVar(variable: string): string {
  return `\${${variable}}`;
}

/**
 * Generate manifest.json for .mcpb package (v0.2 spec)
 */
function generateManifest(mcp: McpRow): string {
  const metadata = mcp.metadata as McpMetadata | null;
  const config = metadata?.configuration?.claudeDesktop?.mcp;
  const serverName = Object.keys(config || {})[0] || mcp.slug;
  const serverConfig = config?.[serverName];
  const httpUrl = serverConfig?.url as string | undefined;

  const userConfig = extractUserConfig(mcp);

  // Determine server type - always node for now (HTTP proxy or stdio)
  const serverType = 'node';

  const manifest = {
    manifest_version: '0.2',
    name: mcp.slug,
    version: '1.0.0',
    description: mcp.description || `MCP server: ${mcp.title || mcp.slug}`,
    author: {
      name: mcp.author || 'HeyClaud',
    },
    server: {
      type: serverType,
      entry_point: 'server/index.js',
      mcp_config: httpUrl
        ? {
            command: 'node',
            args: [`${createTemplateVar('__dirname')}/server/index.js`],
            env: Object.keys(userConfig).reduce(
              (acc, key) => {
                acc[key.toUpperCase()] = createTemplateVar(`user_config.${key}`);
                return acc;
              },
              {} as Record<string, string>
            ),
          }
        : {
            command: 'node',
            args: [`${createTemplateVar('__dirname')}/server/index.js`],
            env: {},
          },
    },
    ...(Object.keys(userConfig).length > 0 && { user_config: userConfig }),
    compatibility: {
      claude_desktop: '>=1.0.0',
      platforms: ['darwin', 'win32', 'linux'],
      runtimes: {
        node: '>=16.0.0',
      },
    },
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Generate Node.js MCP server wrapper
 *
 * For HTTP-based servers: Creates a proxy bridge that converts stdio MCP protocol
 * to HTTP requests to the remote MCP server endpoint.
 *
 * For stdio-based servers: Generates a minimal stdio server that can be extended
 * with tools/resources from metadata if available.
 */
function generateServerIndex(mcp: McpRow): string {
  const metadata = mcp.metadata as McpMetadata | null;
  const config = metadata?.configuration?.claudeDesktop?.mcp;
  const serverName = Object.keys(config || {})[0] || mcp.slug;
  const serverConfig = config?.[serverName];
  const httpUrl = serverConfig?.url as string | undefined;

  const title = (mcp.title || mcp.slug).replace(/\$/g, '\\$').replace(/`/g, '\\`');
  const description = (mcp.description || '').replace(/\$/g, '\\$').replace(/`/g, '\\`');
  const slug = mcp.slug.replace(/\$/g, '\\$').replace(/`/g, '\\`');

  // For HTTP-based servers, create a proxy bridge
  if (httpUrl && typeof httpUrl === 'string') {
    const safeHttpUrl = httpUrl.replace(/\$/g, '\\$').replace(/`/g, '\\`');
    return `#!/usr/bin/env node
/**
 * MCP Server Proxy: ${title}
 * ${description}
 * 
 * HTTP-to-stdio proxy bridge for Claude Desktop integration.
 * Converts stdio MCP protocol to HTTP requests to the remote server.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: '${slug}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// HTTP proxy bridge: Forward MCP requests to remote HTTP endpoint
const HTTP_ENDPOINT = '${safeHttpUrl}';

// Proxy tools list request
server.setRequestHandler('tools/list', async () => {
  try {
    const response = await fetch(\`\${HTTP_ENDPOINT}/tools/list\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Proxy error (tools/list):', error);
    return { tools: [] };
  }
});

// Proxy tool call request
server.setRequestHandler('tools/call', async (request) => {
  try {
    const response = await fetch(\`\${HTTP_ENDPOINT}/tools/call\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.params),
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Proxy error (tools/call):', error);
    throw error;
  }
});

// Proxy resources list request
server.setRequestHandler('resources/list', async () => {
  try {
    const response = await fetch(\`\${HTTP_ENDPOINT}/resources/list\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Proxy error (resources/list):', error);
    return { resources: [] };
  }
});

// Proxy resource read request
server.setRequestHandler('resources/read', async (request) => {
  try {
    const response = await fetch(\`\${HTTP_ENDPOINT}/resources/read\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.params),
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Proxy error (resources/read):', error);
    throw error;
  }
});

// Proxy prompts list request
server.setRequestHandler('prompts/list', async () => {
  try {
    const response = await fetch(\`\${HTTP_ENDPOINT}/prompts/list\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Proxy error (prompts/list):', error);
    return { prompts: [] };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${slug} MCP server proxy running on stdio -> ${safeHttpUrl}');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;
  }

  // For stdio-based servers, generate minimal server
  // Note: Actual server implementation would need to be provided by the MCP server author
  // This is a placeholder that can be extended with tools/resources from metadata
  return `#!/usr/bin/env node
/**
 * MCP Server: ${title}
 * ${description}
 * 
 * Stdio-based MCP server implementation.
 * This server communicates via stdio transport for Claude Desktop integration.
 * 
 * Note: This is a minimal placeholder. The actual server implementation
 * should be provided by the MCP server author or installed as a dependency.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: '${slug}',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Register tools, resources, and prompts based on MCP server capabilities
// This is a placeholder - actual implementation should be provided by the server author
// Example implementation:
// server.setRequestHandler('tools/list', async () => ({
//   tools: [
//     {
//       name: 'example-tool',
//       description: 'Example tool',
//       inputSchema: { type: 'object', properties: {} },
//     },
//   ],
// }));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('${slug} MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;
}

/**
 * Generate package.json for the MCP server
 */
function generatePackageJson(mcp: McpRow): string {
  const packageJson = {
    name: mcp.slug,
    version: '1.0.0',
    description: mcp.description || `MCP server: ${mcp.title || mcp.slug}`,
    type: 'module',
    main: 'server/index.js',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
    },
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * Generate README.md for the .mcpb package
 */
function generateReadme(mcp: McpRow): string {
  return `# ${mcp.title || mcp.slug}

${mcp.description || ''}

## Installation

1. Download the .mcpb file
2. Double-click to install in Claude Desktop
3. Enter your API key when prompted
4. Restart Claude Desktop

## Configuration

${
  mcp.metadata && typeof mcp.metadata === 'object' && 'configuration' in mcp.metadata
    ? 'See Claude Desktop configuration for setup details.'
    : 'No additional configuration required.'
}

## Documentation

${mcp.documentation_url ? `[View Documentation](${mcp.documentation_url})` : ''}

---
Generated by HeyClaud
`;
}

/**
 * Create temporary bundle directory with all required files
 */
async function createTempBundleDirectory(mcp: McpRow): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), `mcpb-${mcp.slug}-`));

  // Create server directory
  const serverDir = join(tempDir, 'server');
  await mkdir(serverDir, { recursive: true });

  // Write manifest.json
  await writeFile(join(tempDir, 'manifest.json'), generateManifest(mcp), 'utf-8');

  // Write server/index.js
  await writeFile(join(serverDir, 'index.js'), generateServerIndex(mcp), 'utf-8');

  // Write package.json
  await writeFile(join(tempDir, 'package.json'), generatePackageJson(mcp), 'utf-8');

  // Write README.md
  await writeFile(join(tempDir, 'README.md'), generateReadme(mcp), 'utf-8');

  return tempDir;
}

/**
 * Pack .mcpb bundle using official CLI tool
 */
async function packMcpbBundle(tempDir: string, outputPath: string): Promise<void> {
  const command = `npx mcpb pack "${tempDir}" "${outputPath}"`;

  try {
    execSync(command, {
      cwd: tempDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'inherit'],
    });
  } catch (error) {
    throw new Error(`mcpb pack failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if MCP server needs rebuild using content hash
 */
function needsRebuild(mcp: McpRow, packageContent: string): boolean {
  const contentHash = computeHash(packageContent);
  return hasHashChanged(`mcpb:${mcp.slug}`, contentHash);
}

/**
 * Upload .mcpb file to Supabase Storage and update database
 * @param mcp - MCP server row from database
 * @param mcpbFilePath - Path to generated .mcpb file
 * @param contentHash - Content hash (computed from packageContent) for rebuild detection
 */
async function uploadToStorage(
  mcp: McpRow,
  mcpbFilePath: string,
  contentHash: string
): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const mcpbBuffer = await readFile(mcpbFilePath);
  const fileName = `packages/${mcp.slug}.mcpb`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('mcpb-packages')
    .upload(fileName, mcpbBuffer, {
      contentType: 'application/zip',
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('mcpb-packages').getPublicUrl(fileName);

  // Update database with storage URL and build metadata
  // Use the content hash (not binary file hash) for consistent rebuild detection
  const { error: updateError } = await supabase
    .from('content')
    .update({
      mcpb_storage_url: publicUrl,
      mcpb_build_hash: contentHash,
      mcpb_last_built_at: new Date().toISOString(),
    })
    .eq('id', mcp.id);

  if (updateError) {
    throw new Error(`Database update failed: ${updateError.message}`);
  }

  return publicUrl;
}

/**
 * Process MCP servers in parallel batches
 */
async function processBatch(
  mcps: Array<{ mcp: McpRow; packageContent: string; hash: string }>
): Promise<Array<{ slug: string; status: 'success' | 'error'; message: string }>> {
  const results = await Promise.allSettled(
    mcps.map(async ({ mcp, packageContent: _packageContent, hash }) => {
      const buildStartTime = performance.now();
      let tempDir: string | null = null;

      try {
        // Create temporary bundle directory
        tempDir = await createTempBundleDirectory(mcp);

        // Pack .mcpb bundle using official CLI tool
        const outputPath = join(tempDir, `${mcp.slug}.mcpb`);
        await packMcpbBundle(tempDir, outputPath);

        // Read generated .mcpb file
        const { readFile } = await import('node:fs/promises');
        const mcpbBuffer = await readFile(outputPath);
        const fileSizeKB = (mcpbBuffer.length / 1024).toFixed(2);

        // Upload to Supabase Storage (pass content hash for database storage)
        await uploadToStorage(mcp, outputPath, hash);

        // Clean up temp directory
        await rm(tempDir, { recursive: true, force: true });

        const buildDuration = performance.now() - buildStartTime;

        // Update unified cache
        setHash(`mcpb:${mcp.slug}`, hash, {
          reason: 'MCPB package rebuilt',
          duration: buildDuration,
          files: [`${mcp.slug}.mcpb`],
        });

        return {
          slug: mcp.slug,
          status: 'success' as const,
          message: `${fileSizeKB}KB`,
        };
      } catch (error) {
        // Clean up temp directory on error
        if (tempDir) {
          await rm(tempDir, { recursive: true, force: true }).catch(() => {
            // Ignore cleanup errors - temp directory will be cleaned up by OS eventually
          });
        }
        throw error;
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    const mcp = mcps[index];
    if (!mcp) {
      return {
        slug: 'unknown',
        status: 'error' as const,
        message: 'MCP server not found at index',
      };
    }
    return {
      slug: mcp.mcp.slug,
      status: 'error' as const,
      message: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}

/**
 * OPTIMIZED Main execution with parallel processing and content hashing
 */
async function main() {
  logger.info('🚀 Generating .mcpb packages for MCP servers (database-first, optimized)...\n');
  logger.info('═'.repeat(80));

  const startTime = performance.now();

  // 1. Load MCP servers from database
  logger.info('\n📊 Loading MCP servers from database...');
  const mcps = await loadAllMcpServersFromDatabase();
  logger.info(`✅ Found ${mcps.length} MCP servers in database\n`, { mcpCount: mcps.length });

  // 2. OPTIMIZATION: Filter MCP servers using content hash
  logger.info('🔍 Computing content hashes and filtering changed MCP servers...');
  const mcpsToRebuild: Array<{ mcp: McpRow; packageContent: string; hash: string }> = [];

  for (const mcp of mcps) {
    // Create package content string for hashing (includes manifest, metadata, etc.)
    const packageContent = JSON.stringify({
      manifest: generateManifest(mcp),
      metadata: mcp.metadata,
      description: mcp.description,
      title: mcp.title,
    });
    const hash = computeHash(packageContent);

    if (needsRebuild(mcp, packageContent)) {
      mcpsToRebuild.push({ mcp, packageContent, hash });
    }
  }

  if (mcpsToRebuild.length === 0) {
    logger.info('✨ All MCP servers up to date! No rebuild needed.\n');
    logger.info('💡 Content hashes match - zero .mcpb files regenerated\n');
    return;
  }

  logger.info(`🔄 Rebuilding ${mcpsToRebuild.length}/${mcps.length} MCP servers\n`, {
    rebuilding: mcpsToRebuild.length,
    total: mcps.length,
  });
  logger.info(`⚡ Processing ${CONCURRENCY} MCP servers concurrently...\n`, {
    concurrency: CONCURRENCY,
  });
  logger.info('═'.repeat(80));

  // 3. OPTIMIZATION: Process in parallel batches
  const allResults: Array<{ slug: string; status: 'success' | 'error'; message: string }> = [];

  for (let i = 0; i < mcpsToRebuild.length; i += CONCURRENCY) {
    const batch = mcpsToRebuild.slice(i, i + CONCURRENCY);
    const batchResults = await processBatch(batch);

    allResults.push(...batchResults);

    // Log progress
    for (const result of batchResults) {
      if (result.status === 'success') {
        logger.info(`✅ ${result.slug} (${result.message})`, {
          slug: result.slug,
          message: result.message,
        });
      } else {
        logger.error(`❌ ${result.slug}: ${result.message}`, undefined, {
          slug: result.slug,
          message: result.message,
        });
      }
    }
  }

  // 4. Summary
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const successCount = allResults.filter((r) => r.status === 'success').length;
  const failCount = allResults.filter((r) => r.status === 'error').length;

  logger.info(`\n${'═'.repeat(80)}`);
  logger.info('\n📊 BUILD SUMMARY:\n');
  logger.info(`   Total MCP servers: ${mcps.length}`);
  logger.info(`   ✅ Built: ${successCount}/${mcpsToRebuild.length}`);
  logger.info(`   ⏭️  Skipped: ${mcps.length - mcpsToRebuild.length} (content unchanged)`);
  logger.info(`   ❌ Failed: ${failCount}/${mcpsToRebuild.length}`);
  logger.info(`   ⏱️  Duration: ${duration}s`);
  logger.info(`   ⚡ Concurrency: ${CONCURRENCY} parallel uploads`);
  logger.info('   🗄️  Storage: Supabase Storage (mcpb-packages bucket)', {
    total: mcps.length,
    built: successCount,
    skipped: mcps.length - mcpsToRebuild.length,
    failed: failCount,
    duration: `${duration}s`,
    concurrency: CONCURRENCY,
  });

  if (failCount > 0) {
    logger.error('\n❌ FAILED BUILDS:\n', undefined, { failCount });
    const failedResults = allResults.filter((r) => r.status === 'error');
    for (const r of failedResults) {
      logger.error(`   ${r.slug}: ${r.message}`, undefined, { slug: r.slug, message: r.message });
    }
    process.exit(1);
  }

  logger.info('\n✨ Build complete! Next run will skip unchanged MCP servers.\n');
}

main().catch((error) => {
  logger.error('Fatal error in MCPB package generation', error, {
    script: 'generate-mcpb-packages',
  });
  process.exit(1);
});
