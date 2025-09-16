#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const GENERATED_DIR = path.join(ROOT_DIR, 'src', 'generated');

// Content types to process
const CONTENT_TYPES = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

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
    remove: /[*+~.()'"!:@]/g
  });
}

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory exists
  }
}

async function loadJsonFiles(type: string): Promise<any[]> {
  const dir = path.join(CONTENT_DIR, type);
  
  try {
    const files = await fs.readdir(dir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
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
  } catch (error) {
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
  
  // Generate TypeScript file
  const tsContent = `// Auto-generated file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

${CONTENT_TYPES.map(type => {
  // Convert kebab-case to camelCase for variable names
  const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
  const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);
  
  return `export const ${varName} = ${JSON.stringify(allContent[type], null, 2)} as const;

export const ${varName}BySlug = new Map(${varName}.map(item => [item.slug, item]));

export function get${capitalizedSingular}BySlug(slug: string) {
  return ${varName}BySlug.get(slug) || null;
}
`;
}).join('\n')}

// Export counts for stats
export const contentStats = {
${CONTENT_TYPES.map(type => {
  const varName = type.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  return `  ${varName}: ${allContent[type].length}`;
}).join(',\n')}
};
`;

  await fs.writeFile(path.join(GENERATED_DIR, 'content.ts'), tsContent);
  console.log('✅ Generated content.ts');
}

// Run the build
generateTypeScript().catch(console.error);