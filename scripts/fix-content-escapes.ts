#!/usr/bin/env tsx
/**
 * Fix escape sequences in all content JSON files
 * Converts literal \n, \", \t, \r to actual characters
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Recursively process all string values to fix escape sequences
 */
function fixEscapeSequences(obj: any): any {
  if (typeof obj === 'string') {
    return obj
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r');
  }

  if (Array.isArray(obj)) {
    return obj.map(fixEscapeSequences);
  }

  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = fixEscapeSequences(value);
    }
    return result;
  }

  return obj;
}

async function fixContentFile(filePath: string): Promise<boolean> {
  try {
    // Read raw file content
    let content = await readFile(filePath, 'utf-8');

    // Fix escape sequences in the RAW JSON string values
    // This replaces \n with actual newlines, \" with actual quotes, etc.
    // We do this BEFORE parsing so the JSON structure remains valid
    content = content
      .replace(/\\\\n/g, '\\n') // Fix double-escaped newlines first
      .replace(/\\\\"/g, '\\"') // Fix double-escaped quotes
      .replace(/\\\\t/g, '\\t') // Fix double-escaped tabs
      .replace(/\\\\r/g, '\\r'); // Fix double-escaped carriage returns

    // Parse to validate it's still valid JSON
    const data = JSON.parse(content);

    // Write back with proper formatting
    await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

    return true;
  } catch (error) {
    console.error(`❌ Failed to fix ${filePath}:`, error);
    return false;
  }
}

async function getAllJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getAllJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  console.log('🔄 Fixing escape sequences in content files...\n');

  const contentDir = join(process.cwd(), 'content');
  const files = await getAllJsonFiles(contentDir);

  console.log(`📂 Found ${files.length} files to process\n`);

  let fixed = 0;
  let errors = 0;

  for (const file of files) {
    const relativePath = file.replace(process.cwd() + '/', '');
    const success = await fixContentFile(file);

    if (success) {
      console.log(`✅ ${relativePath}`);
      fixed++;
    } else {
      errors++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Fixed:  ${fixed}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total:  ${files.length}`);
  console.log('\n✅ Complete!');
}

main().catch(console.error);
