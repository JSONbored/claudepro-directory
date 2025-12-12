/**
 * Unified Structured Data - Renders Schema.org JSON-LD from generate_metadata_complete RPC
 * Schemas are serialized with XSS protection client-side
 */

import { serializeJsonLd } from '@heyclaude/shared-runtime';
import { getSEOMetadataWithSchemas } from '@heyclaude/web-runtime/data';

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
  const seoData = await getSEOMetadataWithSchemas(route);

  // getSEOMetadataWithSchemas() now always returns unified structure with schemas array
  // Check if schemas array has any items
  if (!seoData?.schemas || seoData.schemas.length === 0) {
    return null;
  }

  return (
    <>
      {seoData.schemas.map((schema, index) => {
        // Sanitize schema to remove javascript: protocol before serialization
        const sanitizedSchema = sanitizeUrlsInObject(schema) as typeof schema;
        
        // Serialize JSON-LD with XSS protection
        const serialized = serializeJsonLd(sanitizedSchema);

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
