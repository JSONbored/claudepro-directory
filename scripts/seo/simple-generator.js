#!/usr/bin/env node

// Simple SEO generator that works with our existing data
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const SEO_DIR = path.join(ROOT_DIR, 'seo', 'comparisons');

async function loadContent() {
  const categories = ['agents', 'mcp', 'commands', 'hooks', 'rules'];
  const allContent = [];

  for (const category of categories) {
    try {
      const categoryPath = path.join(CONTENT_DIR, category);
      const files = await fs.readdir(categoryPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(categoryPath, file), 'utf-8');
          const item = JSON.parse(content);
          allContent.push({
            ...item,
            category,
            id: file.replace('.json', ''),
          });
        }
      }
    } catch (err) {
      console.log(`Skipping ${category}: ${err.message}`);
    }
  }

  return allContent;
}

function generateComparison(item1, item2) {
  const title1 = item1.title || item1.name || item1.id;
  const title2 = item2.title || item2.name || item2.id;
  const tags1 = item1.tags || [];
  const tags2 = item2.tags || [];

  return `---
title: "${title1} vs ${title2}: Claude Tools Comparison"
description: "Compare ${title1} and ${title2} for Claude AI"
generated: true
---

# ${title1} vs ${title2}

## Overview

### ${title1}
${item1.description || 'No description available'}

**Category**: ${item1.category}

### ${title2}
${item2.description || 'No description available'}

**Category**: ${item2.category}

## Quick Comparison

| Feature | ${title1} | ${title2} |
|---------|-----------|-----------|
| Category | ${item1.category} | ${item2.category} |
| Tags | ${tags1.length} | ${tags2.length} |

## When to Use

**Use ${title1}** when working with ${item1.category} and need ${tags1.slice(0, 2).join(', ')}.

**Use ${title2}** when working with ${item2.category} and need ${tags2.slice(0, 2).join(', ')}.

---
*Auto-generated comparison for Claude Pro Directory*`;
}

async function generate() {
  console.log('Starting SEO generation...');

  // Create directory
  await fs.mkdir(SEO_DIR, { recursive: true });

  // Load content
  const items = await loadContent();
  console.log(`Loaded ${items.length} items`);

  // Filter to items with tags
  const validItems = items.filter((i) => i.tags && i.tags.length > 0);
  console.log(`Found ${validItems.length} items with tags`);

  // Take top 10 items
  const topItems = validItems.sort((a, b) => b.tags.length - a.tags.length).slice(0, 10);

  // Generate comparisons
  let count = 0;
  const metadata = [];

  for (let i = 0; i < topItems.length; i++) {
    for (let j = i + 1; j < topItems.length; j++) {
      const item1 = topItems[i];
      const item2 = topItems[j];

      const slug = `${item1.id}-vs-${item2.id}`;
      const content = generateComparison(item1, item2);

      await fs.writeFile(path.join(SEO_DIR, `${slug}.mdx`), content);

      metadata.push({ slug });
      count++;
      console.log(`Generated: ${slug}`);
    }
  }

  // Write metadata
  await fs.writeFile(path.join(SEO_DIR, '_metadata.json'), JSON.stringify(metadata, null, 2));

  console.log(`✅ Generated ${count} comparison pages!`);
}

generate().catch(console.error);
