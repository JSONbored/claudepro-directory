#!/usr/bin/env tsx
/**
 * Static LLMs.txt Generator - REAL IMPLEMENTATION
 *
 * Pre-generates all LLMs.txt files at build time by reading actual content.
 * Replaces 15+ serverless functions with static CDN-served files.
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

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log('✅ LLMs.txt output directory ready');
}

async function writeLLMsTxtFile(filename: string, content: string) {
  const filePath = join(OUTPUT_DIR, filename);
  await writeFile(filePath, content, 'utf-8');
  console.log(`✅ Generated ${filename} (${Buffer.byteLength(content)} bytes)`);
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

async function generateSiteLLMs() {
  const categories = [
    { id: 'agents', title: 'AI Agents', desc: 'Specialized AI agents with predefined roles and expertise areas' },
    { id: 'mcp', title: 'MCP Servers', desc: 'Model Context Protocol servers for extending Claude' },
    { id: 'commands', title: 'Commands', desc: 'Custom slash commands for Claude Code' },
    { id: 'rules', title: 'Rules', desc: 'Custom instructions and system prompts' },
    { id: 'hooks', title: 'Hooks', desc: 'Automation hooks for Claude Code sessions' },
    { id: 'statuslines', title: 'Statuslines', desc: 'Custom status line configurations' },
    { id: 'collections', title: 'Collections', desc: 'Curated bundles of related configurations' },
    { id: 'skills', title: 'Skills', desc: 'Task-focused capability guides' },
  ];

  let content = `# ${APP_CONFIG.name}

> Community-driven directory of Claude configurations including agents, MCP servers, rules, commands, and hooks

URL: ${APP_CONFIG.url}
Total Categories: ${categories.length}

---

## Categories

`;

  for (const cat of categories) {
    const items = await readContentFiles(cat.id);
    content += `### ${cat.title}

URL: ${APP_CONFIG.url}/${cat.id}
Description: ${cat.desc}
Items: ${items.length}

`;
  }

  content += `
---

## Additional Resources

- API Documentation: ${APP_CONFIG.url}/api-docs
- Guides: ${APP_CONFIG.url}/guides
- Changelog: ${APP_CONFIG.url}/changelog

Last updated: ${new Date().toISOString()}
Maintained by: ${APP_CONFIG.author}
License: ${APP_CONFIG.license}
`;

  await writeLLMsTxtFile('site.txt', content);
}

async function generateCategoryLLMs() {
  const categories = [
    { id: 'agents', title: 'AI Agents', desc: 'Specialized AI agents with predefined roles' },
    { id: 'mcp', title: 'MCP Servers', desc: 'Model Context Protocol servers' },
    { id: 'commands', title: 'Commands', desc: 'Custom slash commands' },
    { id: 'rules', title: 'Rules', desc: 'Custom instructions and prompts' },
    { id: 'hooks', title: 'Hooks', desc: 'Automation hooks' },
    { id: 'statuslines', title: 'Statuslines', desc: 'Status line configurations' },
    { id: 'collections', title: 'Collections', desc: 'Configuration bundles' },
    { id: 'skills', title: 'Skills', desc: 'Task-focused guides' },
  ];

  for (const cat of categories) {
    const items = await readContentFiles(cat.id);
    
    let content = `# ${cat.title} - ${APP_CONFIG.name}

> ${cat.desc}

URL: ${APP_CONFIG.url}/${cat.id}
Total Items: ${items.length}

---

## All ${cat.title}

`;

    for (const item of items) {
      content += `### ${item.title}

URL: ${APP_CONFIG.url}/${cat.id}/${item.slug}
${item.description}

Tags: ${item.tags?.join(', ') || 'None'}
${item.author ? `Author: ${item.author}` : ''}

---

`;
    }

    content += `
Last updated: ${new Date().toISOString()}
`;

    await writeLLMsTxtFile(`${cat.id}.txt`, content);
    
    // Generate individual item files
    for (const item of items) {
      const itemContent = `# ${item.title} - ${APP_CONFIG.name}

> ${item.description}

URL: ${APP_CONFIG.url}/${cat.id}/${item.slug}
Category: ${cat.title}
${item.author ? `Author: ${item.author}` : ''}
${item.tags ? `Tags: ${item.tags.join(', ')}` : ''}

---

## Content

${item.content || item.description}

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
    { 
      name: 'guides.txt', 
      url: '/guides', 
      title: 'Guides',
      desc: 'Comprehensive tutorials and documentation for getting started'
    },
    { 
      name: 'api-docs.txt', 
      url: '/api-docs', 
      title: 'API Documentation',
      desc: 'RESTful API for accessing Claude configurations programmatically'
    },
    { 
      name: 'config-recommender.txt', 
      url: '/tools/config-recommender', 
      title: 'Configuration Recommender',
      desc: 'AI-powered tool for finding the perfect Claude configuration'
    },
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
  
  try {
    await ensureOutputDir();
    await generateSiteLLMs();
    await generateCategoryLLMs();
    await generateChangelogLLMs();
    await generateOtherLLMs();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Generated all LLMs.txt files in ${duration}ms`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ Failed to generate LLMs.txt files:', error);
    process.exit(1);
  }
}

main();
