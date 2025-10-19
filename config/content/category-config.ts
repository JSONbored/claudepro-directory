/**
 * Unified Category Configuration Registry
 *
 * Single source of truth for ALL content generation categories.
 * Replaces individual template files with pure configuration.
 *
 * Replaces:
 * - statusline-template.ts (423 lines)
 * - hooks-template.ts (410 lines)
 * - mcp-template.ts (491 lines)
 * - commands-template.ts (would be ~400 lines)
 * - rules-template.ts (would be ~400 lines)
 * - agents-template.ts (would be ~400 lines)
 * - skills-template.ts (would be ~400 lines)
 * - collections-template.ts (would be ~400 lines)
 *
 * Total: ~3,300 lines deleted, ~800 lines of config added
 * Net: -2,500 lines
 *
 * @module config/content/category-config
 */

import type { CategoryId } from '@/src/lib/config/category-types';
import { agentContentSchema } from '@/src/lib/schemas/content/agent.schema';
import { collectionContentSchema } from '@/src/lib/schemas/content/collection.schema';
import { commandContentSchema } from '@/src/lib/schemas/content/command.schema';
import { hookContentSchema } from '@/src/lib/schemas/content/hook.schema';
import { mcpContentSchema } from '@/src/lib/schemas/content/mcp.schema';
import { ruleContentSchema } from '@/src/lib/schemas/content/rule.schema';
import { skillContentSchema } from '@/src/lib/schemas/content/skill.schema';
import { statuslineContentSchema } from '@/src/lib/schemas/content/statusline.schema';
import { KEYWORD_STRATEGIES } from './discovery/trend-detection';
import type { ContentGenerationRules } from './generation-rules';
import { CATEGORY_VALIDATORS } from './validation/category-validators';
import type { CategoryValidationConfig } from './validation/generic-validator';

/**
 * Complete Category Configuration
 *
 * Everything needed to generate, validate, and manage content for a category.
 */
export interface CategoryConfig {
  schema: z.ZodType; // Zod schema for this category
  validation: CategoryValidationConfig;
  generation: ContentGenerationRules;
}

/**
 * Unified Category Configuration Registry
 *
 * Configuration for all 8 generatable categories.
 * (guides, jobs, changelog are manually curated, not generated)
 */
