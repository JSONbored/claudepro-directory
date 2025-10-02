#!/usr/bin/env node
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { MAIN_CONTENT_CATEGORIES } from '../lib/constants.js';
import { logger } from '../lib/logger.js';
// Content metadata schema import removed - using direct object destructuring
import { onBuildComplete } from '../lib/related-content/cache-invalidation.js';
import { contentIndexer } from '../lib/related-content/indexer.js';
import type {
  AgentContent,
  CommandContent,
  GuideContent,
  HookContent,
  JobContent,
  McpContent,
  RuleContent,
  StatuslineContent,
} from '../lib/schemas/content/index.js';
import { validateContentByCategory } from '../lib/schemas/content/index.js';
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
const CACHE_DIR = path.join(ROOT_DIR, '.next', 'cache', 'build-content');

// Build configuration with validation
const buildConfig: BuildConfig = buildConfigSchema.parse({
  contentDir: CONTENT_DIR,
  generatedDir: GENERATED_DIR,
  contentTypes: [...MAIN_CONTENT_CATEGORIES],
  generateTypeScript: true,
  generateIndex: true,
  invalidateCaches: true,
});

// Incremental build cache interface
interface BuildCache {
  version: string;
  files: Record<string, { hash: string; mtime: number }>;
  lastBuild: string;
}

