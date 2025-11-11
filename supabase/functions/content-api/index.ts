/**
 * Content API - Unified Content Export Handler
 *
 * Consolidates markdown-export, json-api, llms-txt, readme-generator
 * into a single, powerful, maintainable edge function.
 *
 * Supported formats:
 * - json: Full content + JSON-LD
 * - markdown: Markdown export with frontmatter
 * - llms-txt: LLM-optimized plain text (item-specific)
 * - llms-category: Category-specific llms.txt
 * - llms-changelog: Changelog index llms.txt
 * - llms-entry: Changelog entry llms.txt
 * - llms-tool: Tool-specific llms.txt
 * - readme: GitHub README generation
 * - storage: Proxied storage downloads with custom cache
 *
 * Routes:
 * - GET /{category}/{slug}?format={type}
 * - GET /sitewide?format={type}
 * - GET /{category}?format=llms-category
 * - GET /changelog?format=llms-changelog
 * - GET /changelog/{slug}?format=llms-entry
 * - GET /tools/{tool}?format=llms-tool
 */

import { VALID_CONTENT_CATEGORIES } from '../_shared/constants/categories.ts';
import { getOnlyCorsHeaders, getWithAcceptCorsHeaders } from '../_shared/utils/cors.ts';
import {
  badRequestResponse,
  errorResponse,
  methodNotAllowedResponse,
} from '../_shared/utils/response.ts';
import { proxyStorageFile } from '../_shared/utils/storage-proxy.ts';
import { SITE_URL, supabaseAnon } from '../_shared/utils/supabase.ts';

// Icon name to emoji mapping (for README generation)
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

interface MarkdownExportResult {
  success: boolean;
  markdown?: string;
  filename?: string;
  length?: number;
  content_id?: string;
  error?: string;
}

interface ReadmeCategory {
  category: string;
  title: string;
  description: string;
  icon_name: string;
  url_slug: string;
  items: Array<{ title: string; slug: string; description: string }>;
}

interface ReadmeData {
  categories: ReadmeCategory[];
  totalCount: number;
  categoryBreakdown: Record<string, number>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: getWithAcceptCorsHeaders,
    });
  }

  if (req.method !== 'GET') {
    return methodNotAllowedResponse('GET', getWithAcceptCorsHeaders);
  }

  try {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'json';

    // Supabase strips /functions/v1/ - pathname starts with /content-api/
    const pathname = url.pathname.replace(/^\/content-api/, '');

    // Pattern 1: /sitewide?format=X
    if (pathname.includes('/sitewide')) {
      return await handleSitewideRequest(format);
    }

    // Pattern 2: /changelog?format=llms-changelog
    if (pathname === '/changelog' || pathname === '/changelog/') {
      if (format === 'llms-changelog') {
        return await handleChangelogLlmsTxt();
      }
      return badRequestResponse('Invalid format for changelog', getWithAcceptCorsHeaders);
    }

    // Pattern 3: /changelog/slug?format=llms-entry
    const changelogEntryMatch = pathname.match(/^\/changelog\/([^/]+?)(?:\.\w+)?$/);
    if (changelogEntryMatch) {
      const [, slug] = changelogEntryMatch;
      if (format === 'llms-entry') {
        return await handleChangelogEntryLlmsTxt(slug);
      }
      return badRequestResponse('Invalid format for changelog entry', getWithAcceptCorsHeaders);
    }

    // Pattern 4: /tools/name?format=llms-tool
    const toolMatch = pathname.match(/^\/tools\/([^/]+?)(?:\.\w+)?$/);
    if (toolMatch) {
      const [, tool] = toolMatch;
      if (format === 'llms-tool') {
        return await handleToolLlmsTxt(tool);
      }
      return badRequestResponse('Invalid format for tool', getWithAcceptCorsHeaders);
    }

    // Pattern 5: /category?format=llms-category (category-only, no slug)
    const categoryOnlyMatch = pathname.match(/^\/([^/]+?)\/?$/);
    if (categoryOnlyMatch) {
      const [, category] = categoryOnlyMatch;
      if (VALID_CONTENT_CATEGORIES.includes(category)) {
        if (format === 'llms-category') {
          return await handleCategoryLlmsTxt(category);
        }
        return badRequestResponse('Invalid format for category', getWithAcceptCorsHeaders);
      }
    }

    // Pattern 6: /category/slug?format=X (item-specific)
    const itemMatch = pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.\w+)?$/);
    if (!itemMatch) {
      return badRequestResponse(
        'Invalid path format. Expected patterns: /{category}/{slug}, /{category}, /changelog, /changelog/{slug}, /tools/{tool}, or /sitewide',
        getWithAcceptCorsHeaders
      );
    }

    const [, category, slug] = itemMatch;

    if (!VALID_CONTENT_CATEGORIES.includes(category)) {
      return badRequestResponse(
        `Invalid category '${category}'. Valid categories: ${VALID_CONTENT_CATEGORIES.join(', ')}`,
        getWithAcceptCorsHeaders
      );
    }

    // Route to appropriate handler based on format
    switch (format) {
      case 'json':
        return await handleJsonFormat(category, slug);
      case 'markdown':
      case 'md':
        return await handleMarkdownFormat(category, slug, url);
      case 'llms-txt':
      case 'llms':
        return await handleLlmsTxtFormat(category, slug);
      case 'storage':
        return await handleStorageFormat(category, slug);
      default:
        return badRequestResponse(
          `Invalid format '${format}'. Valid formats: json, markdown, llms-txt, readme, storage, llms-category, llms-changelog, llms-entry, llms-tool`,
          getWithAcceptCorsHeaders
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return errorResponse(error as Error, 'content-api', getWithAcceptCorsHeaders);
  }
});

