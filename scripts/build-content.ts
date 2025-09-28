#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
// Content metadata schema import removed - using direct object destructuring
import { onBuildComplete } from '../lib/related-content/cache-invalidation.js';
import { contentIndexer } from '../lib/related-content/indexer.js';
import { validateContentByCategory } from '../lib/schemas/content/index.js';
import type {
  AgentContent,
  CommandContent,
  GuideContent,
  HookContent,
  JobContent,
  MCPServerContent,
  RuleContent,
} from '../lib/schemas/content.schema.js';
import {
  type BuildConfig,
  type BuildResult,
  buildConfigSchema,
  type GeneratedFile,
  generateSlugFromFilename,
} from '../lib/schemas/content-generation.schema.js';
import { type ContentCategory, contentCategorySchema } from '../lib/schemas/shared.schema.js';
import { slugToTitle } from '../lib/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');

// Build configuration with validation
const buildConfig: BuildConfig = buildConfigSchema.parse({
  contentDir: CONTENT_DIR,
  generatedDir: GENERATED_DIR,
  contentTypes: ['agents', 'mcp', 'rules', 'commands', 'hooks'],
  generateTypeScript: true,
  generateIndex: true,
  invalidateCaches: true,
});

async function ensureDir(dir: string) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (_error) {
    // Directory exists
  }
}

// Define union type for all possible content types
type ValidatedContent =
  | AgentContent
  | MCPServerContent
  | HookContent
  | CommandContent
  | RuleContent
  | JobContent
  | GuideContent;

async function loadJsonFiles(type: ContentCategory): Promise<ValidatedContent[]> {
  // Validate the content category with strict validation
  const validatedType = contentCategorySchema.parse(type);
  const dir = path.join(buildConfig.contentDir, validatedType);

  // Security: Ensure directory path is within expected boundaries
  const resolvedDir = path.resolve(dir);
  const resolvedContentDir = path.resolve(buildConfig.contentDir);
  if (!resolvedDir.startsWith(resolvedContentDir)) {
    throw new Error(`Security violation: Directory traversal detected for type ${type}`);
  }

  try {
    const files = await fs.readdir(dir);
    // Security: Filter for valid JSON files only, prevent execution of other file types
    const jsonFiles = files.filter(
      (f) =>
        f.endsWith('.json') &&
        !f.includes('..') &&
        !f.startsWith('.') &&
        f.match(/^[a-zA-Z0-9\-_]+\.json$/)
    );

    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const filePath = path.join(dir, file);

        // Security: Additional path validation
        const resolvedFilePath = path.resolve(filePath);
        if (!resolvedFilePath.startsWith(resolvedDir)) {
          console.error(`Security violation: Path traversal attempt in file ${file}`);
          return null;
        }

        try {
          const content = await fs.readFile(filePath, 'utf-8');

          // Security: Validate content size to prevent DoS
          if (content.length > 1024 * 1024) {
            // 1MB limit
            console.error(`File ${file} exceeds maximum size limit`);
            return null;
          }

          // Parse and validate JSON structure with Zod
          const rawJsonStructureSchema = z.object({}).passthrough();
          let parsedData: z.infer<typeof rawJsonStructureSchema>;
          try {
            const rawParsed = JSON.parse(content);
            parsedData = rawJsonStructureSchema.parse(rawParsed);
          } catch (parseError) {
            console.error(
              `JSON parse error in ${file}:`,
              parseError instanceof Error ? parseError.message : String(parseError)
            );
            return null;
          }

          // Auto-generate slug from filename if not provided
          if (!parsedData.slug) {
            parsedData.slug = generateSlugFromFilename(file);
          }

          // Auto-generate title from slug if not provided (for display purposes)
          if (!parsedData.title && typeof parsedData.slug === 'string') {
            parsedData.title = slugToTitle(parsedData.slug);
          }

          // Use category-specific validation instead of generic schema
          try {
            const validatedItem = validateContentByCategory(parsedData, validatedType);
            return validatedItem;
          } catch (validationError) {
            if (validationError instanceof z.ZodError) {
              console.error(
                `Category-specific validation failed for ${file} (type: ${validatedType}):`,
                validationError.issues.map((i) => `${i.path.join('.')}: ${i.message}`)
              );
            } else {
              console.error(
                `Validation error for ${file}:`,
                validationError instanceof Error ? validationError.message : String(validationError)
              );
            }
            return null;
          }
        } catch (fileError) {
          console.error(
            `Error reading file ${file}:`,
            fileError instanceof Error ? fileError.message : String(fileError)
          );
          return null;
        }
      })
    );

    // Filter out null values with type safety
    const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);

    console.log(`✅ Loaded ${validItems.length}/${jsonFiles.length} valid ${validatedType} files`);
    return validItems;
  } catch (error) {
    console.error(
      `Failed to load JSON files from ${dir}:`,
      error instanceof Error ? error.message : String(error)
    );
    return [];
  }
}

