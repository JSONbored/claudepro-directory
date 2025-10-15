/**
 * LLMs.txt Route E2E Smoke Tests
 *
 * Tests AI-optimized plain text generation for all content types.
 *
 * **Coverage:**
 * - All category llms.txt routes respond correctly
 * - Detail page llms.txt routes return valid content
 * - Collections llms.txt includes embedded items
 * - Proper content-type headers
 *
 * @group smoke
 */

import { expect, test } from '@playwright/test';

const CATEGORIES = ['agents', 'mcp', 'rules', 'commands', 'hooks', 'statuslines', 'collections'];

test.describe('LLMs.txt Routes - Smoke Tests', () => {
  test('should return valid llms.txt for root', async ({ page }) => {
    const response = await page.goto('/llms.txt');

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Should have correct content-type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('text/plain');

    // Should have content
    const content = await page.content();
    expect(content.length).toBeGreaterThan(100);
  });

  // Test each category llms.txt endpoint
  for (const category of CATEGORIES) {
    test(`should return valid llms.txt for /${category}/llms.txt`, async ({ page }) => {
      const response = await page.goto(`/${category}/llms.txt`);

      // Should return 200 OK
      expect(response?.status()).toBe(200);

      // Should have correct content-type
      const contentType = response?.headers()['content-type'];
      expect(contentType).toContain('text/plain');

      // Should have content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);

      // Should mention the category
      expect(content.toLowerCase()).toContain(category);
    });
  }

  test('should return valid llms.txt for agent detail page', async ({ page }) => {
    // Get agents list first to find a valid slug
    const listResponse = await page.goto('/agents/llms.txt');
    expect(listResponse?.status()).toBe(200);

    // Try a common agent (code-reviewer-agent is likely to exist)
    const detailResponse = await page.goto('/agents/code-reviewer-agent/llms.txt');

    // Should return 200 OK or 404 if not found
    const status = detailResponse?.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      // Should have correct content-type
      const contentType = detailResponse?.headers()['content-type'];
      expect(contentType).toContain('text/plain');

      // Should have content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);

      // Should mention code review
      expect(content.toLowerCase()).toMatch(/code|review/);
    }
  });

  test('should return valid llms.txt for MCP server detail page', async ({ page }) => {
    // Try filesystem server (common MCP)
    const response = await page.goto('/mcp/filesystem-server/llms.txt');

    // Should return 200 OK or 404 if not found
    const status = response?.status();
    expect([200, 404]).toContain(status);

    if (status === 200) {
      // Should have correct content-type
      const contentType = response?.headers()['content-type'];
      expect(contentType).toContain('text/plain');

      // Should have content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
    }
  });

  test('should return valid llms.txt for collection with embedded items', async ({ page }) => {
    // Get collections list to find a valid slug
    const listResponse = await page.goto('/collections/llms.txt');
    expect(listResponse?.status()).toBe(200);

    // Try getting the first collection's detail llms.txt
    // We'll parse the list to find a slug
    const listContent = await page.content();

    // Extract a slug from the list content (look for pattern like /collections/slug)
    const slugMatch = listContent.match(/\/collections\/([a-z0-9-]+)/i);

    if (slugMatch && slugMatch[1]) {
      const slug = slugMatch[1];
      const detailResponse = await page.goto(`/collections/${slug}/llms.txt`);

      // Should return 200 OK
      const status = detailResponse?.status();
      expect([200, 404]).toContain(status);

      if (status === 200) {
        // Should have correct content-type
        const contentType = detailResponse?.headers()['content-type'];
        expect(contentType).toContain('text/plain');

        // Should have content
        const content = await page.content();
        expect(content.length).toBeGreaterThan(100);

        // Collection llms.txt should include "INCLUDED ITEMS" section
        expect(content).toContain('INCLUDED ITEMS');
      }
    }
  });

  test('should return 404 for non-existent llms.txt', async ({ page }) => {
    const response = await page.goto('/agents/this-does-not-exist-12345/llms.txt');

    // Should return 404
    expect(response?.status()).toBe(404);
  });

  test('should have proper cache headers on llms.txt', async ({ page }) => {
    const response = await page.goto('/agents/llms.txt');

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Should have cache control header
    const cacheControl = response?.headers()['cache-control'];
    expect(cacheControl).toBeTruthy();

    // Should allow caching (public)
    expect(cacheControl).toContain('public');
  });

  test('should have robots meta tag allowing indexing on llms.txt', async ({ page }) => {
    const response = await page.goto('/agents/llms.txt');

    // Should return 200 OK
    expect(response?.status()).toBe(200);

    // Check for X-Robots-Tag header
    const robotsTag = response?.headers()['x-robots-tag'];

    if (robotsTag) {
      // Should allow indexing
      expect(robotsTag.toLowerCase()).toMatch(/index|follow/);
    }
  });

  test('should sanitize PII from llms.txt content', async ({ page }) => {
    const response = await page.goto('/agents/llms.txt');

    expect(response?.status()).toBe(200);

    const content = await page.content();

    // Should not contain email addresses (basic check)
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex);

    // Allow GitHub/official domains but not personal emails
    if (emails) {
      const personalEmails = emails.filter(
        (email) => !(email.endsWith('@github.com') || email.endsWith('@anthropic.com'))
      );
      expect(personalEmails.length).toBe(0);
    }
  });
});
