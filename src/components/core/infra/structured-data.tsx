/**
 * Unified Structured Data - Renders pre-generated Schema.org JSON-LD from data-api/seo
 */

import Script from 'next/script';
import { fetchSchemas } from '@/src/lib/seo/client';
import { serializeJsonLd } from '@/src/lib/utils/jsonld.utils';

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
      {schemas.map((schema, index) => (
        <Script
          key={`${schema['@type']}-${index}`}
          id={`structured-data-${schema['@type']}-${index}`}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is pre-generated from database and sanitized via serializeJsonLd (XSS protection)
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(schema),
          }}
          strategy="afterInteractive"
        />
      ))}
    </>
  );
}
