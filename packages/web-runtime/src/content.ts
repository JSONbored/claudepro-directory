import type { Database } from '@heyclaude/database-types';

export function formatViewCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k views`;
  }
  return `${count} views`;
}

export function formatCopyCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k used`;
  }
  return `${count} used`;
}

export function sanitizeSlug(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9-_]/g, '');
}

export function getContentItemUrl(item: {
  category: Database['public']['Enums']['content_category'];
  slug: string;
  subcategory?: string | null | undefined;
}): string {
  return `/${item.category}/${item.slug}`;
}

export function transformMcpConfigForDisplay(
  config: Record<string, unknown>
): Record<string, unknown> {
  if ('mcp' in config && config['mcp']) {
    const { mcp, ...rest } = config;
    return {
      mcpServers: mcp,
      ...rest,
    };
  }
  return config;
}
