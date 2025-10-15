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

import { toast } from 'sonner';
import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { BookOpen, Bot, Layers, Server, Terminal, Webhook } from '@/src/lib/icons';
import type { ContentTypeConfigRegistry } from '@/src/lib/types/content-type-config';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { getDisplayTitle } from '@/src/lib/utils';
import { copyToClipboard } from '@/src/lib/utils/browser.utils';

/**
 * Agent Configuration
 */
const agentConfig: ContentTypeConfigRegistry['agents'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.agents.title,
  icon: UNIFIED_CATEGORY_REGISTRY.agents.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.agents.colorScheme,

  primaryAction: {
    label: 'Deploy Agent',
    icon: <Bot className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: () => {
      toast.success('Agent Deployment', {
        description: 'Copy the agent content and follow the installation instructions.',
      });
    },
  },

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

    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      return [
        'Automate specialized development workflows',
        'Provide expert guidance in specific domains',
        'Enhance code quality and maintainability',
      ];
    },

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

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.agents.title,
    showGitHubLink: true,
    githubPathPrefix: UNIFIED_CATEGORY_REGISTRY.agents.contentLoader,
  },
};

/**
 * Command Configuration
 */
const commandConfig: ContentTypeConfigRegistry['commands'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.commands.title,
  icon: UNIFIED_CATEGORY_REGISTRY.commands.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.commands.colorScheme,

  primaryAction: {
    label: 'Copy Command',
    icon: <Terminal className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: async (item) => {
      const contentToCopy =
        'content' in item && typeof item.content === 'string' ? item.content : '';
      await copyToClipboard(contentToCopy, {
        component: 'command-config',
        action: 'copy-content',
      });
      toast.success('Copied!', {
        description: 'Command content has been copied to your clipboard.',
      });
    },
  },

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

    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }

      const commandName = getDisplayTitle({
        title: item.title,
        name: item.name,
        slug: item.slug,
        category: item.category,
      });

      return [
        `Execute ${commandName} to automate repetitive tasks`,
        `Integrate ${commandName} into development workflows`,
        'Streamline code review and quality assurance processes',
      ];
    },

    troubleshooting: (item) => {
      const commandName = getDisplayTitle({
        title: item.title || '',
        name: item.name || '',
        slug: item.slug,
        category: item.category,
      });

      return [
        {
          issue: `${commandName} command not recognized`,
          solution:
            'Ensure Claude Code is properly installed and the command is configured in .claude/commands/',
        },
        {
          issue: 'Command execution timeout',
          solution:
            'Check your network connection and try again. For large projects, consider breaking down the task.',
        },
      ];
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.commands.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.commands.contentLoader}`,
  },
};

/**
 * Hook Configuration
 */
const hookConfig: ContentTypeConfigRegistry['hooks'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.hooks.title,
  icon: UNIFIED_CATEGORY_REGISTRY.hooks.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.hooks.colorScheme,

  primaryAction: {
    label: 'View on GitHub',
    icon: <Webhook className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: (item) => {
      if ('slug' in item && item.slug) {
        window.open(
          `https://github.com/JSONbored/claudepro-directory/blob/main/content/hooks/${item.slug}.json`,
          '_blank'
        );
      }
    },
  },

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

    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      return [
        'Automate code formatting and quality checks',
        'Trigger workflows on specific events',
        'Integrate with external tools and services',
      ];
    },

    troubleshooting: (_item) => {
      return [
        {
          issue: 'Hook script not executing',
          solution: 'Verify script has executable permissions (chmod +x) and correct shebang line.',
        },
        {
          issue: 'Hook dependencies not found',
          solution: 'Install required tools (jq, prettier, etc.) and ensure they are in your PATH.',
        },
      ];
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.hooks.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.hooks.contentLoader}`,
  },
};

/**
 * MCP Server Configuration
 */
const mcpConfig: ContentTypeConfigRegistry['mcp'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.mcp.title,
  icon: UNIFIED_CATEGORY_REGISTRY.mcp.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.mcp.colorScheme,

  primaryAction: {
    label: 'View Configuration',
    icon: <Server className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: () => {
      const configSection = document.querySelector('[data-section="configuration"]');
      configSection?.scrollIntoView({ behavior: 'smooth' });
    },
  },

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

    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      return [
        'Access external data sources and APIs',
        'Integrate with third-party services',
        'Extend Claude capabilities with custom tools',
      ];
    },

    troubleshooting: (_item) => {
      return [
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
      ];
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.mcp.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.mcp.contentLoader}`,
  },
};

/**
 * Rule Configuration
 */
