#!/usr/bin/env tsx
/**
 * Static API Generator - Production Implementation
 * 
 * Reads actual content from JSON files and generates real API responses.
 * Zero React dependencies, pure Node.js file I/O.
 */

import { readFile, readdir } from 'fs/promises';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const CONTENT_DIR = join(process.cwd(), 'content');
const OUTPUT_DIR = join(process.cwd(), 'public', 'api');

const APP_CONFIG = {
  name: 'Claude Pro Directory',
  url: 'https://claudepro.directory',
  description: 'A community-driven directory of Claude configurations including agents, MCP servers, rules, commands, and hooks',
  license: 'MIT',
};

const CATEGORIES = [
  { file: 'agents.json', id: 'agents', type: 'agent' },
  { file: 'mcp.json', id: 'mcp', type: 'mcp' },
  { file: 'commands.json', id: 'commands', type: 'command' },
  { file: 'rules.json', id: 'rules', type: 'rule' },
  { file: 'hooks.json', id: 'hooks', type: 'hook' },
  { file: 'statuslines.json', id: 'statuslines', type: 'statusline' },
  { file: 'collections.json', id: 'collections', type: 'collection' },
  { file: 'skills.json', id: 'skills', type: 'skill' },
];

async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
}

async function writeJSONFile(filename: string, data: unknown) {
  const filePath = join(OUTPUT_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, json, 'utf-8');
  console.log(`✅ ${filename} (${Math.round(Buffer.byteLength(json) / 1024)}KB)`);
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

function transformContent(items: any[], type: string, category: string) {
  return items.map(item => ({
    ...item,
    type,
    url: `${APP_CONFIG.url}/${category}/${item.slug}`,
  }));
}

async function generateCategoryAPIs() {
  for (const cat of CATEGORIES) {
    const items = await readContentFiles(cat.id);
    const transformed = transformContent(items, cat.type, cat.id);
    
    const response = {
      [cat.id]: transformed,
      count: items.length,
      lastUpdated: new Date().toISOString(),
    };
    
    await writeJSONFile(cat.file, response);
  }
}

async function main() {
  const startTime = Date.now();
  console.log('🔧 Generating static API files...\n');
  
  try {
    await ensureOutputDir();
    await generateCategoryAPIs();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Generated all API JSON files in ${duration}ms`);
  } catch (error) {
    console.error('\n❌ API generation failed:', error);
    process.exit(1);
  }
}

main();
