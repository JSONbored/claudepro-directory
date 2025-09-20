#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import slugify from 'slugify';
import { fileURLToPath } from 'url';

type ContentCategory = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

// Content types to process
const CONTENT_TYPES: ContentCategory[] = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

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
  configuration?: unknown;
}

// Generate title from slug
function _slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Generate SEO-friendly slug from title or name (fallback for legacy content)
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

async function loadJsonFiles(type: string): Promise<BaseContent[]> {
  const dir = path.join(CONTENT_DIR, type);

  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        try {
          const item = JSON.parse(content);

          // For hooks, rules, agents, and MCP servers, prioritize slug as source of truth
          if (type === 'hooks' || type === 'rules' || type === 'mcp' || type === 'agents') {
            // Auto-generate slug from filename if not provided
            if (!item.slug) {
              item.slug = path.basename(file, '.json');
            }

            // TODO - update remaining categories (commands) to use new slug-only approach
            // Auto-generate id and title from slug for slug-based content types
            item.id = item.slug;
            if (!item.title) {
              item.title = _slugToTitle(item.slug);
            }
          } else {
            // Legacy behavior for other content types
            if (!item.slug) {
              item.slug = generateSlug(item);
            }
            if (!item.id) {
              item.id = item.slug;
            }
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
    return [];
  }
}

async function generateTypeScript() {
  await ensureDir(GENERATED_DIR);

  const allContent: Record<string, BaseContent[]> = {};

  // Load all content
  for (const type of CONTENT_TYPES) {
    const items = await loadJsonFiles(type);
    allContent[type] = items;
  }

  // Generate separate files for each content type with metadata only
  for (const type of CONTENT_TYPES) {
    const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

    // Create metadata version (without heavy content fields for listing pages)
    const metadata = allContent[type].map((item) => {
      const { content: _content, config: _config, configuration: _configuration, ...meta } = item;
      return meta;
    });

    // Generate metadata file
    const metadataContent = `// Auto-generated metadata file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

import type { ${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular}, ContentMetadata } from '../types/content';

type ${capitalizedSingular}Metadata = Omit<${capitalizedSingular === 'Mcp' ? 'MCPServer' : capitalizedSingular}, 'content'> & ContentMetadata;

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
}

// Run the build
generateTypeScript().catch(console.error);
