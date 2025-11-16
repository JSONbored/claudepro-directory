/**
 * Unified Structured Data - Renders pre-generated Schema.org JSON-LD from data-api/seo
 * Schemas are pre-serialized with XSS protection at the edge function
 */

import Script from 'next/script';
import { fetchSchemas } from '@/src/lib/data/seo/client';

interface StructuredDataProps {
  route: string;
}

export async function StructuredData({ route }: StructuredDataProps) {
  const schemas = await fetchSchemas(route);

  if (!schemas || schemas.length === 0) {
    return null;
  }

  return (
    <>
      {schemas.map((schema) => {
        // Edge function returns pre-serialized strings (XSS-protected)
        // Extract @type for key (from serialized string) - use schema content hash for unique key
        let schemaType = 'schema';
        let schemaId = schema.slice(0, 20); // Use first 20 chars as unique identifier
        try {
          const parsed = JSON.parse(schema);
          schemaType = (parsed as { '@type'?: string })['@type'] || 'schema';
          // Use @id or @type + hash of content for unique key
          if ('@id' in parsed && typeof parsed['@id'] === 'string') {
            schemaId = parsed['@id'];
          } else {
            // Create hash from schema content for uniqueness
            schemaId = `${schemaType}-${schema.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`;
          }
        } catch {
          // Fallback if parsing fails - use content hash
          schemaId = `schema-${schema.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}`;
        }

        // Use schemaId (derived from content) as key instead of index
        const uniqueKey = `${schemaType}-${schemaId}`;

        return (
          <Script
            key={uniqueKey}
            id={`structured-data-${uniqueKey}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is pre-serialized with XSS protection at edge function
            dangerouslySetInnerHTML={{
              __html: schema,
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}
