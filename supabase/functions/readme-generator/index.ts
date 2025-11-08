/**
 * README Generator API - On-demand GitHub README regeneration
 */

import { getOnlyCorsHeaders } from '../_shared/utils/cors.ts';
import { errorResponse, methodNotAllowedResponse } from '../_shared/utils/response.ts';
import { SITE_URL, supabaseAnon } from '../_shared/utils/supabase.ts';

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
  Code: '💻',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getOnlyCorsHeaders,
    });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return methodNotAllowedResponse('GET, POST', getOnlyCorsHeaders);
  }

  try {
    console.log('📝 Generating README from database...');

    // Call optimized RPC function (15ms execution time)
    const { data, error } = await supabaseAnon.rpc('generate_readme_data');

    if (error) {
      console.error('RPC error (readme-generator):', error);
      return errorResponse(error, 'generate_readme_data', getOnlyCorsHeaders);
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          error: 'README generation failed',
          message: 'RPC returned null',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getOnlyCorsHeaders,
          },
        }
      );
    }

    // Build README markdown from database data
    const readmeMarkdown = buildReadmeMarkdown(data);

    console.log('✅ README generated:', {
      totalItems: data.totalCount,
      categories: Object.keys(data.categoryBreakdown).length,
      bytes: readmeMarkdown.length,
    });

    const url = new URL(req.url);
    const format = url.searchParams.get('format');
    const acceptHeader = req.headers.get('Accept') || '';
    const wantsJson = format === 'json' || acceptHeader.includes('application/json');

    if (wantsJson) {
      const responseData = {
        success: true,
        readme: readmeMarkdown,
        stats: {
          totalCount: data.totalCount,
          categoryBreakdown: data.categoryBreakdown,
          generatedAt: new Date().toISOString(),
        },
      };

      return new Response(JSON.stringify(responseData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache',
          'X-Generated-By': 'Supabase Edge Function',
          'X-Data-Source': 'PostgreSQL generate_readme_data()',
          ...getOnlyCorsHeaders,
        },
      });
    }

    return new Response(readmeMarkdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Generated-By': 'Supabase Edge Function',
        'X-Data-Source': 'PostgreSQL generate_readme_data()',
        ...getOnlyCorsHeaders,
      },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'readme-generator', getOnlyCorsHeaders);
  }
});

interface ReadmeCategory {
  name: string;
  displayName: string;
  items: Array<{ name: string; slug: string; description: string }>;
}

interface ReadmeData {
  categories: ReadmeCategory[];
  totalCount: number;
  categoryBreakdown: Record<string, number>;
}

/**
 * Build README markdown from database data
 */
function buildReadmeMarkdown(data: ReadmeData): string {
  const { categories, totalCount } = data;

  // Build category sections
  const categorySections = categories
    .map((cat) => {
      if (!cat.items || cat.items.length === 0) return '';

      const emoji = ICON_EMOJI_MAP[cat.icon_name] || '📄';

      // Pluralize category title
      const categoryName = cat.title.endsWith('y')
        ? `${cat.title.slice(0, -1)}ies` // Rule → Rules
        : `${cat.title}s`; // Agent → Agents

      let section = `## ${emoji} ${categoryName} (${cat.items.length})\n\n`;
      section += `${cat.description}\n\n`;

      for (const item of cat.items) {
        const url = `${SITE_URL}/${cat.url_slug}/${item.slug}`;
        const description = item.description || 'No description available';
        section += `- **[${item.title}](${url})** - ${description}\n`;
      }

      return `${section}\n`;
    })
    .join('\n');

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

${categorySections}

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
