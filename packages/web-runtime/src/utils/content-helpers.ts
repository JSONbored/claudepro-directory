import type { EnrichedContentItem } from '@heyclaude/database-types/postgres-types';
import { prisma } from '@heyclaude/data-layer/prisma';

export function ensureStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value === 'string') {
    return [value];
  }
  return [];
}

// Type helper: Extract content type from Prisma query result
type ContentType = Awaited<ReturnType<typeof prisma.content.findUnique>>;

export function getMetadata(
  item: EnrichedContentItem | NonNullable<ContentType>
): Record<string, unknown> {
  const metadata = 'metadata' in item ? item.metadata : null;
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata) && metadata !== null) {
    return metadata as Record<string, unknown>;
  }
  return {};
}
