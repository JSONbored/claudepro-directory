import Script from 'next/script';
import { serializeJsonLd } from '@/src/lib/schemas/form.schema';
import {
  generateAllSchemasForContent,
  type UnifiedStructuredDataProps,
} from '@/src/lib/structured-data/schema-types';

/**
 * Unified Structured Data Component
 * Handles schema.org JSON-LD generation for all content types (agents, commands, hooks, mcp, rules, statuslines)
 *
 * Consolidates 6 previously separate schema components into one with type discrimination
 * Configuration-driven approach using STRUCTURED_DATA_RULES from schema-types.ts
 */
export async function UnifiedStructuredData({ item }: UnifiedStructuredDataProps) {
  // Generate all schemas using configuration-driven approach
  const schemas = generateAllSchemasForContent(item);

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
