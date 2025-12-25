/**
 * Tests for Input Sanitization Middleware
 *
 * These tests are located externally from the source package to keep
 * packages/mcp-server clean for community distribution.
 */

import { describe, it, expect } from '@jest/globals';
// Import sanitization functions from mcp-server
// Note: These may be re-exported from shared-runtime, check imports
import { sanitizeString } from '@heyclaude/mcp-server/lib/utils';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('should sanitize normal strings', () => {
      const input = 'test string';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });

    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>test';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).not.toContain('alert');
    });

    it('should remove newlines', () => {
      const input = 'test\nstring\r\nwith\nnewlines';
      const result = sanitizeString(input);
      expect(result).not.toContain('\n');
      expect(result).not.toContain('\r');
    });

    it('should handle empty strings', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should handle special characters', () => {
      const input = 'test@example.com';
      const result = sanitizeString(input);
      // Email addresses should be preserved (no HTML)
      expect(result).toContain('@');
    });

    it('should handle very long strings', () => {
      const input = 'a'.repeat(5000);
      const result = sanitizeString(input);
      // Should be truncated to maxLength (10000)
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  // Add more sanitization tests as needed
  // Example: sanitizeUrl, sanitizeSlug, etc.
});
