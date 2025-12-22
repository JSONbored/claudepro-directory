import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Prisma } from '@prisma/client';

type contentModel = Prisma.contentGetPayload<{}>;
type JsonValue = Prisma.JsonValue;

type Json = JsonValue;

import { prisma } from '@heyclaude/data-layer/prisma/client';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import type { SupabaseClient } from '@supabase/supabase-js';

import { ensureEnvVars } from '../toolkit/env.ts';
import { generatePackages, type PackageGeneratorConfig } from '../toolkit/package-generator.ts';
import { DEFAULT_SUPABASE_URL } from '../toolkit/supabase.ts';

type McpRow = contentModel & { category: 'mcp' };

interface McpMetadata {
  [key: string]: Json | undefined;
  configuration?: {
    [key: string]: Json | undefined;
    claudeDesktop?: {
      [key: string]: Json | undefined;
      mcp?: Record<
        string,
        {
          [key: string]: Json | undefined;
          url?: string;
        }
      >;
    };
  };
  requires_auth?: boolean;
}

interface UserConfigEntry {
  description: string;
  required: boolean;
  sensitive: boolean;
  title: string;
  type: string;
}

export async function runGenerateMcpbPackages(): Promise<void> {
  await ensureEnvVars(['SUPABASE_SERVICE_ROLE_KEY']);

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    const { logger } = await import('../toolkit/logger.ts');
    logger.warn(
      'NEXT_PUBLIC_SUPABASE_URL not set, using fallback URL. Set this in Vercel Project Settings for production builds.',
      {
        script: 'generate-mcpb-packages',
        fallbackUrl: DEFAULT_SUPABASE_URL,
      }
    );
  }

  const config: PackageGeneratorConfig<McpRow, string> = {
    commandName: 'generate-mcpb-packages',
    itemName: 'MCP server',
    itemNamePlural: 'MCP servers',
    cacheKeyPrefix: 'mcpb:',
    storageBucket: 'mcpb-packages',
    fileExtension: '.mcpb',
    concurrency: 5,
    loadItems: loadAllMcpServersFromDatabase,
    transformToPackageContent: (mcp) =>
      JSON.stringify({
        manifest: generateManifest(mcp),
        metadata: mcp.metadata,
        description: mcp.description,
        title: mcp.title,
      }),
    buildPackage: async (mcp, _packageContent) => {
      // Create temp directory and build .mcpb file
      let tempDir: string | null = null;
      try {
        tempDir = await createTempBundleDirectory(mcp);
        const outputPath = join(tempDir, `${mcp.slug}.mcpb`);
        await packMcpbBundle(tempDir, outputPath);
        const mcpbBuffer = await readFile(outputPath);
        return mcpbBuffer;
      } finally {
        if (tempDir) {
          await rm(tempDir, { recursive: true, force: true }).catch(() => {});
        }
      }
    },
    uploadAndUpdate: async (supabase, mcp, mcpbBuffer, contentHash) => {
      return uploadToStorage(supabase, mcp, mcpbBuffer, contentHash);
    },
    verify: async (supabase) => {
      const verificationResult = await verifyMcpbPackages(supabase);
      const { logger } = await import('../toolkit/logger.ts');

      if (verificationResult.missing_packages > 0 || verificationResult.storage_mismatches > 0) {
        logger.warn(
          `⚠️  Verification found ${verificationResult.missing_packages + verificationResult.storage_mismatches} issues`,
          {
            script: 'generate-mcpb-packages',
            missing_packages: verificationResult.missing_packages,
            storage_mismatches: verificationResult.storage_mismatches,
          }
        );
        // Don't fail the build - just warn (packages may be in progress)
      } else {
        logger.info('✅ All MCP content has valid packages!\n', {
          script: 'generate-mcpb-packages',
        });
      }
    },
  };

  await generatePackages(config);
}

interface VerificationResult {
  missing_packages: number;
  missing_packages_list: Array<{
    id: string;
    slug: string;
    title: null | string;
  }>;
  storage_mismatches: number;
  storage_mismatches_list: Array<{
    has_db_url: boolean;
    has_storage_file: boolean;
    id: string;
    slug: string;
  }>;
  total_mcp_content: number;
  with_packages: number;
}

/**
 * Verifies that all MCP content entries have MCPB package URLs in the database and corresponding files in Supabase storage.
 */
