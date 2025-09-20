#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..', '..');
const GENERATED_DIR = path.join(ROOT_DIR, 'generated');
const SEO_DIR = path.join(ROOT_DIR, 'seo', 'comparisons');

interface ContentItem {
  id: string;
  title: string;
  name?: string;
  description: string;
  category: string;
  tags: string[];
  author?: string;
  githubUrl?: string;
  documentation?: string;
}

async function loadAllContent(): Promise<ContentItem[]> {
  const categories = ['agents', 'mcp', 'commands', 'hooks', 'rules'];
  const allContent: ContentItem[] = [];

  for (const category of categories) {
    try {
      // Try JSON first (in case it exists)
      const jsonPath = path.join(GENERATED_DIR, `${category}-metadata.json`);
      try {
        const content = await fs.readFile(jsonPath, 'utf-8');
        const items = JSON.parse(content) as ContentItem[];
        allContent.push(...items.map((item) => ({ ...item, category })));
        continue;
      } catch {
        // Fall through to TypeScript file
      }

      // Try TypeScript file
      const tsPath = path.join(GENERATED_DIR, `${category}-metadata.ts`);
      const content = await fs.readFile(tsPath, 'utf-8');

      // Simple extraction - find the array content between brackets
      const match = content.match(/export const \w+ = (\[[\s\S]*?\]);/);
      if (match?.[1]) {
        // Parse the TypeScript array (safe eval since it's our generated content)
        const arrayStr = match[1]
          .replace(/(\w+):/g, '"$1":') // Convert keys to quoted strings
          .replace(/'/g, '"') // Convert single quotes to double
          .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas

        const items = JSON.parse(arrayStr) as ContentItem[];
        allContent.push(...items.map((item) => ({ ...item, category })));
      }
    } catch (error) {
      console.log(`Skipping ${category}: ${error}`);
    }
  }

  return allContent;
}

function generateComparisonContent(item1: ContentItem, item2: ContentItem): string {
  const title1 = item1.title || item1.name || item1.id;
  const title2 = item2.title || item2.name || item2.id;

  const commonTags = item1.tags.filter((tag) => item2.tags.includes(tag));
  const uniqueTags1 = item1.tags.filter((tag) => !item2.tags.includes(tag));
  const uniqueTags2 = item2.tags.filter((tag) => !item1.tags.includes(tag));

  return `---
title: "${title1} vs ${title2}: Claude Tools Comparison (2025)"
description: "Compare ${title1} and ${title2} for Claude AI. Detailed comparison of features, use cases, and implementation differences."
generated: true
lastUpdated: "${new Date().toISOString()}"
item1Id: "${item1.id}"
item2Id: "${item2.id}"
category1: "${item1.category}"
category2: "${item2.category}"
---

# ${title1} vs ${title2}: Which Claude Tool Should You Use?

## Quick Comparison

Looking for the right Claude AI tool? This detailed comparison of **${title1}** and **${title2}** will help you choose the best option for your specific needs.

## Overview

### ${title1}
${item1.description}

**Category**: ${item1.category}  
${item1.author ? `**Author**: ${item1.author}` : ''}  
${item1.githubUrl ? `**GitHub**: [View Repository](${item1.githubUrl})` : ''}

### ${title2}
${item2.description}

**Category**: ${item2.category}  
${item2.author ? `**Author**: ${item2.author}` : ''}  
${item2.githubUrl ? `**GitHub**: [View Repository](${item2.githubUrl})` : ''}

## Feature Comparison

| Feature | ${title1} | ${title2} |
|---------|-----------|-----------|
| Category | ${item1.category} | ${item2.category} |
| Open Source | ${item1.githubUrl ? '✅ Yes' : '❓ Unknown'} | ${item2.githubUrl ? '✅ Yes' : '❓ Unknown'} |
| Documentation | ${item1.documentation ? '✅ Available' : '📝 Community'} | ${item2.documentation ? '✅ Available' : '📝 Community'} |
| Tags | ${item1.tags.length} topics | ${item2.tags.length} topics |

## Use Cases

### When to Use ${title1}
${item1.category === 'agents' ? `Perfect for AI agent workflows that require ${item1.tags.slice(0, 3).join(', ')}.` : ''}
${item1.category === 'mcp' ? `Ideal for MCP server integrations focusing on ${item1.tags.slice(0, 3).join(', ')}.` : ''}
${item1.category === 'commands' ? `Best for command-based workflows involving ${item1.tags.slice(0, 3).join(', ')}.` : ''}
${item1.category === 'hooks' ? `Excellent for automation hooks that handle ${item1.tags.slice(0, 3).join(', ')}.` : ''}
${item1.category === 'rules' ? `Optimal for Claude rules that enforce ${item1.tags.slice(0, 3).join(', ')}.` : ''}

### When to Use ${title2}
${item2.category === 'agents' ? `Perfect for AI agent workflows that require ${item2.tags.slice(0, 3).join(', ')}.` : ''}
${item2.category === 'mcp' ? `Ideal for MCP server integrations focusing on ${item2.tags.slice(0, 3).join(', ')}.` : ''}
${item2.category === 'commands' ? `Best for command-based workflows involving ${item2.tags.slice(0, 3).join(', ')}.` : ''}
${item2.category === 'hooks' ? `Excellent for automation hooks that handle ${item2.tags.slice(0, 3).join(', ')}.` : ''}
${item2.category === 'rules' ? `Optimal for Claude rules that enforce ${item2.tags.slice(0, 3).join(', ')}.` : ''}

## Tag Analysis

${
  commonTags.length > 0
    ? `### Common Capabilities
Both tools share these features: ${commonTags.join(', ')}`
    : ''
}

${
  uniqueTags1.length > 0
    ? `### Unique to ${title1}
${uniqueTags1.join(', ')}`
    : ''
}

${
  uniqueTags2.length > 0
    ? `### Unique to ${title2}
${uniqueTags2.join(', ')}`
    : ''
}

## Implementation Differences

${
  item1.category === item2.category
    ? `Both tools are in the same category (${item1.category}), making them direct alternatives. Consider your specific requirements when choosing between them.`
    : `These tools serve different purposes - ${title1} is a ${item1.category} while ${title2} is a ${item2.category}. They can potentially be used together in a complementary way.`
}

## Recommendation

**Choose ${title1} if:**
- You need a ${item1.category} solution
- Your workflow involves ${item1.tags.slice(0, 2).join(' and ')}
${item1.githubUrl ? '- You want an open-source solution with community support' : ''}

**Choose ${title2} if:**
- You need a ${item2.category} solution  
- Your workflow involves ${item2.tags.slice(0, 2).join(' and ')}
${item2.githubUrl ? '- You want an open-source solution with community support' : ''}

## Related Comparisons

Explore more Claude tool comparisons:
- [Browse all ${item1.category}](/claudepro-directory/${item1.category})
- [Browse all ${item2.category}](/claudepro-directory/${item2.category})
- [View trending Claude tools](/claudepro-directory/trending)

## Get Started

Ready to implement? View the full details and implementation code:
- [${title1} Full Details](/${item1.category}/${item1.id})
- [${title2} Full Details](/${item2.category}/${item2.id})

---

*This comparison was generated to help the Claude AI community make informed decisions. Last updated: ${new Date().toLocaleDateString()}*`;
}

async function generateComparisons() {
  console.log('🚀 Starting SEO comparison generation...');

  // Ensure SEO directory exists
  await fs.mkdir(SEO_DIR, { recursive: true });

  // Load all content
  const allContent = await loadAllContent();
  console.log(`📦 Loaded ${allContent.length} content items`);

  // Generate comparisons (limit to top items to avoid explosion)
  const topItems = allContent
    .sort((a, b) => (b.tags?.length || 0) - (a.tags?.length || 0))
    .slice(0, 20); // Top 20 items = 190 comparisons

  let generated = 0;
  const comparisons = [];

  for (let i = 0; i < topItems.length; i++) {
    for (let j = i + 1; j < topItems.length; j++) {
      const item1 = topItems[i];
      const item2 = topItems[j];

      // Ensure both items are valid before proceeding
      if (!item1 || !item2 || !item1.id || !item2.id) continue;

      // Generate filename
      const filename = `${item1.id}-vs-${item2.id}.mdx`;
      const filepath = path.join(SEO_DIR, filename);

      // Generate content
      const content = generateComparisonContent(item1, item2);

      // Write file
      await fs.writeFile(filepath, content);
      generated++;

      comparisons.push({
        slug: `${item1.id}-vs-${item2.id}`,
        title: `${item1.title || item1.name || item1.id} vs ${item2.title || item2.name || item2.id}`,
        item1: item1.id,
        item2: item2.id,
        category1: item1.category || '',
        category2: item2.category || '',
        path: `/compare/${item1.id}-vs-${item2.id}`,
      });

      console.log(`✅ Generated: ${filename}`);
    }
  }

  // Write metadata file
  const metadataPath = path.join(SEO_DIR, '_metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(comparisons, null, 2));

  console.log(`\n🎉 Generated ${generated} comparison pages!`);
  console.log(`📁 Files saved to: ${SEO_DIR}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComparisons().catch(console.error);
}
