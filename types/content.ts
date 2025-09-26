export type ContentCategory = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks';

// Hook configuration types
export interface HookConfig {
  script: string;
  matchers?: string[];
  timeout?: number;
  description?: string;
}

export interface HookConfigSet {
  postToolUse?: HookConfig;
  preToolUse?: HookConfig;
  notification?: HookConfig;
  stop?: HookConfig;
  Stop?: Array<{ matchers: string[]; description: string; }>;
  [hookType: string]: HookConfig | Array<{ matchers: string[]; description: string; }> | undefined;
}

// MCP configuration types
export interface MCPConfig {
  command?: string;
  args?: string[];
  transport?: string;
  url?: string;
  env?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  enabled?: boolean;
}

// Configuration type for content items - comprehensive interface without restrictive index signature
export interface ContentConfiguration {
  // Basic configuration
  enabled?: boolean;
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  permissions?: string[];
  requiresAuth?: boolean;
  authType?: string;
  features?: string[];
  options?: Record<string, string | number | boolean>;
  
  // Hook-specific configuration
  hooks?: HookConfigSet;
  hookConfig?: { 
    hooks: HookConfigSet; 
    scriptContent?: string; 
  };
  
  // MCP-specific configuration
  mcpServers?: Record<string, MCPConfig>;
  claudeDesktop?: {
    mcpServers?: Record<string, MCPConfig>;
    [key: string]: string | number | boolean | Record<string, MCPConfig> | undefined;
  };
  
  // Common configuration
  scriptContent?: string;
  tools?: string[];
  dockerVersion?: string;
  package?: Record<string, string | number | boolean> | string;
  
  // Additional fields that may be present
  readOnly?: boolean;
  configLocation?: string;
  
  // Allow for future extensibility
  [key: string]: 
    | string 
    | string[] 
    | number 
    | boolean 
    | Record<string, string | number | boolean> 
    | Record<string, MCPConfig>
    | HookConfigSet
    | { hooks: HookConfigSet; scriptContent?: string; }
    | { mcpServers?: Record<string, MCPConfig>; [key: string]: string | number | boolean | Record<string, MCPConfig> | undefined; }
    | undefined;
}

// Base interface for all content items
export interface ContentMetadata {
  slug: string;
  description: string;
  category: string;
  author: string;
  dateAdded: string;
  lastModified?: string;
  githubUsername?: string;
  tags: readonly string[] | string[];
  popularity?: number;
  views?: number;
  // Auto-generated fields (generated from slug during build)
  name?: string; // For backward compatibility
  title?: string; // Auto-generated from slug if not provided
}

export interface ContentItem extends ContentMetadata {
  content?: string;
  config?: string;
  repository?: string;
  githubUrl?: string | null;
  documentation?: string;
  documentationUrl?: string;
  examples?: Array<{
    title?: string;
    code: string;
    description?: string;
  }> | readonly string[] | string[];
  configuration?: ContentConfiguration;
  similarity?: number;
  type?: string;
  stars?: number;
  forks?: number;
  createdAt?: string;
  source?: string;
}

export interface ContentStats {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
}

// Type aliases for specific content types
export interface Agent extends ContentItem {
  features?: readonly string[] | string[];
  useCases?: readonly string[] | string[];
  installation?: {
    claudeCode?: {
      steps: string[];
      configFormat: string;
      configPath: {
        project: string;
        user: string;
      };
    };
    claudeDesktop?: {
      steps: string[];
      configPath: {
        macOS: string;
        windows: string;
        linux: string;
      };
      note: string;
    };
    sdk?: {
      steps: string[];
    };
    requirements?: readonly string[] | string[];
  };
}
// MCP Server installation configuration
export interface MCPInstallation {
  claudeDesktop?: {
    steps: readonly string[] | string[];
    configPath: {
      macOS?: string;
      windows?: string;
      linux?: string;
    };
    note?: string;
  };
  claudeCode?: string | {
    steps: readonly string[] | string[];
    command: string;
  };
  requirements?: readonly string[] | string[];
}

export interface MCPServer extends ContentItem {
  features?: readonly string[] | string[];
  installation?: MCPInstallation;
  useCases?: readonly string[] | string[];
  security?: readonly string[] | string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | readonly string[] | string[];
  package?: Record<string, string | number | boolean> | string | null;
  requiresAuth?: boolean;
  permissions?: readonly string[] | string[];
  authType?: string;
  // Temporary fields for non-migrated MCP content
  configLocation?: string;
  readOnly?: boolean;
}

export interface Rule extends ContentItem {
  features?: readonly string[] | string[];
  useCases?: readonly string[] | string[];
  installation?: {
    claudeCode?: {
      steps: string[];
      configFormat: string;
      configPath: {
        project: string;
        user: string;
      };
    };
    requirements?: readonly string[] | string[];
  };
}

export interface CommandInstallation {
  claudeCode?: {
    steps: string[];
    configFormat: string;
    configPath: {
      project: string;
      user: string;
    };
  };
  requirements?: readonly string[] | string[];
}

export interface Command extends ContentItem {
  features?: readonly string[] | string[];
  useCases?: readonly string[] | string[];
  installation?: CommandInstallation;
}

export interface Hook extends ContentItem {
  hookType?: 'PostToolUse' | 'PreToolUse' | 'SessionStart' | 'SessionEnd' | 'UserPromptSubmit' | 'Notification' | 'PreCompact' | 'Stop' | 'SubagentStop';
  features?: readonly string[] | string[];
  useCases?: readonly string[] | string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | readonly string[] | string[];
  installation?: {
    claudeCode?: {
      steps: string[];
      configFormat: string;
      configPath: {
        project: string;
        user: string;
      };
    };
    requirements?: readonly string[] | string[];
  };
  requirements?: readonly string[] | string[];
  matchers?: string[];
}