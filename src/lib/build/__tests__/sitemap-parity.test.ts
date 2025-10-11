/**
 * Sitemap URL Generation Test
 *
 * **CRITICAL**: Validates centralized URL generator used by dynamic sitemap
 *
 * Purpose:
 * - Verify ALL URLs are generated correctly for src/app/sitemap.ts
 * - Confirm URL structure, priorities, and change frequencies are valid
 * - Ensure no duplicate URLs
 * - Validate SEO metadata (dates, priorities, frequencies)
 *
 * Test Strategy:
 * 1. Generate URLs using centralized url-generator.ts
 * 2. Validate URL structure and metadata
 * 3. Ensure all categories and content types are included
 * 4. Verify critical routes exist
 *
 * @see src/lib/build/url-generator.ts (centralized URL generation)
 * @see src/app/sitemap.ts (dynamic sitemap using url-generator)
 */

import { describe, expect, it } from 'vitest';
// Import metadata from generated files
import { agentsMetadata } from '@/generated/agents-metadata';
import { collectionsMetadata } from '@/generated/collections-metadata';
import { commandsMetadata } from '@/generated/commands-metadata';
import { hooksMetadata } from '@/generated/hooks-metadata';
import { mcpMetadata } from '@/generated/mcp-metadata';
import { rulesMetadata } from '@/generated/rules-metadata';
import { statuslinesMetadata } from '@/generated/statuslines-metadata';
import { APP_CONFIG } from '@/src/lib/constants';
import { generateAllSiteUrls } from '../url-generator';