export const CATEGORY_CONFIG: Record<CategoryId, CategoryConfig | null> = {
  // ================================================
  // STATUSLINES
  // ================================================
  statuslines: {
    schema: statuslineContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'title',
        'seoTitle',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'statuslineType',
        'configuration',
        'troubleshooting',
        'preview',
      ],
      optionalButRecommended: ['features', 'useCases', 'examples', 'documentationUrl'],
      categorySpecificValidator: CATEGORY_VALIDATORS.statuslines,
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_cli_tools', weight: 0.35, enabled: true },
          { name: 'reddit_commandline', weight: 0.3, enabled: true },
          { name: 'hackernews_cli', weight: 0.2, enabled: true },
          { name: 'dev_to_cli', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.statuslines.primary,
          longtail: [
            'powerline statusline configuration',
            'minimal CLI statusline examples',
            'git branch statusline display',
            'real-time statusline updates',
            'docker container statusline',
            'kubernetes pod statusline',
            'custom bash statusline script',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'statuslines for specific frameworks (Docker, K8s, AWS)',
            'statuslines for monitoring tools (Datadog, New Relic)',
            'statuslines with unique data sources (APIs, databases)',
            'statuslines for specific shells (fish, zsh, bash)',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: {
          verifyInstallation: true,
          verifyOutput: true,
          checkCompatibility: ['bash', 'zsh', 'fish'],
        },
        depthRequirements: {
          useCases: { min: 3, max: 5 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['statusline', 'CLI', 'configuration', 'Claude Code'],
            recommended: ['terminal', 'prompt', 'customization', 'automation'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'code_verification',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: true,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: true,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // HOOKS
  // ================================================
  hooks: {
    schema: hookContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'hookType',
        'configuration',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'requirements', 'installation'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_automation', weight: 0.35, enabled: true },
          { name: 'reddit_devops', weight: 0.3, enabled: true },
          { name: 'hackernews_automation', weight: 0.2, enabled: true },
          { name: 'dev_to_automation', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.hooks.primary,
          longtail: [
            'Claude Code lifecycle hooks',
            'PreToolUse hook automation',
            'PostToolUse hook examples',
            'SessionStart hook configuration',
            'automatic code validation hooks',
            'CI/CD integration hooks',
            'custom workflow automation',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'hooks for specific tools (git, npm, docker)',
            'hooks for specific frameworks (React, Next.js, Vue)',
            'hooks for specific workflows (testing, linting, deployment)',
            'hooks for specific events (SessionStart, Stop, PreCompact)',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: {
          verifyInstallation: true,
          verifyOutput: true,
          checkCompatibility: ['bash', 'zsh', 'fish', 'node', 'python'],
        },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 2 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['hook', 'automation', 'Claude Code'],
            recommended: ['lifecycle', 'workflow', 'event-driven'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'code_verification',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // MCP SERVERS
  // ================================================
  mcp: {
    schema: mcpContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'configuration',
        'troubleshooting',
      ],
      optionalButRecommended: [
        'features',
        'useCases',
        'package',
        'installation',
        'security',
        'requiresAuth',
        'authType',
        'examples',
      ],
      categorySpecificValidator: CATEGORY_VALIDATORS.mcp,
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_mcp_servers', weight: 0.4, enabled: true },
          { name: 'mcp_official_servers', weight: 0.3, enabled: true },
          { name: 'reddit_ai', weight: 0.2, enabled: true },
          { name: 'dev_to_ai', weight: 0.1, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.mcp.primary,
          longtail: [
            'Model Context Protocol servers',
            'Claude Desktop MCP integration',
            'Claude Code MCP servers',
            'stdio MCP server examples',
            'MCP server authentication',
            'official MCP servers list',
            'custom MCP server development',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'MCP servers for specific APIs (payment, CRM, analytics)',
            'MCP servers for databases (PostgreSQL, MongoDB, Redis)',
            'MCP servers for cloud platforms (AWS, GCP, Azure)',
            'MCP servers for developer tools (GitHub, GitLab, Linear)',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: {
          verifyInstallation: true,
          verifyOutput: true,
          checkCompatibility: ['claude-desktop', 'claude-code'],
        },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['MCP server', 'Claude', 'integration'],
            recommended: ['protocol', 'API', 'authentication'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'code_verification',
          'auth_research',
          'security_analysis',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // COMMANDS
  // ================================================
  commands: {
    schema: commandContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'configuration', 'installation', 'examples'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_cli_commands', weight: 0.35, enabled: true },
          { name: 'reddit_cli', weight: 0.3, enabled: true },
          { name: 'hackernews_tools', weight: 0.2, enabled: true },
          { name: 'dev_to_productivity', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.commands.primary,
          longtail: [
            'Claude Code slash commands',
            'custom command configuration',
            'markdown command templates',
            'CLI automation commands',
            'command argument parsing',
            'workflow automation commands',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'commands for specific workflows (testing, deployment)',
            'commands for specific tools (git, npm, docker)',
            'commands with argument parsing',
            'commands for code generation',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: { verifyInstallation: true, verifyOutput: true, checkCompatibility: [] },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['command', 'Claude Code', 'markdown'],
            recommended: ['automation', 'CLI', 'workflow'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // RULES
  // ================================================
  rules: {
    schema: ruleContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'configuration', 'examples'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_configs', weight: 0.35, enabled: true },
          { name: 'reddit_programming', weight: 0.3, enabled: true },
          { name: 'hackernews_tools', weight: 0.2, enabled: true },
          { name: 'dev_to_best_practices', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.rules.primary,
          longtail: [
            'ESLint rules configuration',
            'TypeScript rules best practices',
            'custom linting rules',
            'code quality rules',
            'validation rules setup',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'rules for specific frameworks (React, Vue, Angular)',
            'rules for specific tools (ESLint, Biome, Prettier)',
            'rules for code quality (complexity, duplication)',
            'rules for security validation',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: { verifyInstallation: true, verifyOutput: true, checkCompatibility: [] },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['rules', 'configuration', 'validation'],
            recommended: ['linting', 'code quality', 'best practices'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // AGENTS
  // ================================================
  agents: {
    schema: agentContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'configuration', 'examples'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_ai_agents', weight: 0.4, enabled: true },
          { name: 'reddit_ai', weight: 0.3, enabled: true },
          { name: 'hackernews_ai', weight: 0.2, enabled: true },
          { name: 'dev_to_ai', weight: 0.1, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.agents.primary,
          longtail: [
            'AI agent configuration',
            'Claude Code agents',
            'specialized task agents',
            'agent orchestration',
            'autonomous agents',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'agents for specific tasks (code review, testing)',
            'agents for specific domains (security, performance)',
            'agents with specialized knowledge',
            'multi-agent workflows',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: { verifyInstallation: true, verifyOutput: true, checkCompatibility: [] },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['agent', 'AI', 'automation'],
            recommended: ['autonomous', 'specialized', 'orchestration'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // SKILLS
  // ================================================
  skills: {
    schema: skillContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'configuration', 'examples'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_skills', weight: 0.35, enabled: true },
          { name: 'reddit_productivity', weight: 0.3, enabled: true },
          { name: 'hackernews_tools', weight: 0.2, enabled: true },
          { name: 'dev_to_tutorials', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.skills.primary,
          longtail: [
            'Claude Code skills',
            'reusable capabilities',
            'skill configuration',
            'skill integration',
            'automation skills',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'skills for specific domains (web, mobile, data)',
            'skills for specific tools (git, docker, aws)',
            'skills for specific workflows',
            'skills with external integrations',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: { verifyInstallation: true, verifyOutput: true, checkCompatibility: [] },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['skill', 'Claude Code', 'capability'],
            recommended: ['reusable', 'integration', 'automation'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // COLLECTIONS
  // ================================================
  collections: {
    schema: collectionContentSchema,
    validation: {
      requiredFields: [
        'slug',
        'description',
        'author',
        'dateAdded',
        'tags',
        'category',
        'troubleshooting',
      ],
      optionalButRecommended: ['features', 'useCases', 'items'],
    },
    generation: {
      discovery: {
        trendingSources: [
          { name: 'github_bundles', weight: 0.35, enabled: true },
          { name: 'reddit_productivity', weight: 0.3, enabled: true },
          { name: 'hackernews_tools', weight: 0.2, enabled: true },
          { name: 'dev_to_productivity', weight: 0.15, enabled: true },
        ],
        keywordStrategy: {
          primary: KEYWORD_STRATEGIES.collections.primary,
          longtail: [
            'configuration bundles',
            'starter kits',
            'workflow collections',
            'tool bundles',
            'setup collections',
          ],
          searchIntent: 'implementation',
        },
        contentGaps: {
          checkExisting: true,
          prioritizeGaps: [
            'collections for specific stacks (MERN, JAMstack)',
            'collections for specific workflows (CI/CD, testing)',
            'collections for specific tools',
            'collections for getting started',
          ],
        },
      },
      research: {
        requiredSources: { min: 3, types: ['official_docs', 'community_example', 'github_repo'] },
        validation: { verifyInstallation: true, verifyOutput: true, checkCompatibility: [] },
        depthRequirements: {
          useCases: { min: 3, max: 6 },
          features: { min: 4, max: 8 },
          examples: { min: 1, max: 3 },
          troubleshooting: { min: 4, max: 5 },
        },
      },
      quality: {
        seo: {
          keywords: {
            required: ['collection', 'bundle', 'configurations'],
            recommended: ['starter', 'workflow', 'setup'],
            avoid: ['generic', 'simple', 'basic'],
          },
        },
        accuracy: { codeVerification: true, linkValidation: true, versionCheck: true },
      },
      generation: {
        workflow: [
          'discover_trending_topics',
          'keyword_research',
          'gap_analysis',
          'source_collection',
          'content_drafting',
          'seo_optimization',
          'quality_validation',
          'schema_validation',
        ],
        automation: {
          autoGeneratePreview: false,
          autoExtractFeatures: true,
          autoSuggestTags: true,
          autoOptimizeTitle: false,
          autoGenerateDateAdded: true,
        },
        validation: { strict: true, blockOnError: true },
      },
    },
  },

  // ================================================
  // MANUALLY CURATED (no generation config)
  // ================================================
  guides: null, // Manually written guides
  jobs: null, // Manually curated job listings
  changelog: null, // Auto-generated from git commits
};
