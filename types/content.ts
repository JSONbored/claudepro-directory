export type ContentCategory = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks';

// Configuration type for content items  
export interface ContentConfiguration {
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
  hooks?: Record<string, string | string[] | Record<string, unknown>>;
  hookConfig?: Record<string, string | string[] | Record<string, unknown>>;
  mcpServers?: Record<string, string | string[] | Record<string, unknown>>;
  [key: string]: string | string[] | number | boolean | Record<string, unknown> | undefined;
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
// Maintain safety while allowing dynamic properties
export interface MCPServer extends ContentItem {
  features?: string[];
  installation?: Record<string, unknown>;
  useCases?: string[];
  security?: string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | string[];
  package?: Record<string, unknown> | string | null;
  requiresAuth?: boolean;
  permissions?: string[];
  authType?: string;
  [key: string]: unknown; // Safe fallback for dynamic fields
}

export interface Rule extends ContentItem {
  [key: string]: unknown;
}

export interface Command extends ContentItem {
  [key: string]: unknown;
}

export interface Hook extends ContentItem {
  hookType?: 'PostToolUse' | 'PreToolUse' | 'SessionStart' | 'SessionEnd' | 'UserPromptSubmit' | 'Notification' | 'PreCompact' | 'Stop' | 'SubagentStop';
  features?: string[];
  useCases?: string[];
  troubleshooting?: Array<{ issue: string; solution: string }> | string[];
  installation?: Record<string, unknown>;
  requirements?: string[];
  matchers?: string[];
  [key: string]: unknown; // Safe fallback for dynamic fields
}