/**
 * Content Type Configurations
 *
 * Detail page rendering configuration for all content types.
 * Derives metadata from unified category registry to eliminate duplication.
 *
 * This file contains ONLY detail-page-specific behavior:
 * - Primary actions (handlers, icons)
 * - Section visibility flags
 * - Generator functions (installation, use cases, troubleshooting)
 *
 * All base metadata (typeName, icon, colorScheme) imported from category-config.ts.
 *
 * @see lib/config/category-config.ts - Single source of truth for category metadata
 * @see lib/types/content-type-config.ts - Type definitions
 * @see components/unified-detail-page.tsx - Component consumer
 */

import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import {
  commonActions,
  createNotificationAction,
} from '@/src/lib/config/factories/action-factories';
import {
  commonGenerators,
  createTroubleshootingGenerator,
  createUseCasesGenerator,
} from '@/src/lib/config/factories/generator-factories';
import { BookOpen, Bot } from '@/src/lib/icons';
import type { ContentTypeConfigRegistry } from '@/src/lib/types/content-type-config';

/**
 * Agent Configuration
 */
const agentConfig: Partial<ContentTypeConfigRegistry['agents']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: createNotificationAction(
    'Deploy Agent',
    <Bot className={'h-4 w-4 mr-2'} />,
    'Agent Deployment',
    'Copy the agent content and follow the installation instructions.'
  ),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: true,
    security: false,
    troubleshooting: false,
    examples: false,
  },

  generators: {
    installation: (item) => ({
      claudeCode: {
        steps: [
          'Create agent directory: mkdir -p .claude/agents (project-level) or ~/.claude/agents (user-level)',
          `Create agent file: ${item.slug}.md in the agents directory`,
          'Use YAML frontmatter format with name, description, and optional tools',
          "Add your agent's system prompt as markdown content below the frontmatter",
          'Use /agents command in Claude Code to manage your subagents',
        ],
        configFormat: 'Markdown file with YAML frontmatter',
        configPath: {
          project: `.claude/agents/${item.slug}.md`,
          user: `~/.claude/agents/${item.slug}.md`,
        },
      },
      requirements: ['Claude Code or Claude SDK', 'Access to specified tools and functions'],
    }),

    useCases: createUseCasesGenerator([
      'Automate specialized development workflows',
      'Provide expert guidance in specific domains',
      'Enhance code quality and maintainability',
    ]),

    requirements: (item) => {
      const baseRequirements = ['Claude Code or Claude SDK'];
      const detectedRequirements: string[] = [];

      if ('configuration' in item && typeof item.configuration === 'object') {
        const config = item.configuration as Record<string, unknown>;
        if (config?.tools && Array.isArray(config.tools) && config.tools.length > 0) {
          detectedRequirements.push('Access to specified tools and functions');
        }
        if (config?.temperature || config?.maxTokens) {
          detectedRequirements.push('Claude API access with custom parameters');
        }
      }

      return [...baseRequirements, ...detectedRequirements];
    },
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Command Configuration
 */
const commandConfig: Partial<ContentTypeConfigRegistry['commands']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.copyCommand(),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: false,
    security: false,
    troubleshooting: true,
    examples: false,
  },

  generators: {
    installation: (item) => ({
      claudeCode: {
        steps: [
          'Create command directory: mkdir -p .claude/commands (project-level) or ~/.claude/commands (user-level)',
          `Create command file: ${item.slug}.md in the commands directory`,
          'Use YAML frontmatter format with allowed-tools, argument-hint, description, and model',
          "Add your command's prompt template as markdown content below the frontmatter",
          `Use /${item.slug} to execute the command in Claude Code`,
        ],
        configFormat: 'Markdown file with YAML frontmatter',
        configPath: {
          project: `.claude/commands/${item.slug}.md`,
          user: `~/.claude/commands/${item.slug}.md`,
        },
      },
      requirements: ['Claude Code CLI', 'Command-specific dependencies (see content below)'],
    }),

    useCases: createUseCasesGenerator(
      [
        'Execute {title} to automate repetitive tasks',
        'Integrate {title} into development workflows',
        'Streamline code review and quality assurance processes',
      ],
      { useDisplayTitle: true }
    ),

    troubleshooting: createTroubleshootingGenerator(
      [
        {
          issue: '{title} command not recognized',
          solution:
            'Ensure Claude Code is properly installed and the command is configured in .claude/commands/',
        },
        {
          issue: 'Command execution timeout',
          solution:
            'Check your network connection and try again. For large projects, consider breaking down the task.',
        },
      ],
      { useDisplayTitle: true }
    ),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Hook Configuration
 */
const hookConfig: Partial<ContentTypeConfigRegistry['hooks']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.viewHookOnGitHub(),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: true,
    security: false,
    troubleshooting: true,
    examples: false,
  },

  generators: {
    installation: (item) => ({
      claudeCode: {
        steps: [
          'Create hooks directory: mkdir -p .claude/hooks',
          `Create hook script: .claude/hooks/${item.slug}.sh`,
          'Add hook configuration to your Claude Code config',
          `Make script executable: chmod +x .claude/hooks/${item.slug}.sh`,
          'Restart Claude Code to activate the hook',
        ],
        configPath: {
          project: '.claude/hooks/',
          user: '~/.claude/hooks/',
        },
      },
      requirements: [
        'Claude Code CLI',
        'Bash shell',
        'Hook-specific dependencies (e.g., jq, prettier)',
      ],
    }),

    useCases: createUseCasesGenerator([
      'Automate code formatting and quality checks',
      'Trigger workflows on specific events',
      'Integrate with external tools and services',
    ]),

    troubleshooting: commonGenerators.staticTroubleshooting([
      {
        issue: 'Hook script not executing',
        solution: 'Verify script has executable permissions (chmod +x) and correct shebang line.',
      },
      {
        issue: 'Hook dependencies not found',
        solution: 'Install required tools (jq, prettier, etc.) and ensure they are in your PATH.',
      },
    ]),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * MCP Server Configuration
 */
const mcpConfig: Partial<ContentTypeConfigRegistry['mcp']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.viewConfiguration(),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: true,
    security: true,
    troubleshooting: true,
    examples: true,
  },

  generators: {
    installation: (_item) => ({
      claudeDesktop: {
        steps: [
          'Obtain API key or credentials from service provider',
          'Open your Claude Desktop configuration file',
          'Add the MCP server configuration with your credentials',
          'Restart Claude Desktop',
          'Verify connection by testing a sample query',
        ],
        configPath: {
          macOS: '~/Library/Application Support/Claude/claude_desktop_config.json',
          windows: '%APPDATA%\\Claude\\claude_desktop_config.json',
          linux: '~/.config/claude/claude_desktop_config.json',
        },
      },
      requirements: [
        'Node.js 18+ for npm-based servers',
        'Valid API credentials',
        'Network access',
      ],
    }),

    useCases: createUseCasesGenerator([
      'Access external data sources and APIs',
      'Integrate with third-party services',
      'Extend Claude capabilities with custom tools',
    ]),

    troubleshooting: commonGenerators.staticTroubleshooting([
      {
        issue: 'Connection timeout or server not responding',
        solution:
          'Check network connectivity and verify server URL endpoints. Ensure firewall allows outbound connections.',
      },
      {
        issue: 'Authentication errors or invalid credentials',
        solution:
          'Verify API key format and permissions. Check if credentials need to be refreshed or renewed.',
      },
    ]),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Rule Configuration
 */
const ruleConfig: Partial<ContentTypeConfigRegistry['rules']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: createNotificationAction(
    'Use Rule',
    <BookOpen className={'h-4 w-4 mr-2'} />,
    'Rule Integration',
    'Copy the rule content and add it to your Claude configuration.'
  ),

  sections: {
    features: false,
    installation: false,
    useCases: true,
    configuration: true,
    security: false,
    troubleshooting: false,
    examples: false,
  },

  generators: {
    useCases: createUseCasesGenerator(
      [
        'Improve code quality and consistency',
        'Provide specialized guidance in your domain',
        'Ensure best practices in development workflows',
      ],
      {
        tagMapping: {
          api: ['Design and review RESTful APIs and GraphQL schemas'],
          security: ['Conduct security reviews and vulnerability assessments'],
          frontend: ['Review frontend architecture and component design'],
          backend: ['Design scalable backend architectures'],
        },
      }
    ),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Statusline Configuration
 */
const statuslineConfig: Partial<ContentTypeConfigRegistry['statuslines']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.copyScript(),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: true,
    security: false,
    troubleshooting: true,
    examples: false,
  },

  generators: {
    installation: (_item) => ({
      claudeCode: {
        steps: [
          'Save the statusline script to ~/.claude/statusline.sh (or your preferred location)',
          'Make the script executable: chmod +x ~/.claude/statusline.sh',
          'Open ~/.claude/settings.json in your text editor',
          'Add the statusLine configuration (see example below)',
          'Restart Claude Code to activate your new statusline',
        ],
        configFormat: 'JSON configuration in .claude/settings.json',
        configPath: {
          macOS: '~/.claude/settings.json',
          windows: '%USERPROFILE%\\.claude\\settings.json',
          linux: '~/.claude/settings.json',
        },
        configExample: {
          statusLine: {
            type: 'command',
            command: '~/.claude/statusline.sh',
            padding: 0,
          },
        },
      },
      requirements: ['Claude Code CLI', 'Bash shell', 'Terminal with color support'],
    }),

    useCases: createUseCasesGenerator([
      'Display real-time session information in CLI',
      'Customize terminal appearance and branding',
      'Show project context and status at a glance',
    ]),

    requirements: (item) => {
      const baseRequirements = ['Claude Code CLI', 'Bash shell'];
      const detectedRequirements: string[] = [];

      if ('configuration' in item && typeof item.configuration === 'object' && item.configuration) {
        const config = item.configuration as Record<string, unknown>;
        if (config?.format === 'python') {
          detectedRequirements.push('Python 3.6+');
        } else if (config?.format === 'javascript') {
          detectedRequirements.push('Node.js 18+');
        }
        if (config?.colorScheme) {
          detectedRequirements.push('Terminal with color support (256 colors or truecolor)');
        }
      }

      return [...baseRequirements, ...detectedRequirements];
    },

    troubleshooting: commonGenerators.staticTroubleshooting([
      {
        issue: 'Statusline not displaying or showing incorrect output',
        solution:
          'Verify script has executable permissions and test it independently. Check Claude Code config path is correct.',
      },
      {
        issue: 'Colors not rendering correctly',
        solution:
          'Ensure your terminal supports color codes. Try setting TERM=xterm-256color environment variable.',
      },
    ]),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Collection Configuration
 */
const collectionConfig: Partial<ContentTypeConfigRegistry['collections']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.viewCollection(),

  sections: {
    features: false,
    installation: false,
    useCases: true,
    configuration: false,
    security: false,
    troubleshooting: false,
    examples: false,
  },

  generators: {
    useCases: createUseCasesGenerator([
      'Quick start with pre-configured bundles',
      'Explore curated workflows and best practices',
      'Discover related content organized by theme',
    ]),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
};

/**
 * Skill Configuration
 */
const skillConfig: Partial<ContentTypeConfigRegistry['skills']> = {
  // Base properties (typeName, icon, colorScheme) auto-injected by getContentTypeConfig()

  primaryAction: commonActions.applySkill(),

  sections: {
    features: true,
    installation: true,
    useCases: true,
    configuration: false,
    security: false,
    troubleshooting: true,
    examples: true,
  },

  generators: {
    useCases: createUseCasesGenerator(
      [
        'Apply {title} in real-world workflows',
        'Automate tedious document tasks',
        'Integrate into CI scripts and pipelines',
      ],
      { useDisplayTitle: true }
    ),
    installation: (item) => ({
      claudeDesktop: {
        steps: [
          'Ensure required CLI tools are installed (see requirements below)',
          'Restart Claude Desktop if new tools were added',
        ],
      },
      claudeCode: {
        steps: ['Install Python/Node packages as required', 'Verify versions match guide'],
      },
      requirements:
        'requirements' in item &&
        Array.isArray(item.requirements) &&
        item.requirements.length > 0 &&
        item.requirements.every((r): r is string => typeof r === 'string')
          ? item.requirements
          : ['Install dependencies noted in the guide'],
    }),
  },

  // Metadata (categoryLabel, showGitHubLink, githubPathPrefix) auto-injected by getContentTypeConfig()
  // Note: skills has showGitHubLink: false (exception), will be handled by auto-derivation
};

/**
 * Content Type Configuration Registry
 *
 * Central registry of all content type configurations.
 * Used internally by getContentTypeConfig function.
 *
 * Note: Base properties (typeName, icon, colorScheme) and metadata
 * are auto-injected by getContentTypeConfig() from UNIFIED_CATEGORY_REGISTRY.
 */
const contentTypeConfigs = {
  agents: agentConfig,
  commands: commandConfig,
  hooks: hookConfig,
  mcp: mcpConfig,
  rules: ruleConfig,
  statuslines: statuslineConfig,
  collections: collectionConfig,
  skills: skillConfig,
  guides: ruleConfig, // Guides use same config as rules for now
} as const;

/**
 * Get configuration for a content type with auto-injected metadata
 *
 * Auto-derives properties from UNIFIED_CATEGORY_REGISTRY to eliminate duplication:
 * - Base properties: typeName, icon, colorScheme
 * - Metadata: categoryLabel, showGitHubLink, githubPathPrefix
 *
 * Benefits:
 * - DRY: Single source of truth (UNIFIED_CATEGORY_REGISTRY)
 * - Type-safe: Full TypeScript validation
 * - Future-proof: New categories automatically get correct metadata
 *
 * @param category - Category identifier (agents, mcp, commands, etc.)
 * @returns Complete configuration with auto-injected metadata, or null if not found
 */
export function getContentTypeConfig(
  category: string
): ContentTypeConfigRegistry[keyof ContentTypeConfigRegistry] | null {
  const normalizedCategory = category.toLowerCase();

  // Type-safe lookup with explicit keys
  type ConfigKey = keyof typeof contentTypeConfigs;
  const configKey = normalizedCategory as ConfigKey;

  if (!(configKey in contentTypeConfigs)) return null;

  const config = contentTypeConfigs[configKey];
  if (!config) return null;

  // Get category metadata from registry
  type RegistryKey = keyof typeof UNIFIED_CATEGORY_REGISTRY;
  const registryKey = normalizedCategory as RegistryKey;

  if (!(registryKey in UNIFIED_CATEGORY_REGISTRY)) {
    // Return config as-is if no registry entry (with type assertion for complete config)
    return config as ContentTypeConfigRegistry[keyof ContentTypeConfigRegistry];
  }

  const categoryMeta = UNIFIED_CATEGORY_REGISTRY[registryKey];

  // Auto-inject base properties
  const enhancedConfig = {
    ...config,
    typeName: categoryMeta.title,
    icon: categoryMeta.icon,
    colorScheme: categoryMeta.colorScheme,
  };

  // Auto-inject metadata
  enhancedConfig.metadata = {
    ...config.metadata,
    categoryLabel: categoryMeta.title,
    // GitHub link defaults to true except for skills
    showGitHubLink: config.metadata?.showGitHubLink ?? normalizedCategory !== 'skills',
    // GitHub path: agents uses direct contentLoader, others use content/ prefix
    githubPathPrefix:
      config.metadata?.githubPathPrefix ||
      (normalizedCategory === 'agents'
        ? categoryMeta.contentLoader
        : `content/${categoryMeta.contentLoader}`),
  };

  return enhancedConfig as ContentTypeConfigRegistry[keyof ContentTypeConfigRegistry];
}
