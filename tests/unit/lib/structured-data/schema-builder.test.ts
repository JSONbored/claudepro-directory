/**
 * Structured Data Schema Builder Test Suite
 *
 * Tests JSON-LD schema generation against Schema.org 29.3 standards (Sept 2025).
 * NO MOCKING - validates actual schema output for SEO and AI citation optimization.
 *
 * **Why Test This:**
 * - Used on EVERY content detail page for SEO structured data
 * - Critical for Google Rich Results and search rankings
 * - Essential for AI citation optimization (ChatGPT, Perplexity, Claude search)
 * - Only 36% of schema implementations are error-free (industry study)
 *
 * **2025 Schema.org Standards Validated:**
 * - JSON-LD format (Google's preferred format)
 * - Required properties for each schema type
 * - Proper @context and @type declarations
 * - Correct property value types
 * - Valid URLs and identifiers
 * - Schema.org 29.3 compliance (September 2025)
 *
 * **Test Coverage:**
 * - buildBreadcrumb() - BreadcrumbList schema
 * - buildSoftwareApplication() - SoftwareApplication schema
 * - buildSoftwareSourceCode() - SoftwareSourceCode schema
 * - buildHowTo() - HowTo schema with steps
 * - buildCreativeWork() - CreativeWork schema for templates
 * - buildWebPageSpeakable() - WebPage with speakable for voice search
 * - buildFAQPage() - FAQPage schema for troubleshooting
 * - buildReviewSchema() - Review schema for user reviews (Phase 3)
 * - buildAggregateRatingSchema() - AggregateRating schema for rating snippets (Phase 3)
 * - buildVideoObjectSchema() - VideoObject schema for tutorial videos (Phase 3)
 * - buildCourseSchema() - Course schema for educational guides (Phase 3)
 * - buildJobPostingSchema() - JobPosting schema for job listings (Phase 3)
 * - buildCollectionPageSchema() - CollectionPage schema for collections (Phase 3)
 *
 * @see src/lib/structured-data/schema-builder.ts
 * @see https://schema.org/ - Schema.org documentation
 */

import { describe, expect, it } from 'vitest';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  type AggregateRatingConfig,
  buildAggregateRatingSchema,
  buildBreadcrumb,
  buildCollectionPageSchema,
  buildCourseSchema,
  buildCreativeWork,
  buildFAQPage,
  buildHowTo,
  buildJobPostingSchema,
  buildReviewSchema,
  buildSoftwareApplication,
  buildSoftwareSourceCode,
  buildVideoObjectSchema,
  buildWebPageSpeakable,
  type CollectionPageConfig,
  type CourseConfig,
  type CreativeWorkConfig,
  type FAQItem,
  type HowToConfig,
  type JobPostingConfig,
  type ReviewConfig,
  type SoftwareApplicationConfig,
  type SoftwareSourceCodeConfig,
  type VideoObjectConfig,
} from '@/src/lib/structured-data/schema-builder';

const BASE_URL = APP_CONFIG.url;
const SCHEMA_CONTEXT = 'https://schema.org';

describe('buildBreadcrumb()', () => {
  describe('Basic Breadcrumb Generation', () => {
    it('generates valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Agents', url: '/agents' },
      ];

      const schema = buildBreadcrumb(items);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(2);
    });

    it('includes all required BreadcrumbList properties', () => {
      const items = [{ name: 'Home', url: '/' }];
      const schema = buildBreadcrumb(items);

      expect(schema).toHaveProperty('@context');
      expect(schema).toHaveProperty('@type');
      expect(schema).toHaveProperty('itemListElement');
    });

    it('creates ListItem elements with correct structure', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Agents', url: '/agents' },
      ];

      const schema = buildBreadcrumb(items);
      const firstItem = schema.itemListElement[0];

      expect(firstItem['@type']).toBe('ListItem');
      expect(firstItem.position).toBe(1);
      expect(firstItem.item).toHaveProperty('@id');
      expect(firstItem.item).toHaveProperty('name');
    });

    it('uses 1-based position indexing (schema.org standard)', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Agents', url: '/agents' },
        { name: 'Code Reviewer', url: '/agents/code-reviewer' },
      ];

      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement[0].position).toBe(1);
      expect(schema.itemListElement[1].position).toBe(2);
      expect(schema.itemListElement[2].position).toBe(3);
    });

    it('converts relative URLs to absolute URLs', () => {
      const items = [{ name: 'Agents', url: '/agents' }];
      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement[0].item['@id']).toBe(`${BASE_URL}/agents`);
    });

    it('preserves absolute URLs', () => {
      const items = [{ name: 'External', url: 'https://example.com/page' }];
      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement[0].item['@id']).toBe('https://example.com/page');
    });
  });

  describe('Real-World Breadcrumb Examples', () => {
    it('generates breadcrumb for agent detail page', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'AI Agents', url: '/agents' },
        { name: 'Code Reviewer Agent', url: '/agents/code-reviewer' },
      ];

      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement).toHaveLength(3);
      expect(schema.itemListElement[2].item.name).toBe('Code Reviewer Agent');
      expect(schema.itemListElement[2].item['@id']).toBe(`${BASE_URL}/agents/code-reviewer`);
    });

    it('generates breadcrumb for guide page', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/guides' },
        { name: 'Tutorials', url: '/guides/tutorials' },
        { name: 'MCP Setup', url: '/guides/tutorials/mcp-setup' },
      ];

      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement).toHaveLength(4);
      expect(schema.itemListElement[3].position).toBe(4);
    });
  });

  describe('Edge Cases', () => {
    it('handles single item breadcrumb', () => {
      const items = [{ name: 'Home', url: '/' }];
      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement).toHaveLength(1);
      expect(schema.itemListElement[0].position).toBe(1);
    });

    it('handles special characters in names', () => {
      const items = [{ name: 'MCP & Integration', url: '/mcp' }];
      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement[0].item.name).toBe('MCP & Integration');
    });

    it('handles URLs with query parameters', () => {
      const items = [{ name: 'Search', url: '/search?q=test' }];
      const schema = buildBreadcrumb(items);

      expect(schema.itemListElement[0].item['@id']).toContain('/search?q=test');
    });
  });
});

