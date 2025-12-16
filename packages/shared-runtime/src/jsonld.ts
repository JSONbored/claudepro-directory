// Json type for JSON-LD serialization
// Using a generic JSON value type compatible with Prisma's JsonValue
// Note: shared-runtime is a pure utility package and shouldn't depend on data-layer
type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

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

export function serializeJsonLd(data: JsonValue): string {
  const validated = validateJsonLdSafe(data);
  return JSON.stringify(validated).replaceAll('<', String.raw`\u003c`);
}

// Re-export JsonValue as Json for backward compatibility
export type Json = JsonValue;