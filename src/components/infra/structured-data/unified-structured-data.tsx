import Script from 'next/script';
import {
  generateAllSchemasForContent,
  type UnifiedStructuredDataProps,
} from '@/src/lib/structured-data/schema-types';
import { serializeJsonLd } from '@/src/lib/utils/jsonld.utils';

/**
 * Unified Structured Data - Database-First Architecture
 * All configuration from PostgreSQL structured_data_config table
 */
export async function UnifiedStructuredData({ item }: UnifiedStructuredDataProps) {
  const schemas = await generateAllSchemasForContent(item);

  // Render all schemas as Script tags
  return (
    <>
      {schemas.map((schema, index) => {
        // Extract type-safe @id or @type for unique key
        const schemaWithId = schema as { '@id'?: string; '@type'?: string };
        const idFragment = schemaWithId['@id'] ? schemaWithId['@id'].split('#').pop() : null;
        const schemaId = idFragment || `${schemaWithId['@type'] || 'schema'}-${index}`;

        return (
          <Script
            key={`${item.category}-${item.slug}-${schemaId}`}
            id={`structured-data-${item.category}-${schemaId}`}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is generated from validated Zod schemas
            dangerouslySetInnerHTML={{
              __html: serializeJsonLd(schema),
            }}
            strategy="afterInteractive"
          />
        );
      })}
    </>
  );
}
