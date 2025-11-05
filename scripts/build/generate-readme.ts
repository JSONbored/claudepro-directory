#!/usr/bin/env tsx

/**
 * README Generator - Database-First Architecture
 * Generates README.md by querying content and category_configs tables directly.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { Tables } from '@/src/types/database.types';
import { ensureEnvVars } from '../utils/env.js';

// ============================================================================
// Environment Loading
// ============================================================================

await ensureEnvVars(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!(supabaseUrl && supabaseKey)) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Configuration
// ============================================================================

const README_PATH = join(process.cwd(), 'README.md');
const SITE_URL = 'https://claudepro.directory';

// Icon name to emoji mapping (Lucide icons → emoji)
const ICON_EMOJI_MAP: Record<string, string> = {
  Sparkles: '🤖',
  Server: '⚙️',
  Webhook: '🪝',
  Terminal: '🔧',
  BookOpen: '📜',
  Layers: '📦',
  FileText: '📄',
  Briefcase: '💼',
};

// Categories to include in README (exclude guides, jobs, changelog)
const README_CATEGORIES = [
  'agents',
  'mcp',
  'hooks',
  'commands',
  'rules',
  'skills',
  'statuslines',
  'collections',
];

// ============================================================================
// Database Queries
// ============================================================================

async function getCategoryConfigs() {
  const { data, error } = await supabase
    .from('category_configs')
    .select('category, title, description, icon_name, url_slug')
    .in('category', README_CATEGORIES)
    .order('title');

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`);
  return data || [];
}

async function getContentByCategory(category: string) {
  const { data, error } = await supabase
    .from('content')
    .select('slug, title, description')
    .eq('category', category)
    .order('title');

  if (error) throw new Error(`Failed to fetch content for ${category}: ${error.message}`);
  return data || [];
}

async function getTotalContentCount() {
  const { count, error } = await supabase
    .from('content')
    .select('*', { count: 'exact', head: true })
    .in('category', README_CATEGORIES);

  if (error) throw new Error(`Failed to count content: ${error.message}`);
  return count || 0;
}

// ============================================================================
// README Generation
// ============================================================================

async function generateCategorySection(
  categoryConfig: Tables<'category_configs'>,
  contentItems: Tables<'content'>[]
) {
  const count = contentItems.length;
  if (count === 0) return '';

  const emoji = ICON_EMOJI_MAP[categoryConfig.icon_name] || '📄';
  const categoryName = categoryConfig.title.endsWith('y')
    ? `${categoryConfig.title.slice(0, -1)}ies` // Rule → Rules
    : `${categoryConfig.title}s`; // Agent → Agents

  let section = `## ${emoji} ${categoryName} (${count})\n\n`;
  section += `${categoryConfig.description}\n\n`;

  for (const item of contentItems) {
    const url = `${SITE_URL}/${categoryConfig.url_slug}/${item.slug}`;
    const description = item.description || 'No description available';
    section += `- **[${item.title}](${url})** - ${description}\n`;
  }

  section += '\n';
  return section;
}

async function generateReadme() {
  console.log('📝 Generating README.md from database...\n');

  const [categories, totalCount] = await Promise.all([
    getCategoryConfigs(),
    getTotalContentCount(),
  ]);

  // Generate category sections
  const categorySections = await Promise.all(
    categories.map(async (cat) => {
      const items = await getContentByCategory(cat.category);
      return generateCategorySection(cat, items);
    })
  );

  return `![ClaudePro.directory](public/og-images/og-image.webp)

<div align="center">

# Claude Pro Directory

**Discover and share the best Claude configurations**
${totalCount}+ expert rules, powerful MCP servers, specialized agents, automation hooks, and more.

[![Mentioned in Awesome Claude Code](https://awesome.re/mentioned-badge.svg)](https://github.com/hesreallyhim/awesome-claude-code)

[🌐 Website](${SITE_URL}) • [💬 Discord](https://discord.gg/Ax3Py4YDrq) • [🐦 Twitter](https://x.com/JSONbored) • [💼 Discussions](https://github.com/JSONbored/claudepro-directory/discussions)

</div>

---

## 🎯 What is Claude Pro Directory?

**Stop starting from scratch.** A searchable collection of ${totalCount}+ pre-built Claude configurations with instant setup, task-specific optimization, and weekly community updates.

Whether you need Claude to review code like a senior engineer, write like a professional author, or analyze data like a scientist - find it in seconds, copy, and start using.

## 🚀 Quick Start

### For Users

1. **[Visit claudepro.directory](${SITE_URL})**
2. **Search or browse** for configurations
3. **Copy** the configuration
4. **Paste** into Claude
5. **Start using** your enhanced Claude immediately

No account needed. No downloads. Just better AI conversations.

### For Contributors

Want to share your Claude configurations with the community?

1. **Use [GitHub issue templates](https://github.com/JSONbored/claudepro-directory/issues/new/choose)** (web submit form coming soon)
2. **Add** your configuration via issue template or PR
3. **Help** others work smarter with Claude

See our [Contributing Guide](.github/CONTRIBUTING.md) for detailed instructions.

---

## 📚 Content Catalog

Browse all available Claude configurations by category:

${categorySections.join('\n')}

---

<div align="center">

## 📈 Activity

![RepoBeats Analytics](https://repobeats.axiom.co/api/embed/c2b1b7e36103fba7a650c6d7f2777cba7338a1f7.svg "Repobeats analytics image")

## 👥 Contributors

Thanks to everyone who has contributed to making Claude better for everyone!

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<!-- Add contributors here -->
<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

<a href="https://github.com/JSONbored/claudepro-directory/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=JSONbored/claudepro-directory" />
</a>

---

**Built with ❤️ by [@JSONbored](https://github.com/JSONbored)**

[Website](${SITE_URL}) • [GitHub](https://github.com/JSONbored/claudepro-directory) • [Discord](https://discord.gg/Ax3Py4YDrq) • [License](LICENSE)

</div>
`;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  try {
    const readme = await generateReadme();
    writeFileSync(README_PATH, readme, 'utf-8');

    const totalCount = await getTotalContentCount();
    const categories = await getCategoryConfigs();

    console.log('✅ README.md generated successfully!');
    console.log(`   Total items: ${totalCount}`);
    console.log(`   Categories: ${categories.length}\n`);

    // Show category breakdown
    for (const cat of categories) {
      const items = await getContentByCategory(cat.category);
      if (items.length > 0) {
        const emoji = ICON_EMOJI_MAP[cat.icon_name] || '📄';
        const categoryName = cat.title.endsWith('y')
          ? `${cat.title.slice(0, -1)}ies`
          : `${cat.title}s`;
        console.log(`   ${emoji} ${categoryName}: ${items.length}`);
      }
    }
  } catch (error) {
    console.error('❌ Failed to generate README:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
