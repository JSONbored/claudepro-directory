/**
 * Metadata Registry Tests
 *
 * Tests for title generation helpers and metadata registry functions.
 * Validates SEO title length constraints (55-60 chars) and smart truncation logic.
 *
 * @module tests/unit/lib/seo/metadata-registry.test
 */

import { describe, expect, it } from 'vitest';
import {
  buildContentTitle,
  buildPageTitle,
  CATEGORY_NAMES,
  METADATA_DEFAULTS,
  smartTruncate,
} from '@/src/lib/seo/metadata-registry';

describe('metadata-registry', () => {
  describe('smartTruncate()', () => {
    it('should return unchanged string if within max length', () => {
      const input = 'Short Title';
      const result = smartTruncate(input, 20);
      expect(result).toBe(input);
    });

    it('should truncate at last space within 70% threshold', () => {
      const input = 'This is a very long title that needs truncation';
      const result = smartTruncate(input, 25);

      expect(result.length).toBeLessThanOrEqual(25);
      expect(result).toBe('This is a very long');
      expect(result.endsWith(' ')).toBe(false);
    });

    it('should truncate at max length if no space within 70% threshold', () => {
      const input = 'Supercalifragilisticexpialidocious';
      const result = smartTruncate(input, 20);

      expect(result.length).toBeLessThanOrEqual(20);
      expect(result).toBe('Supercalifragilistic');
    });

    it('should handle edge case with exactly max length', () => {
      const input = 'Exactly Twenty Chars';
      const result = smartTruncate(input, 20);
      expect(result).toBe(input);
    });

    it('should trim trailing whitespace', () => {
      const input = 'Title with trailing spaces   ';
      const result = smartTruncate(input, 15);
      expect(result.endsWith(' ')).toBe(false);
    });
  });

  describe('buildContentTitle()', () => {
    it('should build title for AI Agents category', () => {
      const result = buildContentTitle('Code Reviewer', 'agents');
      // With padding: "Code Reviewer Tool - AI Agents - Claude Pro Directory" (59 chars)
      expect(result).toContain('Code Reviewer');
      expect(result).toContain('AI Agents');
      expect(result).toContain(METADATA_DEFAULTS.siteName);
      expect(result.length).toBeGreaterThanOrEqual(55);
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('should build title for MCP category', () => {
      const result = buildContentTitle('File System', 'mcp');
      // With padding: "File System Server - MCP - Claude Pro Directory" (47 chars)
      expect(result).toContain('File System');
      expect(result).toContain('MCP');
      expect(result).toContain(METADATA_DEFAULTS.siteName);
      expect(result.length).toBeGreaterThanOrEqual(55);
      expect(result.length).toBeLessThanOrEqual(60);
    });

    it('should truncate long content names to fit 60-char limit', () => {
      const longName = 'This is a very long agent name that exceeds the maximum allowed length';
      const result = buildContentTitle(longName, 'agents');

      expect(result.length).toBeGreaterThanOrEqual(55);
      expect(result.length).toBeLessThanOrEqual(60);
      expect(result).toContain('AI Agents');
      expect(result).toContain(METADATA_DEFAULTS.siteName);
    });

    it('should preserve category display names from CATEGORY_NAMES', () => {
      const result = buildContentTitle('Test Agent', 'agents');
      expect(result).toContain('AI Agents');

      const result2 = buildContentTitle('Test Server', 'mcp');
      expect(result2).toContain('MCP');
    });

    it('should handle fallback for unknown categories', () => {
      const result = buildContentTitle('Test Item', 'unknown' as any);
      expect(result).toContain('unknown');
      expect(result).toContain(METADATA_DEFAULTS.siteName);
      expect(result.length).toBeGreaterThanOrEqual(55);
      expect(result.length).toBeLessThanOrEqual(60);
    });
  });

  describe('buildPageTitle()', () => {
    it('should build title with single part', () => {
      const result = buildPageTitle('About');
      const expected = `About${METADATA_DEFAULTS.separator}${METADATA_DEFAULTS.siteName}`;
      expect(result).toBe(expected);
    });

    it('should build title with multiple parts', () => {
      const result = buildPageTitle('Account', 'Settings');
      const expected = `Account${METADATA_DEFAULTS.separator}Settings${METADATA_DEFAULTS.separator}${METADATA_DEFAULTS.siteName}`;
      expect(result).toBe(expected);
    });

    it('should filter out empty strings', () => {
      const result = buildPageTitle('About', '', 'Page');
      const expected = `About${METADATA_DEFAULTS.separator}Page${METADATA_DEFAULTS.separator}${METADATA_DEFAULTS.siteName}`;
      expect(result).toBe(expected);
    });

    it('should handle variadic arguments', () => {
      const result = buildPageTitle('Part 1', 'Part 2', 'Part 3');
      expect(result).toContain('Part 1');
      expect(result).toContain('Part 2');
      expect(result).toContain('Part 3');
      expect(result).toContain(METADATA_DEFAULTS.siteName);
    });
  });

  describe('Category Overhead Calculations', () => {
    it('should calculate correct overhead for AI Agents', () => {
      const categoryDisplay = CATEGORY_NAMES.agents;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(35); // " - " (3) + "AI Agents" (9) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(25);
    });

    it('should calculate correct overhead for MCP', () => {
      const categoryDisplay = CATEGORY_NAMES.mcp;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(29); // " - " (3) + "MCP" (3) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(31);
    });

    it('should calculate correct overhead for Rules', () => {
      const categoryDisplay = CATEGORY_NAMES.rules;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(31); // " - " (3) + "Rules" (5) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(29);
    });

    it('should calculate correct overhead for Commands', () => {
      const categoryDisplay = CATEGORY_NAMES.commands;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(34); // " - " (3) + "Commands" (8) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(26);
    });

    it('should calculate correct overhead for Hooks', () => {
      const categoryDisplay = CATEGORY_NAMES.hooks;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(31); // " - " (3) + "Hooks" (5) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(29);
    });

    it('should calculate correct overhead for Statuslines', () => {
      const categoryDisplay = CATEGORY_NAMES.statuslines;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(37); // " - " (3) + "Statuslines" (11) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(23);
    });

    it('should calculate correct overhead for Guides', () => {
      const categoryDisplay = CATEGORY_NAMES.guides;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(32); // " - " (3) + "Guides" (6) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(28);
    });

    it('should calculate correct overhead for Collections', () => {
      const categoryDisplay = CATEGORY_NAMES.collections;
      const overhead =
        METADATA_DEFAULTS.separator.length +
        categoryDisplay.length +
        METADATA_DEFAULTS.separator.length +
        METADATA_DEFAULTS.siteName.length;
      const maxContentLength = 60 - overhead;

      expect(overhead).toBe(37); // " - " (3) + "Collections" (11) + " - " (3) + "Claude Pro Directory" (20)
      expect(maxContentLength).toBe(23);
    });
  });
});
