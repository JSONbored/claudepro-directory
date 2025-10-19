#!/usr/bin/env tsx
/**
 * Generate README.md from content files
 *
 * This script automatically generates the project README.md with:
 * - OG image hero section
 * - Awesome-list style content catalog
 * - Auto-counted content items by category
 * - Contributors section and analytics
 *
 * Run: npm run generate:readme
 * Auto-runs: Pre-commit when content files change
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ContentItem {
  title: string;
  slug: string;
  description: string;
  category: string;
  url?: string;
}

interface CategoryConfig {
  name: string;
  emoji: string;
  description: string;
  path: string;
  sortOrder: number;
}

// ============================================================================
// Configuration
// ============================================================================

const CONTENT_DIR = join(process.cwd(), 'content');
const README_PATH = join(process.cwd(), 'README.md');
const SITE_URL = 'https://claudepro.directory';

const CATEGORIES: CategoryConfig[] = [
  {
    name: 'Agents',
    emoji: '🤖',
    description: 'Specialized AI personas for specific development workflows and expert assistance',
    path: 'agents',
    sortOrder: 1,
  },
  {
    name: 'MCP Servers',
    emoji: '⚙️',
    description: "Model Context Protocol servers for extending Claude's capabilities",
    path: 'mcp',
    sortOrder: 2,
  },
  {
    name: 'Hooks',
    emoji: '🪝',
    description: 'Event-driven automation scripts that run on specific triggers',
    path: 'hooks',
    sortOrder: 3,
  },
  {
    name: 'Commands',
    emoji: '🔧',
    description: 'Quick-action slash commands for common development tasks',
    path: 'commands',
    sortOrder: 4,
  },
  {
    name: 'Rules',
    emoji: '📜',
    description: 'Custom instructions and guidelines for specialized AI behaviors',
    path: 'rules',
    sortOrder: 5,
  },
  {
    name: 'Skills',
    emoji: '📚',
    description: 'Task-focused capability guides and specialized expertise',
    path: 'skills',
    sortOrder: 6,
  },
  {
    name: 'Statuslines',
    emoji: '💻',
    description: 'Custom status bar displays for your Claude development environment',
    path: 'statuslines',
    sortOrder: 7,
  },
  {
    name: 'Collections',
    emoji: '📦',
    description: 'Curated bundles of configurations for specific use cases',
    path: 'collections',
    sortOrder: 8,
  },
];

// ============================================================================
// Content Loading
// ============================================================================

/**
 * Load all JSON content files from a category directory
 */
function loadCategoryContent(categoryPath: string): ContentItem[] {
  const categoryDir = join(CONTENT_DIR, categoryPath);
  const items: ContentItem[] = [];

  try {
    const files = readdirSync(categoryDir).filter((f) => f.endsWith('.json'));

    for (const file of files) {
      try {
        const content = readFileSync(join(categoryDir, file), 'utf-8');
        const data = JSON.parse(content);

        // Generate title from slug if not present
        const slug = data.slug || file.replace('.json', '');
        const title =
          data.title ||
          data.name ||
          slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        // Extract metadata from JSON
        items.push({
          title,
          slug,
          description: data.description || data.seoDescription || '',
          category: categoryPath,
          url: data.url,
        });
      } catch (_error) {
        console.warn(`⚠️  Failed to parse ${file}:`, _error);
      }
    }
  } catch (_error) {
    // Category directory doesn't exist or is empty
    console.warn(`⚠️  Category ${categoryPath} not found or empty`);
  }

  // Sort alphabetically by title
  return items.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Get total count of all content items
 */
function getTotalCount(): number {
  return CATEGORIES.reduce((total, category) => {
    const items = loadCategoryContent(category.path);
    return total + items.length;
  }, 0);
}

// ============================================================================
// README Generation
// ============================================================================

/**
 * Generate a category section for the README
 */
function generateCategorySection(category: CategoryConfig): string {
  const items = loadCategoryContent(category.path);
  const count = items.length;

  if (count === 0) {
    return ''; // Skip empty categories
  }

  let section = `## ${category.emoji} ${category.name} (${count})\n\n`;
  section += `${category.description}\n\n`;

  // List items
  for (const item of items) {
    const url = `${SITE_URL}/${category.path}/${item.slug}`;
    const description = item.description || 'No description available';
    section += `- **[${item.title}](${url})** - ${description}\n`;
  }

  section += '\n';
  return section;
}

/**
 * Generate the complete README.md content
 */
function generateReadme(): string {
  const totalCount = getTotalCount();

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

${CATEGORIES.map((cat) => generateCategorySection(cat)).join('')}

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

function main() {
  console.log('📝 Generating README.md from content files...\n');

  try {
    const readme = generateReadme();
    writeFileSync(README_PATH, readme, 'utf-8');

    console.log('✅ README.md generated successfully!');
    console.log(`   Total items: ${getTotalCount()}`);
    console.log(`   Categories: ${CATEGORIES.length}\n`);

    // Show category breakdown
    for (const category of CATEGORIES) {
      const items = loadCategoryContent(category.path);
      if (items.length > 0) {
        console.log(`   ${category.emoji} ${category.name}: ${items.length}`);
      }
    }
  } catch (_error) {
    console.error('❌ Failed to generate README:', _error);
    process.exit(1);
  }
}

main();
