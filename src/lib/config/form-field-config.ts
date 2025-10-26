/**
 * Form Field Configuration System
 *
 * Config-driven form rendering eliminates 285 LOC of repetitive conditional blocks.
 *
 * Architecture:
 * - Data structures define all form fields
 * - Single renderer component consumes config
 * - Type-safe with discriminated unions
 * - Grid layout system for responsive design
 * - Fully accessible (ARIA, labels, validation)
 * - Icon support for visual enhancement
 *
 * Impact:
 * - Before: 285 LOC conditional rendering + 27 useId() calls
 * - After: Config data + single renderer component
 * - Maintainability: Hard → Easy
 */

import type { LucideIcon } from 'lucide-react';
import { Github } from '@/src/lib/icons';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Field type discriminator
 * Maps to different input/textarea/select components
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'select';

/**
 * Grid column span for responsive layouts
 * - 'full': Takes full width (grid-cols-1)
 * - 'half': Half width on desktop, full on mobile (sm:grid-cols-2)
 * - 'third': Third width on desktop, full on mobile (sm:grid-cols-3)
 * - 'two-thirds': Two-thirds width (used in combination with third)
 */
export type GridColumn = 'full' | 'half' | 'third' | 'two-thirds';

/**
 * Icon position relative to input field
 * - 'left': Icon displayed before input (most common for visual indicators)
 * - 'right': Icon displayed after input (common for actions like copy/clear)
 */
export type IconPosition = 'left' | 'right';

/**
 * Select option definition
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Base field definition with common properties
 */
interface BaseFieldDefinition {
  /**
   * Field name attribute (must match schema field name exactly)
   * Used for form submission and template pre-fill
   */
  name: string;

  /**
   * Label text displayed above field
   */
  label: string;

  /**
   * Placeholder text for empty field
   */
  placeholder?: string;

  /**
   * Help text displayed below field (muted foreground)
   */
  helpText?: string;

  /**
   * Whether field is required
   */
  required?: boolean;

  /**
   * Grid column span for responsive layout
   * Defaults to 'full' if not specified
   */
  gridColumn?: GridColumn;

  /**
   * Lucide icon component to display alongside field
   * Provides visual context (e.g., Github icon for github URL field)
   */
  icon?: LucideIcon;

  /**
   * Position of icon relative to input field
   * Defaults to 'left' if icon is provided
   */
  iconPosition?: IconPosition;
}

/**
 * Text input field definition
 */
export interface TextFieldDefinition extends BaseFieldDefinition {
  type: 'text';
  /** Default value for field */
  defaultValue?: string;
}

/**
 * Textarea field definition
 */
export interface TextareaFieldDefinition extends BaseFieldDefinition {
  type: 'textarea';
  /** Number of rows (default: 4) */
  rows?: number;
  /** Whether to use monospace font */
  monospace?: boolean;
  /** Default value for field */
  defaultValue?: string;
}

/**
 * Number input field definition
 */
export interface NumberFieldDefinition extends BaseFieldDefinition {
  type: 'number';
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Default value for field */
  defaultValue?: number | string;
}

/**
 * Select field definition
 */
export interface SelectFieldDefinition extends BaseFieldDefinition {
  type: 'select';
  /** Options for select dropdown */
  options: SelectOption[];
  /** Default selected value */
  defaultValue?: string;
}

/**
 * Discriminated union of all field types
 * TypeScript enforces correct props based on type
 */
export type FieldDefinition =
  | TextFieldDefinition
  | TextareaFieldDefinition
  | NumberFieldDefinition
  | SelectFieldDefinition;

/**
 * Content type configuration
 * Defines all fields for a specific content type
 */
export interface ContentTypeConfig {
  /**
   * Array of field definitions
   * Rendered in order specified
   */
  fields: FieldDefinition[];
}

/**
 * Content types matching schema
 */
export type ContentType =
  | 'agents'
  | 'mcp'
  | 'rules'
  | 'commands'
  | 'hooks'
  | 'statuslines'
  | 'skills';

/**
 * Complete form configuration mapping
 * Maps each content type to its field config
 */
export type FormConfigs = Record<ContentType, ContentTypeConfig>;

// ============================================================================
// COMMON FIELDS - Shared across all content types
// ============================================================================

/**
 * Common fields present in every submission form
 * These appear before type-specific fields
 */