describe('buildSoftwareApplication()', () => {
  const baseConfig: SoftwareApplicationConfig = {
    slug: 'code-reviewer',
    name: 'Code Reviewer Agent',
    description: 'AI-powered code review agent for quality analysis',
    category: 'agents',
    applicationSubCategory: 'Code Quality',
    keywords: ['code-review', 'ai', 'quality'],
    dateAdded: '2025-01-15T00:00:00Z',
  };

  describe('Required Properties', () => {
    it('includes all required SoftwareApplication properties', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer`);
      expect(schema.name).toBe('Code Reviewer Agent');
      expect(schema.description).toBeDefined();
      expect(schema.url).toBe(`${BASE_URL}/agents/code-reviewer`);
    });

    it('sets applicationCategory to DeveloperApplication', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.applicationCategory).toBe('DeveloperApplication');
    });

    it('uses custom applicationSubCategory from config', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.applicationSubCategory).toBe('Code Quality');
    });

    it('includes alternateName as slug', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.alternateName).toBe('code-reviewer');
    });
  });

  describe('Operating System', () => {
    it('uses default operating system when not specified', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.operatingSystem).toBe('Claude Desktop / Claude Code');
    });

    it('uses custom operating system when provided', () => {
      const config = { ...baseConfig, operatingSystem: 'macOS, Windows, Linux' };
      const schema = buildSoftwareApplication(config);

      expect(schema.operatingSystem).toBe('macOS, Windows, Linux');
    });
  });

  describe('Dates and Metadata', () => {
    it('includes datePublished from dateAdded', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.datePublished).toBe('2025-01-15T00:00:00Z');
    });

    it('uses lastModified for dateModified when provided', () => {
      const config = { ...baseConfig, lastModified: '2025-10-01T00:00:00Z' };
      const schema = buildSoftwareApplication(config);

      expect(schema.dateModified).toBe('2025-10-01T00:00:00Z');
    });

    it('falls back to dateAdded for dateModified when lastModified missing', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.dateModified).toBe('2025-01-15T00:00:00Z');
    });
  });

  describe('Keywords', () => {
    it('converts keywords array to comma-separated string', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.keywords).toBe('code-review, ai, quality');
    });

    it('handles single keyword', () => {
      const config = { ...baseConfig, keywords: ['testing'] };
      const schema = buildSoftwareApplication(config);

      expect(schema.keywords).toBe('testing');
    });

    it('handles many keywords', () => {
      const config = {
        ...baseConfig,
        keywords: ['code', 'review', 'ai', 'quality', 'testing'],
      };
      const schema = buildSoftwareApplication(config);

      expect(schema.keywords).toBe('code, review, ai, quality, testing');
    });
  });

  describe('Author Information', () => {
    it('creates Person author when no githubUrl provided', () => {
      const config = { ...baseConfig, author: 'John Doe' };
      const schema = buildSoftwareApplication(config);

      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBe('John Doe');
    });

    it('creates Organization author for Anthropic GitHub URLs', () => {
      const config = {
        ...baseConfig,
        author: 'Anthropic',
        githubUrl: 'https://github.com/anthropics/claude-code',
      };
      const schema = buildSoftwareApplication(config);

      expect(schema.author['@type']).toBe('Organization');
      expect(schema.author.name).toBe('Anthropic');
      expect(schema.author.url).toBe('https://github.com/anthropics/claude-code');
    });

    it('includes sameAs property when githubUrl provided', () => {
      const config = {
        ...baseConfig,
        author: 'Developer',
        githubUrl: 'https://github.com/developer/repo',
      };
      const schema = buildSoftwareApplication(config);

      expect(schema.author.sameAs).toBe('https://github.com/developer/repo');
    });

    it('defaults to Unknown author when not provided', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.author.name).toBe('Unknown');
    });
  });

  describe('Features and Requirements', () => {
    it('includes featureList when features provided', () => {
      const config = {
        ...baseConfig,
        features: ['Code analysis', 'Bug detection', 'Quality metrics'],
      };
      const schema = buildSoftwareApplication(config);

      expect(schema.featureList).toBe('Code analysis, Bug detection, Quality metrics');
    });

    it('includes softwareRequirements when requirements provided', () => {
      const config = {
        ...baseConfig,
        requirements: ['Node.js 18+', 'TypeScript 5.0'],
      };
      const schema = buildSoftwareApplication(config);

      expect(schema.softwareRequirements).toBe('Node.js 18+, TypeScript 5.0');
    });

    it('uses default requirements when not provided', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.softwareRequirements).toBe('Claude Desktop or Claude Code');
    });
  });

  describe('Offer Information', () => {
    it('includes free offer with correct schema', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.offers['@type']).toBe('Offer');
      expect(schema.offers.price).toBe('0');
      expect(schema.offers.priceCurrency).toBe('USD');
      expect(schema.offers.availability).toBe('https://schema.org/InStock');
    });
  });

  describe('Educational Properties', () => {
    it('includes learning resource type', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.learningResourceType).toBe('Software Configuration');
    });

    it('sets educational level to Professional', () => {
      const schema = buildSoftwareApplication(baseConfig);

      expect(schema.educationalLevel).toBe('Professional');
    });
  });
});

describe('buildSoftwareSourceCode()', () => {
  const baseConfig: SoftwareSourceCodeConfig = {
    slug: 'code-reviewer',
    category: 'agents',
    name: 'Code Review Configuration',
    description: 'Configuration for automated code review',
    programmingLanguage: 'JSON',
    code: '{"model": "claude-3-5-sonnet", "temperature": 0.7}',
    encodingFormat: 'application/json',
    fragmentId: 'configuration',
  };

  describe('Required Properties', () => {
    it('includes all required SoftwareSourceCode properties', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('SoftwareSourceCode');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#configuration`);
      expect(schema.name).toBe('Code Review Configuration');
      expect(schema.description).toBeDefined();
      expect(schema.text).toBeDefined();
    });

    it('includes code text in text property', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.text).toBe('{"model": "claude-3-5-sonnet", "temperature": 0.7}');
    });

    it('includes encoding format', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.encodingFormat).toBe('application/json');
    });
  });

  describe('Programming Language', () => {
    it('creates ComputerLanguage object for programming language', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.programmingLanguage['@type']).toBe('ComputerLanguage');
      expect(schema.programmingLanguage.name).toBe('JSON');
    });

    it('handles different programming languages', () => {
      const config = { ...baseConfig, programmingLanguage: 'TypeScript' };
      const schema = buildSoftwareSourceCode(config);

      expect(schema.programmingLanguage.name).toBe('TypeScript');
    });
  });

  describe('Runtime and Platform', () => {
    it('sets runtimePlatform to Claude AI Assistant', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.runtimePlatform).toBe('Claude AI Assistant');
    });

    it('sets targetProduct to Claude Desktop / Claude Code', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.targetProduct).toBe('Claude Desktop / Claude Code');
    });
  });

  describe('Code Repository', () => {
    it('includes codeRepository when githubUrl provided', () => {
      const config = { ...baseConfig, githubUrl: 'https://github.com/user/repo' };
      const schema = buildSoftwareSourceCode(config);

      expect(schema.codeRepository).toBe('https://github.com/user/repo');
    });

    it('handles missing githubUrl gracefully', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.codeRepository).toBeUndefined();
    });
  });

  describe('License and Relationships', () => {
    it('includes MIT license', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.license).toBe('https://opensource.org/licenses/MIT');
    });

    it('links to parent application with isPartOf', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema.isPartOf['@id']).toBe(`${BASE_URL}/agents/code-reviewer`);
    });
  });

  describe('Fragment IDs', () => {
    it('appends fragment ID to @id', () => {
      const schema = buildSoftwareSourceCode(baseConfig);

      expect(schema['@id']).toContain('#configuration');
    });

    it('handles different fragment IDs', () => {
      const config = { ...baseConfig, fragmentId: 'example-usage' };
      const schema = buildSoftwareSourceCode(config);

      expect(schema['@id']).toContain('#example-usage');
    });
  });
});

