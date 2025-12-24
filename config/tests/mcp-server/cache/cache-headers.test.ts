/**
 * Tests for Cache Headers
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateCacheControl,
  generateCacheHeaders,
  isNotModified,
  createNotModifiedResponse,
  type CacheHeaderConfig,
} from '@heyclaude/mcp-server/cache/cache-headers';

describe('Cache Headers', () => {
  describe('generateCacheControl', () => {
    it('should generate default cache control header', () => {
      const header = generateCacheControl();
      expect(header).toContain('public');
      expect(header).toContain('max-age=3600');
      expect(header).toContain('stale-while-revalidate=86400');
      expect(header).toContain('must-revalidate');
    });

    it('should generate private cache control', () => {
      const config: CacheHeaderConfig = { public: false };
      const header = generateCacheControl(config);
      expect(header).toContain('private');
      expect(header).not.toContain('public');
    });

    it('should generate custom max-age', () => {
      const config: CacheHeaderConfig = { maxAge: 7200 };
      const header = generateCacheControl(config);
      expect(header).toContain('max-age=7200');
    });

    it('should generate custom stale-while-revalidate', () => {
      const config: CacheHeaderConfig = { staleWhileRevalidate: 43200 };
      const header = generateCacheControl(config);
      expect(header).toContain('stale-while-revalidate=43200');
    });

    it('should omit stale-while-revalidate when 0', () => {
      const config: CacheHeaderConfig = { staleWhileRevalidate: 0 };
      const header = generateCacheControl(config);
      expect(header).not.toContain('stale-while-revalidate');
    });

    it('should omit must-revalidate when false', () => {
      const config: CacheHeaderConfig = { mustRevalidate: false };
      const header = generateCacheControl(config);
      expect(header).not.toContain('must-revalidate');
    });
  });

  describe('generateCacheHeaders', () => {
    it('should generate cache headers with ETag and Last-Modified', () => {
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';
      const headers = generateCacheHeaders(etag, cachedAt);

      expect(headers['Cache-Control']).toBeDefined();
      expect(headers['ETag']).toBe(etag);
      expect(headers['Last-Modified']).toBeDefined();
    });
  });

  describe('isNotModified', () => {
    it('should return true when If-None-Match matches ETag', () => {
      const headers = new Headers();
      headers.set('if-none-match', '"abc123"');
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';

      expect(isNotModified(headers, etag, cachedAt)).toBe(true);
    });

    it('should return false when If-None-Match does not match', () => {
      const headers = new Headers();
      headers.set('if-none-match', '"different"');
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';

      expect(isNotModified(headers, etag, cachedAt)).toBe(false);
    });

    it('should return true when If-Modified-Since is after cachedAt', () => {
      const headers = new Headers();
      headers.set('if-modified-since', 'Wed, 01 Jan 2025 00:00:00 GMT');
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';

      expect(isNotModified(headers, etag, cachedAt)).toBe(true);
    });

    it('should return false when If-Modified-Since is before cachedAt', () => {
      const headers = new Headers();
      headers.set('if-modified-since', 'Wed, 01 Jan 2023 00:00:00 GMT');
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';

      expect(isNotModified(headers, etag, cachedAt)).toBe(false);
    });
  });

  describe('createNotModifiedResponse', () => {
    it('should create 304 response with cache headers', () => {
      const etag = '"abc123"';
      const cachedAt = '2024-01-01T00:00:00.000Z';
      const response = createNotModifiedResponse(etag, cachedAt);

      expect(response.status).toBe(304);
      expect(response.headers.get('ETag')).toBe(etag);
      expect(response.headers.get('Cache-Control')).toBeDefined();
    });
  });
});

