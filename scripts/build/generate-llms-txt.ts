#!/usr/bin/env tsx
/**
 * Static LLMs.txt Generator (Simplified - No React Dependencies)
 *
 * Generates basic LLMs.txt files at build time.
 * Avoids importing from files with React/JSX to prevent build errors.
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const OUTPUT_DIR = join(process.cwd(), 'public', 'llms-txt');

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log('✅ LLMs.txt output directory ready');
}

async function writeLLMsTxtFile(filename: string, content: string) {
  const filePath = join(OUTPUT_DIR, filename);
  await writeFile(filePath, content, 'utf-8');
  console.log(`✅ Generated ${filename}`);
}

async function generateSiteLLMs() {
  const content = `# Claude Pro Directory

> Community-driven directory of Claude configurations

URL: https://claudepro.directory

## Categories

- AI Agents - Specialized AI agents with predefined roles
- MCP Servers - Model Context Protocol servers
- Commands - Custom slash commands for Claude Code
- Rules - Custom instructions and system prompts
- Hooks - Automation hooks for Claude Code
- Statuslines - Custom status line configurations
- Collections - Curated configuration bundles
- Skills - Task-focused capability guides

Last updated: ${new Date().toISOString()}
`;

  await writeLLMsTxtFile('site.txt', content);
}

async function generateCategoryLLMs() {
  const categories = ['agents', 'mcp', 'commands', 'rules', 'hooks', 'statuslines', 'collections', 'skills'];
  
  for (const category of categories) {
    const content = `# ${category.charAt(0).toUpperCase() + category.slice(1)} - Claude Pro Directory

URL: https://claudepro.directory/${category}

Browse all ${category} on the website.

Last updated: ${new Date().toISOString()}
`;
    
    await writeLLMsTxtFile(`${category}.txt`, content);
  }
}

async function generateChangelogLLMs() {
  const content = `# Changelog - Claude Pro Directory

URL: https://claudepro.directory/changelog

Track all platform updates, features, and fixes.

Last updated: ${new Date().toISOString()}
`;
  
  await writeLLMsTxtFile('changelog.txt', content);
}

async function generateOtherLLMs() {
  const files = [
    { name: 'guides.txt', url: '/guides', title: 'Guides' },
    { name: 'api-docs.txt', url: '/api-docs', title: 'API Documentation' },
    { name: 'config-recommender.txt', url: '/tools/config-recommender', title: 'Configuration Recommender' },
  ];
  
  for (const file of files) {
    const content = `# ${file.title} - Claude Pro Directory

URL: https://claudepro.directory${file.url}

Visit the website for more information.

Last updated: ${new Date().toISOString()}
`;
    
    await writeLLMsTxtFile(file.name, content);
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    await ensureOutputDir();
    await generateSiteLLMs();
    await generateCategoryLLMs();
    await generateChangelogLLMs();
    await generateOtherLLMs();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Generated all LLMs.txt files in ${duration}ms`);
  } catch (error) {
    console.error('❌ Failed to generate LLMs.txt files:', error);
    process.exit(1);
  }
}

main();
