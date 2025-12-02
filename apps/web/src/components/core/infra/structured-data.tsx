/**
 * Unified Structured Data - Renders Schema.org JSON-LD from generate_metadata_complete RPC
 * Schemas are serialized with XSS protection client-side
 * 
 * Note: Uses native <script> element instead of next/script for JSON-LD because:
 * 1. JSON-LD needs type="application/ld+json" which next/script doesn't support
 * 2. Inline structured data is not deferred/loaded like external scripts
 * 3. Server-rendered JSON-LD is immediately available for crawlers
 */

import { serializeJsonLd } from '@heyclaude/shared-runtime';
import { getSEOMetadataWithSchemas } from '@heyclaude/web-runtime/data';

interface StructuredDataProps {
  route: string;
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
        // Serialize JSON-LD with XSS protection
        const serialized = serializeJsonLd(schema);

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
          if ('@id' in parsed && typeof parsed['@id'] === 'string') {
            schemaId = parsed['@id'];
          } else {
            schemaId = `${schemaType}-${index}`;
          }
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
            // eslint-disable-next-line react/no-danger -- JSON-LD structured data is serialized with XSS protection via serializeJsonLd
            dangerouslySetInnerHTML={{
              __html: serialized,
            }}
          />
        );
      })}
    </>
  );
}