async function generateTypeScript(): Promise<GeneratedFile[]> {
  await ensureDir(buildConfig.generatedDir);

  const allContent: Record<ContentCategory, ValidatedContent[]> = {} as Record<
    ContentCategory,
    ValidatedContent[]
  >;
  const generatedFiles: GeneratedFile[] = [];

  // Load all content with category-specific validation
  for (const type of buildConfig.contentTypes) {
    try {
      const items = await loadJsonFiles(type);
      allContent[type] = items;
      console.log(`✅ Processed ${items.length} ${type} items`);
    } catch (error) {
      console.error(
        `❌ Failed to load ${type} content:`,
        error instanceof Error ? error.message : String(error)
      );
      allContent[type] = [];
    }
  }

  // Generate separate files for each content type with metadata only
  for (const type of buildConfig.contentTypes) {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

    // Create metadata version (without heavy content fields for listing pages)
    const contentData = allContent[type];
    if (!contentData || contentData.length === 0) continue;

    // Extract metadata fields, preserving type-specific fields like 'source'
    const metadata = contentData.map((item) => {
      // Create metadata by excluding only very heavy content fields
      const {
        features,
        useCases,
        installation,
        documentationUrl,
        githubUrl,
        package: packageField,
        ...metadata
      } = item as Record<string, unknown>;
      return metadata;
    });

    // Generate metadata file with proper types
    const typeImportMap = {
      agents: 'AgentContent',
      mcp: 'McpContent',
      hooks: 'HookContent',
      commands: 'CommandContent',
      rules: 'RuleContent',
    };
    const typeImport = typeImportMap[type as keyof typeof typeImportMap] || 'ContentMetadata';

    const metadataContent = `// Auto-generated metadata file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
// Content Type: ${type}

import type { ${typeImport} } from '@/lib/schemas/content.schema';

export const ${varName}Metadata: ${typeImport}[] = ${JSON.stringify(metadata, null, 2)};

export const ${varName}MetadataBySlug = new Map(${varName}Metadata.map(item => [item.slug, item]));

export function get${capitalizedSingular}MetadataBySlug(slug: string) {
  return ${varName}MetadataBySlug.get(slug) || null;
}

// Type for this content category metadata
export type ${capitalizedSingular}Metadata = typeof ${varName}Metadata[number];`;

    const metadataPath = path.join(buildConfig.generatedDir, `${type}-metadata.ts`);
    await fs.writeFile(metadataPath, metadataContent, 'utf-8');

    generatedFiles.push({
      path: metadataPath,
      type: 'metadata',
      category: type,
      itemCount: metadata.length,
      timestamp: new Date().toISOString(),
    });

    // Generate full content file with proper schema imports
    const schemaImport = typeImportMap[type as keyof typeof typeImportMap] || 'ContentMetadata';

    const fullContent = `// Auto-generated full content file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
// Content Type: ${type}

import type { ${schemaImport} } from '@/lib/schemas/content.schema';

export const ${varName}Full: ${schemaImport}[] = ${JSON.stringify(allContent[type], null, 2)};

export const ${varName}FullBySlug = new Map(${varName}Full.map(item => [item.slug, item]));

export function get${capitalizedSingular}FullBySlug(slug: string) {
  return ${varName}FullBySlug.get(slug) || null;
}

// Type for this content category (full content)
export type ${capitalizedSingular}Full = typeof ${varName}Full[number];`;

    const fullPath = path.join(buildConfig.generatedDir, `${type}-full.ts`);
    await fs.writeFile(fullPath, fullContent, 'utf-8');

    generatedFiles.push({
      path: fullPath,
      type: 'full',
      category: type,
      itemCount: contentData.length,
      timestamp: new Date().toISOString(),
    });
  }

  // Generate main index file that exports metadata by default
  const indexContent = `// Auto-generated index file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

// Export metadata by default for list views
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

    return `export {
  ${varName}Metadata as ${varName},
  ${varName}MetadataBySlug as ${varName}BySlug,
  get${capitalizedSingular}MetadataBySlug as get${capitalizedSingular}BySlug
} from './${type}-metadata';`;
  })
  .join('\n')}

// Export lazy loaders for full content (used in detail pages)
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);

    return `export async function get${capitalizedSingular}FullContent(slug: string) {
  const module = await import('./${type}-full');
  return module.get${capitalizedSingular}FullBySlug(slug);
}`;
  })
  .join('\n\n')}

// Export counts for stats
import type { ContentStats } from '../lib/schemas/content.schema';

export const contentStats: ContentStats = {
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const typeData = allContent[type];
    return `  ${varName}: ${typeData ? typeData.length : 0}`;
  })
  .join(',\n')},
  guides: 0
};`;

  const indexPath = path.join(buildConfig.generatedDir, 'content.ts');
  await fs.writeFile(indexPath, indexContent);

  generatedFiles.push({
    path: indexPath,
    type: 'index',
    itemCount: Object.values(allContent).reduce((sum, items) => sum + items.length, 0),
    timestamp: new Date().toISOString(),
  });

  return generatedFiles;
}