/**
 * Handle sitewide requests (README, sitewide llms.txt)
 */
async function handleSitewideRequest(format: string): Promise<Response> {
  switch (format) {
    case 'readme':
      return await handleReadmeFormat();
    case 'llms-txt':
    case 'llms':
      return await handleSitewideLlmsTxt();
    default:
      return badRequestResponse(
        `Invalid sitewide format '${format}'. Valid formats: readme, llms-txt`,
        getWithAcceptCorsHeaders
      );
  }
}

/**
 * Format Handler: Category LLMs.txt
 */
async function handleCategoryLlmsTxt(category: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_category_llms_txt', {
    p_category: category,
  });

  if (error) {
    console.error('RPC error (generate_category_llms_txt):', { category, error });
    return errorResponse(error, 'generate_category_llms_txt', getOnlyCorsHeaders);
  }

  if (!data) {
    console.error('Category LLMs.txt not found:', { category });
    return new Response('Category not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=1296000',
        'CDN-Cache-Control': 'max-age=2592000',
        ...getOnlyCorsHeaders,
      },
    });
  }

  console.log('Category LLMs.txt generated:', { category, bytes: data.length });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=1296000',
      'CDN-Cache-Control': 'max-age=2592000',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_category_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Changelog Index LLMs.txt
 */
async function handleChangelogLlmsTxt(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_changelog_llms_txt');

  if (error) {
    console.error('RPC error (generate_changelog_llms_txt):', error);
    return errorResponse(error, 'generate_changelog_llms_txt', getOnlyCorsHeaders);
  }

  console.log('Changelog LLMs.txt generated:', { bytes: data?.length || 0 });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
      'CDN-Cache-Control': 'max-age=604800',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_changelog_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Changelog Entry LLMs.txt
 */
async function handleChangelogEntryLlmsTxt(slug: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_changelog_entry_llms_txt', {
    p_slug: slug,
  });

  if (error) {
    console.error('RPC error (generate_changelog_entry_llms_txt):', { slug, error });
    return errorResponse(error, 'generate_changelog_entry_llms_txt', getOnlyCorsHeaders);
  }

  if (!data) {
    console.error('Changelog entry LLMs.txt not found:', { slug });
    return new Response('Changelog entry not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        ...getOnlyCorsHeaders,
      },
    });
  }

  console.log('Changelog entry LLMs.txt generated:', { slug, bytes: data.length });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'CDN-Cache-Control': 'max-age=31536000',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_changelog_entry_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Tool LLMs.txt
 */
