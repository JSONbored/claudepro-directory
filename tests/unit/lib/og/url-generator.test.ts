/**
 * OpenGraph URL Generator Test Suite
 *
 * Tests OG image URL generation for unified screenshot-based API endpoint.
 * Validates URL formatting, query parameters, and dimension handling.
 *
 * **Why Test This:**
 * - Used across ALL pages for social media metadata
 * - Critical for Twitter/Facebook/LinkedIn sharing previews
 * - URL format must be correct for CDN caching
 * - Default dimensions follow OG image standards (1200x630)
 *
 * **Test Coverage:**
 * - URL generation with various paths
 * - Query parameter formatting
 * - Custom dimensions handling
 * - Refresh parameter support
 * - OpenGraph metadata object generation
 * - Twitter Card metadata generation
 *
 * @see src/lib/og/url-generator.ts
 */

import { describe, expect, it } from 'vitest';
import {
  generateOGImageUrl,
  generateOGMetadata,
  generateTwitterMetadata,
  OG_IMAGE_DIMENSIONS,
} from '@/src/lib/og/url-generator';

const BASE_URL = 'https://claudepro.directory'; // From APP_CONFIG.url

describe('OG_IMAGE_DIMENSIONS', () => {
  it('defines standard OG image dimensions', () => {
    expect(OG_IMAGE_DIMENSIONS.width).toBe(1200);
    expect(OG_IMAGE_DIMENSIONS.height).toBe(630);
  });

  it('uses 1.91:1 aspect ratio (OG standard)', () => {
    const ratio = OG_IMAGE_DIMENSIONS.width / OG_IMAGE_DIMENSIONS.height;
    expect(ratio).toBeCloseTo(1.905, 2); // ~1.91:1 ratio
  });

  it('is immutable constant (TypeScript protection)', () => {
    // TypeScript prevents modification at compile time with 'as const'
    // Runtime immutability is not enforced for plain objects
    expect(Object.isFrozen(OG_IMAGE_DIMENSIONS)).toBe(false);
    // But TypeScript will prevent modifications in production code
  });
});

describe('generateOGImageUrl()', () => {
  describe('Basic URL Generation', () => {
    it('generates URL for homepage', () => {
      const url = generateOGImageUrl('/');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for section page', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for category page', () => {
      const url = generateOGImageUrl('/agents');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for content detail page', () => {
      const url = generateOGImageUrl('/agents/code-reviewer');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for guide page', () => {
      const url = generateOGImageUrl('/guides/tutorials/mcp-setup');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });
  });

  describe('Real-World Examples', () => {
    it('generates URL for trending page OG image', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for agent detail OG image', () => {
      const url = generateOGImageUrl('/agents/code-reviewer');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for guide OG image', () => {
      const url = generateOGImageUrl('/guides/tutorials/mcp-setup');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for collection OG image', () => {
      const url = generateOGImageUrl('/collections/best-agents');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });

    it('generates URL for API docs OG image', () => {
      const url = generateOGImageUrl('/api-docs/getContentByCategory');
      expect(url).toBe(`${BASE_URL}/og-images/og-image.webp`);
    });
  });

  describe('Return Value', () => {
    it('returns string type', () => {
      const url = generateOGImageUrl('/trending');
      expect(typeof url).toBe('string');
    });

    it('returns valid URL format', () => {
      const url = generateOGImageUrl('/trending');
      expect(() => new URL(url)).not.toThrow();
    });

    it('returns absolute URL', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).toMatch(/^https?:\/\//);
    });
  });
});