describe('buildHowTo()', () => {
  const baseConfig: HowToConfig = {
    slug: 'code-reviewer',
    category: 'agents',
    name: 'Code Reviewer Agent',
    description: 'Step-by-step guide for using the code reviewer',
    steps: [
      {
        position: 1,
        name: 'Install Agent',
        text: 'Download and install the code reviewer agent',
      },
      {
        position: 2,
        name: 'Configure Settings',
        text: 'Set up your configuration file',
        code: '{"enabled": true}',
        programmingLanguage: 'json',
      },
    ],
  };

  describe('Required Properties', () => {
    it('includes all required HowTo properties', () => {
      const schema = buildHowTo(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('HowTo');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#howto`);
      expect(schema.name).toBe('How to use Code Reviewer Agent');
      expect(schema.description).toBeDefined();
      expect(schema.step).toHaveLength(2);
    });

    it('prepends "How to use" to name', () => {
      const schema = buildHowTo(baseConfig);

      expect(schema.name).toContain('How to use');
      expect(schema.name).toContain('Code Reviewer Agent');
    });
  });

  describe('Estimated Cost', () => {
    it('includes free estimated cost', () => {
      const schema = buildHowTo(baseConfig);

      expect(schema.estimatedCost['@type']).toBe('MonetaryAmount');
      expect(schema.estimatedCost.currency).toBe('USD');
      expect(schema.estimatedCost.value).toBe('0');
    });
  });

  describe('Steps', () => {
    it('creates HowToStep for each step', () => {
      const schema = buildHowTo(baseConfig);

      expect(schema.step[0]['@type']).toBe('HowToStep');
      expect(schema.step[0].position).toBe(1);
      expect(schema.step[0].name).toBe('Install Agent');
      expect(schema.step[0].text).toBe('Download and install the code reviewer agent');
    });

    it('preserves step order with position', () => {
      const schema = buildHowTo(baseConfig);

      expect(schema.step[0].position).toBe(1);
      expect(schema.step[1].position).toBe(2);
    });

    it('includes SoftwareSourceCode for steps with code', () => {
      const schema = buildHowTo(baseConfig);
      const stepWithCode = schema.step[1];

      expect(stepWithCode.itemListElement['@type']).toBe('SoftwareSourceCode');
      expect(stepWithCode.itemListElement.text).toBe('{"enabled": true}');
      expect(stepWithCode.itemListElement.programmingLanguage).toBe('json');
    });

    it('omits itemListElement for steps without code', () => {
      const schema = buildHowTo(baseConfig);
      const stepWithoutCode = schema.step[0];

      expect(stepWithoutCode).not.toHaveProperty('itemListElement');
    });
  });

  describe('Real-World Examples', () => {
    it('generates HowTo for MCP server setup', () => {
      const config: HowToConfig = {
        slug: 'filesystem-server',
        category: 'mcp',
        name: 'Filesystem MCP Server',
        description: 'Setup guide for filesystem MCP server',
        steps: [
          { position: 1, name: 'Install MCP', text: 'Install the MCP server package' },
          {
            position: 2,
            name: 'Configure',
            text: 'Add configuration',
            code: '{}',
            programmingLanguage: 'json',
          },
          { position: 3, name: 'Test Connection', text: 'Verify the server is working' },
        ],
      };

      const schema = buildHowTo(config);

      expect(schema.step).toHaveLength(3);
      expect(schema['@id']).toContain('/mcp/filesystem-server#howto');
    });
  });
});

describe('buildCreativeWork()', () => {
  const baseConfig: CreativeWorkConfig = {
    slug: 'best-practices',
    category: 'rules',
    name: 'Claude Code Best Practices',
    description: 'Production-ready development rules for Claude',
    content: 'Always write type-safe, validated, error-handled code...',
    author: 'Claude Team',
  };

  describe('Required Properties', () => {
    it('includes all required CreativeWork properties', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('CreativeWork');
      expect(schema['@id']).toBe(`${BASE_URL}/rules/best-practices#content`);
      expect(schema.name).toBe('Claude Code Best Practices - Content Template');
      expect(schema.description).toBeDefined();
      expect(schema.text).toBeDefined();
    });

    it('appends "- Content Template" to name', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.name).toContain('- Content Template');
    });

    it('includes content in text property', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.text).toBe('Always write type-safe, validated, error-handled code...');
    });
  });

  describe('Language and Encoding', () => {
    it('sets inLanguage to en (English)', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.inLanguage).toBe('en');
    });

    it('sets encodingFormat to text/plain', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.encodingFormat).toBe('text/plain');
    });
  });

  describe('Creator', () => {
    it('creates Person creator with provided author', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.creator['@type']).toBe('Person');
      expect(schema.creator.name).toBe('Claude Team');
    });

    it('defaults to Unknown when author not provided', () => {
      const config = { ...baseConfig, author: undefined };
      const schema = buildCreativeWork(config);

      expect(schema.creator.name).toBe('Unknown');
    });
  });

  describe('Educational Properties', () => {
    it('sets learningResourceType to Template', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.learningResourceType).toBe('Template');
    });

    it('sets educationalUse to Professional Development', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.educationalUse).toBe('Professional Development');
    });
  });

  describe('Relationships', () => {
    it('links to parent with isPartOf', () => {
      const schema = buildCreativeWork(baseConfig);

      expect(schema.isPartOf['@id']).toBe(`${BASE_URL}/rules/best-practices`);
    });
  });
});

