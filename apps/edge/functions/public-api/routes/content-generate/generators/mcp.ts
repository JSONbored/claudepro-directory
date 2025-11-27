/**
 * MCP .mcpb Package Generator
 *
 * Generates one-click installer .mcpb packages for MCP servers.
 * Uses shared storage and database utilities from data-api.
 */

import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import {
  getStorageServiceClient,
  supabaseServiceRole,
  uploadObject,
} from '@heyclaude/edge-runtime';
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
 * Builds a manifest template placeholder in the form `${variable}`.
 *
 * @param variable - The template variable name to embed
 * @returns The placeholder string formatted as `${variable}`
 */
function createTemplateVar(variable: string): string {
  return `\${${variable}}`;
}

/**
 * Escape characters so a string can be embedded inside a single-quoted JavaScript string literal.
 *
 * @param s - The input string to escape
 * @returns The input with backslashes, single quotes, dollar signs (`$`), and backticks escaped for safe inclusion in a single-quoted JS string
 */
function escapeForSingleQuotedLiteral(s: string): string {
  // Escape backslashes, then single quotes, then template literal chars ($ and `)
  // just in case it ends up inside a template literal too
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

/**
 * Retrieve a named own property value from an unknown value if it is a plain object.
 *
 * @param obj - The value to inspect for the property
 * @param key - The property name to read
 * @returns The property's value if `obj` is a non-null object and has an own property `key`, `undefined` otherwise
 */
function getProperty(obj: unknown, key: string): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return undefined;
  }
  const desc = Object.getOwnPropertyDescriptor(obj, key);
  return desc ? desc.value : undefined;
}

/**
 * Retrieve a string property from an unknown object if present.
 *
 * @param obj - The value to read the property from
 * @param key - The property name to retrieve
 * @returns The string value of `key` if present and of type `string`, `undefined` otherwise
 */
