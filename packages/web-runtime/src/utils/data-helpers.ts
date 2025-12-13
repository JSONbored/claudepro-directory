/**
 * Client-safe data helper utilities
 * Extracted from data.ts to avoid Turbopack phantom module issues
 * when both data.ts and actions.ts are in the module graph
 */

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function ensureStringArray(value: unknown, fallback: readonly string[] = []): string[] {
  return isStringArray(value) ? [...value] : [...fallback];
}

export function getMetadata(
  item: { metadata?: unknown } | Record<string, unknown>
): Record<string, unknown> {
  if ('metadata' in item && item.metadata) {
    return typeof item.metadata === 'object' &&
      item.metadata !== null &&
      !Array.isArray(item.metadata)
      ? (item.metadata as Record<string, unknown>)
      : {};
  }
  return {};
}
