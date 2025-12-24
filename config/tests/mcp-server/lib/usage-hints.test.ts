/**
 * Tests for Usage Hints
 */

import { describe, it, expect } from '@jest/globals';
import {
  getContentUsageHints,
  getSearchUsageHints,
  getCategoryUsageHints,
} from '@heyclaude/mcp-server/lib/usage-hints';

describe('Usage Hints', () => {
  describe('getContentUsageHints', () => {
    it('should return content usage hints', () => {
      const hints = getContentUsageHints('agents', 'test-slug');

      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('downloadContentForPlatform');
      expect(hints[1]).toContain('getRelatedContent');
      expect(hints[1]).toContain('agents');
      expect(hints[1]).toContain('test-slug');
      expect(hints[2]).toContain('getContentByTag');
      expect(hints[3]).toContain('searchContent');
      expect(hints[3]).toContain('agents');
    });
  });

  describe('getSearchUsageHints', () => {
    it('should return hints for empty search results', () => {
      const hints = getSearchUsageHints(false);

      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('broadening');
      expect(hints[1]).toContain('getSearchSuggestions');
      expect(hints[2]).toContain('getSearchFacets');
      expect(hints[3]).toContain('category filter');
    });

    it('should return hints for empty search with category', () => {
      const hints = getSearchUsageHints(false, 'agents');

      expect(hints).toHaveLength(4);
      expect(hints[3]).toContain('without the category filter');
    });

    it('should return hints for successful search results', () => {
      const hints = getSearchUsageHints(true);

      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('getContentDetail');
      expect(hints[1]).toContain('downloadContentForPlatform');
      expect(hints[2]).toContain('getRelatedContent');
      expect(hints[3]).toContain('getContentByTag');
    });
  });

  describe('getCategoryUsageHints', () => {
    it('should return category usage hints', () => {
      const hints = getCategoryUsageHints();

      expect(hints).toHaveLength(4);
      expect(hints[0]).toContain('searchContent');
      expect(hints[1]).toContain('getTrending');
      expect(hints[2]).toContain('getRecent');
      expect(hints[3]).toContain('getCategoryConfigs');
    });
  });
});