export const COMMON_FIELDS: FieldDefinition[] = [
  {
    type: 'text',
    name: 'name',
    label: 'Name *',
    placeholder: 'e.g., "React Query Expert" or "Supabase MCP Server"',
    required: true,
    gridColumn: 'full',
    helpText: 'A clear, descriptive name for your configuration',
  },
  {
    type: 'textarea',
    name: 'description',
    label: 'Description *',
    placeholder: 'Brief description of what this does and its key features...',
    required: true,
    rows: 3,
    gridColumn: 'full',
    helpText: 'Concise overview (50-500 characters)',
  },
  {
    type: 'text',
    name: 'category',
    label: 'Category *',
    placeholder: 'e.g., Development, DevOps, AI/ML, Data Science',
    required: true,
    gridColumn: 'half',
    helpText: 'Primary category for organization',
  },
  {
    type: 'text',
    name: 'author',
    label: 'Author/Creator',
    placeholder: 'Your name or GitHub username',
    gridColumn: 'half',
  },
  {
    type: 'text',
    name: 'authorProfileUrl',
    label: 'Author Profile URL (optional)',
    placeholder: 'https://github.com/username or your personal site',
    gridColumn: 'half',
    helpText: 'Link to your profile (auto-filled for signed-in users)',
  },
  {
    type: 'text',
    name: 'github',
    label: 'GitHub Repository (optional)',
    placeholder: 'https://github.com/username/repo',
    gridColumn: 'full',
    icon: Github,
    iconPosition: 'left',
    helpText: 'Link to source code repository',
  },
];

/**
 * Tags field - appears after type-specific fields
 */
export const TAGS_FIELD: FieldDefinition = {
  type: 'text',
  name: 'tags',
  label: 'Tags (optional)',
  placeholder: 'productivity, ai, automation (comma-separated)',
  gridColumn: 'full',
  helpText: 'Separate multiple tags with commas (max 10)',
};

// ============================================================================
// FORM CONFIGS - Data-driven field definitions
// ============================================================================

/**
 * Agents content type configuration
 * Schema: agentSubmissionSchema (systemPrompt, temperature, maxTokens)
 */
const AGENTS_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'systemPrompt',
      label: 'System Prompt * (Plaintext)',
      placeholder:
        'You are an expert in... [Write your Claude system prompt here in plain English]',
      required: true,
      rows: 12,
      monospace: true,
      helpText: 'Write your Claude system prompt in plain text. No JSON formatting needed!',
      gridColumn: 'full',
    },
    {
      type: 'number',
      name: 'temperature',
      label: 'Temperature (0-1)',
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: '0.7',
      gridColumn: 'half',
    },
    {
      type: 'number',
      name: 'maxTokens',
      label: 'Max Tokens',
      min: 100,
      max: 200000,
      defaultValue: '8000',
      gridColumn: 'half',
    },
  ],
};

/**
 * Rules content type configuration
 * Schema: rulesSubmissionSchema (rulesContent, temperature, maxTokens)
 */
const RULES_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'rulesContent',
      label: 'Claude Rules Content * (Plaintext)',
      placeholder: 'You are an expert in... [Write your Claude expertise rules in plain text]',
      required: true,
      rows: 12,
      monospace: true,
      helpText: "Define Claude's expertise and guidelines in plain text.",
      gridColumn: 'full',
    },
    {
      type: 'number',
      name: 'temperature',
      label: 'Temperature (0-1)',
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: '0.7',
      gridColumn: 'half',
    },
    {
      type: 'number',
      name: 'maxTokens',
      label: 'Max Tokens',
      min: 100,
      max: 200000,
      defaultValue: '8000',
      gridColumn: 'half',
    },
  ],
};

/**
 * Commands content type configuration
 * Schema: commandsSubmissionSchema (commandContent)
 */
const COMMANDS_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'commandContent',
      label: 'Command Content * (Plaintext)',
      placeholder:
        '---\ndescription: What this command does\nmodel: claude-3-5-sonnet-20241022\n---\n\nCommand instructions here...',
      required: true,
      rows: 12,
      monospace: true,
      helpText: 'Provide command content in markdown format with frontmatter. No JSON needed!',
      gridColumn: 'full',
    },
  ],
};

/**
 * Hooks content type configuration
 * Schema: hooksSubmissionSchema (hookScript, hookType, triggeredBy)
 */
const HOOKS_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'hookScript',
      label: 'Hook Script * (Bash)',
      placeholder:
        "#!/usr/bin/env bash\n# Your hook script here...\n\necho 'Hook running...'\nexit 0",
      required: true,
      rows: 12,
      monospace: true,
      helpText: 'Write your bash hook script in plain text.',
      gridColumn: 'full',
    },
    {
      type: 'select',
      name: 'hookType',
      label: 'Hook Type *',
      required: true,
      options: [
        { value: 'pre-tool-use', label: 'Pre Tool Use' },
        { value: 'post-tool-use', label: 'Post Tool Use' },
        { value: 'pre-command', label: 'Pre Command' },
        { value: 'post-command', label: 'Post Command' },
      ],
      gridColumn: 'half',
    },
    {
      type: 'text',
      name: 'triggeredBy',
      label: 'Triggered By (optional)',
      placeholder: 'tool1, tool2',
      gridColumn: 'half',
    },
  ],
};