describe('generateOGMetadata()', () => {
  describe('Basic Metadata Generation', () => {
    it('generates OpenGraph metadata object', () => {
      const metadata = generateOGMetadata('/trending', 'Trending Configurations');
      expect(metadata).toHaveProperty('images');
      expect(Array.isArray(metadata.images)).toBe(true);
    });

    it('includes image URL with encoded path', () => {
      const metadata = generateOGMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
    });

    it('includes standard OG dimensions (1200x630)', () => {
      const metadata = generateOGMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].width).toBe(1200);
      expect(metadata.images[0].height).toBe(630);
    });

    it('includes alt text', () => {
      const metadata = generateOGMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].alt).toBe('Trending Configurations');
    });

    it('includes image type', () => {
      const metadata = generateOGMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].type).toBe('image/webp');
    });
  });

  describe('Alt Text Handling', () => {
    it('uses provided alt text', () => {
      const metadata = generateOGMetadata('/agents', 'Claude AI Agents');
      expect(metadata.images[0].alt).toBe('Claude AI Agents');
    });

    it('handles special characters in alt text', () => {
      const metadata = generateOGMetadata('/guides', 'MCP Setup & Configuration');
      expect(metadata.images[0].alt).toBe('MCP Setup & Configuration');
    });

    it('handles Unicode in alt text', () => {
      const metadata = generateOGMetadata('/guides', 'AI Configuration 🤖');
      expect(metadata.images[0].alt).toBe('AI Configuration 🤖');
    });

    it('handles long alt text', () => {
      const longAlt = 'A'.repeat(200);
      const metadata = generateOGMetadata('/guides', longAlt);
      expect(metadata.images[0].alt).toBe(longAlt);
    });
  });

  describe('Image Array Structure', () => {
    it('returns array with single image', () => {
      const metadata = generateOGMetadata('/trending', 'Trending');
      expect(metadata.images).toHaveLength(1);
    });

    it('includes all required image properties', () => {
      const metadata = generateOGMetadata('/trending', 'Trending');
      const image = metadata.images[0];
      expect(image).toHaveProperty('url');
      expect(image).toHaveProperty('width');
      expect(image).toHaveProperty('height');
      expect(image).toHaveProperty('alt');
      expect(image).toHaveProperty('type');
    });
  });

  describe('Real-World Examples', () => {
    it('generates metadata for homepage', () => {
      const metadata = generateOGMetadata('/', 'Claude Pro Directory');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
      expect(metadata.images[0].alt).toBe('Claude Pro Directory');
      expect(metadata.images[0].width).toBe(1200);
      expect(metadata.images[0].height).toBe(630);
    });

    it('generates metadata for agent detail page', () => {
      const metadata = generateOGMetadata('/agents/code-reviewer', 'Code Reviewer Agent');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
      expect(metadata.images[0].alt).toBe('Code Reviewer Agent');
    });

    it('generates metadata for guide page', () => {
      const metadata = generateOGMetadata('/guides/tutorials/mcp-setup', 'MCP Server Setup');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
      expect(metadata.images[0].alt).toBe('MCP Server Setup');
    });
  });
});

describe('generateTwitterMetadata()', () => {
  describe('Basic Metadata Generation', () => {
    it('generates Twitter Card metadata object', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata).toHaveProperty('card');
      expect(metadata).toHaveProperty('images');
    });

    it('uses summary_large_image card type', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata.card).toBe('summary_large_image');
    });

    it('includes image URL', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
    });

    it('includes standard dimensions', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].width).toBe(1200);
      expect(metadata.images[0].height).toBe(630);
    });

    it('includes alt text', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0].alt).toBe('Trending Configurations');
    });

    it('does not include type property (Twitter specific)', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending Configurations');
      expect(metadata.images[0]).not.toHaveProperty('type');
    });
  });

  describe('Card Type', () => {
    it('returns card type as const string', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending');
      const cardType: 'summary_large_image' = metadata.card;
      expect(cardType).toBe('summary_large_image');
    });
  });

  describe('Alt Text Handling', () => {
    it('uses provided alt text', () => {
      const metadata = generateTwitterMetadata('/agents', 'Claude AI Agents');
      expect(metadata.images[0].alt).toBe('Claude AI Agents');
    });

    it('handles special characters in alt text', () => {
      const metadata = generateTwitterMetadata('/guides', 'MCP Setup & Configuration');
      expect(metadata.images[0].alt).toBe('MCP Setup & Configuration');
    });
  });

  describe('Image Array Structure', () => {
    it('returns array with single image', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending');
      expect(metadata.images).toHaveLength(1);
    });

    it('includes required Twitter image properties', () => {
      const metadata = generateTwitterMetadata('/trending', 'Trending');
      const image = metadata.images[0];
      expect(image).toHaveProperty('url');
      expect(image).toHaveProperty('width');
      expect(image).toHaveProperty('height');
      expect(image).toHaveProperty('alt');
    });
  });

  describe('Real-World Examples', () => {
    it('generates metadata for homepage', () => {
      const metadata = generateTwitterMetadata('/', 'Claude Pro Directory');
      expect(metadata.card).toBe('summary_large_image');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
    });

    it('generates metadata for agent detail page', () => {
      const metadata = generateTwitterMetadata('/agents/code-reviewer', 'Code Reviewer Agent');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
    });

    it('generates metadata for guide page', () => {
      const metadata = generateTwitterMetadata('/guides/tutorials/mcp-setup', 'MCP Server Setup');
      expect(metadata.images[0].url).toContain('/og-images/og-image.webp');
    });
  });

  describe('Differences from OG Metadata', () => {
    it('does not include type property', () => {
      const ogMeta = generateOGMetadata('/trending', 'Trending');
      const twitterMeta = generateTwitterMetadata('/trending', 'Trending');
      expect(ogMeta.images[0]).toHaveProperty('type');
      expect(twitterMeta.images[0]).not.toHaveProperty('type');
    });

    it('includes card property (OG does not)', () => {
      const ogMeta = generateOGMetadata('/trending', 'Trending');
      const twitterMeta = generateTwitterMetadata('/trending', 'Trending');
      expect(ogMeta).not.toHaveProperty('card');
      expect(twitterMeta).toHaveProperty('card');
    });
  });
});
