/**
 * MCP .mcpb Package Generator
 *
 * Generates one-click installer .mcpb packages for MCP servers.
 * Uses shared storage and database utilities from data-api.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { supabaseServiceRole } from '@heyclaude/edge-runtime/clients/supabase.ts';
import { getStorageServiceClient } from '@heyclaude/edge-runtime/utils/storage/client.ts';
import { uploadObject } from '@heyclaude/edge-runtime/utils/storage/upload.ts';
import type { ContentRow, GenerateResult, PackageGenerator } from '../types.ts';

type McpRow = ContentRow & { category: 'mcp' };

// MCP metadata is stored as Json type in database, validated at runtime

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

/**
 * Helper to create template variable strings for manifest.json
 * These are literal strings that will be in the generated JSON, not template literals
 */
function createTemplateVar(variable: string): string {
  return `\${${variable}}`;
}

/**
 * Escape a string for safe inclusion in a JS template literal (for generated code).
 * Escapes backslashes first, then $ and ` to prevent injection issues.
 */
function escapeForTemplateLiteral(s: string): string {
  // Must escape backslash first, then the rest
  return s.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

/**
 * Extract user_config from MCP metadata
 */
function extractUserConfig(mcp: McpRow): Record<string, UserConfigEntry> {
  const userConfig: Record<string, UserConfigEntry> = {};

  const metadata = mcp.metadata;
  if (!metadata || typeof metadata !== 'object') {
    return userConfig;
  }

  // Check if requires_auth is true
  const requiresAuthDesc = Object.getOwnPropertyDescriptor(metadata, 'requires_auth');
  const requiresAuth = requiresAuthDesc && requiresAuthDesc.value === true;

  if (requiresAuth) {
    // Extract common API key patterns from metadata
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
 * Generate manifest.json for .mcpb package (v0.2 spec)
 */
function generateManifest(mcp: McpRow): string {
  // Safely extract properties from metadata
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc ? desc.value : undefined;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const metadata = mcp.metadata;
  const config =
    metadata && typeof metadata === 'object' ? getProperty(metadata, 'configuration') : undefined;
  const claudeDesktop =
    config && typeof config === 'object' ? getProperty(config, 'claudeDesktop') : undefined;
  const mcpConfig =
    claudeDesktop && typeof claudeDesktop === 'object'
      ? getProperty(claudeDesktop, 'mcp')
      : undefined;

  const configObj =
    mcpConfig && typeof mcpConfig === 'object' && !Array.isArray(mcpConfig) ? mcpConfig : undefined;
  const serverName = configObj ? Object.keys(configObj)[0] || mcp.slug : mcp.slug;
  const serverConfig =
    configObj && typeof configObj === 'object' ? getProperty(configObj, serverName) : undefined;
  const httpUrl =
    serverConfig && typeof serverConfig === 'object'
      ? getStringProperty(serverConfig, 'url')
      : undefined;

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
            env: Object.keys(userConfig).reduce<Record<string, string>>((acc, key) => {
              acc[key.toUpperCase()] = createTemplateVar(`user_config.${key}`);
              return acc;
            }, {}),
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
        // Uses global `fetch`, which is reliably available in Node >=18
        node: '>=18.0.0',
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
  // Safely extract properties from metadata (same logic as generateManifest)
  const getProperty = (obj: unknown, key: string): unknown => {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    return desc ? desc.value : undefined;
  };

  const getStringProperty = (obj: unknown, key: string): string | undefined => {
    const value = getProperty(obj, key);
    return typeof value === 'string' ? value : undefined;
  };

  const metadata = mcp.metadata;
  const config =
    metadata && typeof metadata === 'object' ? getProperty(metadata, 'configuration') : undefined;
  const claudeDesktop =
    config && typeof config === 'object' ? getProperty(config, 'claudeDesktop') : undefined;
  const mcpConfig =
    claudeDesktop && typeof claudeDesktop === 'object'
      ? getProperty(claudeDesktop, 'mcp')
      : undefined;

  const configObj =
    mcpConfig && typeof mcpConfig === 'object' && !Array.isArray(mcpConfig) ? mcpConfig : undefined;
  const serverName = configObj ? Object.keys(configObj)[0] || mcp.slug : mcp.slug;
  const serverConfig =
    configObj && typeof configObj === 'object' ? getProperty(configObj, serverName) : undefined;
  const httpUrl =
    serverConfig && typeof serverConfig === 'object'
      ? getStringProperty(serverConfig, 'url')
      : undefined;

  const title = escapeForTemplateLiteral(mcp.title || mcp.slug);
  const description = escapeForTemplateLiteral(mcp.description || '');
  const slug = escapeForTemplateLiteral(mcp.slug);

  // For HTTP-based servers, create a proxy bridge
  if (httpUrl && typeof httpUrl === 'string') {
    const safeHttpUrl = escapeForTemplateLiteral(httpUrl);
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
 * Create .mcpb package (ZIP file) from bundle files
 * Note: .mcpb files are ZIP archives, so we can create them directly
 *
 * Uses manual ZIP creation (same approach as Skills generator)
 * TODO: Replace with proper Deno-compatible ZIP library when available
 */
async function createMcpbPackage(
  manifest: string,
  serverIndex: string,
  packageJson: string,
  readme: string
): Promise<Uint8Array> {
  // Create ZIP with multiple files
  // For simplicity, we'll create a basic ZIP structure
  // A proper ZIP library would be better, but this works for now

  const files = [
    { name: 'manifest.json', content: new TextEncoder().encode(manifest) },
    { name: 'server/index.js', content: new TextEncoder().encode(serverIndex) },
    { name: 'package.json', content: new TextEncoder().encode(packageJson) },
    { name: 'README.md', content: new TextEncoder().encode(readme) },
  ];

  const dosTime = dateToDosTime(new Date());
  const dosDate = dateToDosDate(new Date());

  // Build ZIP structure
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    // Local File Header
    const localHeader = createZipLocalFileHeader(file.name, file.content.length, dosTime, dosDate);
    parts.push(localHeader);
    offset += localHeader.length;

    // File Data
    parts.push(file.content);
    offset += file.content.length;

    // Central Directory Entry
    const cdEntry = createZipCentralDirEntry(
      file.name,
      file.content.length,
      offset - file.content.length - localHeader.length,
      dosTime,
      dosDate
    );
    centralDir.push(cdEntry);
  }

  const centralDirSize = centralDir.reduce((sum, entry) => sum + entry.length, 0);
  const centralDirOffset = offset;

  // Add Central Directory
  parts.push(...centralDir);
  offset += centralDirSize;

  // End of Central Directory
  const eocd = createZipEocd(centralDirOffset, centralDirSize, files.length);
  parts.push(eocd);

  // Combine all parts
  const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
  const zipBuffer = new Uint8Array(totalLength);
  let currentOffset = 0;
  for (const part of parts) {
    zipBuffer.set(part, currentOffset);
    currentOffset += part.length;
  }

  return zipBuffer;
}

/**
 * Create ZIP Local File Header
 */
function createZipLocalFileHeader(
  fileName: string,
  fileSize: number,
  dosTime: number,
  dosDate: number
): Uint8Array {
  const header = new Uint8Array(30 + fileName.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true); // Local file header signature
  view.setUint16(4, 20, true); // Version needed
  view.setUint16(6, 0, true); // General purpose bit flag
  view.setUint16(8, 0, true); // Compression method (0 = stored)
  view.setUint16(10, dosTime, true); // Last mod time
  view.setUint16(12, dosDate, true); // Last mod date
  view.setUint32(14, 0, true); // CRC-32 (0 for now)
  view.setUint32(18, fileSize, true); // Compressed size
  view.setUint32(22, fileSize, true); // Uncompressed size
  view.setUint16(26, fileName.length, true); // File name length
  view.setUint16(28, 0, true); // Extra field length

  new TextEncoder().encodeInto(fileName, header.subarray(30));
  return header;
}

/**
 * Create ZIP Central Directory Entry
 */
function createZipCentralDirEntry(
  fileName: string,
  fileSize: number,
  localHeaderOffset: number,
  dosTime: number,
  dosDate: number
): Uint8Array {
  const entry = new Uint8Array(46 + fileName.length);
  const view = new DataView(entry.buffer);

  view.setUint32(0, 0x02014b50, true); // Central file header signature
  view.setUint16(4, 20, true); // Version made by
  view.setUint16(6, 20, true); // Version needed
  view.setUint16(8, 0, true); // General purpose bit flag
  view.setUint16(10, 0, true); // Compression method
  view.setUint16(12, dosTime, true); // Last mod time
  view.setUint16(14, dosDate, true); // Last mod date
  view.setUint32(16, 0, true); // CRC-32
  view.setUint32(20, fileSize, true); // Compressed size
  view.setUint32(24, fileSize, true); // Uncompressed size
  view.setUint16(28, fileName.length, true); // File name length
  view.setUint16(30, 0, true); // Extra field length
  view.setUint16(32, 0, true); // File comment length
  view.setUint16(34, 0, true); // Disk number start
  view.setUint16(36, 0, true); // Internal file attributes
  view.setUint32(38, 0, true); // External file attributes
  view.setUint32(42, localHeaderOffset, true); // Relative offset of local header

  new TextEncoder().encodeInto(fileName, entry.subarray(46));
  return entry;
}

/**
 * Create ZIP End of Central Directory Record
 */
function createZipEocd(
  centralDirOffset: number,
  centralDirSize: number,
  entryCount: number
): Uint8Array {
  const eocd = new Uint8Array(22);
  const view = new DataView(eocd.buffer);

  view.setUint32(0, 0x06054b50, true); // End of central dir signature
  view.setUint16(4, 0, true); // Number of this disk
  view.setUint16(6, 0, true); // Number of disk with start of central directory
  view.setUint16(8, entryCount, true); // Total entries in central dir on this disk
  view.setUint16(10, entryCount, true); // Total entries in central directory
  view.setUint32(12, centralDirSize, true); // Size of central directory
  view.setUint32(16, centralDirOffset, true); // Offset of start of central directory
  view.setUint16(20, 0, true); // ZIP file comment length

  return eocd;
}

/**
 * Convert Date to DOS time format (16-bit)
 */
function dateToDosTime(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return (hour << 11) | (minute << 5) | (second >> 1);
}

/**
 * Convert Date to DOS date format (16-bit)
 */
function dateToDosDate(date: Date): number {
  const year = date.getFullYear() - 1980;
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return (year << 9) | (month << 5) | day;
}

export class McpGenerator implements PackageGenerator {
  canGenerate(content: ContentRow): boolean {
    return content.category === 'mcp' && content.slug != null && content.slug.trim().length > 0;
  }

  async generate(content: ContentRow): Promise<GenerateResult> {
    if (!content.slug) {
      throw new Error('MCP server slug is required');
    }

    // Validate content is MCP category
    if (content.category !== 'mcp') {
      throw new Error('Content must be MCP category');
    }
    // After validation, content.category is narrowed to 'mcp', so we can use it as McpRow
    const mcp: McpRow = {
      ...content,
      category: 'mcp',
    };

    // 1. Compute content hash FIRST to check if regeneration is needed
    // Generate manifest temporarily to compute hash (matches build script logic)
    const manifestForHash = generateManifest(mcp);
    const packageContent = JSON.stringify({
      manifest: manifestForHash,
      metadata: mcp.metadata,
      description: mcp.description,
      title: mcp.title,
    });
    const contentHash = await computeContentHash(packageContent);

    // 2. Check if package already exists and content hasn't changed
    // Skip generation if hash matches and storage URL exists (optimization)
    if (
      mcp.mcpb_build_hash === contentHash &&
      mcp.mcpb_storage_url &&
      mcp.mcpb_storage_url.trim().length > 0
    ) {
      // Package is up to date, return existing storage URL
      return {
        storageUrl: mcp.mcpb_storage_url,
        metadata: {
          file_size_kb: '0', // Unknown, but package exists
          package_type: 'mcpb',
          build_hash: contentHash,
          skipped: true,
          reason: 'content_unchanged',
        },
      };
    }

    // 3. Generate package files (content changed or package missing)
    const manifest = generateManifest(mcp);
    const serverIndex = generateServerIndex(mcp);
    const packageJson = generatePackageJson(mcp);
    const readme = generateReadme(mcp);

    // 4. Create .mcpb package (ZIP file)
    const mcpbBuffer = await createMcpbPackage(manifest, serverIndex, packageJson, readme);
    const fileSizeKB = (mcpbBuffer.length / 1024).toFixed(2);

    // 5. Upload to Supabase Storage using shared utility
    const fileName = `packages/${mcp.slug}.mcpb`;
    // Convert Uint8Array to ArrayBuffer for upload
    // Create a new ArrayBuffer by copying the Uint8Array data
    const arrayBuffer = new Uint8Array(mcpbBuffer).buffer;
    const uploadResult = await uploadObject({
      bucket: this.getBucketName(),
      buffer: arrayBuffer,
      mimeType: 'application/zip',
      objectPath: fileName,
      cacheControl: '3600',
      upsert: true,
      client: getStorageServiceClient(),
    });

    if (!(uploadResult.success && uploadResult.publicUrl)) {
      throw new Error(uploadResult['error'] || 'Failed to upload .mcpb package to storage');
    }

    // 6. Update database with storage URL and build metadata
    // Use updateTable helper to properly handle extended Database type
    const updateData = {
      mcpb_storage_url: uploadResult.publicUrl,
      mcpb_build_hash: contentHash,
      mcpb_last_built_at: new Date().toISOString(),
    } satisfies DatabaseGenerated['public']['Tables']['content']['Update'];
    const { error: updateError } = await supabaseServiceRole
      .from('content')
      .update(updateData)
      .eq('id', mcp.id);

    if (updateError) {
      throw new Error(
        `Database update failed: ${updateError instanceof Error ? updateError.message : String(updateError)}`
      );
    }

    return {
      storageUrl: uploadResult.publicUrl,
      metadata: {
        file_size_kb: fileSizeKB,
        package_type: 'mcpb',
        build_hash: contentHash,
      },
    };
  }

  getBucketName(): string {
    return 'mcpb-packages';
  }

  getDatabaseFields(): string[] {
    return ['mcpb_storage_url', 'mcpb_build_hash', 'mcpb_last_built_at'];
  }
}

/**
 * Compute content hash for build tracking
 * Uses Web Crypto API (available in Deno)
 */
async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
