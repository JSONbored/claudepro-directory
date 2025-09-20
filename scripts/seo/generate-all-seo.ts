#!/usr/bin/env node

/**
 * Master SEO Generation Script
 * Automatically generates SEO content whenever new content is added
 * Run this after adding new content files to automatically create SEO pages
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../..');

async function runCommand(command: string, description: string): Promise<boolean> {
  console.log(`\n📝 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: ROOT_DIR });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(
      `❌ ${description} failed:`,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }
}

async function generateAllSEO(): Promise<void> {
  console.log('🚀 Starting complete SEO generation pipeline...\n');
  console.log('This will automatically:');
  console.log('1. Generate SEO content for MCP servers');
  console.log('2. Generate SEO content for Agents');
  console.log('3. Update sitemap with all pages');
  console.log('4. Generate API endpoints');
  console.log('5. Build content metadata\n');

  const startTime = Date.now();

  // Step 1: Build content metadata (needed for SEO generators)
  await runCommand('npm run build:content', 'Building content metadata');

  // Step 2: API endpoints now handled by ISR - no longer needed

  // Step 3: Generate MCP SEO content
  await runCommand('tsx scripts/seo/generators/mcp-seo-generator.ts', 'Generating MCP SEO content');

  // Step 4: Generate Agents SEO content
  await runCommand(
    'tsx scripts/seo/generators/agents-seo-generator.ts',
    'Generating Agents SEO content'
  );

  // Step 5: Generate sitemap with all content
  await runCommand('npm run generate:sitemap', 'Generating sitemap');

  // Step 6: Count generated files
  const seoDir = path.join(ROOT_DIR, 'seo');
  const categories = ['use-cases', 'tutorials', 'collections', 'categories', 'workflows'];
  let totalPages = 0;

  for (const category of categories) {
    try {
      const dir = path.join(seoDir, category);
      const files = await fs.readdir(dir);
      const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
      totalPages += mdxFiles.length;
      console.log(`  📁 ${category}: ${mdxFiles.length} pages`);
    } catch {
      // Directory doesn't exist
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✨ SEO Generation Complete!`);
  console.log(`📊 Total SEO pages: ${totalPages}`);
  console.log(`⏱️  Time taken: ${duration}s`);
  console.log('='.repeat(50));

  // Show next steps
  console.log('\n📋 Next Steps:');
  console.log('1. Run "npm run dev" to preview SEO pages locally');
  console.log('2. Visit http://localhost:3000/guides to see all guides');
  console.log('3. Commit and deploy to production');
  console.log('\n💡 This script runs automatically when you:');
  console.log('   - Add new content files (agents, MCP servers, etc.)');
  console.log('   - Run "npm run build"');
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllSEO().catch(console.error);
}

export { generateAllSEO };
