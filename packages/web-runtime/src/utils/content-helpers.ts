import type { Database } from '@heyclaude/database-types';

export function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

export function getMetadata(
  item: Database['public']['CompositeTypes']['enriched_content_item'] | Database['public']['Tables']['content']['Row']
): Record<string, unknown> {
  const metadata = 'metadata' in item ? item.metadata : null;
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}