describe('buildWebPageSpeakable()', () => {
  describe('Speakable Specification', () => {
    it('generates WebPage with speakable specification', () => {
      const schema = buildWebPageSpeakable('code-reviewer', 'agents');

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('WebPage');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#webpage`);
      expect(schema.url).toBe(`${BASE_URL}/agents/code-reviewer`);
      expect(schema.speakable).toBeDefined();
    });

    it('includes SpeakableSpecification type', () => {
      const schema = buildWebPageSpeakable('mcp-server', 'mcp');

      expect(schema.speakable['@type']).toBe('SpeakableSpecification');
    });

    it('specifies CSS selectors for voice assistants', () => {
      const schema = buildWebPageSpeakable('test', 'agents');

      expect(schema.speakable.cssSelector).toContain('description');
      expect(schema.speakable.cssSelector).toContain('headline');
      expect(schema.speakable.cssSelector).toContain('.features');
    });

    it('specifies XPath selectors for voice assistants', () => {
      const schema = buildWebPageSpeakable('test', 'agents');

      expect(schema.speakable.xpath).toContain('/html/head/title');
      expect(schema.speakable.xpath).toContain('/html/head/meta[@name="description"]/@content');
    });
  });

  describe('ID and URL Construction', () => {
    it('constructs correct @id with fragment', () => {
      const schema = buildWebPageSpeakable('test-slug', 'hooks');

      expect(schema['@id']).toBe(`${BASE_URL}/hooks/test-slug#webpage`);
    });

    it('constructs correct URL without fragment', () => {
      const schema = buildWebPageSpeakable('test-slug', 'commands');

      expect(schema.url).toBe(`${BASE_URL}/commands/test-slug`);
    });
  });
});