async function handleToolLlmsTxt(tool: string): Promise<Response> {
  if (tool !== 'config-recommender') {
    return badRequestResponse(`Invalid tool: ${tool}`, getOnlyCorsHeaders);
  }

  const { data, error } = await supabaseAnon.rpc('generate_tool_llms_txt', {
    p_tool_name: tool,
  });

  if (error) {
    console.error('RPC error (generate_tool_llms_txt):', { tool, error });
    return errorResponse(error, 'generate_tool_llms_txt', getOnlyCorsHeaders);
  }

  console.log('Tool LLMs.txt generated:', { tool, bytes: data?.length || 0 });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=1296000',
      'CDN-Cache-Control': 'max-age=2592000',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_tool_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: JSON (full content + JSON-LD)
 */
async function handleJsonFormat(category: string, slug: string): Promise<Response> {
  const { data: jsonContent, error } = await supabaseAnon.rpc('get_api_content_full', {
    p_category: category,
    p_slug: slug,
    p_base_url: SITE_URL,
  });

  if (error) {
    console.error('RPC error (get_api_content_full):', error);
    return errorResponse(error, 'get_api_content_full', getOnlyCorsHeaders);
  }

  if (!jsonContent) {
    console.error('Content not found:', { category, slug });
    return new Response(JSON.stringify({ error: 'Content not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...getOnlyCorsHeaders,
      },
    });
  }

  console.log('JSON API response:', { category, slug, bytes: jsonContent.length });

  return new Response(jsonContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
      'CDN-Cache-Control': 'max-age=604800',
      'X-Robots-Tag': 'index, follow',
      'X-Content-Type-Options': 'nosniff',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL get_api_content_full',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Markdown
 */
async function handleMarkdownFormat(category: string, slug: string, url: URL): Promise<Response> {
  const includeMetadata = url.searchParams.get('includeMetadata') !== 'false';
  const includeFooter = url.searchParams.get('includeFooter') === 'true';

  const { data, error } = await supabaseAnon.rpc('generate_markdown_export', {
    p_category: category,
    p_slug: slug,
    p_include_metadata: includeMetadata,
    p_include_footer: includeFooter,
  });

  if (error) {
    console.error('RPC error (generate_markdown_export):', error);
    return errorResponse(error, 'generate_markdown_export', getWithAcceptCorsHeaders);
  }

  if (!data) {
    console.error('Markdown content not found:', { category, slug });
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Content not found',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getWithAcceptCorsHeaders,
        },
      }
    );
  }

  const result = data as MarkdownExportResult;

  if (!(result.success && result.markdown)) {
    console.error('Markdown generation failed:', { category, slug, error: result.error });
    return new Response(
      JSON.stringify({
        success: false,
        error: result.error || 'Failed to generate markdown',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getWithAcceptCorsHeaders,
        },
      }
    );
  }

  console.log('Markdown export:', {
    category,
    slug,
    bytes: result.markdown.length,
    filename: result.filename,
  });

  return new Response(result.markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `inline; filename="${result.filename}"`,
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
      'CDN-Cache-Control': 'max-age=604800',
      'X-Robots-Tag': 'index, follow',
      'X-Content-Type-Options': 'nosniff',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_markdown_export',
      'X-Content-ID': result.content_id,
      ...getWithAcceptCorsHeaders,
    },
  });
}

/**
 * Format Handler: LLMs.txt (item-specific)
 */
async function handleLlmsTxtFormat(category: string, slug: string): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_item_llms_txt', {
    p_category: category,
    p_slug: slug,
  });

  if (error) {
    console.error('RPC error (generate_item_llms_txt):', error);
    return errorResponse(error, 'generate_item_llms_txt', getOnlyCorsHeaders);
  }

  if (!data) {
    console.error('LLMs.txt content not found:', { category, slug });
    return new Response('Content not found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
        'CDN-Cache-Control': 'max-age=604800',
        ...getOnlyCorsHeaders,
      },
    });
  }

  console.log('LLMs.txt generated:', { category, slug, bytes: data.length });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=1209600',
      'CDN-Cache-Control': 'max-age=604800',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_item_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Sitewide LLMs.txt
 */