/**
 * Statuslines content type configuration
 * Schema: statuslinesSubmissionSchema (statuslineScript, statuslineType, refreshInterval, position)
 */
const STATUSLINES_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'statuslineScript',
      label: 'Statusline Script * (Bash)',
      placeholder: "#!/usr/bin/env bash\n\nread -r input\necho 'Your statusline output'",
      required: true,
      rows: 12,
      monospace: true,
      helpText: 'Write your bash statusline script in plain text.',
      gridColumn: 'full',
    },
    {
      type: 'select',
      name: 'statuslineType',
      label: 'Type',
      options: [
        { value: 'custom', label: 'Custom' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'extended', label: 'Extended' },
      ],
      gridColumn: 'third',
    },
    {
      type: 'number',
      name: 'refreshInterval',
      label: 'Refresh (ms)',
      defaultValue: '1000',
      gridColumn: 'third',
    },
    {
      type: 'select',
      name: 'position',
      label: 'Position',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
      gridColumn: 'third',
    },
  ],
};

/**
 * MCP content type configuration
 * Schema: mcpSubmissionSchema (npmPackage, serverType, installCommand, configCommand, toolsDescription, envVars)
 */
const MCP_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'text',
      name: 'npmPackage',
      label: 'NPM Package Name *',
      placeholder: '@company/mcp-server-name',
      required: true,
      gridColumn: 'full',
    },
    {
      type: 'select',
      name: 'serverType',
      label: 'Server Type *',
      required: true,
      options: [
        { value: 'stdio', label: 'STDIO' },
        { value: 'sse', label: 'SSE' },
        { value: 'websocket', label: 'WebSocket' },
      ],
      gridColumn: 'half',
    },
    {
      type: 'text',
      name: 'installCommand',
      label: 'Installation Command *',
      placeholder: 'npm install -g @company/mcp-server',
      required: true,
      gridColumn: 'half',
    },
    {
      type: 'text',
      name: 'configCommand',
      label: 'Configuration Command *',
      placeholder: 'mcp-server-name',
      required: true,
      gridColumn: 'full',
    },
    {
      type: 'textarea',
      name: 'toolsDescription',
      label: 'Tools/Capabilities (optional)',
      placeholder: 'Describe what tools and capabilities this MCP server provides...',
      rows: 4,
      gridColumn: 'full',
    },
    {
      type: 'textarea',
      name: 'envVars',
      label: 'Environment Variables (optional)',
      placeholder: 'API_KEY=your-key-here\nDATABASE_URL=postgres://...',
      rows: 4,
      monospace: true,
      helpText: 'One per line, format: KEY=value',
      gridColumn: 'full',
    },
  ],
};

/**
 * Skills content type configuration
 * Schema: skillsSubmissionSchema (skillContent, requirements, installation)
 */
const SKILLS_CONFIG: ContentTypeConfig = {
  fields: [
    {
      type: 'textarea',
      name: 'skillContent',
      label: 'Skill Content * (Plaintext)',
      placeholder:
        'Detailed skill guide with examples and best practices...\n\nInclude:\n- Overview of the skill\n- Step-by-step instructions\n- Code examples\n- Common pitfalls and solutions',
      required: true,
      rows: 12,
      monospace: true,
      helpText:
        'Provide detailed skill guide content (100-15000 characters). Include examples and best practices.',
      gridColumn: 'full',
    },
    {
      type: 'text',
      name: 'requirements',
      label: 'Requirements (optional)',
      placeholder: 'Node.js 18+, TypeScript, Git (comma-separated)',
      helpText: 'Required dependencies or tools (comma-separated list)',
      gridColumn: 'full',
    },
    {
      type: 'textarea',
      name: 'installation',
      label: 'Installation Instructions (optional)',
      placeholder:
        'Installation or setup instructions...\n\nExample:\nnpm install -g package-name\nConfigure with: package-name config',
      rows: 6,
      monospace: true,
      helpText: 'Optional installation or setup instructions (max 2000 characters)',
      gridColumn: 'full',
    },
  ],
};

/**
 * Complete form configs export
 * Maps each content type to its field configuration
 */
export const FORM_CONFIGS: FormConfigs = {
  agents: AGENTS_CONFIG,
  rules: RULES_CONFIG,
  commands: COMMANDS_CONFIG,
  hooks: HOOKS_CONFIG,
  statuslines: STATUSLINES_CONFIG,
  mcp: MCP_CONFIG,
  skills: SKILLS_CONFIG,
};
