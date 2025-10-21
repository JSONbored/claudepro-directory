#!/usr/bin/env tsx
/**
 * Clean up converted JSON guide files
 *
 * Fixes issues from automated MDX→JSON conversion:
 * - Remove malformed component sections with JSX in children
 * - Fix component prop errors (type vs variant)
 * - Remove orphaned closing tags as paragraphs
 * - Consolidate broken multi-line content
 *
 * Usage:
 *   tsx scripts/cleanup-json-guides.ts
 *   tsx scripts/cleanup-json-guides.ts --dry-run
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content/guides');

const GUIDE_CATEGORIES = [
  'tutorials',
  'comparisons',
  'workflows',
  'use-cases',
  'troubleshooting',
] as const;

const isDryRun = process.argv.includes('--dry-run');

/**
 * Check if section is malformed (contains unparsed JSX/HTML)
 */
function isMalformedSection(section: any): boolean {
  // Paragraph containing JSX tags
  if (section.type === 'paragraph' && typeof section.content === 'string') {
    if (section.content.match(/<[A-Z][a-zA-Z]*[\s>]/)) return true;
    if (section.content.match(/<\/[A-Z]/)) return true;
  }

  // Component with JSX in props
  if (section.type === 'component' && section.props) {
    const propsStr = JSON.stringify(section.props);
    if (propsStr.includes('<div') || propsStr.includes('<CodeGroup') || propsStr.includes('<p>')) {
      return true;
    }
  }

  // Empty blockquote
  if (section.type === 'blockquote' && !section.content.trim()) return true;

  // Orphaned closing tags
  if (section.type === 'paragraph' && section.content.match(/^<\/[A-Z][a-zA-Z]*>$/)) return true;

  return false;
}

/**
 * Fix component props (type vs variant issues)
 */
function fixComponentProps(section: any): any {
  if (section.type !== 'component') return section;

  const { component, props } = section;

  // Fix UnifiedContentBox infobox: type → variant
  if (component === 'UnifiedContentBox' && props.contentType === 'infobox' && props.type) {
    return {
      ...section,
      props: {
        ...props,
        variant: props.type,
        type: undefined,
      },
    };
  }

  // Remove icon prop from UnifiedContentBox (not supported)
  if (component === 'UnifiedContentBox' && props.icon) {
    const { icon, ...restProps } = props;
    return {
      ...section,
      props: restProps,
    };
  }

  return section;
}

/**
 * Clean up guide JSON file
 */
async function cleanupGuideJson(jsonPath: string): Promise<void> {
  const content = await fs.readFile(jsonPath, 'utf-8');
  const json = JSON.parse(content);

  const originalSectionCount = json.content.sections.length;

  // Filter out malformed sections and fix props
  json.content.sections = json.content.sections
    .filter((section: any) => !isMalformedSection(section))
    .map((section: any) => fixComponentProps(section));

  const cleanedSectionCount = json.content.sections.length;
  const removedCount = originalSectionCount - cleanedSectionCount;

  // Write back
  if (!isDryRun) {
    await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf-8');
  }

  return removedCount;
}

/**
 * Main execution
 */
async function main() {
  console.log('🧹 JSON Guide Cleanup\n');

  if (isDryRun) {
    console.log('📋 DRY RUN MODE - No files will be modified\n');
  }

  let totalFiles = 0;
  let totalSectionsRemoved = 0;

  for (const category of GUIDE_CATEGORIES) {
    const categoryDir = path.join(CONTENT_DIR, category);

    try {
      await fs.access(categoryDir);
    } catch {
      continue;
    }

    const files = await fs.readdir(categoryDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const jsonPath = path.join(categoryDir, file);

      try {
        const removedCount = await cleanupGuideJson(jsonPath);

        if (removedCount > 0) {
          console.log(`✅ ${category}/${file}: Removed ${removedCount} malformed sections`);
        }

        totalFiles++;
        totalSectionsRemoved += removedCount;
      } catch (error) {
        console.error(
          `❌ Error cleaning ${file}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary');
  console.log('='.repeat(50));
  console.log(`✅ Processed: ${totalFiles} files`);
  console.log(`🗑️  Removed: ${totalSectionsRemoved} malformed sections`);

  if (isDryRun) {
    console.log('\n📋 DRY RUN - No files were modified');
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
