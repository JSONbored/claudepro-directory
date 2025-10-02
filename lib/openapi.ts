/**
 * Fumadocs OpenAPI Configuration
 *
 * Creates an OpenAPI instance for API documentation generation using Fumadocs.
 * Integrates with the existing OpenAPI 3.1.0 specification generated from Zod schemas.
 *
 * Features:
 * - Reads from generated public/openapi.json
 * - Provides API page props for rendering
 * - Integrates with Fumadocs UI components
 * - Supports server-side rendering
 *
 * @module lib/openapi
 * @see {@link https://fumadocs.dev/docs/ui/openapi Fumadocs OpenAPI Documentation}
 */

import { createOpenAPI } from 'fumadocs-openapi/server';

/**
 * OpenAPI instance for Fumadocs integration
 *
 * Configuration:
 * - input: Path to OpenAPI 3.1.0 specification (generated at build time)
 * - Reads from public/openapi.json (57KB, 8 endpoints)
 *
 * Usage:
 * ```tsx
 * import { openapi } from '@/lib/openapi';
 *
 * // In API docs page component
 * <APIPage {...openapi.getAPIPageProps(props)} />
 * ```
 *
 * @constant
 * @type {ReturnType<typeof createOpenAPI>}
 */
export const openapi = createOpenAPI({
  // Path to OpenAPI 3.1.0 specification
  // Generated from Zod schemas via scripts/generate-openapi.ts
  input: ['./public/openapi.json'],
});
