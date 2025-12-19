import { describe, expect, it } from 'vitest';
import { buildSecurityHeaders } from './security-headers.ts';

describe('buildSecurityHeaders', () => {
  describe('default headers', () => {
    it('should return default security headers', () => {
      const headers = buildSecurityHeaders();
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['Permissions-Policy']).toBe('geolocation=(), microphone=(), camera=()');
    });

    it('should return all default headers', () => {
      const headers = buildSecurityHeaders();
      const headerKeys = Object.keys(headers);
      expect(headerKeys.length).toBe(5);
      expect(headerKeys).toContain('X-Frame-Options');
      expect(headerKeys).toContain('X-Content-Type-Options');
      expect(headerKeys).toContain('X-XSS-Protection');
      expect(headerKeys).toContain('Referrer-Policy');
      expect(headerKeys).toContain('Permissions-Policy');
    });
  });

  describe('custom options', () => {
    it('should allow SAMEORIGIN for X-Frame-Options', () => {
      const headers = buildSecurityHeaders({ frameOptions: 'SAMEORIGIN' });
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });

    it('should disable X-Content-Type-Options', () => {
      const headers = buildSecurityHeaders({ contentTypeOptions: false });
      expect(headers['X-Content-Type-Options']).toBeUndefined();
    });

    it('should disable X-XSS-Protection', () => {
      const headers = buildSecurityHeaders({ xssProtection: false });
      expect(headers['X-XSS-Protection']).toBeUndefined();
    });

    it('should allow custom Referrer-Policy', () => {
      const headers = buildSecurityHeaders({ referrerPolicy: 'no-referrer' });
      expect(headers['Referrer-Policy']).toBe('no-referrer');
    });

    it('should allow custom Permissions-Policy', () => {
      const customPolicy = 'geolocation=(self), microphone=()';
      const headers = buildSecurityHeaders({ permissionsPolicy: customPolicy });
      expect(headers['Permissions-Policy']).toBe(customPolicy);
    });

    it('should allow custom Permissions-Policy', () => {
      const customPolicy = 'geolocation=(self)';
      const headers = buildSecurityHeaders({ permissionsPolicy: customPolicy });
      expect(headers['Permissions-Policy']).toBe(customPolicy);
    });

    it('should not set Permissions-Policy for empty string', () => {
      const headers = buildSecurityHeaders({ permissionsPolicy: '' });
      // Empty string is falsy, so header is not set (undefined)
      expect(headers['Permissions-Policy']).toBeUndefined();
    });
  });

  describe('all referrer policy options', () => {
    const policies = [
      'no-referrer',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ] as const;

    it.each(policies)('should accept %s referrer policy', (policy) => {
      const headers = buildSecurityHeaders({ referrerPolicy: policy });
      expect(headers['Referrer-Policy']).toBe(policy);
    });
  });

  describe('edge cases', () => {
    it('should handle empty options object', () => {
      const headers = buildSecurityHeaders({});
      expect(headers).toBeDefined();
      expect(Object.keys(headers).length).toBeGreaterThan(0);
    });

    it('should merge options with defaults', () => {
      const headers = buildSecurityHeaders({
        frameOptions: 'SAMEORIGIN',
        referrerPolicy: 'no-referrer',
      });
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headers['Referrer-Policy']).toBe('no-referrer');
      // Other defaults should still be present
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should return plain object (not class instance)', () => {
      const headers = buildSecurityHeaders();
      expect(headers.constructor).toBe(Object);
      expect(headers.toString()).toBe('[object Object]');
    });
  });
});
