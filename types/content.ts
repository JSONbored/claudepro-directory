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
  tags: string[];
  popularity?: number;
  views?: number;
  // Legacy fields for backward compatibility (auto-generated from slug)
  id: string; // Auto-generated from slug during build
  name?: string;
  title?: string;
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
  }> | string[];
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
  features?: string[];
  useCases?: string[];
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
    requirements?: string[];
  };
}
// MCP Server installation configuration
export interface MCPInstallation {
  claudeDesktop?: {
    steps: string[];
    configPath: {
      macOS?: string;
      windows?: string;
      linux?: string;
    };
    note?: string;
  };
  claudeCode?: string | {
    steps: string[];
    command: string;
  };
  requirements?: string[];
}

export interface MCPServer extends ContentItem {
  features?: string[];
  installation?: MCPInstallation;
  useCases?: string[];
  security?: string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | string[];
  package?: Record<string, string | number | boolean> | string | null;
  requiresAuth?: boolean;
  permissions?: string[];
  authType?: string;
  // Temporary fields for non-migrated MCP content
  configLocation?: string;
  readOnly?: boolean;
}

export interface Rule extends ContentItem {
  features?: string[];
  useCases?: string[];
  installation?: {
    claudeCode?: {
      steps: string[];
      configFormat: string;
      configPath: {
        project: string;
        user: string;
      };
    };
    requirements?: string[];
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
  requirements?: string[];
}

export interface Command extends ContentItem {
  features?: string[];
  useCases?: string[];
  installation?: CommandInstallation;
}

export interface Hook extends ContentItem {
  hookType?: 'PostToolUse' | 'PreToolUse' | 'SessionStart' | 'SessionEnd' | 'UserPromptSubmit' | 'Notification' | 'PreCompact' | 'Stop' | 'SubagentStop';
  features?: string[];
  useCases?: string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | string[];
  installation?: {
    claudeCode?: {
      steps: string[];
      configFormat: string;
      configPath: {
        project: string;
        user: string;
      };
    };
    requirements?: string[];
  };
  requirements?: string[];
  matchers?: string[];
}