async function handleSitewideLlmsTxt(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_sitewide_llms_txt');

  if (error) {
    console.error('RPC error (generate_sitewide_llms_txt):', error);
    return errorResponse(error, 'generate_sitewide_llms_txt', getOnlyCorsHeaders);
  }

  console.log('Sitewide LLMs.txt generated:', { bytes: data?.length || 0 });

  // Fix PostgreSQL TEXT escaping - replace literal \n with actual newlines
  const formattedData = data.replace(/\\n/g, '\n');

  return new Response(formattedData, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=2592000, stale-while-revalidate=1296000',
      'CDN-Cache-Control': 'max-age=2592000',
      'X-Content-Type-Options': 'nosniff',
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Window': '3600',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_sitewide_llms_txt',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: README
 */
async function handleReadmeFormat(): Promise<Response> {
  const { data, error } = await supabaseAnon.rpc('generate_readme_data');

  if (error) {
    console.error('RPC error (generate_readme_data):', error);
    return errorResponse(error, 'generate_readme_data', getOnlyCorsHeaders);
  }

  if (!data) {
    console.error('README generation failed: RPC returned null');
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

  const readmeMarkdown = buildReadmeMarkdown(data as ReadmeData);

  console.log('✅ README generated:', {
    totalItems: (data as ReadmeData).totalCount,
    categories: (data as ReadmeData).categories.length,
    bytes: readmeMarkdown.length,
  });

  return new Response(readmeMarkdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Generated-By': 'Supabase Edge Function',
      'X-Content-Source': 'PostgreSQL generate_readme_data()',
      ...getOnlyCorsHeaders,
    },
  });
}

/**
 * Format Handler: Storage (proxied downloads with custom cache)
 */
async function handleStorageFormat(category: string, slug: string): Promise<Response> {
  // Only skills have storage downloads currently
  if (category !== 'skills') {
    return badRequestResponse(
      `Storage format not supported for category '${category}'`,
      getWithAcceptCorsHeaders
    );
  }

  // Fetch content to get storage_url
  const { data: content, error } = await supabaseAnon
    .from('content')
    .select('storage_url')
    .eq('category', category)
    .eq('slug', slug)
    .single();

  if (error || !content?.storage_url) {
    console.error('Storage URL not found:', { category, slug, error });
    return new Response(
      JSON.stringify({
        error: 'Storage file not found',
        message: 'Content does not have a storage_url',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...getWithAcceptCorsHeaders,
        },
      }
    );
  }

  // Parse storage URL to extract bucket and path
  // Example: https://hgtjdifxfapoltfflowc.supabase.co/storage/v1/object/public/skills/packages/bash-scripting.zip
  const storageUrlMatch = content.storage_url.match(
    /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/
  );

  if (!storageUrlMatch) {
    console.error('Invalid storage URL format:', {
      category,
      slug,
      storage_url: content.storage_url,
    });
    return new Response(
      JSON.stringify({
        error: 'Invalid storage URL format',
        storage_url: content.storage_url,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getWithAcceptCorsHeaders,
        },
      }
    );
  }

  const [, bucket, path] = storageUrlMatch;

  console.log('Proxying storage file:', { category, slug, bucket, path });

  // Proxy file with custom cache control (1 year for static assets)
  return await proxyStorageFile({
    bucket,
    path,
    cacheControl: 'public, max-age=31536000, immutable', // 1 year
  });
}

/**
 * Build README markdown from database data
 */
function buildReadmeMarkdown(data: ReadmeData): string {
  const { categories, totalCount } = data;

  const categorySections = categories
    .map((cat) => {
      if (!cat.items || cat.items.length === 0) return '';

      const emoji = ICON_EMOJI_MAP[cat.icon_name] || '📄';
      const categoryName = cat.title.endsWith('y')
        ? `${cat.title.slice(0, -1)}ies`
        : `${cat.title}s`;

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