// Cache utilities for incremental builds
const buildCache = {
  async load(): Promise<BuildCache | null> {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const cachePath = path.join(CACHE_DIR, 'build-cache.json');
      const content = await fs.readFile(cachePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  },

  async save(cache: BuildCache): Promise<void> {
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const cachePath = path.join(CACHE_DIR, 'build-cache.json');
      await fs.writeFile(cachePath, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (error) {
      logger.warn(
        `Failed to save build cache: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  },

  async getFileInfo(filePath: string): Promise<{ hash: string; mtime: number } | null> {
    try {
      const [content, stats] = await Promise.all([
        fs.readFile(filePath, 'utf-8'),
        fs.stat(filePath),
      ]);
      return {
        hash: this.computeHash(content),
        mtime: stats.mtimeMs,
      };
    } catch {
      return null;
    }
  },
};

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
  | McpContent
  | HookContent
  | CommandContent
  | RuleContent
  | JobContent
  | GuideContent
  | StatuslineContent;

// Process a single file with caching
async function processJsonFile(
  file: string,
  dir: string,
  validatedType: ContentCategory,
  _cache: BuildCache | null
): Promise<ValidatedContent | null> {
  const filePath = path.join(dir, file);
  const resolvedFilePath = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);

  // Security: Additional path validation
  if (!resolvedFilePath.startsWith(resolvedDir)) {
    logger.error(`Security violation: Path traversal attempt in file ${file}`);
    return null;
  }

  try {
    // Check cache for unchanged files (note: cache parameter is reserved for future
    // incremental skipping optimization where validated output would be cached)
    const fileInfo = await buildCache.getFileInfo(filePath);
    if (!fileInfo) return null;

    const content = await fs.readFile(filePath, 'utf-8');

    // Security: Validate content size to prevent DoS
    if (content.length > 1024 * 1024) {
      logger.error(`File ${file} exceeds maximum size limit`);
      return null;
    }

    // Parse and validate JSON structure with Zod
    const rawJsonStructureSchema = z.object({}).passthrough();
    let parsedData: z.infer<typeof rawJsonStructureSchema>;
    try {
      const rawParsed = JSON.parse(content);
      parsedData = rawJsonStructureSchema.parse(rawParsed);
    } catch (parseError) {
      logger.error(
        `JSON parse error in ${file}: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
      return null;
    }

    // Auto-generate slug from filename if not provided
    if (!parsedData.slug) {
      parsedData.slug = generateSlugFromFilename(file);
    }

    // Auto-generate title from slug if not provided or empty (for display purposes)
    if (
      (!parsedData.title ||
        (typeof parsedData.title === 'string' && parsedData.title.trim() === '')) &&
      typeof parsedData.slug === 'string'
    ) {
      parsedData.title = slugToTitle(parsedData.slug);
    }

    // Use category-specific validation instead of generic schema
    try {
      const validatedItem = validateContentByCategory(parsedData, validatedType);
      return validatedItem;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        logger.error(
          `Category-specific validation failed for ${file} (type: ${validatedType}): ${validationError.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
        );
      } else {
        logger.error(
          `Validation error for ${file}: ${validationError instanceof Error ? validationError.message : String(validationError)}`
        );
      }
      return null;
    }
  } catch (fileError) {
    logger.error(
      `Error reading file ${file}: ${fileError instanceof Error ? fileError.message : String(fileError)}`
    );
    return null;
  }
}

async function loadJsonFiles(
  type: ContentCategory,
  cache: BuildCache | null
): Promise<ValidatedContent[]> {
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
    // Exclude template files from processing
    const jsonFiles = files.filter(
      (f) =>
        f.endsWith('.json') &&
        !f.includes('..') &&
        !f.startsWith('.') &&
        !f.includes('template') &&
        f.match(/^[a-zA-Z0-9\-_]+\.json$/)
    );

    // Process files in parallel with concurrency limit (10 at a time for optimal CPU usage)
    const BATCH_SIZE = 10;
    const items: (ValidatedContent | null)[] = [];

    for (let i = 0; i < jsonFiles.length; i += BATCH_SIZE) {
      const batch = jsonFiles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((file) => processJsonFile(file, dir, validatedType, cache))
      );
      items.push(...batchResults);
    }

    // Filter out null values with type safety
    const validItems = items.filter((item): item is NonNullable<typeof item> => item !== null);

    logger.success(`Loaded ${validItems.length}/${jsonFiles.length} valid ${validatedType} files`);
    return validItems;
  } catch (error) {
    logger.error(
      `Failed to load JSON files from ${dir}: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

async function generateTypeScript(cache: BuildCache | null): Promise<GeneratedFile[]> {
  await ensureDir(buildConfig.generatedDir);

  const allContent: Record<ContentCategory, ValidatedContent[]> = {} as Record<
    ContentCategory,
    ValidatedContent[]
  >;
  const generatedFiles: GeneratedFile[] = [];

  // Load all content in parallel with category-specific validation
  const loadPromises = buildConfig.contentTypes.map(async (type) => {
    try {
      const items = await loadJsonFiles(type, cache);
      allContent[type] = items;
      logger.success(`Processed ${items.length} ${type} items`);
    } catch (error) {
      logger.failure(
        `Failed to load ${type} content: ${error instanceof Error ? error.message : String(error)}`
      );
      allContent[type] = [];
    }
  });

  // Execute all category loads in parallel
  await Promise.all(loadPromises);

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
      statuslines: 'StatuslineContent',
    };
    const typeImport = typeImportMap[type as keyof typeof typeImportMap] || 'BaseContentMetadata';

    const metadataContent = `// Auto-generated metadata file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
// Content Type: ${type}

import type { ${typeImport} } from '@/lib/schemas/content';

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
    const schemaImport = typeImportMap[type as keyof typeof typeImportMap] || 'BaseContentMetadata';

    const fullContent = `// Auto-generated full content file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}
// Content Type: ${type}

import type { ${schemaImport} } from '@/lib/schemas/content';

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

  // Generate main index file with lazy loading using existing infrastructure
  const indexContent = `// Auto-generated index file - DO NOT EDIT
// Generated at: ${new Date().toISOString()}

// OPTIMIZATION: Use lazy loading to reduce initial bundle size
// Instead of direct imports, use the existing lazy loading infrastructure
import { metadataLoader } from '@/lib/lazy-content-loaders';

// Lazy metadata getters - only load when accessed
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    return `export const get${varName.charAt(0).toUpperCase() + varName.slice(1)} = () => metadataLoader.get('${varName}Metadata');`;
  })
  .join('\n')}

// Backward compatibility: export promises that resolve to the data
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const capitalizedName = varName.charAt(0).toUpperCase() + varName.slice(1);
    return `export const ${varName} = get${capitalizedName}();`;
  })
  .join('\n')}

// By-slug getters - load metadata on demand and find by slug
${buildConfig.contentTypes
  .map((type) => {
    const varName = type.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const singularName = varName.replace(/s$/, '').replace(/Servers/, 'Server');
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);
    const capitalizedName = varName.charAt(0).toUpperCase() + varName.slice(1);

    return `export const get${capitalizedSingular}BySlug = async (slug: string) => {
  const ${varName}Data = await get${capitalizedName}();
  return (${varName}Data as any[]).find(item => item.slug === slug);
};`;
  })
  .join('\n\n')}

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
import type { ContentStats } from '../lib/schemas/content';

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
    // Load existing cache
    const cache = await buildCache.load();
    if (cache) {
      logger.info(`Loaded build cache from ${cache.lastBuild}`);
    }

    // Generate TypeScript files with validation and caching
    const generatedFiles = await generateTypeScript(cache);
    logger.success(`Generated ${generatedFiles.length} TypeScript files`);

    // Build content index and save in parallel
    const [index] = await Promise.all([
      contentIndexer.buildIndex(),
      // Update cache with all processed files
      (async () => {
        const newCache: BuildCache = {
          version: '1.0.0',
          files: {},
          lastBuild: new Date().toISOString(),
        };

        // Collect all file paths from all content directories
        for (const type of buildConfig.contentTypes) {
          const dir = path.join(buildConfig.contentDir, type);
          try {
            const files = await fs.readdir(dir);
            const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.includes('template'));

            await Promise.all(
              jsonFiles.map(async (file) => {
                const filePath = path.join(dir, file);
                const fileInfo = await buildCache.getFileInfo(filePath);
                if (fileInfo) {
                  newCache.files[filePath] = fileInfo;
                }
              })
            );
          } catch {
            // Directory might not exist
          }
        }

        await buildCache.save(newCache);
      })(),
    ]);

    // Save both the original monolithic index and new split indices
    await Promise.all([
      contentIndexer.saveIndex(index), // Keep original for backward compatibility
      contentIndexer.saveSplitIndex(index), // New split files for performance
    ]);
    logger.success(`Built content index with ${index.items.length} items`);

    // Invalidate caches after build
    if (buildConfig.invalidateCaches) {
      await onBuildComplete();
      logger.success('Invalidated content caches');
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

    logger.success('Build completed successfully');
    logger.info(`Build time: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    if (error instanceof z.ZodError) {
      logger.error(
        `Validation error during build: ${error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      );
      errors.push(...error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    } else {
      logger.error('Build failed:', error instanceof Error ? error : new Error(String(error)));
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

    logger.error(`Build failed with result: ${JSON.stringify(result, null, 2)}`);
    process.exit(1);
  }
}

// Execute build and handle results
build()
  .then((result) => {
    if (!result.success) {
      logger.failure(`Build failed with errors: ${result.errors?.join(', ')}`);
      process.exit(1);
    }
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      'Unexpected error during build:',
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  });
