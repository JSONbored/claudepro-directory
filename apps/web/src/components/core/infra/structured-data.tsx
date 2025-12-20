/**
 * Unified Structured Data - Renders Schema.org JSON-LD from generate_metadata_complete RPC
 * Schemas are serialized with XSS protection client-side
 *
 * **Build-Time Optimization:**
 * - This component is used in pages with 'use cache' directive
 * - During build: RPC call executes (deterministic - uses stored database data)
 * - At runtime: Uses cached result from Next.js cache (no RPC call if cache valid)
 */

import { serializeJsonLd } from '@heyclaude/shared-runtime';
import { serializeForClient } from '@heyclaude/shared-runtime/utils/serialize';
import { getSEOMetadataWithSchemas } from '@heyclaude/web-runtime/data/seo/client';

interface StructuredDataProps {
  route: string;
}

/**
 * Recursively sanitize URLs in a JSON object to remove javascript: protocol
 */
function sanitizeUrlsInObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Remove javascript: protocol from URLs
    return obj.replace(/javascript:/gi, '').trim() || obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeUrlsInObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeUrlsInObject(value);
    }
    return sanitized;
  }

  return obj;
}

export async function StructuredData({ route }: StructuredDataProps) {
  // Fetch SEO metadata with schemas (build-time cached, deterministic)
  // During build: RPC executes (deterministic - uses stored database data), result cached by Next.js 'use cache'
  // At runtime: Uses cached result (no RPC call if cache valid)
  // Request cache skips Date.now() during build (via isBuildTime() check), so this is safe
  // Note: Next.js may still require connection() before database calls, but we can't use it in 'use cache' context
  // The RPC is STABLE (deterministic), so it should work at build time
  const seoData = await getSEOMetadataWithSchemas(route);

  // getSEOMetadataWithSchemas() now always returns unified structure with schemas array
  // Check if schemas array has any items
  if (!seoData?.schemas || seoData.schemas.length === 0) {
    return null;
  }

  return (
    <>
      {seoData.schemas.map((schema, index) => {
        // First, serialize for client to remove any functions or non-serializable data
        // This ensures the schema is safe to pass through Next.js prerendering
        // Use aggressive serialization to remove all functions, React components, and non-serializable values
        const serializedSchema = serializeForClient(schema);

        // Additional pass: Remove any remaining functions or React components that might have been missed
        // This handles edge cases where functions are nested deeply or in unexpected structures
        const deepCleaned = JSON.parse(
          JSON.stringify(serializedSchema, (_key, value) => {
            // Remove functions
            if (typeof value === 'function') {
              return undefined;
            }
            // Remove React components (have $$typeof property)
            if (value && typeof value === 'object' && '$$typeof' in value) {
              return undefined;
            }
            // Remove objects with render functions (React components)
            if (value && typeof value === 'object' && typeof value.render === 'function') {
              return undefined;
            }
            return value;
          })
        );

        // Sanitize schema to remove javascript: protocol before JSON-LD serialization
        const sanitizedSchema = sanitizeUrlsInObject(deepCleaned);

        // Serialize JSON-LD with XSS protection
        // Prisma JsonValue and shared-runtime JsonValue are structurally compatible
        // Both are: string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[]
        // We use JSON.parse/stringify to convert between compatible types (not a type assertion)
        const serialized = serializeJsonLd(JSON.parse(JSON.stringify(sanitizedSchema)));

        // Extract @type for key
        let schemaType = 'schema';
        let schemaId = `schema-${index}`;
        try {
          const parsed =
            typeof schema === 'object' && schema !== null
              ? schema
              : JSON.parse(JSON.stringify(schema));
          schemaType = (parsed as { '@type'?: string })['@type'] || 'schema';
          // Use @id or @type + index for unique key
          schemaId =
            '@id' in parsed && typeof parsed['@id'] === 'string'
              ? parsed['@id']
              : `${schemaType}-${index}`;
        } catch {
          // Fallback if parsing fails
          schemaId = `schema-${index}`;
        }

        const uniqueKey = `${schemaType}-${schemaId}`;

        return (
          <script
            key={uniqueKey}
            id={`structured-data-${uniqueKey}`}
            type="application/ld+json"
            // eslint-disable-next-line jsx-a11y/no-danger -- JSON-LD structured data is serialized with XSS protection via serializeJsonLd
            dangerouslySetInnerHTML={{
              __html: serialized,
            }}
          />
        );
      })}
    </>
  );
}
