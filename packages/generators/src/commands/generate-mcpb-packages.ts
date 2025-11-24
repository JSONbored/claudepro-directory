import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import type { Database, Json } from '@heyclaude/database-types';
import { computeHash, hasHashChanged, setHash } from '../toolkit/cache.js';
import { callEdgeFunction } from '../toolkit/edge.js';
import { ensureEnvVars } from '../toolkit/env.js';
import { logger } from '../toolkit/logger.js';
import { createServiceRoleClient, DEFAULT_SUPABASE_URL } from '../toolkit/supabase.js';

type McpRow = Database['public']['Tables']['content']['Row'] & { category: 'mcp' };

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

type UserConfigEntry = {
  type: string;
  title: string;
  description: string;
  required: boolean;
  sensitive: boolean;
};

const CONCURRENCY = 5;

export async function runGenerateMcpbPackages(): Promise<void> {
  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-mcpb-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  const supabase = createServiceRoleClient();

  logger.info('🚀 Generating .mcpb packages for MCP servers (database-first, optimized)...\n');
  logger.info('═'.repeat(80));

  const startTime = performance.now();

  logger.info('\n📊 Loading MCP servers from database...');
  const mcps = await loadAllMcpServersFromDatabase(supabase);
  logger.info(`✅ Found ${mcps.length} MCP servers in database\n`, { mcpCount: mcps.length });

  logger.info('🔍 Computing content hashes and filtering changed MCP servers...');
  const mcpsToRebuild: Array<{ mcp: McpRow; packageContent: string; hash: string }> = [];

  for (const mcp of mcps) {
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

  const allResults: Array<{ slug: string; status: 'success' | 'error'; message: string }> = [];

  for (let i = 0; i < mcpsToRebuild.length; i += CONCURRENCY) {
    const batch = mcpsToRebuild.slice(i, i + CONCURRENCY);
    const batchResults = await processBatch(batch);

    allResults.push(...batchResults);

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
    const failedResults = allResults.filter((r) => r.status === 'error');
    logger.error('\n❌ FAILED BUILDS:\n', undefined, {
      failCount,
      failedBuilds: failedResults.map((r) => ({
        slug: r.slug,
        message: r.message,
      })),
    });
    for (const r of failedResults) {
      logger.error(`   ${r.slug}: ${r.message}`, undefined, { slug: r.slug, message: r.message });
    }
    process.exit(1);
  }

  logger.info('\n✨ Build complete! Next run will skip unchanged MCP servers.\n');
}

async function loadAllMcpServersFromDatabase(
  supabase: ReturnType<typeof createServiceRoleClient>
): Promise<McpRow[]> {
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

function extractUserConfig(mcp: McpRow): Record<string, UserConfigEntry> {
  const userConfig: Record<string, UserConfigEntry> = {};
  const metadata = mcp.metadata as McpMetadata | null;

  if (!metadata) {
    return userConfig;
  }

  const requiresAuth = metadata.requires_auth === true;

  if (requiresAuth) {
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

function createTemplateVar(variable: string): string {
  return `\${${variable}}`;
}

function generateManifest(mcp: McpRow): string {
  const metadata = mcp.metadata as McpMetadata | null;
  const config = metadata?.configuration?.claudeDesktop?.mcp;
  const serverName = Object.keys(config || {})[0] || mcp.slug;
  const serverConfig = config?.[serverName];
  const httpUrl = serverConfig?.url as string | undefined;

  const userConfig = extractUserConfig(mcp);
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
        node: '>=18.0.0',
      },
    },
  };

  return JSON.stringify(manifest, null, 2);
}

/**
 * Escapes backslash, dollar sign, and backtick for safe embedding in JavaScript template literals.
 * Order matters: backslashes must be escaped first to prevent double-escaping.
 */
function escapeForTemplateLiteral(input: string): string {
  return input
    .replace(/\\/g, '\\\\') // Escape backslash first
    .replace(/\$/g, '\\$') // Escape dollar sign
    .replace(/`/g, '\\`'); // Escape backtick
}

function generateServerIndex(mcp: McpRow): string {
  const metadata = mcp.metadata as McpMetadata | null;
  const config = metadata?.configuration?.claudeDesktop?.mcp;
  const serverName = Object.keys(config || {})[0] || mcp.slug;
  const serverConfig = config?.[serverName];
  const httpUrl = serverConfig?.url as string | undefined;

  const title = escapeForTemplateLiteral(mcp.title || mcp.slug);
  const description = escapeForTemplateLiteral(mcp.description || '');
  const slug = escapeForTemplateLiteral(mcp.slug);

  if (httpUrl && typeof httpUrl === 'string') {
    // Use JSON.stringify to safely embed the URL, including proper escaping for backslashes/quotes
    const escapedHttpUrl = JSON.stringify(httpUrl);

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

const HTTP_ENDPOINT = ${escapedHttpUrl};

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
  console.error('${slug} MCP server proxy running on stdio -> ' + ${escapedHttpUrl});
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
`;
  }

  return `#!/usr/bin/env node
/**
 * MCP Server: ${title}
 * ${description}
 * 
 * Stdio-based MCP server implementation.
 * This server communicates via stdio transport for Claude Desktop integration.
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

async function createTempBundleDirectory(mcp: McpRow): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), `mcpb-${mcp.slug}-`));
  const serverDir = join(tempDir, 'server');
  await mkdir(serverDir, { recursive: true });
  await writeFile(join(tempDir, 'manifest.json'), generateManifest(mcp), 'utf-8');
  await writeFile(join(serverDir, 'index.js'), generateServerIndex(mcp), 'utf-8');
  await writeFile(join(tempDir, 'package.json'), generatePackageJson(mcp), 'utf-8');
  await writeFile(join(tempDir, 'README.md'), generateReadme(mcp), 'utf-8');
  return tempDir;
}

async function packMcpbBundle(tempDir: string, outputPath: string): Promise<void> {
  const result = spawnSync('npx', ['mcpb', 'pack', tempDir, outputPath], {
    cwd: tempDir,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  if (result.error) {
    throw new Error(`mcpb pack failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const errorOutput = result.stderr?.toString() || result.stdout?.toString() || 'Unknown error';
    throw new Error(`mcpb pack failed with exit code ${result.status}: ${errorOutput}`);
  }
}

function needsRebuild(mcp: McpRow, packageContent: string): boolean {
  const contentHash = computeHash(packageContent);
  return hasHashChanged(`mcpb:${mcp.slug}`, contentHash);
}

async function uploadToStorage(
  mcp: McpRow,
  mcpbFilePath: string,
  contentHash: string
): Promise<string> {
  const { readFile } = await import('node:fs/promises');
  const mcpbBuffer = await readFile(mcpbFilePath);
  const base64File = mcpbBuffer.toString('base64');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const result = await callEdgeFunction<{
      success: boolean;
      storage_url: string;
      message?: string;
      error?: string;
    }>('/data-api/content/generate-package/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content_id: mcp.id,
        category: 'mcp',
        mcpb_file: base64File,
        content_hash: contentHash,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!(result.success && result.storage_url)) {
      throw new Error(
        result.error || result.message || 'Edge function upload returned unsuccessful response'
      );
    }

    return result.storage_url;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Upload timed out after 10s');
    }
    throw error;
  }
}

async function processBatch(
  mcps: Array<{ mcp: McpRow; packageContent: string; hash: string }>
): Promise<Array<{ slug: string; status: 'success' | 'error'; message: string }>> {
  const results = await Promise.allSettled(
    mcps.map(async ({ mcp, packageContent: _packageContent, hash }) => {
      const buildStartTime = performance.now();
      let tempDir: string | null = null;

      try {
        tempDir = await createTempBundleDirectory(mcp);
        const outputPath = join(tempDir, `${mcp.slug}.mcpb`);
        await packMcpbBundle(tempDir, outputPath);

        const { readFile } = await import('node:fs/promises');
        const mcpbBuffer = await readFile(outputPath);
        const fileSizeKB = (mcpbBuffer.length / 1024).toFixed(2);

        await uploadToStorage(mcp, outputPath, hash);

        await rm(tempDir, { recursive: true, force: true });

        const buildDuration = performance.now() - buildStartTime;

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
        if (tempDir) {
          await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
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
