import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { buildReadmeMarkdown } from './readme-builder.ts';
import type { Database } from '@heyclaude/database-types';

type ReadmeData = Database['public']['Functions']['generate_readme_data']['Returns'];

describe('buildReadmeMarkdown', () => {
  const originalEnv = process.env['NEXT_PUBLIC_SITE_URL'];

  beforeEach(() => {
    // Reset to default for each test
    delete process.env['NEXT_PUBLIC_SITE_URL'];
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env['NEXT_PUBLIC_SITE_URL'] = originalEnv;
    } else {
      delete process.env['NEXT_PUBLIC_SITE_URL'];
    }
  });

  describe('happy path', () => {
    it('should generate valid markdown with complete data', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'MCP Server',
            description: 'Model Context Protocol servers',
            icon_name: 'Server',
            url_slug: 'mcp-servers',
            items: [
              {
                slug: 'filesystem',
                title: 'Filesystem MCP',
                description: 'Access local files',
              },
              {
                slug: 'database',
                title: 'Database MCP',
                description: 'Query databases',
              },
            ],
          },
        ],
        total_count: 2,
      };

      const result = buildReadmeMarkdown(data);

      // Check structure
      expect(result).toContain('# Claude Pro Directory');
      expect(result).toContain('2+ expert rules');
      expect(result).toContain('## ⚙️ MCP Servers (2)');
      expect(result).toContain('Model Context Protocol servers');
      expect(result).toContain('**[Filesystem MCP](https://claudepro.directory/mcp-servers/filesystem)** - Access local files');
      expect(result).toContain('**[Database MCP](https://claudepro.directory/mcp-servers/database)** - Query databases');
      expect(result).toContain('## 📈 Activity');
    });

    it('should use custom SITE_URL from environment', () => {
      process.env['NEXT_PUBLIC_SITE_URL'] = 'https://test.example.com';

      const data: ReadmeData = {
        categories: [
          {
            title: 'Agent',
            description: 'AI agents',
            icon_name: 'Sparkles',
            url_slug: 'agents',
            items: [
              {
                slug: 'code-reviewer',
                title: 'Code Reviewer',
                description: 'Reviews code',
              },
            ],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('https://test.example.com/agents/code-reviewer');
      expect(result).toContain('[🌐 Website](https://test.example.com)');
      expect(result).toContain('1+ expert rules');
    });

    it('should pluralize category names correctly', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Skill',
            description: 'Skills',
            icon_name: 'Terminal',
            url_slug: 'skills',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
          {
            title: 'Hook',
            description: 'Hooks',
            icon_name: 'Webhook',
            url_slug: 'hooks',
            items: [{ slug: 'test2', title: 'Test2', description: 'Test2' }],
          },
        ],
        total_count: 2,
      };

      const result = buildReadmeMarkdown(data);

      // "Skill" ends with consonant, add "s"
      expect(result).toContain('## 🔧 Skills (1)');
      // "Hook" ends with consonant, add "s"
      expect(result).toContain('## 🪝 Hooks (1)');
    });

    it('should handle "y" ending categories correctly', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Category',
            description: 'Test category',
            icon_name: 'FileText',
            url_slug: 'categories',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      // "Category" ends with "y", replace with "ies"
      expect(result).toContain('## 📄 Categories (1)');
    });

    it('should use correct emoji for each icon type', () => {
      const iconTests = [
        { icon_name: 'Sparkles', emoji: '🤖' },
        { icon_name: 'Server', emoji: '⚙️' },
        { icon_name: 'Webhook', emoji: '🪝' },
        { icon_name: 'Terminal', emoji: '🔧' },
        { icon_name: 'BookOpen', emoji: '📜' },
        { icon_name: 'Layers', emoji: '📦' },
        { icon_name: 'FileText', emoji: '📄' },
        { icon_name: 'Briefcase', emoji: '💼' },
        { icon_name: 'Code', emoji: '💻' },
      ];

      for (const { icon_name, emoji } of iconTests) {
        const data: ReadmeData = {
          categories: [
            {
              title: 'Test',
              description: 'Test',
              icon_name,
              url_slug: 'test',
              items: [{ slug: 'test', title: 'Test', description: 'Test' }],
            },
          ],
          total_count: 1,
        };

        const result = buildReadmeMarkdown(data);
        expect(result).toContain(`## ${emoji} Tests (1)`);
      }
    });

    it('should handle multiple items per category', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Skill',
            description: 'Skills',
            icon_name: 'Terminal',
            url_slug: 'skills',
            items: Array.from({ length: 5 }, (_, i) => ({
              slug: `skill-${i}`,
              title: `Skill ${i}`,
              description: `Description ${i}`,
            })),
          },
        ],
        total_count: 5,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('## 🔧 Skills (5)');
      for (let i = 0; i < 5; i++) {
        expect(result).toContain(`**[Skill ${i}]`);
        expect(result).toContain(`Description ${i}`);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      const data: ReadmeData = {
        categories: [],
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('# Claude Pro Directory');
      expect(result).toContain('0+ expert rules');
      expect(result).toContain('## 📚 Content Catalog');
      expect(result).not.toContain('##  '); // No empty category sections
    });

    it('should handle null/undefined categories', () => {
      const data: ReadmeData = {
        categories: null,
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('# Claude Pro Directory');
      expect(result).toContain('0+ expert rules');
    });

    it('should handle null/undefined total_count', () => {
      const data: ReadmeData = {
        categories: [],
        total_count: null,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('0+ expert rules');
    });

    it('should skip categories with empty items array', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Empty Category',
            description: 'No items',
            icon_name: 'FileText',
            url_slug: 'empty',
            items: [],
          },
          {
            title: 'Valid Category',
            description: 'Has items',
            icon_name: 'Code',
            url_slug: 'valid',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).not.toContain('Empty Category');
      expect(result).toContain('## 💻 Valid Categories (1)');
    });

    it('should skip categories with null items', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Null Items',
            description: 'Has null items',
            icon_name: 'FileText',
            url_slug: 'null-items',
            items: null,
          },
        ],
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).not.toContain('Null Items');
    });

    it('should skip categories with null title', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: null,
            description: 'No title',
            icon_name: 'FileText',
            url_slug: 'no-title',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).not.toContain('No title');
    });

    it('should use default emoji for unknown icon_name', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Unknown Icon',
            description: 'Test',
            icon_name: 'UnknownIcon',
            url_slug: 'test',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('## 📄 Unknown Icons (1)'); // Default emoji
    });

    it('should use default emoji for null icon_name', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'No Icon',
            description: 'Test',
            icon_name: null,
            url_slug: 'test',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('## 📄 No Icons (1)'); // Default emoji
    });

    it('should handle null description gracefully', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'No Description',
            description: null,
            icon_name: 'Code',
            url_slug: 'test',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('## 💻 No Descriptions (1)');
      // Should have empty description section (just newlines)
      expect(result).toMatch(/## 💻 No Descriptions \(1\)\n\n\n\n/);
    });

    it('should handle null url_slug gracefully', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'No Slug',
            description: 'Test',
            icon_name: 'Code',
            url_slug: null,
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      // URL should have empty category slug
      expect(result).toContain('https://claudepro.directory//test');
    });

    it('should skip items with null slug', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Category',
            description: 'Test',
            icon_name: 'Code',
            url_slug: 'test',
            items: [
              { slug: null, title: 'No Slug', description: 'Should skip' },
              { slug: 'valid', title: 'Valid', description: 'Should include' },
            ],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).not.toContain('No Slug');
      expect(result).toContain('Valid');
    });

    it('should skip items with null title', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Category',
            description: 'Test',
            icon_name: 'Code',
            url_slug: 'test',
            items: [
              { slug: 'no-title', title: null, description: 'Should skip' },
              { slug: 'valid', title: 'Valid', description: 'Should include' },
            ],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).not.toContain('Should skip');
      expect(result).toContain('Valid');
    });

    it('should use default description for items with null description', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Category',
            description: 'Test',
            icon_name: 'Code',
            url_slug: 'test',
            items: [
              { slug: 'no-desc', title: 'No Description', description: null },
            ],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('**[No Description]');
      expect(result).toContain('No description available');
    });
  });

  describe('markdown structure', () => {
    it('should contain all required sections', () => {
      const data: ReadmeData = {
        categories: [],
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('![ClaudePro.directory](apps/web/public/og-images/og-image.webp)');
      expect(result).toContain('# Claude Pro Directory');
      expect(result).toContain('## 🎯 What is Claude Pro Directory?');
      expect(result).toContain('## 🚀 Quick Start');
      expect(result).toContain('### For Users');
      expect(result).toContain('### For Contributors');
      expect(result).toContain('## 📚 Content Catalog');
      expect(result).toContain('## 📈 Activity');
    });

    it('should contain all social links', () => {
      const data: ReadmeData = {
        categories: [],
        total_count: 0,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('https://discord.gg/Ax3Py4YDrq');
      expect(result).toContain('https://x.com/JSONbored');
      expect(result).toContain('https://github.com/JSONbored/claudepro-directory/discussions');
      expect(result).toContain('https://github.com/hesreallyhim/awesome-claude-code');
    });

    it('should have proper markdown list formatting for items', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Test',
            description: 'Test',
            icon_name: 'Code',
            url_slug: 'test',
            items: [
              { slug: 'item1', title: 'Item 1', description: 'Desc 1' },
              { slug: 'item2', title: 'Item 2', description: 'Desc 2' },
            ],
          },
        ],
        total_count: 2,
      };

      const result = buildReadmeMarkdown(data);

      // Check markdown list format
      expect(result).toMatch(/- \*\*\[Item 1\]\(.*\)\*\* - Desc 1\n/);
      expect(result).toMatch(/- \*\*\[Item 2\]\(.*\)\*\* - Desc 2\n/);
    });

    it('should have proper section spacing', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'Test',
            description: 'Test description',
            icon_name: 'Code',
            url_slug: 'test',
            items: [{ slug: 'test', title: 'Test', description: 'Test' }],
          },
        ],
        total_count: 1,
      };

      const result = buildReadmeMarkdown(data);

      // Category section should have proper spacing
      expect(result).toContain('## 💻 Tests (1)\n\nTest description\n\n');
    });
  });

  describe('integration scenarios', () => {
    it('should handle realistic data with multiple categories and items', () => {
      const data: ReadmeData = {
        categories: [
          {
            title: 'MCP Server',
            description: 'Extend Claude with external tools',
            icon_name: 'Server',
            url_slug: 'mcp-servers',
            items: [
              { slug: 'filesystem', title: 'Filesystem', description: 'Local file access' },
              { slug: 'postgres', title: 'PostgreSQL', description: 'Database queries' },
              { slug: 'github', title: 'GitHub', description: 'GitHub API integration' },
            ],
          },
          {
            title: 'Agent',
            description: 'Specialized AI agents',
            icon_name: 'Sparkles',
            url_slug: 'agents',
            items: [
              { slug: 'code-reviewer', title: 'Code Reviewer', description: 'Review code quality' },
              { slug: 'writer', title: 'Content Writer', description: 'Write content' },
            ],
          },
          {
            title: 'Skill',
            description: 'Custom skills',
            icon_name: 'Terminal',
            url_slug: 'skills',
            items: [
              { slug: 'python', title: 'Python Expert', description: 'Python development' },
            ],
          },
        ],
        total_count: 6,
      };

      const result = buildReadmeMarkdown(data);

      expect(result).toContain('6+ expert rules');
      expect(result).toContain('## ⚙️ MCP Servers (3)');
      expect(result).toContain('## 🤖 Agents (2)');
      expect(result).toContain('## 🔧 Skills (1)');
      expect(result).toContain('Extend Claude with external tools');
      expect(result).toContain('Specialized AI agents');
      expect(result).toContain('Custom skills');
    });

    it('should handle large dataset efficiently', () => {
      const largeData: ReadmeData = {
        categories: Array.from({ length: 10 }, (_, catIndex) => ({
          title: `Category ${catIndex}`,
          description: `Description for category ${catIndex}`,
          icon_name: 'Code',
          url_slug: `category-${catIndex}`,
          items: Array.from({ length: 50 }, (_, itemIndex) => ({
            slug: `item-${catIndex}-${itemIndex}`,
            title: `Item ${catIndex}-${itemIndex}`,
            description: `Description for item ${catIndex}-${itemIndex}`,
          })),
        })),
        total_count: 500,
      };

      const startTime = Date.now();
      const result = buildReadmeMarkdown(largeData);
      const duration = Date.now() - startTime;

      expect(result).toContain('500+ expert rules');
      expect(result.length).toBeGreaterThan(10000); // Should generate substantial content
      expect(duration).toBeLessThan(1000); // Should be fast (less than 1 second)
    });
  });
});