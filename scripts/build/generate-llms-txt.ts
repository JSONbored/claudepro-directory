#!/usr/bin/env tsx
/**
 * Static LLMs.txt Generator - Production Implementation
 * 
 * Reads actual content from JSON files and generates real LLMs.txt.
 * Zero React dependencies, pure Node.js file I/O.
 */

import { readFile, readdir } from 'fs/promises';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'content');
const OUTPUT_DIR = join(process.cwd(), 'public', 'llms-txt');

const APP_CONFIG = {
  name: 'Claude Pro Directory',
  url: 'https://claudepro.directory',
  author: 'JSONbored',
  license: 'MIT',
};

const CATEGORIES = [
  { id: 'agents', title: 'AI Agents', desc: 'Specialized AI agents with predefined roles and expertise areas' },
  { id: 'mcp', title: 'MCP Servers', desc: 'Model Context Protocol servers for extending Claude with external tools' },
  { id: 'commands', title: 'Commands', desc: 'Custom slash commands for Claude Code to streamline development workflows' },
  { id: 'rules', title: 'Rules', desc: 'Custom instructions and system prompts to modify Claude behavior for specific tasks' },
  { id: 'hooks', title: 'Hooks', desc: 'Automation hooks that trigger on events in Claude Code sessions' },
  { id: 'statuslines', title: 'Statuslines', desc: 'Custom status line configurations for Claude Code workspace displays' },
  { id: 'collections', title: 'Collections', desc: 'Curated bundles of related configurations for specific use cases' },
  { id: 'skills', title: 'Skills', desc: 'Task-focused capability guides with dependencies, examples, and troubleshooting' },
];

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function writeLLMsTxtFile(filename: string, content: string) {
  const filePath = join(OUTPUT_DIR, filename);
  await writeFile(filePath, content, 'utf-8');
  console.log(`✅ ${filename} (${Math.round(Buffer.byteLength(content) / 1024)}KB)`);
}

async function readContentFiles(category: string) {
  const categoryDir = join(CONTENT_DIR, category);
  try {
    const files = await readdir(categoryDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('-template'));
    
    const items = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await readFile(join(categoryDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );
    
    return items;
  } catch {
    return [];
  }
}

function truncateContent(text: string, maxLength: number = 2000): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...\n\n[Content truncated for brevity]';
}

async function generateSiteLLMs() {
  let content = `# ${APP_CONFIG.name}

> Community-driven directory of Claude configurations including agents, MCP servers, rules, commands, and hooks

URL: ${APP_CONFIG.url}

---

## Categories

`;

  for (const cat of CATEGORIES) {
    const items = await readContentFiles(cat.id);
    content += `### ${cat.title} (${items.length} items)

URL: ${APP_CONFIG.url}/${cat.id}
${cat.desc}

`;
  }

  content += `
---

Last updated: ${new Date().toISOString()}
Maintained by: ${APP_CONFIG.author}
License: ${APP_CONFIG.license}
`;

  await writeLLMsTxtFile('site.txt', content);
}

async function generateCategoryLLMs() {
  for (const cat of CATEGORIES) {
    const items = await readContentFiles(cat.id);
    
    let content = `# ${cat.title} - ${APP_CONFIG.name}

> ${cat.desc}

URL: ${APP_CONFIG.url}/${cat.id}
Total Items: ${items.length}

---

## All ${cat.title}

`;

    for (const item of items.slice(0, 50)) { // Limit to 50 for index
      content += `### ${item.title}

URL: ${APP_CONFIG.url}/${cat.id}/${item.slug}
${item.description}

`;
    }

    content += `
Last updated: ${new Date().toISOString()}
`;

    await writeLLMsTxtFile(`${cat.id}.txt`, content);
    
    // Individual item files
    for (const item of items) {
      const itemContent = `# ${item.title} - ${APP_CONFIG.name}

> ${item.description}

URL: ${APP_CONFIG.url}/${cat.id}/${item.slug}
Category: ${cat.title}
${item.author ? `Author: ${item.author}` : ''}
${item.tags ? `Tags: ${item.tags.join(', ')}` : ''}
${item.dateAdded ? `Added: ${item.dateAdded}` : ''}

---

${truncateContent(item.content || item.description, 5000)}

---

Last updated: ${new Date().toISOString()}
`;

      await writeLLMsTxtFile(`${cat.id}-${item.slug}.txt`, itemContent);
    }
  }
}

async function generateChangelogLLMs() {
  const content = `# Changelog - ${APP_CONFIG.name}

> Track all platform updates, new features, bug fixes, and improvements

URL: ${APP_CONFIG.url}/changelog

Visit the website for complete changelog.

Last updated: ${new Date().toISOString()}
`;
  
  await writeLLMsTxtFile('changelog.txt', content);
}

async function generateOtherLLMs() {
  const files = [
    { name: 'guides.txt', url: '/guides', title: 'Guides', desc: 'Comprehensive tutorials and documentation' },
    { name: 'api-docs.txt', url: '/api-docs', title: 'API Documentation', desc: 'RESTful API for accessing configurations' },
    { name: 'config-recommender.txt', url: '/tools/config-recommender', title: 'Configuration Recommender', desc: 'AI-powered configuration finder' },
  ];
  
  for (const file of files) {
    const content = `# ${file.title} - ${APP_CONFIG.name}

> ${file.desc}

URL: ${APP_CONFIG.url}${file.url}

Visit the website for more information.

Last updated: ${new Date().toISOString()}
`;
    
    await writeLLMsTxtFile(file.name, content);
  }
}

async function main() {
  const startTime = Date.now();
  console.log('📝 Generating LLMs.txt files...\n');
  
  try {
    await ensureOutputDir();
    await generateSiteLLMs();
    await generateCategoryLLMs();
    await generateChangelogLLMs();
    await generateOtherLLMs();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Generated all LLMs.txt files in ${duration}ms`);
  } catch (error) {
    console.error('\n❌ LLMs.txt generation failed:', error);
    process.exit(1);
  }
}

main();
