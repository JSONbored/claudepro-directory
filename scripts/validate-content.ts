#!/usr/bin/env tsx

import fs from 'fs';
import { validateContent } from '../lib/schemas/content.schema';

// Type for content JSON data structure
interface ContentData {
  slug: string;
  description: string;
  category: string;
  author: string;
  dateAdded: string;
  tags?: string[];
  [key: string]: string | string[] | number | boolean | Record<string, unknown> | undefined;
}

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
  console.log('No content files to validate');
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

    try {
      data = JSON.parse(content);
    } catch (e) {
      console.error(`ERROR: Invalid JSON in ${filePath}`);
      console.error(e instanceof Error ? e.message : String(e));
      hasErrors = true;
      return;
    }

    // Get category from file path
    const category = getCategoryFromPath(filePath);
    if (!category) {
      console.error(`ERROR: Cannot determine category from path ${filePath}`);
      hasErrors = true;
      return;
    }

    // Use Zod schema validation
    try {
      validateContent(category, data);
      console.log(`✅ VALID: ${filePath}`);
    } catch (validationError) {
      console.error(`❌ VALIDATION ERROR in ${filePath}:`);
      if (validationError instanceof Error) {
        console.error(`  - ${validationError.message}`);
      } else {
        console.error(`  - ${String(validationError)}`);
      }
      hasErrors = true;
    }
  } catch (error) {
    console.error(`ERROR: Failed to process ${filePath}`);
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(String(error));
    }
    hasErrors = true;
  }
});

// Exit with error code if validation failed
if (hasErrors) {
  console.error('\n❌ Content validation failed');
  process.exit(1);
} else {
  process.exit(0);
}
