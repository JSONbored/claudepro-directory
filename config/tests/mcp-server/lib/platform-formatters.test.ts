/**
 * Tests for Platform Formatters
 */

import { describe, it, expect } from 'vitest';
import {
  formatForClaudeCode,
  formatForCursor,
  formatForCodex,
  formatGeneric,
  getPlatformFilename,
  getTargetDirectory,
  getInstallationInstructions,
  type ContentItem,
} from '../../../../packages/mcp-server/src/lib/platform-formatters.js';

// Helper to create a test content item
function createTestContentItem(overrides?: Partial<ContentItem>): ContentItem {
  return {
    slug: 'test-slug',
    title: 'Test Title',
    displayTitle: 'Test Display Title',
    category: 'agents',
    description: 'Test description',
    content: 'Test content body',
    tags: ['ai', 'automation'],
    author: 'test-author',
    authorProfileUrl: 'https://example.com/test-author',
    dateAdded: new Date('2024-01-15'),
    dateUpdated: new Date('2024-01-16'),
    createdAt: new Date('2024-01-14'),
    metadata: {},
    stats: {
      views: 100,
      bookmarks: 10,
      copies: 5,
    },
    ...overrides,
  };
}

describe('Platform Formatters', () => {
  describe('formatForClaudeCode', () => {
    it('should format basic content', () => {
      const item = createTestContentItem();
      const result = formatForClaudeCode(item);

      expect(result).toContain('# Test Title');
      expect(result).toContain('Test description');
      expect(result).toContain('Test content body');
      expect(result).toContain('**Source:** test-author');
    });

    it('should include features section when present', () => {
      const item = createTestContentItem({
        metadata: {
          features: ['Feature 1', 'Feature 2'],
        },
      });
      const result = formatForClaudeCode(item);

      expect(result).toContain('## Features');
      expect(result).toContain('Feature 1');
      expect(result).toContain('Feature 2');
    });

    it('should include examples section when present', () => {
      const item = createTestContentItem({
        metadata: {
          examples: [
            {
              title: 'Example 1',
              description: 'Example description',
              code: 'console.log("hello")',
              language: 'javascript',
            },
          ],
        },
      });
      const result = formatForClaudeCode(item);

      expect(result).toContain('## Examples');
      expect(result).toContain('### Example 1');
      expect(result).toContain('Example description');
      expect(result).toContain('```javascript');
      expect(result).toContain('console.log("hello")');
    });

    it('should include troubleshooting section', () => {
      const item = createTestContentItem({
        metadata: {
          troubleshooting: [
            {
              issue: 'Common Issue',
              solution: 'Common Solution',
            },
          ],
        },
      });
      const result = formatForClaudeCode(item);

      expect(result).toContain('## Troubleshooting');
      expect(result).toContain('### Common Issue');
      expect(result).toContain('Common Solution');
    });
  });

  describe('formatForCursor', () => {
    it('should format content for Cursor', () => {
      const item = createTestContentItem();
      const result = formatForCursor(item);

      expect(result).toContain('# Test Title');
      expect(result).toContain('**Category:** agents');
    });

    it('should use typescript as default code language', () => {
      const item = createTestContentItem({
        metadata: {
          examples: [
            {
              code: 'const x = 1;',
            },
          ],
        },
      });
      const result = formatForCursor(item);

      expect(result).toContain('```typescript');
    });
  });

  describe('formatForCodex', () => {
    it('should format content for Codex', () => {
      const item = createTestContentItem();
      const result = formatForCodex(item);

      expect(result).toContain('# Test Title');
      expect(result).toContain('**Category:** agents');
    });
  });

  describe('formatGeneric', () => {
    it('should format generic markdown', () => {
      const item = createTestContentItem();
      const result = formatGeneric(item);

      expect(result).toContain('# Test Title');
      expect(result).toContain('Test description');
      expect(result).toContain('Test content body');
    });
  });

  describe('getPlatformFilename', () => {
    it('should return correct filename for claude-code', () => {
      expect(getPlatformFilename('claude-code')).toBe('CLAUDE.md');
    });

    it('should return correct filename for cursor', () => {
      expect(getPlatformFilename('cursor')).toBe('cursor-rules.mdc');
    });

    it('should return correct filename for chatgpt-codex', () => {
      expect(getPlatformFilename('chatgpt-codex')).toBe('AGENTS.md');
    });

    it('should return default filename for unknown platform', () => {
      expect(getPlatformFilename('unknown')).toBe('content.md');
    });
  });

  describe('getTargetDirectory', () => {
    it('should return correct directory for claude-code', () => {
      expect(getTargetDirectory('claude-code')).toBe('.claude');
    });

    it('should return correct directory for cursor', () => {
      expect(getTargetDirectory('cursor')).toBe('.cursor/rules');
    });

    it('should return correct directory for chatgpt-codex', () => {
      expect(getTargetDirectory('chatgpt-codex')).toBe('.');
    });

    it('should return default directory for unknown platform', () => {
      expect(getTargetDirectory('unknown')).toBe('.');
    });
  });

  describe('getInstallationInstructions', () => {
    it('should generate instructions for claude-code', () => {
      const instructions = getInstallationInstructions('claude-code', 'CLAUDE.md', '.claude');

      expect(instructions).toContain('Installation Instructions');
      expect(instructions).toContain('.claude');
      expect(instructions).toContain('CLAUDE.md');
    });

    it('should generate instructions for cursor', () => {
      const instructions = getInstallationInstructions('cursor', 'cursor-rules.mdc', '.cursor/rules');

      expect(instructions).toContain('Installation Instructions');
      expect(instructions).toContain('.cursor/rules');
      expect(instructions).toContain('cursor-rules.mdc');
    });

    it('should generate instructions for chatgpt-codex', () => {
      const instructions = getInstallationInstructions('chatgpt-codex', 'AGENTS.md', '.');

      expect(instructions).toContain('Installation Instructions');
      expect(instructions).toContain('AGENTS.md');
    });
  });
});

