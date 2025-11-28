import type { Json } from '@heyclaude/database-types';

function validateJsonLdSafe(data: unknown): unknown {
  const jsonString = JSON.stringify(data);

  if (/(['":])\s*javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }

  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON-LD data');
  }
}

export function serializeJsonLd(data: Json): string {
  const validated = validateJsonLdSafe(data);
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}

export type { Json };
