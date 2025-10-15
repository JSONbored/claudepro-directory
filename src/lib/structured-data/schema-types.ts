/**
 * Schema Types
 * Type definitions for unified structured data generation
 */

import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';
import type { CommandContent } from '@/src/lib/schemas/content/command.schema';
import type { HookContent } from '@/src/lib/schemas/content/hook.schema';
import type { McpContent } from '@/src/lib/schemas/content/mcp.schema';
import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';
import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';
import type { SkillContent } from '@/src/lib/schemas/content/skill.schema';
import {
  buildBreadcrumb,
  buildCreativeWork,
  buildFAQPage,
  buildHowTo,
  buildSoftwareApplication,
  buildSoftwareSourceCode,
  buildWebPageSpeakable,
  type FAQItem,
  type SchemaObject,
} from '@/src/lib/structured-data/schema-builder';
import { getContentItemUrl, transformMcpConfigForDisplay } from '@/src/lib/utils/content.utils';

/**
 * Discriminated union for all content types
 */
export type UnifiedContent =
  | ({ category: 'agents' } & AgentContent)
  | ({ category: 'commands' } & CommandContent)
  | ({ category: 'hooks' } & HookContent)
  | ({ category: 'mcp' } & McpContent)
  | ({ category: 'rules' } & RuleContent)
  | ({ category: 'statuslines' } & StatuslineContent)
  | ({ category: 'skills' } & SkillContent);

/**
 * Props for unified structured data component
 */
export interface UnifiedStructuredDataProps {
  item: UnifiedContent;
}

/**
 * Type guards for content discrimination
 */
export function isAgentContent(
  item: UnifiedContent
): item is AgentContent & { category: 'agents' } {
  return item.category === 'agents';
}

export function isCommandContent(
  item: UnifiedContent
): item is CommandContent & { category: 'commands' } {
  return item.category === 'commands';
}

export function isHookContent(item: UnifiedContent): item is HookContent & { category: 'hooks' } {
  return item.category === 'hooks';
}

export function isMcpContent(item: UnifiedContent): item is McpContent & { category: 'mcp' } {
  return item.category === 'mcp';
}

export function isRuleContent(item: UnifiedContent): item is RuleContent & { category: 'rules' } {
  return item.category === 'rules';
}

export function isStatuslineContent(
  item: UnifiedContent
): item is StatuslineContent & { category: 'statuslines' } {
  return item.category === 'statuslines';
}

export function isSkillContent(item: UnifiedContent): item is SkillContent & { category: 'skills' } {
  return item.category === 'skills';
}

/**
 * Configuration for schema generation per content type
 */
export interface SchemaGenerationConfig {
  generateApplication: boolean;
  generateSourceCode: boolean;
  generateHowTo: boolean;
  generateCreativeWork: boolean;
  generateFAQ: boolean;
  generateBreadcrumb: boolean;
  generateSpeakable: boolean;
}

export const SCHEMA_CONFIGS: Record<UnifiedContent['category'], SchemaGenerationConfig> = {
  agents: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: true,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: true,
  },
  commands: {
    generateApplication: false,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  hooks: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  mcp: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: true,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  rules: {
    generateApplication: true,
    generateSourceCode: false,
    generateHowTo: true,
    generateCreativeWork: true,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: true,
  },
  statuslines: {
    generateApplication: true,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: false,
    generateFAQ: false,
    generateBreadcrumb: true,
    generateSpeakable: false,
  },
  skills: {
    generateApplication: false,
    generateSourceCode: true,
    generateHowTo: true,
    generateCreativeWork: true,
    generateFAQ: true,
    generateBreadcrumb: true,
    generateSpeakable: true,
  },
};

/**
 * STRUCTURED_DATA_RULES
 * Central configuration for schema generation logic
 * Maps content type → schema generation rules (builders, extractors, transformers)
 */
export interface StructuredDataRule {
  // Schema type mappings
  schemaTypes: {
    application?: boolean;
    sourceCode?: boolean;
    creativeWork?: boolean;
    howTo?: boolean;
    faq?: boolean;
    breadcrumb?: boolean;
    speakable?: boolean;
    review?: boolean;
    aggregateRating?: boolean;
    videoObject?: boolean;
    course?: boolean;
    jobPosting?: boolean;
    collectionPage?: boolean;
  };

  // Property extractors (centralize what was scattered inline)
  extractors: {
    applicationSubCategory: (item: UnifiedContent) => string;
    keywords: (item: UnifiedContent) => string[];
    requirements: (item: UnifiedContent) => string[];
    configuration: (item: UnifiedContent) => unknown;
    creativeWorkDescription: (item: UnifiedContent) => string;
  };

