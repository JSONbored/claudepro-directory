/**
 * Migrate Examples Schema
 *
 * Converts OLD format: string[]
 * To NEW format: Array<{title, code, language, description}>
 *
 * Processes:
 * - 40 MCP server configs in /content/mcp/
 * - 1 Rule config in /content/rules/
 */

import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { ParseStrategy, safeParse } from '../src/lib/utils/data.utils.js';

interface OldFormat {
  examples?: string[];
  [key: string]: unknown;
}

interface NewExample {
  title: string;
  code: string;
  language:
    | 'typescript'
    | 'javascript'
    | 'json'
    | 'bash'
    | 'shell'
    | 'python'
    | 'yaml'
    | 'markdown'
    | 'plaintext';
  description?: string;
}

interface NewFormat {
  examples?: NewExample[];
  [key: string]: unknown;
}

/**
 * Convert a simple string example to structured format
 * Intelligently infers language and creates title/code/description
 */
function convertExample(example: string, index: number, category: string): NewExample {
  const trimmed = example.trim();

  // Determine language based on content patterns
  let language: NewExample['language'] = 'plaintext';
  let code = trimmed;
  let title = `Example ${index + 1}`;
  let description: string | undefined;

  // MCP server examples are usually plain text descriptions
  if (category === 'mcp') {
    // Convert description to actual usage
    title = trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed;
    code = `Ask Claude: "${trimmed}"`;
    description = 'Common usage pattern for this MCP server';
  }

  // Rules examples might have code patterns
  if (category === 'rules') {
    if (trimmed.includes('function') || trimmed.includes('=>')) {
      language = 'javascript';
    } else if (trimmed.includes('{') && trimmed.includes('}')) {
      language = 'json';
    }
    title = trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed;
    code = trimmed;
    description = 'Example application of this rule';
  }

  return {
    title,
    code,
    language,
    ...(description && { description }),
  };
}

/**
 * Migrate a single JSON file
 */
function migrateFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    // Production-grade: safeParse with permissive schema
    const oldFormatSchema = z
      .object({
        examples: z.array(z.unknown()).optional(),
      })
      .passthrough();

    const data = safeParse(content, oldFormatSchema, {
      strategy: ParseStrategy.VALIDATED_JSON,
    }) as OldFormat;

    // Skip if no examples field
    if (!(data.examples && Array.isArray(data.examples))) {
      console.log(`⏭️  Skipped: ${filePath} (no examples field)`);
      return false;
    }

    // Skip if already migrated (has objects instead of strings)
    if (data.examples.length > 0 && typeof data.examples[0] === 'object') {
      console.log(`✅ Already migrated: ${filePath}`);
      return false;
    }

    // Get category from file path
    const category = filePath.includes('/mcp/') ? 'mcp' : 'rules';

    // Convert examples
    const newExamples: NewExample[] = data.examples.map((example, index) =>
      convertExample(example, index, category)
    );

    // Create new data with migrated examples
    const newData: NewFormat = {
      ...data,
      examples: newExamples,
    };

    // Write back to file with proper formatting
    writeFileSync(filePath, `${JSON.stringify(newData, null, 2)}\n`, 'utf-8');

    console.log(`✅ Migrated: ${filePath} (${data.examples.length} examples)`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error);
    return false;
  }
}

/**
 * Main migration function
 */
function main() {
  console.log('🚀 Starting examples schema migration...\n');

  const contentDir = join(process.cwd(), 'content');

  // Find all MCP and Rules JSON files
  const mcpDir = join(contentDir, 'mcp');
  const rulesDir = join(contentDir, 'rules');

  const mcpFiles = readdirSync(mcpDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(mcpDir, f));

  const ruleFiles = readdirSync(rulesDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => join(rulesDir, f));

  const allFiles = [...mcpFiles, ...ruleFiles];

  console.log(`📁 Found ${allFiles.length} files to check`);
  console.log(`   - ${mcpFiles.length} MCP servers`);
  console.log(`   - ${ruleFiles.length} Rules\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of allFiles) {
    const result = migrateFile(file);
    if (result === true) {
      migrated++;
    } else if (result === false) {
      skipped++;
    } else {
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Migrated: ${migrated} files`);
  console.log(`   ⏭️  Skipped: ${skipped} files`);
  console.log(`   ❌ Errors: ${errors} files`);
  console.log('\n✨ Migration complete!');
}

main();
