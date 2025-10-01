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
import { urls } from '@/lib/get-base-url';
import { logger } from '@/lib/logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '../..');

async function runCommand(command: string, description: string): Promise<boolean> {
  logger.log(`\n📝 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: ROOT_DIR });
    logger.success(`${description} completed`);
    return true;
  } catch (error) {
    logger.failure(
      `${description} failed: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

async function generateAllSEO(): Promise<void> {
  logger.log('🚀 Starting optimized SEO pipeline...\n');
  logger.log('This will automatically:');
  logger.log('1. Build content metadata');
  logger.log('2. Update sitemap with all pages');
  logger.log('3. Validate guide content structure\n');
  logger.log('📝 Note: Main category SEO (agents, mcp, etc.) now handled by ISR');
  logger.log('📝 Guide content (/content/guides/*.mdx) already optimized with ISR + AI search\n');

  const startTime = Date.now();

  // Step 1: Build content metadata
  await runCommand('npm run build:content', 'Building content metadata');

  // Step 2: Generate sitemap with all content
  await runCommand('npm run generate:sitemap', 'Generating sitemap');

  // Step 3: Count guide content files
  const seoDir = path.join(ROOT_DIR, 'content/guides');
  const categories = ['use-cases', 'tutorials', 'workflows', 'comparisons', 'troubleshooting'];
  let totalPages = 0;

  logger.log('\n📊 Guide Content Summary:');
  for (const category of categories) {
    try {
      const dir = path.join(seoDir, category);
      const files = await fs.readdir(dir);
      const mdxFiles = files.filter((f) => f.endsWith('.mdx'));
      totalPages += mdxFiles.length;
      logger.log(`  📁 ${category}: ${mdxFiles.length} pages`);
    } catch {
      // Directory doesn't exist
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  logger.log(`\n${'='.repeat(50)}`);
  logger.success('SEO Pipeline Complete!');
  logger.log(`📊 Guide content pages: ${totalPages}`);
  logger.log(`⏱️  Time taken: ${duration}s`);
  logger.log('='.repeat(50));

  // Show next steps
  logger.log('\n📋 Next Steps:');
  logger.log('1. Run "npm run dev" to preview content locally');
  logger.log(`2. Visit ${urls.guides()} for guide content`);
  logger.log(`3. Visit ${urls.agents()} for main categories`);
  logger.log('4. Commit and deploy to production');
  logger.log('\n💡 ISR Optimization Active:');
  logger.log('   - Guide content: Enhanced with AI search optimization');
  logger.log('   - Main categories: JSON-based content with ISR performance');
}

// Run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAllSEO().catch((error) => logger.error('SEO generation failed:', error));
}

export { generateAllSEO };