describe('Sitemap Parity Test', () => {
  describe('Dynamic Sitemap Generation', () => {
    it('generates URLs using centralized URL generator', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        {
          baseUrl: APP_CONFIG.url,
          includeGuides: true,
          includeChangelog: true,
          includeLlmsTxt: true,
          includeTools: true,
        }
      );

      expect(urls).toBeDefined();
      expect(Array.isArray(urls)).toBe(true);
      expect(urls.length).toBeGreaterThan(400); // Expect 425+ URLs
    });

    it('includes all required URL fields', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      // Check first URL has all required fields
      const firstUrl = urls[0];
      expect(firstUrl).toBeDefined();
      expect(firstUrl).toHaveProperty('loc');
      expect(firstUrl).toHaveProperty('lastmod');
      expect(firstUrl).toHaveProperty('changefreq');
      expect(firstUrl).toHaveProperty('priority');

      // Validate field types
      expect(typeof firstUrl.loc).toBe('string');
      expect(typeof firstUrl.lastmod).toBe('string');
      expect(typeof firstUrl.changefreq).toBe('string');
      expect(typeof firstUrl.priority).toBe('number');
    });

    it('generates unique URLs (no duplicates)', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      const urlSet = new Set(urls.map((u) => u.loc));
      expect(urlSet.size).toBe(urls.length); // No duplicates
    });
  });

  describe('URL Structure Validation', () => {
    it('includes homepage with highest priority', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      const homepage = urls.find((u) => u.loc === APP_CONFIG.url);
      expect(homepage).toBeDefined();
      expect(homepage?.priority).toBe(1.0); // Highest priority
      expect(homepage?.changefreq).toBe('daily');
    });

    it('includes all main category pages', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines'];
      for (const category of categories) {
        const categoryUrl = urls.find((u) => u.loc === `${APP_CONFIG.url}/${category}`);
        expect(categoryUrl).toBeDefined();
        expect(categoryUrl?.priority).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('includes all content item pages', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      // Check agents
      expect(agentsMetadata.length).toBeGreaterThan(0);
      for (const agent of agentsMetadata) {
        const agentUrl = urls.find((u) => u.loc === `${APP_CONFIG.url}/agents/${agent.slug}`);
        expect(agentUrl).toBeDefined();
      }

      // Check MCP servers
      expect(mcpMetadata.length).toBeGreaterThan(0);
      for (const mcp of mcpMetadata.slice(0, 3)) {
        // Sample check
        const mcpUrl = urls.find((u) => u.loc === `${APP_CONFIG.url}/mcp/${mcp.slug}`);
        expect(mcpUrl).toBeDefined();
      }
    });

    it('includes llms.txt routes when enabled', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        {
          baseUrl: APP_CONFIG.url,
          includeLlmsTxt: true,
        }
      );

      // Site-wide llms.txt
      const siteLlmsTxt = urls.find((u) => u.loc === `${APP_CONFIG.url}/llms.txt`);
      expect(siteLlmsTxt).toBeDefined();
      expect(siteLlmsTxt?.priority).toBeGreaterThanOrEqual(0.85);

      // Category llms.txt
      const agentsLlmsTxt = urls.find((u) => u.loc === `${APP_CONFIG.url}/agents/llms.txt`);
      expect(agentsLlmsTxt).toBeDefined();

      // Individual item llms.txt (sample)
      const firstAgent = agentsMetadata[0];
      if (firstAgent) {
        const agentLlmsTxt = urls.find(
          (u) => u.loc === `${APP_CONFIG.url}/agents/${firstAgent.slug}/llms.txt`
        );
        expect(agentLlmsTxt).toBeDefined();
      }
    });

    it('includes collection pages', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      const collectionsPage = urls.find((u) => u.loc === `${APP_CONFIG.url}/collections`);
      expect(collectionsPage).toBeDefined();

      // Individual collections
      expect(collectionsMetadata.length).toBeGreaterThan(0);
      for (const collection of collectionsMetadata.slice(0, 3)) {
        const collectionUrl = urls.find(
          (u) => u.loc === `${APP_CONFIG.url}/collections/${collection.slug}`
        );
        expect(collectionUrl).toBeDefined();
      }
    });
  });

  describe('URL Count Validation', () => {
    it('generates expected number of URLs (±10 tolerance for growth)', async () => {
      const dynamicUrls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        {
          baseUrl: APP_CONFIG.url,
          includeGuides: true,
          includeChangelog: true,
          includeLlmsTxt: true,
          includeTools: true,
        }
      );

      // Baseline: 427 URLs (2025-10-11 - verified from last static generation)
      // NOTE: Update this baseline when you add significant new content sections
      // (e.g., new category pages, guide sections, etc.)
      const baselineCount = 427;
      const tolerance = 10; // Allow ±10 URLs for organic content growth

      const actualCount = dynamicUrls.length;
      const isWithinTolerance =
        actualCount >= baselineCount - tolerance && actualCount <= baselineCount + tolerance;

      expect(isWithinTolerance).toBe(true);
    });

    it('includes all critical routes', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        {
          baseUrl: APP_CONFIG.url,
          includeGuides: true,
          includeChangelog: true,
          includeLlmsTxt: true,
          includeTools: true,
        }
      );

      const urlSet = new Set(urls.map((u) => u.loc));

      // Critical routes that MUST exist
      const criticalRoutes = [
        APP_CONFIG.url, // Homepage
        `${APP_CONFIG.url}/agents`,
        `${APP_CONFIG.url}/mcp`,
        `${APP_CONFIG.url}/collections`,
        `${APP_CONFIG.url}/changelog`,
        `${APP_CONFIG.url}/api-docs`,
        `${APP_CONFIG.url}/llms.txt`,
        `${APP_CONFIG.url}/tools/config-recommender`,
      ];

      for (const route of criticalRoutes) {
        expect(urlSet.has(route)).toBe(true);
      }
    });
  });

  describe('SEO Metadata Validation', () => {
    it('uses proper ISO date format for lastmod', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      // Check date format: YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const url of urls.slice(0, 10)) {
        // Sample check
        expect(url.lastmod).toMatch(dateRegex);
      }
    });

    it('uses valid changefreq values', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      const validFreqs = [
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ] as const;

      for (const url of urls) {
        expect(validFreqs).toContain(url.changefreq as (typeof validFreqs)[number]);
      }
    });

    it('uses valid priority range (0.0 to 1.0)', async () => {
      const urls = await generateAllSiteUrls(
        {
          agentsMetadata,
          collectionsMetadata,
          commandsMetadata,
          hooksMetadata,
          mcpMetadata,
          rulesMetadata,
          statuslinesMetadata,
        },
        { baseUrl: APP_CONFIG.url }
      );

      for (const url of urls) {
        expect(url.priority).toBeGreaterThanOrEqual(0.0);
        expect(url.priority).toBeLessThanOrEqual(1.0);
      }
    });
  });
});
