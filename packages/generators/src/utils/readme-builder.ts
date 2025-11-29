import type { Database as DatabaseGenerated } from '@heyclaude/database-types';

const SITE_URL = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://claudepro.directory';

const ICON_EMOJI_MAP: Record<string, string> = {
  Sparkles: '🤖',
  Server: '⚙️',
  Webhook: '🪝',
  Terminal: '🔧',
  BookOpen: '📜',
  Layers: '📦',
  FileText: '📄',
  Briefcase: '💼',
  Code: '💻',
};

/**
 * Build a complete README markdown document from the structured RPC data.
 *
 * Produces a Markdown string containing site header, overview, quick start,
 * content catalog (generated from categories and their items), and activity section.
 *
 * @param data - RPC result object containing `categories` and `total_count`. Each category may include `title`, `description`, `icon_name`, `url_slug`, and an `items` array; each item may include `slug`, `title`, and `description`.
 * @returns The assembled README as a Markdown string.
 *
 * @example
 * // const md = buildReadmeMarkdown(rpcResult);
 */
export function buildReadmeMarkdown(
  data: DatabaseGenerated['public']['Functions']['generate_readme_data']['Returns']
): string {
  // Composite type fields are snake_case as defined in the database
  // Supabase RPC returns them as snake_case in JSON
  const categories = data.categories ?? [];
  const totalCount = data.total_count ?? 0;

  const categorySections = categories
    .map((cat) => {
      if (!cat.items || cat.items.length === 0) return '';

      // Handle nullable fields from composite type
      if (!cat.title) return '';

      const emoji = ICON_EMOJI_MAP[cat.icon_name ?? ''] || '📄';
      // Pluralize category name (handles consonant+y -> ies, but not vowel+y)
      const categoryName = cat.title.endsWith('y') && !/[aeiou]y$/i.test(cat.title)
        ? `${cat.title.slice(0, -1)}ies`
        : `${cat.title}s`;

      let section = `## ${emoji} ${categoryName} (${cat.items.length})\n\n`;
      section += `${cat.description ?? ''}\n\n`;

      for (const item of cat.items) {
        if (!(item.slug && item.title)) continue;
        // Safely construct URL to avoid double slashes
        const categorySlug = cat.url_slug ? `/${cat.url_slug}` : '';
        const url = `${SITE_URL}${categorySlug}/${item.slug}`;
        const description = item.description ?? 'No description available';
        section += `- **[${item.title}](${url})** - ${description}\n`;
      }

      return `${section}\n`;
    })
    .join('\n');

  return `![ClaudePro.directory](apps/web/public/og-images/og-image.webp)

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

${categorySections}

---

<div align="center">

## 📈 Activity

Stay in the loop with the latest updates, new MCP servers, community submissions, and feature launches.

</div>
`;
}