function getStringProperty(obj: unknown, key: string): string | undefined {
  const value = getProperty(obj, key);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Builds user_config entries for the MCP manifest based on the MCP's metadata.
 *
 * If `metadata.requires_auth` is true, returns a single API key entry whose key name is derived from the MCP slug (falling back to `api_key`) and whose title/description include the MCP title or slug. Otherwise returns an empty object.
 *
 * @param mcp - The MCP content row whose metadata, slug, and title are used to derive user_config entries
 * @returns A map of `UserConfigEntry` objects keyed by their environment variable name; empty when no user config is required
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
    const rawServerName = mcp.slug.replace(/-mcp-server$/, '').replace(/-mcp$/, '');
    const serverName = rawServerName.trim();
    const apiKeyName = serverName ? `${serverName}_api_key` : 'api_key';

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
 * Build an MCP .mcpb manifest (v0.2) for the provided MCP content row.
 *
 * @param mcp - The MCP content row whose metadata, slug, title, description, and author populate manifest fields
 * @returns The manifest.json content as a pretty-printed JSON string conforming to the .mcpb v0.2 specification
 */
function generateManifest(mcp: McpRow): string {
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
 * Generates the Node.js server entry file (server/index.js) for an MCP package.
 *
 * Produces an HTTP-to-stdio proxy bridge when the MCP metadata specifies a remote HTTP endpoint,
 * otherwise produces a minimal stdio-based MCP server placeholder.
 *
 * @param mcp - The MCP content row; used to read metadata (title, description, slug, and configuration) that determine server type and embedded values.
 * @returns The generated source code for server/index.js as a string.
 */
function generateServerIndex(mcp: McpRow): string {
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

  const title = escapeForSingleQuotedLiteral(mcp.title || mcp.slug);
  const description = escapeForSingleQuotedLiteral(mcp.description || '');
  const slug = escapeForSingleQuotedLiteral(mcp.slug);

  // For HTTP-based servers, create a proxy bridge
  if (httpUrl && typeof httpUrl === 'string') {
    // Use JSON.stringify to safe-guard URL injection
    // This handles quotes, backslashes, and other special chars correctly
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

// HTTP proxy bridge: Forward MCP requests to remote HTTP endpoint
const HTTP_ENDPOINT = ${escapedHttpUrl};

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
  console.error('${slug} MCP server proxy running on stdio -> ' + ${escapedHttpUrl});
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
 * Create the contents of a package.json for an MCP Node.js package.
 *
 * @param mcp - MCP row whose `slug`, `description`, and `title` are used to populate the package fields
 * @returns A pretty-printed JSON string for package.json including `name`, `version`, `description`, `type`, `main`, and `dependencies`
 */
function generatePackageJson(mcp: McpRow): string {
  const packageJson = {
    name: mcp.slug,
    version: '1.0.0',
    description: mcp.description || `MCP server: ${mcp.title || mcp.slug}`,
    type: 'module',
    main: 'server/index.js',
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.22.0',
    },
  };

  return JSON.stringify(packageJson, null, 2);
}

/**
 * Builds the README.md contents for a generated .mcpb package using MCP metadata.
 *
 * @param mcp - The MCP content row whose title, description, configuration flag, and documentation URL populate the README
 * @returns The README.md content as a Markdown string
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
 * Assembles a .mcpb package containing manifest, server index, package.json, and README into a ZIP-formatted byte array.
 *
 * @param manifest - The text content for `manifest.json`
 * @param serverIndex - The text content for `server/index.js`
 * @param packageJson - The text content for `package.json`
 * @param readme - The text content for `README.md`
 * @returns A `Uint8Array` containing the ZIP-formatted `.mcpb` package
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

  const encoder = new TextEncoder();
  const files = [
    { name: 'manifest.json', content: encoder.encode(manifest) },
    { name: 'server/index.js', content: encoder.encode(serverIndex) },
    { name: 'package.json', content: encoder.encode(packageJson) },
    { name: 'README.md', content: encoder.encode(readme) },
  ];

  const dosTime = dateToDosTime(new Date());
  const dosDate = dateToDosDate(new Date());

  // Build ZIP structure
  const parts: Uint8Array[] = [];
  const centralDir: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const crc = crc32(file.content);
    // Local File Header
    const localHeader = createZipLocalFileHeader(
      file.name,
      file.content.length,
      dosTime,
      dosDate,
      crc
    );
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
      dosDate,
      crc
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
 * Builds a ZIP local file header for a single file entry.
 *
 * @param fileName - The file name to include in the header (UTF-8)
 * @param fileSize - The file's size in bytes (used for both compressed and uncompressed sizes)
 * @param dosTime - The last modification time encoded in DOS time format
 * @param dosDate - The last modification date encoded in DOS date format
 * @param crc - The CRC-32 checksum of the file data
 * @returns A `Uint8Array` containing the local file header followed by the file name bytes
 */
function createZipLocalFileHeader(
  fileName: string,
  fileSize: number,
  dosTime: number,
  dosDate: number,
  crc: number
): Uint8Array {
  const header = new Uint8Array(30 + fileName.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true); // Local file header signature
  view.setUint16(4, 20, true); // Version needed
  view.setUint16(6, 0, true); // General purpose bit flag
  view.setUint16(8, 0, true); // Compression method (0 = stored)
  view.setUint16(10, dosTime, true); // Last mod time
  view.setUint16(12, dosDate, true); // Last mod date
  view.setUint32(14, crc, true); // CRC-32
  view.setUint32(18, fileSize, true); // Compressed size
  view.setUint32(22, fileSize, true); // Uncompressed size
  view.setUint16(26, fileName.length, true); // File name length
  view.setUint16(28, 0, true); // Extra field length

  new TextEncoder().encodeInto(fileName, header.subarray(30));
  return header;
}

/**
 * Builds a ZIP central directory entry for a single file.
 *
 * @param fileName - The file name to store in the central directory entry.
 * @param fileSize - The file size in bytes (used for both compressed and uncompressed size fields).
 * @param localHeaderOffset - The relative offset (from start of archive) to the file's local header.
 * @param dosTime - The last-modified time encoded in DOS time format.
 * @param dosDate - The last-modified date encoded in DOS date format.
 * @param crc - The CRC-32 checksum of the file data.
 * @returns A Uint8Array containing the binary central directory entry for the specified file.
 */
function createZipCentralDirEntry(
  fileName: string,
  fileSize: number,
  localHeaderOffset: number,
  dosTime: number,
  dosDate: number,
  crc: number
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
  view.setUint32(16, crc, true); // CRC-32
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
 * Compute the CRC-32 checksum of a byte array.
 *
 * @param data - The input bytes to checksum
 * @returns The CRC-32 checksum of `data` as an unsigned 32-bit integer
 */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds the ZIP End of Central Directory (EOCD) record.
 *
 * @param centralDirOffset - Byte offset where the central directory starts within the archive
 * @param centralDirSize - Size in bytes of the central directory
 * @param entryCount - Number of entries contained in the central directory
 * @returns A 22-byte `Uint8Array` containing the EOCD record ready to append to the ZIP archive
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
 * Encode a Date's time component into 16-bit MS-DOS time format.
 *
 * @param date - The date whose local time will be encoded
 * @returns A 16-bit DOS time value: hours in bits 11–15, minutes in bits 5–10, and seconds/2 in bits 0–4
 */
function dateToDosTime(date: Date): number {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return (hour << 11) | (minute << 5) | (second >> 1);
}

/**
 * Convert a JavaScript Date into a 16-bit DOS date value.
 *
 * @param date - The date to convert
 * @returns A 16-bit DOS date where bits encode the year since 1980, month, and day
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
    // Create a new ArrayBuffer to ensure type compatibility (ArrayBufferLike includes SharedArrayBuffer)
    // Copy the buffer to ensure we have a proper ArrayBuffer, not SharedArrayBuffer
    const arrayBuffer =
      mcpbBuffer.buffer instanceof ArrayBuffer
        ? mcpbBuffer.buffer
        : (new Uint8Array(mcpbBuffer).buffer as ArrayBuffer);
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
 * Produce a SHA-256 hash of the given content as a lowercase hexadecimal string.
 *
 * @param content - The input string to hash
 * @returns The SHA-256 digest of `content` encoded as a lowercase hex string
 */
async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}