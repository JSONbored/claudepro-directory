#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import { fileURLToPath } from 'url';
import type { Agent, Command, ContentCategory, Hook, MCPServer, Rule } from '../src/types/content';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const GENERATED_DIR = path.join(ROOT_DIR, 'src', 'generated');

// Content types to process
const CONTENT_TYPES: ContentCategory[] = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

type ContentItem = Agent | MCPServer | Rule | Command | Hook;

interface BaseContent {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  description: string;
  category: string;
  author: string;
  tags: string[];
  content?: string;
  config?: string;
}

// Generate SEO-friendly slug from title or name
function generateSlug(item: BaseContent): string {
  const source = item.title || item.name || item.id;
  return slugify(source, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (_error) {
    // Directory exists
  }
}

async function loadJsonFiles(type: string): Promise<any[]> {
  const dir = path.join(CONTENT_DIR, type);

  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        try {
          const item = JSON.parse(content);

          // Auto-generate slug if not provided
          if (!item.slug) {
            item.slug = generateSlug(item);
          }

          // Ensure id matches slug for consistency
          if (!item.id) {
            item.id = item.slug;
          }

          return item;
        } catch (error) {
          console.error(`Error parsing ${file}:`, error);
          return null;
        }
      })
    );

    return items.filter(Boolean);
  } catch (_error) {
    console.log(`No content found for ${type}`);
    return [];
  }
}

async function generateTypeScript() {
  await ensureDir(GENERATED_DIR);

  const allContent: Record<string, any[]> = {};

  // Load all content
  for (const type of CONTENT_TYPES) {
    const items = await loadJsonFiles(type);
    allContent[type] = items;
    console.log(`Loaded ${items.length} ${type}`);
  }

  // Generate separate files for each content type with metadata only
  for (const type of CONTENT_TYPES) {
    const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

    // Create metadata version (without content/config fields for listing pages)
    const metadata = allContent[type].map((item) => {
      const { content, config, ...meta } = item;
      return meta;
    });

    // Generate metadata file
    const metadataContent = `// Auto-generated metadata file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

import type { ${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular}, ContentMetadata } from '../types/content';

type ${capitalizedSingular}Metadata = Omit<${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular}, 'content'>;

export const ${varName}Metadata: ${capitalizedSingular}Metadata[] = ${JSON.stringify(metadata, null, 2)};

export const ${varName}MetadataBySlug = new Map(${varName}Metadata.map(item => [item.slug, item]));

export function get${capitalizedSingular}MetadataBySlug(slug: string): ${capitalizedSingular}Metadata | null {
  return ${varName}MetadataBySlug.get(slug) || null;
}`;

    await fs.writeFile(path.join(GENERATED_DIR, `${type}-metadata.ts`), metadataContent, 'utf-8');

    // Generate full content file (loaded lazily when needed)
    const fullContent = `// Auto-generated full content file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

import type { ${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular} } from '../types/content';

export const ${varName}Full: ${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular}[] = ${JSON.stringify(allContent[type], null, 2)};

export const ${varName}FullBySlug = new Map(${varName}Full.map(item => [item.slug, item]));

export function get${capitalizedSingular}FullBySlug(slug: string): ${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular} | null {
  return ${varName}FullBySlug.get(slug) || null;
}`;

    await fs.writeFile(path.join(GENERATED_DIR, `${type}-full.ts`), fullContent, 'utf-8');
  }

  // Generate main index file that exports metadata by default
  const indexContent = `// Auto-generated index file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

// Export metadata by default for list views
${CONTENT_TYPES.map((type) => {
  const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
  const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

  return `export { 
  ${varName}Metadata as ${varName}, 
  ${varName}MetadataBySlug as ${varName}BySlug, 
  get${capitalizedSingular}MetadataBySlug as get${capitalizedSingular}BySlug 
} from './${type}-metadata';`;
}).join('\n')}

// Export lazy loaders for full content (used in detail pages)
${CONTENT_TYPES.map((type) => {
  const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
  const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

  return `export async function get${capitalizedSingular}FullContent(slug: string) {
  const module = await import('./${type}-full');
  return module.get${capitalizedSingular}FullBySlug(slug);
}`;
}).join('\n\n')}

// Export counts for stats
import type { ContentStats } from '../types/content';

export const contentStats: ContentStats = {
${CONTENT_TYPES.map((type) => {
  const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return `  ${varName}: ${allContent[type].length}`;
}).join(',\n')}
};`;

  await fs.writeFile(path.join(GENERATED_DIR, 'content.ts'), indexContent);
  console.log('✅ Generated content metadata and full content files');
}

// Run the build
generateTypeScript().catch(console.error);