// Run the build
async function build(): Promise<BuildResult> {
  const startTime = performance.now();
  const errors: string[] = [];

  try {
    // Generate TypeScript files with validation
    const generatedFiles = await generateTypeScript();
    console.log(`✅ Generated ${generatedFiles.length} TypeScript files`);

    // Build content index
    const index = await contentIndexer.buildIndex();
    await contentIndexer.saveIndex(index);
    console.log(`✅ Built content index with ${index.items.length} items`);

    // Invalidate caches after build
    if (buildConfig.invalidateCaches) {
      await onBuildComplete();
      console.log('✅ Invalidated content caches');
    }

    const duration = performance.now() - startTime;

    // Calculate content stats
    const contentStats: Record<ContentCategory, number> = {} as Record<ContentCategory, number>;
    for (const type of buildConfig.contentTypes) {
      const files = generatedFiles.filter((f) => f.category === type && f.type === 'full');
      contentStats[type] = files[0]?.itemCount || 0;
    }

    const result: BuildResult = {
      success: true,
      contentStats,
      generatedFiles,
      indexItems: index.items.length,
      cacheInvalidated: buildConfig.invalidateCaches,
      duration,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log('✅ Build completed successfully');
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof z.ZodError) {
      console.error('Validation error during build:', error.issues);
      errors.push(...error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    } else {
      console.error('Build failed:', error);
      errors.push(String(error));
    }

    const result: BuildResult = {
      success: false,
      contentStats: {} as Record<ContentCategory, number>,
      generatedFiles: [],
      indexItems: 0,
      cacheInvalidated: false,
      duration,
      errors,
    };

    console.error('Build failed with result:', JSON.stringify(result, null, 2));
    process.exit(1);
  }
}

// Execute build and handle results
build()
  .then((result) => {
    if (!result.success) {
      console.error('❌ Build failed with errors:', result.errors);
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unexpected error during build:', error);
    process.exit(1);
  });