describe('buildFAQPage()', () => {
  const baseTroubleshooting: FAQItem[] = [
    {
      issue: 'Agent not responding',
      solution: 'Check your configuration file and restart Claude',
    },
    {
      issue: 'Installation failed',
      solution: 'Ensure you have the latest version of Claude Desktop',
    },
  ];

  describe('Required Properties', () => {
    it('includes all required FAQPage properties', () => {
      const schema = buildFAQPage('code-reviewer', 'agents', 'Code Reviewer', baseTroubleshooting);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#faq`);
      expect(schema.name).toBe('Code Reviewer - Troubleshooting');
      expect(schema.description).toContain('Frequently asked questions');
      expect(schema.url).toBe(`${BASE_URL}/agents/code-reviewer`);
      expect(schema.mainEntity).toHaveLength(2);
    });

    it('appends "- Troubleshooting" to name', () => {
      const schema = buildFAQPage('test', 'mcp', 'Test MCP', baseTroubleshooting);

      expect(schema.name).toBe('Test MCP - Troubleshooting');
    });

    it('includes item name in description', () => {
      const schema = buildFAQPage('test', 'mcp', 'Test MCP', baseTroubleshooting);

      expect(schema.description).toContain('Test MCP');
    });
  });

  describe('Question and Answer Schema', () => {
    it('creates Question entities with correct structure', () => {
      const schema = buildFAQPage('test', 'agents', 'Test', baseTroubleshooting);

      const question = schema.mainEntity[0];
      expect(question['@type']).toBe('Question');
      expect(question.name).toBe('Agent not responding');
      expect(question.acceptedAnswer).toBeDefined();
    });

    it('creates Answer entities with correct structure', () => {
      const schema = buildFAQPage('test', 'agents', 'Test', baseTroubleshooting);

      const answer = schema.mainEntity[0].acceptedAnswer;
      expect(answer['@type']).toBe('Answer');
      expect(answer.text).toBe('Check your configuration file and restart Claude');
    });

    it('handles multiple FAQ items', () => {
      const schema = buildFAQPage('test', 'agents', 'Test', baseTroubleshooting);

      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0].name).toBe('Agent not responding');
      expect(schema.mainEntity[1].name).toBe('Installation failed');
    });
  });

  describe('Real-World Examples', () => {
    it('generates FAQ for MCP server troubleshooting', () => {
      const mcpTroubleshooting: FAQItem[] = [
        {
          issue: 'Server connection timeout',
          solution: 'Check your network settings and firewall configuration',
        },
        {
          issue: 'Permission denied error',
          solution: 'Verify file system permissions for the MCP server directory',
        },
        {
          issue: 'Invalid configuration format',
          solution: 'Ensure your config.json follows the correct schema',
        },
      ];

      const schema = buildFAQPage(
        'filesystem-server',
        'mcp',
        'Filesystem MCP Server',
        mcpTroubleshooting
      );

      expect(schema.mainEntity).toHaveLength(3);
      expect(schema['@id']).toContain('/mcp/filesystem-server#faq');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty troubleshooting array', () => {
      const schema = buildFAQPage('test', 'agents', 'Test', []);

      expect(schema.mainEntity).toHaveLength(0);
    });

    it('handles special characters in issues and solutions', () => {
      const troubleshooting: FAQItem[] = [
        {
          issue: 'Error: "Cannot find module"',
          solution: 'Run npm install && npm run build',
        },
      ];

      const schema = buildFAQPage('test', 'agents', 'Test', troubleshooting);

      expect(schema.mainEntity[0].name).toContain('"Cannot find module"');
      expect(schema.mainEntity[0].acceptedAnswer.text).toContain('&&');
    });
  });
});

