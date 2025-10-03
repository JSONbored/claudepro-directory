#!/usr/bin/env tsx

// biome-ignore lint/nursery/noUnresolvedImports: Node.js built-in module
import fs from 'fs';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { contentItemSchema } from '../lib/schemas/content/content-item-union.schema';
import type { ContentCategory } from '../lib/schemas/shared.schema';
import { validateContentByCategory } from '../lib/validation/content-validator';

// Schema for raw JSON data validation
const rawJsonSchema = z.record(z.string(), z.unknown());

// Type for validated content data
type ContentData = z.infer<typeof contentItemSchema>;

// Get file paths from command line arguments
const files = process.argv.slice(2);

if (files.length === 0) {
  process.exit(0);
}

let hasErrors = false;

// Filter to only validate actual content files (not system files)
const contentFiles = files.filter(
  (filePath) =>
    filePath.includes('content/') &&
    !filePath.includes('template.json') &&
    filePath.endsWith('.json')
);

if (contentFiles.length === 0) {
  process.exit(0);
}

// Extract category from file path
function getCategoryFromPath(filePath: string): string | null {
  const pathParts = filePath.split('/');
  const contentIndex = pathParts.findIndex((part: string) => part === 'content');
  if (contentIndex !== -1 && contentIndex + 1 < pathParts.length) {
    return pathParts[contentIndex + 1] || null;
  }
  return null;
}

// Validate each content file using Zod schemas
contentFiles.forEach((filePath) => {
  try {
    // Read and parse JSON file
    const content = fs.readFileSync(filePath, 'utf8');
    let data: ContentData;

    let rawData: unknown;
    try {
      rawData = JSON.parse(content);
    } catch (error) {
      logger.error(
        'Invalid JSON in content file',
        error instanceof Error ? error : new Error(String(error)),
        {
          filePath: String(filePath),
        }
      );
      hasErrors = true;
      return;
    }

    // Validate raw JSON structure
    const rawValidation = rawJsonSchema.safeParse(rawData);
    if (!rawValidation.success) {
      logger.error('Invalid JSON structure', new Error(rawValidation.error.issues.join(', ')), {
        filePath: String(filePath),
      });
      hasErrors = true;
      return;
    }

    data = rawValidation.data as ContentData;

    // Get category from file path
    const category = getCategoryFromPath(filePath);
    if (!category) {
      logger.error(
        'Cannot determine content category from file path',
        new Error('Category determination failed'),
        {
          filePath: String(filePath),
          pathParts: String(filePath.split('/').length),
        }
      );
      hasErrors = true;
      return;
    }

    // Use Zod schema validation
    try {
      validateContentByCategory(data, category as ContentCategory);
      logger.info('Content validation successful', {
        filePath,
        category,
        slug: data.slug,
      });
    } catch (validationError) {
      logger.error(
        'Content validation failed',
        validationError instanceof Error ? validationError : new Error(String(validationError)),
        {
          filePath: String(filePath),
          category: String(category),
        }
      );
      hasErrors = true;
    }
  } catch (error) {
    logger.error(
      'Failed to process content file',
      error instanceof Error ? error : new Error(String(error)),
      {
        filePath: String(filePath),
      }
    );
    hasErrors = true;
  }
});

// Exit with error code if validation failed
process.exit(hasErrors ? 1 : 0);
