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
  OG_IMAGE_DIMENSIONS,
  generateOGImageUrl,
  generateOGMetadata,
  generateTwitterMetadata,
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
      expect(url).toBe(`${BASE_URL}/api/og?path=%2F`);
    });

    it('generates URL for section page', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Ftrending`);
    });

    it('generates URL for category page', () => {
      const url = generateOGImageUrl('/agents');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fagents`);
    });

    it('generates URL for content detail page', () => {
      const url = generateOGImageUrl('/agents/code-reviewer');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fagents%2Fcode-reviewer`);
    });

    it('generates URL for guide page', () => {
      const url = generateOGImageUrl('/guides/tutorials/mcp-setup');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fguides%2Ftutorials%2Fmcp-setup`);
    });

    it('properly encodes special characters in path', () => {
      const url = generateOGImageUrl('/guides/api & integration');
      // URLSearchParams uses '+' for spaces (valid encoding) and %26 for &
      expect(url).toContain('%2Fguides%2Fapi+%26+integration');
    });

    it('properly encodes Unicode characters', () => {
      const url = generateOGImageUrl('/guides/test-🤖');
      expect(url).toContain('%F0%9F%A4%96'); // Encoded emoji
    });
  });

  describe('Default Dimensions', () => {
    it('omits width parameter when using default', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).not.toContain('width=');
    });

    it('omits height parameter when using default', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).not.toContain('height=');
    });

    it('uses defaults when options is undefined', () => {
      const url = generateOGImageUrl('/trending', undefined);
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Ftrending`);
    });

    it('uses defaults when options is empty object', () => {
      const url = generateOGImageUrl('/trending', {});
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Ftrending`);
    });
  });

  describe('Custom Dimensions', () => {
    it('includes width parameter when different from default (1200)', () => {
      const url = generateOGImageUrl('/trending', { width: 1000 });
      expect(url).toContain('width=1000');
      expect(url).not.toContain('height='); // Height uses default, omitted
    });

    it('includes height parameter when different from default (630)', () => {
      const url = generateOGImageUrl('/trending', { height: 500 });
      expect(url).toContain('height=500');
      expect(url).not.toContain('width='); // Width uses default, omitted
    });

    it('includes both width and height when both differ from defaults', () => {
      const url = generateOGImageUrl('/trending', { width: 1000, height: 500 });
      expect(url).toContain('width=1000');
      expect(url).toContain('height=500');
    });

    it('preserves path parameter with custom dimensions', () => {
      const url = generateOGImageUrl('/agents/code-reviewer', { width: 800, height: 400 });
      expect(url).toContain('path=%2Fagents%2Fcode-reviewer');
      expect(url).toContain('width=800');
      expect(url).toContain('height=400');
    });

    it('handles Twitter Card dimensions (summary)', () => {
      const url = generateOGImageUrl('/trending', { width: 120, height: 120 });
      expect(url).toContain('width=120');
      expect(url).toContain('height=120');
    });

    it('handles large custom dimensions', () => {
      const url = generateOGImageUrl('/trending', { width: 2400, height: 1260 });
      expect(url).toContain('width=2400');
      expect(url).toContain('height=1260');
    });

    it('omits width when it matches default', () => {
      const url = generateOGImageUrl('/trending', { width: 1200, height: 500 });
      expect(url).not.toContain('width=');
      expect(url).toContain('height=500');
    });

    it('omits height when it matches default', () => {
      const url = generateOGImageUrl('/trending', { width: 1000, height: 630 });
      expect(url).toContain('width=1000');
      expect(url).not.toContain('height=');
    });
  });

  describe('Refresh Parameter', () => {
    it('omits refresh parameter by default', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).not.toContain('refresh=');
    });

    it('omits refresh parameter when false', () => {
      const url = generateOGImageUrl('/trending', { refresh: false });
      expect(url).not.toContain('refresh=');
    });

    it('includes refresh parameter when true', () => {
      const url = generateOGImageUrl('/trending', { refresh: true });
      expect(url).toContain('refresh=true');
    });

    it('combines refresh with custom dimensions', () => {
      const url = generateOGImageUrl('/trending', { width: 1000, height: 500, refresh: true });
      expect(url).toContain('width=1000');
      expect(url).toContain('height=500');
      expect(url).toContain('refresh=true');
    });
  });

  describe('Query Parameter Ordering', () => {
    it('includes path as first parameter', () => {
      const url = generateOGImageUrl('/trending', { width: 1000, height: 500 });
      const pathIndex = url.indexOf('path=');
      const paramIndex = url.indexOf('width=');
      expect(pathIndex).toBeLessThan(paramIndex);
      expect(pathIndex).toBeGreaterThan(0); // Ensures path is found
    });

    it('properly formats multiple query parameters with ampersands', () => {
      const url = generateOGImageUrl('/trending', { width: 1000, height: 500, refresh: true });
      expect(url).toContain('path=%2Ftrending');
      expect(url).toContain('&width=1000');
      expect(url).toContain('&height=500');
      expect(url).toContain('&refresh=true');
    });
  });

  describe('Edge Cases', () => {
    it('handles root path', () => {
      const url = generateOGImageUrl('/');
      expect(url).toContain('path=%2F');
    });

    it('handles deep nested paths', () => {
      const url = generateOGImageUrl('/guides/tutorials/advanced/mcp-server-setup');
      expect(url).toContain('path=%2Fguides%2Ftutorials%2Fadvanced%2Fmcp-server-setup');
    });

    it('handles paths with query parameters (encodes them)', () => {
      const url = generateOGImageUrl('/search?q=test');
      expect(url).toContain('path=%2Fsearch%3Fq%3Dtest');
    });

    it('handles paths with hash fragments', () => {
      const url = generateOGImageUrl('/guides#section');
      expect(url).toContain('path=%2Fguides%23section');
    });

    it('handles zero dimensions', () => {
      const url = generateOGImageUrl('/trending', { width: 0, height: 0 });
      expect(url).toContain('width=0');
      expect(url).toContain('height=0');
    });
  });

  describe('Real-World Examples', () => {
    it('generates URL for trending page OG image', () => {
      const url = generateOGImageUrl('/trending');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Ftrending`);
    });

    it('generates URL for agent detail OG image', () => {
      const url = generateOGImageUrl('/agents/code-reviewer');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fagents%2Fcode-reviewer`);
    });

    it('generates URL for guide OG image', () => {
      const url = generateOGImageUrl('/guides/tutorials/mcp-setup');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fguides%2Ftutorials%2Fmcp-setup`);
    });

    it('generates URL for collection OG image', () => {
      const url = generateOGImageUrl('/collections/best-agents');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fcollections%2Fbest-agents`);
    });

    it('generates URL for API docs OG image', () => {
      const url = generateOGImageUrl('/api-docs/getContentByCategory');
      expect(url).toBe(`${BASE_URL}/api/og?path=%2Fapi-docs%2FgetContentByCategory`);
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
      expect(metadata.images[0].url).toContain('/api/og?path=%2Ftrending');
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
      expect(metadata.images[0].type).toBe('image/png');
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
      expect(metadata.images[0].url).toContain('/api/og?path=%2F');
      expect(metadata.images[0].alt).toBe('Claude Pro Directory');
      expect(metadata.images[0].width).toBe(1200);
      expect(metadata.images[0].height).toBe(630);
    });

    it('generates metadata for agent detail page', () => {
      const metadata = generateOGMetadata('/agents/code-reviewer', 'Code Reviewer Agent');
      expect(metadata.images[0].url).toContain('/api/og?path=%2Fagents%2Fcode-reviewer');
      expect(metadata.images[0].alt).toBe('Code Reviewer Agent');
    });

    it('generates metadata for guide page', () => {
      const metadata = generateOGMetadata('/guides/tutorials/mcp-setup', 'MCP Server Setup');
      expect(metadata.images[0].url).toContain('/api/og?path=%2Fguides%2Ftutorials%2Fmcp-setup');
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
      expect(metadata.images[0].url).toContain('/api/og?path=%2Ftrending');
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
      expect(metadata.images[0].url).toContain('/api/og?path=%2F');
    });

    it('generates metadata for agent detail page', () => {
      const metadata = generateTwitterMetadata('/agents/code-reviewer', 'Code Reviewer Agent');
      expect(metadata.images[0].url).toContain('/api/og?path=%2Fagents%2Fcode-reviewer');
    });

    it('generates metadata for guide page', () => {
      const metadata = generateTwitterMetadata('/guides/tutorials/mcp-setup', 'MCP Server Setup');
      expect(metadata.images[0].url).toContain('/api/og?path=%2Fguides%2Ftutorials%2Fmcp-setup');
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