describe('buildReviewSchema()', () => {
  const baseConfig: ReviewConfig = {
    slug: 'code-reviewer',
    category: 'agents',
    itemName: 'Code Reviewer Agent',
    reviewBody: 'Excellent agent for automated code review. Saves hours of manual review time.',
    rating: 5,
    author: 'John Developer',
    datePublished: '2025-01-15',
  };

  describe('Required Properties', () => {
    it('includes all required Review properties', () => {
      const schema = buildReviewSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('Review');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#review`);
      expect(schema.reviewBody).toBeDefined();
      expect(schema.reviewRating).toBeDefined();
      expect(schema.author).toBeDefined();
    });

    it('includes itemReviewed as SoftwareApplication', () => {
      const schema = buildReviewSchema(baseConfig);

      expect(schema.itemReviewed['@type']).toBe('SoftwareApplication');
      expect(schema.itemReviewed.name).toBe('Code Reviewer Agent');
    });
  });

  describe('Rating', () => {
    it('creates Rating object with correct structure', () => {
      const schema = buildReviewSchema(baseConfig);

      expect(schema.reviewRating['@type']).toBe('Rating');
      expect(schema.reviewRating.ratingValue).toBe(5);
      expect(schema.reviewRating.bestRating).toBe(5);
      expect(schema.reviewRating.worstRating).toBe(1);
    });

    it('handles different rating values', () => {
      const config = { ...baseConfig, rating: 3 };
      const schema = buildReviewSchema(config);

      expect(schema.reviewRating.ratingValue).toBe(3);
    });
  });

  describe('Author', () => {
    it('creates Person author', () => {
      const schema = buildReviewSchema(baseConfig);

      expect(schema.author['@type']).toBe('Person');
      expect(schema.author.name).toBe('John Developer');
    });
  });

  describe('Date Published', () => {
    it('uses provided datePublished', () => {
      const schema = buildReviewSchema(baseConfig);

      expect(schema.datePublished).toBe('2025-01-15');
    });

    it('generates current date when not provided', () => {
      const config = { ...baseConfig, datePublished: undefined };
      const schema = buildReviewSchema(config);

      expect(schema.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

describe('buildAggregateRatingSchema()', () => {
  const baseConfig: AggregateRatingConfig = {
    slug: 'code-reviewer',
    category: 'agents',
    itemName: 'Code Reviewer Agent',
    ratingValue: 4.5,
    reviewCount: 128,
  };

  describe('Required Properties', () => {
    it('includes all required SoftwareApplication with AggregateRating properties', () => {
      const schema = buildAggregateRatingSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('SoftwareApplication');
      expect(schema['@id']).toBe(`${BASE_URL}/agents/code-reviewer#aggregaterating`);
      expect(schema.name).toBe('Code Reviewer Agent');
      expect(schema.aggregateRating).toBeDefined();
    });
  });

  describe('Aggregate Rating', () => {
    it('creates AggregateRating object with correct structure', () => {
      const schema = buildAggregateRatingSchema(baseConfig);

      expect(schema.aggregateRating['@type']).toBe('AggregateRating');
      expect(schema.aggregateRating.ratingValue).toBe(4.5);
      expect(schema.aggregateRating.reviewCount).toBe(128);
    });

    it('uses default bestRating and worstRating', () => {
      const schema = buildAggregateRatingSchema(baseConfig);

      expect(schema.aggregateRating.bestRating).toBe(5);
      expect(schema.aggregateRating.worstRating).toBe(1);
    });

    it('uses custom bestRating and worstRating when provided', () => {
      const config = { ...baseConfig, bestRating: 10, worstRating: 2 };
      const schema = buildAggregateRatingSchema(config);

      expect(schema.aggregateRating.bestRating).toBe(10);
      expect(schema.aggregateRating.worstRating).toBe(2);
    });
  });
});

describe('buildVideoObjectSchema()', () => {
  const baseConfig: VideoObjectConfig = {
    slug: 'setup-tutorial',
    category: 'guides',
    name: 'Claude Code Setup Tutorial',
    description: 'Complete guide to setting up Claude Code for development',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    uploadDate: '2025-01-15',
    duration: 'PT10M30S',
    contentUrl: 'https://example.com/video.mp4',
    embedUrl: 'https://example.com/embed/video',
  };

  describe('Required Properties', () => {
    it('includes all required VideoObject properties', () => {
      const schema = buildVideoObjectSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('VideoObject');
      expect(schema['@id']).toBe(`${BASE_URL}/guides/setup-tutorial#video`);
      expect(schema.name).toBe('Claude Code Setup Tutorial');
      expect(schema.description).toBeDefined();
      expect(schema.thumbnailUrl).toBe('https://example.com/thumbnail.jpg');
      expect(schema.uploadDate).toBe('2025-01-15');
    });
  });

  describe('Optional Properties', () => {
    it('includes duration when provided', () => {
      const schema = buildVideoObjectSchema(baseConfig);

      expect(schema.duration).toBe('PT10M30S');
    });

    it('includes contentUrl when provided', () => {
      const schema = buildVideoObjectSchema(baseConfig);

      expect(schema.contentUrl).toBe('https://example.com/video.mp4');
    });

    it('includes embedUrl when provided', () => {
      const schema = buildVideoObjectSchema(baseConfig);

      expect(schema.embedUrl).toBe('https://example.com/embed/video');
    });

    it('omits optional properties when not provided', () => {
      const config = {
        ...baseConfig,
        duration: undefined,
        contentUrl: undefined,
        embedUrl: undefined,
      };
      const schema = buildVideoObjectSchema(config);

      expect(schema).not.toHaveProperty('duration');
      expect(schema).not.toHaveProperty('contentUrl');
      expect(schema).not.toHaveProperty('embedUrl');
    });
  });
});

describe('buildCourseSchema()', () => {
  const baseConfig: CourseConfig = {
    slug: 'mcp-mastery',
    category: 'guides',
    name: 'MCP Server Development Mastery',
    description: 'Complete course on building production-ready MCP servers',
    provider: 'Claude Pro Directory',
    educationalLevel: 'Intermediate',
    timeRequired: 'PT8H',
    courseCode: 'MCP-101',
  };

  describe('Required Properties', () => {
    it('includes all required Course properties', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('Course');
      expect(schema['@id']).toBe(`${BASE_URL}/guides/mcp-mastery#course`);
      expect(schema.name).toBe('MCP Server Development Mastery');
      expect(schema.description).toBeDefined();
      expect(schema.provider).toBeDefined();
    });

    it('creates Organization provider', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema.provider['@type']).toBe('Organization');
      expect(schema.provider.name).toBe('Claude Pro Directory');
    });
  });

  describe('Educational Level', () => {
    it('uses provided educational level', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema.educationalLevel).toBe('Intermediate');
    });

    it('defaults to Professional when not provided', () => {
      const config = { ...baseConfig, educationalLevel: undefined };
      const schema = buildCourseSchema(config);

      expect(schema.educationalLevel).toBe('Professional');
    });
  });

  describe('Course Instance', () => {
    it('includes hasCourseInstance with online mode', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema.hasCourseInstance['@type']).toBe('CourseInstance');
      expect(schema.hasCourseInstance.courseMode).toBe('online');
      expect(schema.hasCourseInstance.courseWorkload).toBe('PT8H');
    });
  });

  describe('Optional Properties', () => {
    it('includes timeRequired when provided', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema.timeRequired).toBe('PT8H');
    });

    it('includes courseCode when provided', () => {
      const schema = buildCourseSchema(baseConfig);

      expect(schema.courseCode).toBe('MCP-101');
    });
  });
});

