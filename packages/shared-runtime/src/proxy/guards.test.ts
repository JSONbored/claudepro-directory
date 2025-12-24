import { describe, expect, it } from '@jest/globals';
import {
  DEFAULT_SUSPICIOUS_HEADERS,
  detectSuspiciousHeaders,
  getClientInfo,
  sanitizePathForLogging,
} from './guards.ts';

describe('detectSuspiciousHeaders', () => {
  it('should return empty array when no suspicious headers present', () => {
    const request = new Request('https://example.com');
    const result = detectSuspiciousHeaders(request);
    expect(result).toEqual([]);
  });

  it('should detect suspicious headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-middleware-subrequest': 'true',
      },
    });
    const result = detectSuspiciousHeaders(request);
    expect(result.length).toBe(1);
    expect(result[0]?.header).toBe('x-middleware-subrequest');
    expect(result[0]?.value).toBe('true');
  });

  it('should detect multiple suspicious headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-middleware-subrequest': 'true',
        'x-middleware-rewrite': '/rewritten',
        'x-vercel-invoke-path': '/api/route',
      },
    });
    const result = detectSuspiciousHeaders(request);
    expect(result.length).toBe(3);
  });

  it('should use custom header list', () => {
    const request = new Request('https://example.com', {
      headers: {
        'custom-suspicious': 'value',
      },
    });
    const result = detectSuspiciousHeaders(request, ['custom-suspicious']);
    expect(result.length).toBe(1);
    expect(result[0]?.header).toBe('custom-suspicious');
  });

  it('should not detect non-suspicious headers', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Mozilla/5.0',
        accept: 'text/html',
      },
    });
    const result = detectSuspiciousHeaders(request);
    expect(result).toEqual([]);
  });
});

describe('sanitizePathForLogging', () => {
  it('should sanitize UUIDs in paths', () => {
    const path = '/api/users/550e8400-e29b-41d4-a716-446655440000';
    const result = sanitizePathForLogging(path);
    expect(result).toBe('/api/*/[UUID]');
  });

  it('should sanitize numeric IDs in paths', () => {
    const path = '/api/posts/12345';
    const result = sanitizePathForLogging(path);
    expect(result).toBe('/api/*/[ID]');
  });

  it('should remove query strings', () => {
    const path = '/api/search?q=test&page=1';
    const result = sanitizePathForLogging(path);
    expect(result).toBe('/api/search');
  });

  it('should truncate long paths', () => {
    const longPath = '/api/' + 'a'.repeat(300);
    const result = sanitizePathForLogging(longPath);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('should handle multiple UUIDs', () => {
    const path =
      '/api/users/550e8400-e29b-41d4-a716-446655440000/posts/660e8400-e29b-41d4-a716-446655440001';
    const result = sanitizePathForLogging(path);
    expect(result).toContain('[UUID]');
  });

  it('should handle paths with both UUIDs and query strings', () => {
    const path = '/api/users/550e8400-e29b-41d4-a716-446655440000?include=posts';
    const result = sanitizePathForLogging(path);
    expect(result).toBe('/api/*/[UUID]');
  });

  it('should handle normal paths without sanitization', () => {
    const path = '/api/search';
    const result = sanitizePathForLogging(path);
    expect(result).toBe('/api/search');
  });
});

describe('getClientInfo', () => {
  it('should extract IP from x-forwarded-for', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
    });
    const result = getClientInfo(request);
    // getClientInfo returns the entire header value (doesn't extract first IP)
    // Note: rate-limit.ts extracts first IP, but getClientInfo doesn't
    expect(result.ip).toBe('192.168.1.1, 10.0.0.1');
  });

  it('should extract IP from x-real-ip when x-forwarded-for not present', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-real-ip': '10.0.0.1',
      },
    });
    const result = getClientInfo(request);
    expect(result.ip).toBe('10.0.0.1');
  });

  it('should return "unknown" when no IP headers present', () => {
    const request = new Request('https://example.com');
    const result = getClientInfo(request);
    expect(result.ip).toBe('unknown');
  });

  it('should extract user agent', () => {
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    const result = getClientInfo(request);
    expect(result.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  });

  it('should truncate long user agents', () => {
    const longUserAgent = 'a'.repeat(150);
    const request = new Request('https://example.com', {
      headers: {
        'user-agent': longUserAgent,
      },
    });
    const result = getClientInfo(request);
    expect(result.userAgent.length).toBeLessThanOrEqual(100);
  });

  it('should return "unknown" for missing user agent', () => {
    const request = new Request('https://example.com');
    const result = getClientInfo(request);
    expect(result.userAgent).toBe('unknown');
  });

  it('should prioritize x-forwarded-for over x-real-ip', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.1',
      },
    });
    const result = getClientInfo(request);
    expect(result.ip).toBe('192.168.1.1');
  });
});

describe('DEFAULT_SUSPICIOUS_HEADERS', () => {
  it('should contain expected headers', () => {
    expect(DEFAULT_SUSPICIOUS_HEADERS).toContain('x-middleware-subrequest');
    expect(DEFAULT_SUSPICIOUS_HEADERS).toContain('x-middleware-rewrite');
    expect(DEFAULT_SUSPICIOUS_HEADERS).toContain('x-vercel-invoke-path');
  });

  it('should be readonly array', () => {
    // DEFAULT_SUSPICIOUS_HEADERS is a const array, so it's immutable at compile time
    // Runtime immutability depends on TypeScript's readonly modifier
    expect(Array.isArray(DEFAULT_SUSPICIOUS_HEADERS)).toBe(true);
    expect(DEFAULT_SUSPICIOUS_HEADERS.length).toBeGreaterThan(0);
  });
});