async function verifyMcpbPackages(supabase: SupabaseClient): Promise<VerificationResult> {
  const mcpContent = await prisma.content.findMany({
    where: {
      category: 'mcp',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      mcpb_storage_url: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  if (mcpContent.length === 0) {
    return {
      total_mcp_content: 0,
      with_packages: 0,
      missing_packages: 0,
      missing_packages_list: [],
      storage_mismatches: 0,
      storage_mismatches_list: [],
    };
  }

  const missingPackages = mcpContent.filter(
    (mcp) => !mcp.mcpb_storage_url || mcp.mcpb_storage_url.trim().length === 0
  );

  const withPackages = mcpContent.filter(
    (mcp): mcp is typeof mcp & { mcpb_storage_url: string } => {
      const url = mcp.mcpb_storage_url;
      return url !== null && url !== undefined && url.trim().length > 0;
    }
  );

  const storageMismatches: VerificationResult['storage_mismatches_list'] = [];

  const { logger } = await import('../toolkit/logger.ts');

  for (const mcp of withPackages) {
    const { data: fileData, error: fileError } = await supabase.storage
      .from('mcpb-packages')
      .list('packages', {
        search: mcp.slug,
      });

    if (fileError) {
      logger.warn(`Storage list error for ${mcp.slug}: ${fileError.message}`, {
        script: 'generate-mcpb-packages',
        slug: mcp.slug,
      });
    }

    const hasStorageFile =
      !fileError && Boolean(fileData) && fileData.some((file) => file.name === `${mcp.slug}.mcpb`);

    if (!hasStorageFile) {
      storageMismatches.push({
        id: mcp.id,
        slug: mcp.slug,
        has_db_url: true,
        has_storage_file: false,
      });
    }
  }

  return {
    total_mcp_content: mcpContent.length,
    with_packages: withPackages.length,
    missing_packages: missingPackages.length,
    missing_packages_list: missingPackages.map((mcp) => ({
      id: mcp.id,
      slug: mcp.slug,
      title: mcp.title,
    })),
    storage_mismatches: storageMismatches.length,
    storage_mismatches_list: storageMismatches,
  };
}

async function loadAllMcpServersFromDatabase(): Promise<McpRow[]> {
  // OPTIMIZATION: Use select to fetch only required fields (8 fields)
  // This reduces data transfer significantly (from 30+ fields to 8 fields per MCP server)
  // Fields match script usage requirements
  const mcps = await prisma.content.findMany({
    where: {
      category: 'mcp',
    },
    select: {
      id: true,
      slug: true,
      metadata: true,
      description: true,
      title: true,
      mcpb_storage_url: true,
      author: true,
      documentation_url: true,
    },
    orderBy: {
      slug: 'asc',
    },
  });

  return mcps as McpRow[];
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
  const httpUrl = serverConfig?.url;

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
    .replaceAll('\\', '\\\\') // Escape backslash first
    .replaceAll('$', String.raw`\$`) // Escape dollar sign
    .replaceAll('`', '\\`'); // Escape backtick
}

function generateServerIndex(mcp: McpRow): string {
  const metadata = mcp.metadata as McpMetadata | null;
  const config = metadata?.configuration?.claudeDesktop?.mcp;
  const serverName = Object.keys(config || {})[0] || mcp.slug;
  const serverConfig = config?.[serverName];
  const httpUrl = serverConfig?.url;

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
  await writeFile(join(tempDir, 'manifest.json'), generateManifest(mcp), 'utf8');
  await writeFile(join(serverDir, 'index.js'), generateServerIndex(mcp), 'utf8');
  await writeFile(join(tempDir, 'package.json'), generatePackageJson(mcp), 'utf8');
  await writeFile(join(tempDir, 'README.md'), generateReadme(mcp), 'utf8');
  return tempDir;
}

async function packMcpbBundle(tempDir: string, outputPath: string): Promise<void> {
  const result = spawnSync('npx', ['mcpb', 'pack', tempDir, outputPath], {
    cwd: tempDir,
    encoding: 'utf8',
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


/**
 * Uploads a generated .mcpb package to Supabase Storage.
 *
 * Uses direct Supabase Storage API (same pattern as skills packages).
 *
 * @param supabase - Supabase service role client
 * @param mcp - The MCP content row
 * @param mcpbBuffer - Buffer containing the .mcpb file content
 * @param contentHash - Pre-computed hash of the package content
 * @returns The public URL of the uploaded package
 */
async function uploadToStorage(
  supabase: SupabaseClient,
  mcp: McpRow,
  mcpbBuffer: Buffer,
  contentHash: string
): Promise<string> {
  const fileName = `packages/${mcp.slug}.mcpb`;

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

  const {
    data: { publicUrl },
  } = supabase.storage.from('mcpb-packages').getPublicUrl(fileName);

  // Update database with storage URL and build hash
  await prisma.content.update({
    where: {
      id: mcp.id,
    },
    data: {
      mcpb_storage_url: publicUrl,
      mcpb_build_hash: contentHash,
      mcpb_last_built_at: new Date(),
    },
  });

  return publicUrl;
}

