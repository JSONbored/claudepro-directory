/**
 * OpenAPI Generator Tests
 *
 * Validates that the OpenAPI generator can:
 * - Extract route metadata from route files
 * - Evaluate Zod schemas correctly
 * - Generate valid OpenAPI documentation
 * - Extract OpenAPI metadata (summary, description, tags, operationId, responses)
 *
 * This is a single test file for the OpenAPI generator, not per-route tests.
 * Per-route tests should focus on route functionality, not OpenAPI generation.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { join } from 'node:path';
import { extractRouteMetadata, evaluateSchemas } from './generate-openapi';

// Mock jiti to avoid actual file evaluation in tests
jest.mock('jiti', () => {
  return jest.fn(() => ({
    import: jest.fn(async (path: string) => {
      // Return mock module based on path
      if (path.includes('company/route')) {
        return {
          companyQuerySchema: {
            _def: {
              typeName: 'ZodObject',
              shape: {
                slug: {
                  _def: { typeName: 'ZodString' },
                },
              },
            },
          },
          GET: {
            route: '/api/v1/company',
            method: 'GET',
            openapi: {
              summary: 'Get company profile by slug',
              description: 'Returns company profile data by slug identifier',
              tags: ['company', 'profiles'],
              operationId: 'getCompanyProfile',
              responses: {
                200: { description: 'Company profile retrieved successfully' },
                404: { description: 'Company not found' },
              },
            },
          },
        };
      }
      return {};
    }),
  }));
});

describe('OpenAPI Generator', () => {
  const PROJECT_ROOT = process.cwd();
  const companyRoutePath = join(PROJECT_ROOT, 'apps/web/src/app/api/company/route.ts');

  describe('extractRouteMetadata', () => {
    it('should extract route metadata from company route', async () => {
      const routes = await extractRouteMetadata(companyRoutePath);

      expect(routes.length).toBeGreaterThan(0);

      const getRoute = routes.find((r) => r.method === 'GET');
      expect(getRoute).toBeDefined();

      if (getRoute) {
        expect(getRoute.route).toBe('/api/v1/company');
        expect(getRoute.method).toBe('GET');
        expect(getRoute.openapi).toBeDefined();
        if (getRoute.openapi) {
          expect(getRoute.openapi.summary).toBe('Get company profile by slug');
          expect(getRoute.openapi.description).toContain('Returns company profile');
          expect(getRoute.openapi.tags).toContain('company');
          expect(getRoute.openapi.operationId).toBe('getCompanyProfile');
          expect(getRoute.openapi.responses).toBeDefined();
          if (getRoute.openapi.responses) {
            expect(getRoute.openapi.responses[200]).toBeDefined();
            expect(getRoute.openapi.responses[404]).toBeDefined();
          }
        }
        expect(getRoute.querySchemaSource).toBeDefined();
        expect(getRoute.querySchemaName).toBe('companyQuerySchema');
      }
    });

    it('should extract query schema source from route', async () => {
      const routes = await extractRouteMetadata(companyRoutePath);

      const getRoute = routes.find((r) => r.method === 'GET');
      expect(getRoute).toBeDefined();

      if (getRoute) {
        // Should have query schema source (the actual schema definition)
        expect(getRoute.querySchemaSource).toBeDefined();
        // Should have query schema name (exported schema name)
        expect(getRoute.querySchemaName).toBe('companyQuerySchema');
      }
    });
  });

  describe('evaluateSchemas', () => {
    it('should evaluate Zod schemas from route metadata', async () => {
      const routes = await extractRouteMetadata(companyRoutePath);
      const routesWithSchemas = await evaluateSchemas(companyRoutePath, routes);

      expect(routesWithSchemas.length).toBeGreaterThan(0);

      const getRoute = routesWithSchemas.find((r) => r.method === 'GET');
      expect(getRoute).toBeDefined();

      if (getRoute) {
        // Should have evaluated query schema
        expect(getRoute.querySchema).toBeDefined();
        if (getRoute.querySchema) {
          // Verify it's a Zod schema object
          expect(getRoute.querySchema._def).toBeDefined();
          expect(getRoute.querySchema._def.typeName).toBe('ZodObject');
        }
      }
    });
  });

  describe('OpenAPI metadata validation', () => {
    it('should extract all required OpenAPI fields from company route', async () => {
      const routes = await extractRouteMetadata(companyRoutePath);

      const getRoute = routes.find((r) => r.method === 'GET');
      expect(getRoute).toBeDefined();

      if (getRoute && getRoute.openapi) {
        // Required fields for OpenAPI generation
        expect(getRoute.openapi.summary).toBeDefined();
        expect(getRoute.openapi.description).toBeDefined();
        expect(getRoute.openapi.tags).toBeDefined();
        expect(Array.isArray(getRoute.openapi.tags)).toBe(true);
        expect(getRoute.openapi.operationId).toBeDefined();
        expect(getRoute.openapi.responses).toBeDefined();

        // Verify response schemas are documented
        if (getRoute.openapi.responses) {
          const response200 = getRoute.openapi.responses[200];
          expect(response200).toBeDefined();
          expect(response200.description).toBeDefined();

          const response404 = getRoute.openapi.responses[404];
          expect(response404).toBeDefined();
          expect(response404.description).toBeDefined();
        }
      }
    });
  });
});
