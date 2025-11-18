/**
 * JSON-LD Serialization Utilities
 * Production-grade JSON-LD validation and serialization with XSS protection
 */

import type { Json } from '@/src/types/database.types';

/**
 * Validates JSON-LD data for safety
 * Checks for XSS vectors (javascript: protocol)
 */
function validateJsonLdSafe(data: unknown): unknown {
  const jsonString = JSON.stringify(data);

  // Check for javascript: protocol ONLY when it appears in URLs (after quotes/colons)
  // Allows educational text like "JavaScript: " while blocking actual javascript: URLs
  if (/(["':])\s*javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }

  // Round-trip validation: parse and re-stringify to ensure valid JSON
  try {
    return JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON-LD data');
  }
}

/**
 * Serializes data to JSON-LD string with XSS protection
 * Escapes < characters to prevent script injection
 * Used for structured data (Schema.org markup)
 */
export function serializeJsonLd(data: Json): string {
  const validated = validateJsonLdSafe(data);
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}
