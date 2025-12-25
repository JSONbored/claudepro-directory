/**
 * Tests for MCP Server utility functions
 *
 * These tests are located externally from the source package to keep
 * packages/mcp-server clean for community distribution.
 */

import { describe, it, expect } from '@jest/globals';
// Use relative path from test directory to source file
// This avoids workspace package resolution issues in Vitest
import { sanitizeString, isValidSlug, isValidUrl } from '@heyclaude/mcp-server/lib/utils';

describe('MCP Server Utils', () => {
  describe('sanitizeString', () => {
    it('should sanitize string input', () => {
      const input = 'test string';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });

    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>test';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should remove newlines', () => {
      const input = 'test\nstring';
      const result = sanitizeString(input);
      expect(result).not.toContain('\n');
    });
  });

  describe('isValidSlug', () => {
    it('should validate valid slugs', () => {
      expect(isValidSlug('valid-slug')).toBe(true);
      expect(isValidSlug('valid-slug-123')).toBe(true);
      expect(isValidSlug('a')).toBe(true);
    });

    it('should reject invalid slugs', () => {
      expect(isValidSlug('Invalid Slug')).toBe(false); // Spaces not allowed
      // Note: underscores ARE allowed by isValidSlug (from discord/sanitization.ts)
      // This differs from validateSlug which only allows hyphens
      expect(isValidSlug('invalid.slug')).toBe(false); // Dots not allowed
      expect(isValidSlug('')).toBe(false); // Empty not allowed
    });
  });

  describe('isValidUrl', () => {
    it('should validate valid URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:3000/path?query=value')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });
});