  // Display name mapping
  categoryDisplayName: string;
}

export const STRUCTURED_DATA_RULES: Record<UnifiedContent['category'], StructuredDataRule> = {
  agents: {
    schemaTypes: {
      application: true,
      sourceCode: true,
      creativeWork: true,
      howTo: true,
      breadcrumb: true,
      speakable: true,
    },
    extractors: {
      applicationSubCategory: () => 'AI Agent',
      keywords: (item) => [
        'Claude Agent',
        'AI Assistant Agent',
        item.category,
        'Claude',
        ...(item.tags || []),
      ],
      requirements: () => ['Claude Desktop or Claude Code'],
      configuration: (item) => (isAgentContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'Agent system prompt and instructions',
    },
    categoryDisplayName: 'Agents',
  },
  commands: {
    schemaTypes: {
      sourceCode: true,
      howTo: true,
      breadcrumb: true,
    },
    extractors: {
      applicationSubCategory: () => 'Claude Command',
      keywords: (item) => [
        'Claude Command',
        'AI Assistant Command',
        item.category,
        'Claude',
        ...(item.tags || []),
      ],
      requirements: () => ['Claude Desktop or Claude Code'],
      configuration: (item) => (isCommandContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'Command template',
    },
    categoryDisplayName: 'Commands',
  },
  hooks: {
    schemaTypes: {
      application: true,
      sourceCode: true,
      howTo: true,
      breadcrumb: true,
    },
    extractors: {
      applicationSubCategory: (item) =>
        isHookContent(item) ? `${item.hookType || 'Hook'} - Claude Hook` : 'Claude Hook',
      keywords: (item) => {
        const hookType = isHookContent(item) ? item.hookType : undefined;
        return [
          'Claude Hook',
          hookType || 'Hook',
          'Automation',
          item.category,
          'Claude',
          ...(item.tags || []),
        ];
      },
      requirements: (item) => {
        const base = ['Claude Desktop or Claude Code'];
        return isHookContent(item) && item.requirements ? [...base, ...item.requirements] : base;
      },
      configuration: (item) => (isHookContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'Hook automation script',
    },
    categoryDisplayName: 'Hooks',
  },
  mcp: {
    schemaTypes: {
      application: true,
      sourceCode: true,
      howTo: true,
      faq: true,
      breadcrumb: true,
    },
    extractors: {
      applicationSubCategory: () => 'MCP Server',
      keywords: (item) => [
        'MCP Server',
        'Model Context Protocol',
        'AI Development',
        item.category,
        'Claude',
        ...(item.tags || []),
      ],
      requirements: (item) => {
        const base = ['Claude Desktop or Claude Code'];
        return isMcpContent(item) && item.installation?.requirements
          ? [...base, ...item.installation.requirements]
          : base;
      },
      configuration: (item) => (isMcpContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'MCP server configuration',
    },
    categoryDisplayName: 'MCP Servers',
  },
  rules: {
    schemaTypes: {
      application: true,
      creativeWork: true,
      howTo: true,
      breadcrumb: true,
      speakable: true,
    },
    extractors: {
      applicationSubCategory: () => 'Development Rule',
      keywords: (item) => [
        'Development Rule',
        'Code Standards',
        'Best Practices',
        item.category,
        'Claude',
        ...(item.tags || []),
      ],
      requirements: () => ['Claude Desktop or Claude Code'],
      configuration: (item) => (isRuleContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'Development rule and best practices',
    },
    categoryDisplayName: 'Rules',
  },
  statuslines: {
    schemaTypes: {
      application: true,
      sourceCode: true,
      howTo: true,
      breadcrumb: true,
    },
    extractors: {
      applicationSubCategory: (item) =>
        isStatuslineContent(item)
          ? `${item.statuslineType || 'Statusline'} - CLI Statusline`
          : 'CLI Statusline',
      keywords: (item) => {
        const statuslineType = isStatuslineContent(item) ? item.statuslineType : undefined;
        return [
          'Claude Statusline',
          'CLI Statusline',
          'Terminal Customization',
          statuslineType || 'Statusline',
          item.category,
          'Claude',
          ...(item.tags || []),
        ];
      },
      requirements: (item) => {
        const base = ['Claude Desktop or Claude Code'];
        return isStatuslineContent(item) && item.requirements
          ? [...base, ...item.requirements]
          : base;
      },
      configuration: (item) => (isStatuslineContent(item) ? item.configuration : undefined),
      creativeWorkDescription: () => 'Statusline display script',
    },
    categoryDisplayName: 'Statuslines',
  },
  skills: {
    schemaTypes: {
      sourceCode: true,
      howTo: true,
      creativeWork: true,
      faq: true,
      breadcrumb: true,
      speakable: true,
    },
    extractors: {
      applicationSubCategory: () => 'Skill Guide',
      keywords: (item) => ['Claude Skill', 'Document Processing', item.category, 'Claude', ...(item.tags || [])],
      requirements: (item) => (isSkillContent(item) && item.requirements ? item.requirements : []),
      configuration: () => undefined,
      creativeWorkDescription: () => 'Skill guide and examples',
    },
    categoryDisplayName: 'Skills',
  },
};

/**
 * generateAllSchemasForContent()
 * Central orchestrator for schema generation - replaces scattered inline logic
 * Configuration-driven approach using STRUCTURED_DATA_RULES
 */
export function generateAllSchemasForContent(item: UnifiedContent): SchemaObject[] {
  const schemas: SchemaObject[] = [];
  const rules = STRUCTURED_DATA_RULES[item.category];

  // Type-safe property access
  const itemTitle = 'title' in item ? (item.title as string | undefined) : undefined;
  const itemName = 'name' in item ? (item.name as string | undefined) : undefined;
  const itemGithubUrl = 'githubUrl' in item ? (item.githubUrl as string | undefined) : undefined;
  const itemLastModified =
    'lastModified' in item ? (item.lastModified as string | undefined) : undefined;
  const itemFeatures = 'features' in item ? (item.features as string[] | undefined) : undefined;

  const displayName = itemTitle || itemName || item.slug;
  const displayTitle = itemTitle || itemName || item.slug;

  // 1. SoftwareApplication Schema
  if (rules.schemaTypes.application) {
    schemas.push(
      buildSoftwareApplication({
        slug: item.slug,
        name: displayName,
        description: item.description,
        category: item.category,
        applicationSubCategory: rules.extractors.applicationSubCategory(item),
        keywords: rules.extractors.keywords(item),
        author: item.author,
        githubUrl: itemGithubUrl,
        dateAdded: item.dateAdded,
        lastModified: itemLastModified,
        features: itemFeatures,
        requirements: rules.extractors.requirements(item),
        configuration: rules.extractors.configuration(item),
      })
    );
  }

  // 2. SoftwareSourceCode Schema(s)
  if (rules.schemaTypes.sourceCode) {
    schemas.push(...generateSourceCodeSchemas(item, displayName, itemGithubUrl));
  }

  // 3. CreativeWork Schema
  if (rules.schemaTypes.creativeWork && item.content) {
    schemas.push(
      buildCreativeWork({
        slug: item.slug,
        category: item.category,
        name: displayName,
        description: rules.extractors.creativeWorkDescription(item),
        content: item.content,
        author: item.author,
      })
    );
  }

  // 4. HowTo Schema
  if (rules.schemaTypes.howTo) {
    schemas.push(
      buildHowTo({
        slug: item.slug,
        category: item.category,
        name: displayName,
        description: `Step-by-step guide to implement ${displayName}`,
        steps: generateHowToSteps(item, displayName, rules.categoryDisplayName),
      })
    );
  }

  // 5. FAQPage Schema
  if (
    rules.schemaTypes.faq &&
    isMcpContent(item) &&
    item.troubleshooting &&
    item.troubleshooting.length > 0
  ) {
    schemas.push(
      buildFAQPage(item.slug, item.category, displayName, item.troubleshooting as FAQItem[])
    );
  }

  // 6. Breadcrumb Schema
  if (rules.schemaTypes.breadcrumb) {
    schemas.push(
      buildBreadcrumb([
        { name: 'Home', url: '/' },
        { name: rules.categoryDisplayName, url: `/${item.category}` },
        {
          name: displayTitle,
          url: getContentItemUrl({ category: item.category, slug: item.slug }),
        },
      ])
    );
  }

  // 7. WebPage Speakable Schema
  if (rules.schemaTypes.speakable) {
    schemas.push(buildWebPageSpeakable(item.slug, item.category));
  }

  return schemas;
}

/**
 * Helper: Generate source code schemas for all content types
 * Centralized from scattered inline logic in unified-structured-data.tsx
 */
function generateSourceCodeSchemas(
  item: UnifiedContent,
  displayName: string,
  githubUrl?: string
): SchemaObject[] {
  const schemas: SchemaObject[] = [];

  // Agent configuration
  if (isAgentContent(item) && item.configuration) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Configuration`,
        description: 'Agent configuration for Claude',
        programmingLanguage: 'JSON',
        code: JSON.stringify(item.configuration, null, 2),
        encodingFormat: 'application/json',
        githubUrl,
        fragmentId: 'configuration',
      })
    );
  }

  // Command content
  if (isCommandContent(item) && item.content) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Command`,
        description: 'Command syntax and configuration',
        programmingLanguage: 'Claude Command',
        code: item.content,
        encodingFormat: 'text/plain',
        githubUrl,
        fragmentId: 'command',
      })
    );
  }

  // Hook script
  if (isHookContent(item) && item.configuration?.scriptContent) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Script`,
        description: `${item.hookType || 'Hook'} script for Claude`,
        programmingLanguage: 'Shell Script',
        code: item.configuration.scriptContent,
        encodingFormat: 'text/x-shellscript',
        githubUrl,
        fragmentId: 'script',
      })
    );

    if (item.configuration.hookConfig) {
      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Configuration`,
          description: 'Hook configuration',
          programmingLanguage: 'JSON',
          code: JSON.stringify(item.configuration.hookConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl,
          fragmentId: 'config',
        })
      );
    }
  }

  // MCP configurations
  if (isMcpContent(item)) {
    if (item.configuration?.claudeDesktop) {
      const displayConfig = transformMcpConfigForDisplay(
        item.configuration.claudeDesktop as Record<string, unknown>
      );

      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Desktop Config`,
          description: 'Configuration for Claude Desktop',
          programmingLanguage: 'JSON',
          code: JSON.stringify(displayConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl,
          fragmentId: 'claude-desktop-config',
        })
      );
    }

    if (item.configuration?.claudeCode) {
      const displayConfig = transformMcpConfigForDisplay(
        item.configuration.claudeCode as Record<string, unknown>
      );

      schemas.push(
        buildSoftwareSourceCode({
          slug: item.slug,
          category: item.category,
          name: `${displayName} - Claude Code Config`,
          description: 'Configuration for Claude Code',
          programmingLanguage: 'JSON',
          code: JSON.stringify(displayConfig, null, 2),
          encodingFormat: 'application/json',
          githubUrl,
          fragmentId: 'claude-code-config',
        })
      );
    }
  }

  // Statusline script
  if (isStatuslineContent(item) && item.content) {
    schemas.push(
      buildSoftwareSourceCode({
        slug: item.slug,
        category: item.category,
        name: `${displayName} - Script`,
        description: `${item.statuslineType || 'Statusline'} script for Claude Code`,
        programmingLanguage: item.configuration?.format === 'python' ? 'Python' : 'Shell Script',
        code: item.content,
        encodingFormat:
          item.configuration?.format === 'python' ? 'text/x-python' : 'text/x-shellscript',
        githubUrl,
        fragmentId: 'script',
      })
    );
  }

  return schemas;
}

/**
 * Helper: Generate HowTo steps for all content types
 * Centralized from scattered inline logic in unified-structured-data.tsx
 */
function generateHowToSteps(
  item: UnifiedContent,
  displayName: string,
  categoryDisplayName: string
) {
  const baseSteps = [
    {
      position: 1,
      name: 'Open Claude Desktop or Claude Code',
      text: 'Launch your Claude application',
    },
    {
      position: 2,
      name: `Navigate to ${categoryDisplayName}`,
      text: `Access the ${item.category} configuration section`,
    },
  ];

  if (isAgentContent(item) || isCommandContent(item) || isRuleContent(item)) {
    const configCode = item.configuration ? JSON.stringify(item.configuration, null, 2) : undefined;
    baseSteps.push({
      position: 3,
      name: 'Apply configuration',
      text: `Copy and apply the ${displayName} configuration`,
      ...(configCode && { code: configCode, programmingLanguage: 'json' }),
    });
  }

  if (isHookContent(item)) {
    const scriptContent = item.configuration?.scriptContent;
    baseSteps.push({
      position: 3,
      name: 'Create hook script',
      text: 'Create the hook script file',
      ...(scriptContent && {
        code: scriptContent,
        programmingLanguage: 'bash',
      }),
    });
  }

  if (isMcpContent(item)) {
    const installText =
      typeof item.installation?.claudeCode === 'string'
        ? item.installation.claudeCode
        : item.package
          ? `npm install ${item.package}`
          : 'Install the MCP server package';
    baseSteps.push({
      position: 3,
      name: 'Install MCP server',
      text: installText,
    });
  }

  return baseSteps;
}