describe('buildJobPostingSchema()', () => {
  const baseConfig: JobPostingConfig = {
    slug: 'senior-ai-engineer',
    title: 'Senior AI Engineer - MCP Development',
    description: 'Build next-generation AI development tools using MCP protocol',
    hiringOrganization: 'Claude Pro Directory',
    datePosted: '2025-01-15',
    validThrough: '2025-03-15',
    employmentType: 'FULL_TIME',
    jobLocation: {
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      remote: false,
    },
    baseSalary: {
      currency: 'USD',
      value: 180000,
      unitText: 'YEAR',
    },
  };

  describe('Required Properties', () => {
    it('includes all required JobPosting properties', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('JobPosting');
      expect(schema['@id']).toBe(`${BASE_URL}/jobs/senior-ai-engineer#jobposting`);
      expect(schema.title).toBe('Senior AI Engineer - MCP Development');
      expect(schema.description).toBeDefined();
      expect(schema.datePosted).toBe('2025-01-15');
      expect(schema.hiringOrganization).toBeDefined();
    });

    it('creates Organization for hiringOrganization', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema.hiringOrganization['@type']).toBe('Organization');
      expect(schema.hiringOrganization.name).toBe('Claude Pro Directory');
    });
  });

  describe('Optional Properties', () => {
    it('includes validThrough when provided', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema.validThrough).toBe('2025-03-15');
    });

    it('includes employmentType when provided', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema.employmentType).toBe('FULL_TIME');
    });
  });

  describe('Job Location', () => {
    it('creates Place with PostalAddress for on-site jobs', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema.jobLocation['@type']).toBe('Place');
      expect(schema.jobLocation.address['@type']).toBe('PostalAddress');
      expect(schema.jobLocation.address.addressLocality).toBe('San Francisco');
      expect(schema.jobLocation.address.addressRegion).toBe('CA');
      expect(schema.jobLocation.address.addressCountry).toBe('USA');
    });

    it('creates remote Place for remote jobs', () => {
      const config = {
        ...baseConfig,
        jobLocation: { remote: true },
      };
      const schema = buildJobPostingSchema(config);

      expect(schema.jobLocation['@type']).toBe('Place');
      expect(schema.jobLocation.address.addressCountry).toBe('Remote');
    });
  });

  describe('Base Salary', () => {
    it('includes baseSalary as MonetaryAmount', () => {
      const schema = buildJobPostingSchema(baseConfig);

      expect(schema.baseSalary['@type']).toBe('MonetaryAmount');
      expect(schema.baseSalary.currency).toBe('USD');
      expect(schema.baseSalary.value['@type']).toBe('QuantitativeValue');
      expect(schema.baseSalary.value.value).toBe(180000);
      expect(schema.baseSalary.value.unitText).toBe('YEAR');
    });
  });
});