const ruleConfig: ContentTypeConfigRegistry['rules'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.rules.title,
  icon: UNIFIED_CATEGORY_REGISTRY.rules.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.rules.colorScheme,

  primaryAction: {
    label: 'Use Rule',
    icon: <BookOpen className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: () => {
      toast.success('Rule Integration', {
        description: 'Copy the rule content and add it to your Claude configuration.',
      });
    },
  },

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
    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }

      const tags = item.tags || [];
      const generatedUseCases: string[] = [];

      const tagBasedUseCases: Record<string, string[]> = {
        api: ['Design and review RESTful APIs and GraphQL schemas'],
        security: ['Conduct security reviews and vulnerability assessments'],
        frontend: ['Review frontend architecture and component design'],
        backend: ['Design scalable backend architectures'],
      };

      tags.forEach((tag) => {
        const tagUseCases = tagBasedUseCases[tag];
        if (tagUseCases) {
          generatedUseCases.push(...tagUseCases);
        }
      });

      if (generatedUseCases.length === 0) {
        generatedUseCases.push(
          'Improve code quality and consistency',
          'Provide specialized guidance in your domain',
          'Ensure best practices in development workflows'
        );
      }

      return generatedUseCases;
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.rules.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.rules.contentLoader}`,
  },
};

/**
 * Statusline Configuration
 */
const statuslineConfig: ContentTypeConfigRegistry['statuslines'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.statuslines.title,
  icon: UNIFIED_CATEGORY_REGISTRY.statuslines.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.statuslines.colorScheme,

  primaryAction: {
    label: 'Copy Script',
    icon: <Terminal className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: async (item) => {
      const scriptContent =
        'configuration' in item &&
        typeof item.configuration === 'object' &&
        item.configuration &&
        'scriptContent' in item.configuration &&
        typeof item.configuration.scriptContent === 'string'
          ? item.configuration.scriptContent
          : '';
      await copyToClipboard(scriptContent, {
        component: 'statusline-config',
        action: 'copy-script',
      });
      toast.success('Copied!', {
        description: 'Statusline script has been copied to your clipboard.',
      });
    },
  },

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

    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      return [
        'Display real-time session information in CLI',
        'Customize terminal appearance and branding',
        'Show project context and status at a glance',
      ];
    },

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

    troubleshooting: (_item) => {
      return [
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
      ];
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.statuslines.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.statuslines.contentLoader}`,
  },
};

/**
 * Collection Configuration
 */
const collectionConfig: ContentTypeConfigRegistry['collections'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.collections.title,
  icon: UNIFIED_CATEGORY_REGISTRY.collections.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.collections.colorScheme,

  primaryAction: {
    label: 'View Collection',
    icon: <Layers className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: () => {
      const itemsSection = document.querySelector('[data-section="items"]');
      itemsSection?.scrollIntoView({ behavior: 'smooth' });
    },
  },

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
    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      return [
        'Quick start with pre-configured bundles',
        'Explore curated workflows and best practices',
        'Discover related content organized by theme',
      ];
    },
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.collections.title,
    showGitHubLink: true,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.collections.contentLoader}`,
  },
};

/**
 * Skill Configuration
 */
const skillConfig: ContentTypeConfigRegistry['skills'] = {
  typeName: UNIFIED_CATEGORY_REGISTRY.skills.title,
  icon: UNIFIED_CATEGORY_REGISTRY.skills.icon,
  colorScheme: UNIFIED_CATEGORY_REGISTRY.skills.colorScheme,

  primaryAction: {
    label: 'Use Skill',
    icon: <BookOpen className={`h-4 w-4 ${UI_CLASSES.MR_2}`} />,
    handler: () => {
      const contentSection = document.querySelector('[data-section="content"]');
      contentSection?.scrollIntoView({ behavior: 'smooth' });
    },
  },

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
    useCases: (item) => {
      if ('useCases' in item && Array.isArray(item.useCases) && item.useCases.length > 0) {
        return item.useCases;
      }
      const title = getDisplayTitle({
        title: item.title,
        name: item.name,
        slug: item.slug,
        category: item.category,
      });
      return [
        `Apply ${title} in real-world workflows`,
        'Automate tedious document tasks',
        'Integrate into CI scripts and pipelines',
      ];
    },
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
        Array.isArray((item as any).requirements) && (item as any).requirements.length > 0
          ? ((item as any).requirements as string[])
          : ['Install dependencies noted in the guide'],
    }),
  },

  metadata: {
    categoryLabel: UNIFIED_CATEGORY_REGISTRY.skills.title,
    showGitHubLink: false,
    githubPathPrefix: `content/${UNIFIED_CATEGORY_REGISTRY.skills.contentLoader}`,
  },
};

/**
 * Content Type Configuration Registry
 *
 * Central registry of all content type configurations.
 * Used internally by getContentTypeConfig function
 */
const contentTypeConfigs: ContentTypeConfigRegistry = {
  agents: agentConfig,
  commands: commandConfig,
  hooks: hookConfig,
  mcp: mcpConfig,
  rules: ruleConfig,
  statuslines: statuslineConfig,
  collections: collectionConfig,
  skills: skillConfig,
  guides: ruleConfig, // Guides use same config as rules for now
};

/**
 * Get configuration for a content type
 */
export function getContentTypeConfig(
  category: string
): ContentTypeConfigRegistry[keyof ContentTypeConfigRegistry] | null {
  const normalizedCategory = category.toLowerCase() as keyof ContentTypeConfigRegistry;
  return contentTypeConfigs[normalizedCategory] || null;
}
