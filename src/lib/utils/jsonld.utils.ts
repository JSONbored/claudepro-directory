/**
 * JSON-LD Serialization Utilities
 * Production-grade JSON-LD validation and serialization with XSS protection
 *
 * Database-first: Moved from form.schema.ts during Phase 2 schema consolidation
 */

import { z } from 'zod';
import { ParseStrategy, safeParse } from '@/src/lib/utils/data.utils';

/**
 * Validates JSON-LD data for safety
 * Checks for XSS vectors (script tags, javascript: protocol)
 * Uses safeParse for round-trip validation
 */
export function validateJsonLdSafe(data: unknown): unknown {
  const jsonString = JSON.stringify(data);

  if (/<script\b/i.test(jsonString)) {
    throw new Error('Script tags are not allowed in JSON-LD data');
  }

  if (/javascript:/i.test(jsonString)) {
    throw new Error('JavaScript protocol not allowed in JSON-LD data');
  }

  // Production-grade: safeParse with permissive unknown schema for round-trip validation
  return safeParse(jsonString, z.unknown(), {
    strategy: ParseStrategy.VALIDATED_JSON,
  });
}

/**
 * Serializes data to JSON-LD string with XSS protection
 * Escapes < characters to prevent script injection
 * Used in structured data components
 */
export function serializeJsonLd(data: unknown): string {
  const validated = validateJsonLdSafe(data);
  return JSON.stringify(validated).replace(/</g, '\\u003c');
}
