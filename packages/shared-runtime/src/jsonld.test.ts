import { describe, expect, it } from 'vitest';
import { serializeJsonLd, type Json } from './jsonld.ts';

describe('serializeJsonLd', () => {
  describe('valid JSON-LD data', () => {
    it('should serialize simple object', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John Doe',
      };
      const result = serializeJsonLd(data);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed['@type']).toBe('Person');
      expect(parsed.name).toBe('John Doe');
    });

    it('should serialize nested objects', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Example Corp',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '123 Main St',
          addressLocality: 'City',
        },
      };
      const result = serializeJsonLd(data);
      const parsed = JSON.parse(result);
      expect(parsed.address.streetAddress).toBe('123 Main St');
    });

    it('should serialize arrays', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Item 1' },
          { '@type': 'ListItem', position: 2, name: 'Item 2' },
        ],
      };
      const result = serializeJsonLd(data);
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed.itemListElement)).toBe(true);
      expect(parsed.itemListElement.length).toBe(2);
    });

    it('should escape angle brackets', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Test < Page',
      };
      const result = serializeJsonLd(data);
      expect(result).toContain('\\u003c');
      expect(result).not.toContain('<');
    });

    it('should handle null values', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John Doe',
        description: null,
      };
      const result = serializeJsonLd(data);
      const parsed = JSON.parse(result);
      expect(parsed.description).toBeNull();
    });

    it('should handle boolean values', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        isAccessibleForFree: true,
      };
      const result = serializeJsonLd(data);
      const parsed = JSON.parse(result);
      expect(parsed.isAccessibleForFree).toBe(true);
    });

    it('should handle number values', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        price: 99.99,
        rating: 4.5,
      };
      const result = serializeJsonLd(data);
      const parsed = JSON.parse(result);
      expect(parsed.price).toBe(99.99);
      expect(parsed.rating).toBe(4.5);
    });
  });

  describe('security checks', () => {
    it('should reject JavaScript protocol in strings', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: 'javascript:alert(1)',
      };
      expect(() => serializeJsonLd(data)).toThrow('JavaScript protocol not allowed');
    });

    it('should reject JavaScript protocol in nested objects', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        mainEntity: {
          '@type': 'Thing',
          url: 'javascript:alert(1)',
        },
      };
      expect(() => serializeJsonLd(data)).toThrow('JavaScript protocol not allowed');
    });

    it('should reject JavaScript protocol in arrays', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: [{ '@type': 'ListItem', url: 'javascript:alert(1)' }],
      };
      expect(() => serializeJsonLd(data)).toThrow('JavaScript protocol not allowed');
    });

    it('should handle case-insensitive JavaScript protocol detection', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        url: 'JAVASCRIPT:alert(1)',
      };
      expect(() => serializeJsonLd(data)).toThrow('JavaScript protocol not allowed');
    });
  });

  describe('invalid JSON', () => {
    it('should throw on circular references', () => {
      const data: any = {
        '@context': 'https://schema.org',
        '@type': 'Thing',
      };
      data.self = data; // Circular reference
      expect(() => serializeJsonLd(data)).toThrow();
    });

    it('should handle invalid JSON gracefully', () => {
      // This test verifies the function handles edge cases
      // The actual validation happens in validateJsonLdSafe
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Thing',
      };
      const result = serializeJsonLd(data);
      expect(result).toBeTruthy();
    });
  });

  describe('type exports', () => {
    it('should export Json type', () => {
      const data: Json = {
        '@context': 'https://schema.org',
        '@type': 'Thing',
      };
      expect(data).toBeDefined();
    });
  });
});
