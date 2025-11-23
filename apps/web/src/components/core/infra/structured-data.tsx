/**
 * Unified Structured Data - Renders Schema.org JSON-LD from generate_metadata_complete RPC
 * Schemas are serialized with XSS protection client-side
 */

import { serializeJsonLd } from '@heyclaude/shared-runtime';
import { getSEOMetadataWithSchemas } from '@heyclaude/web-runtime/data';
import Script from 'next/script';

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
          <Script
            key={uniqueKey}
            id={`structured-data-${uniqueKey}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is serialized with XSS protection via serializeJsonLd
            dangerouslySetInnerHTML={{
              __html: serialized,
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}