describe('buildCollectionPageSchema()', () => {
  const baseConfig: CollectionPageConfig = {
    slug: 'top-mcp-servers',
    name: 'Top MCP Servers 2025',
    description: 'Curated collection of the best MCP servers for Claude development',
    items: [
      {
        name: 'Filesystem Server',
        url: '/mcp/filesystem-server',
        description: 'Access local filesystem with MCP',
      },
      {
        name: 'Database Server',
        url: '/mcp/database-server',
        description: 'Query databases via MCP',
      },
      {
        name: 'External API',
        url: 'https://example.com/api-server',
        description: 'Call external APIs',
      },
    ],
    collectionSize: 3,
  };

  describe('Required Properties', () => {
    it('includes all required CollectionPage properties', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      expect(schema['@context']).toBe(SCHEMA_CONTEXT);
      expect(schema['@type']).toBe('CollectionPage');
      expect(schema['@id']).toBe(`${BASE_URL}/collections/top-mcp-servers#collection`);
      expect(schema.name).toBe('Top MCP Servers 2025');
      expect(schema.description).toBeDefined();
      expect(schema.mainEntity).toBeDefined();
    });
  });

  describe('Item List', () => {
    it('creates ItemList as mainEntity', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      expect(schema.mainEntity['@type']).toBe('ItemList');
      expect(schema.mainEntity.numberOfItems).toBe(3);
      expect(schema.mainEntity.itemListElement).toHaveLength(3);
    });

    it('uses provided collectionSize', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      expect(schema.mainEntity.numberOfItems).toBe(3);
    });

    it('defaults to items.length when collectionSize not provided', () => {
      const config = { ...baseConfig, collectionSize: undefined };
      const schema = buildCollectionPageSchema(config);

      expect(schema.mainEntity.numberOfItems).toBe(3);
    });
  });

  describe('List Items', () => {
    it('creates ListItem for each item with correct structure', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      const firstItem = schema.mainEntity.itemListElement[0];
      expect(firstItem['@type']).toBe('ListItem');
      expect(firstItem.position).toBe(1);
      expect(firstItem.item['@type']).toBe('Thing');
      expect(firstItem.item.name).toBe('Filesystem Server');
    });

    it('converts relative URLs to absolute URLs', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      const firstItem = schema.mainEntity.itemListElement[0];
      expect(firstItem.item.url).toBe(`${BASE_URL}/mcp/filesystem-server`);
    });

    it('preserves absolute URLs', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      const thirdItem = schema.mainEntity.itemListElement[2];
      expect(thirdItem.item.url).toBe('https://example.com/api-server');
    });

    it('includes description when provided', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      const firstItem = schema.mainEntity.itemListElement[0];
      expect(firstItem.item.description).toBe('Access local filesystem with MCP');
    });

    it('uses 1-based position indexing', () => {
      const schema = buildCollectionPageSchema(baseConfig);

      expect(schema.mainEntity.itemListElement[0].position).toBe(1);
      expect(schema.mainEntity.itemListElement[1].position).toBe(2);
      expect(schema.mainEntity.itemListElement[2].position).toBe(3);
    });
  });
});
