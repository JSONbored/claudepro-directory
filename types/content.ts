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
  options?: Record<string, any>;
  hooks?: Record<string, any>;
  hookConfig?: Record<string, any>;
  mcpServers?: Record<string, any>;
  [key: string]: any;
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
export interface Agent extends ContentItem {}
export interface MCPServer extends ContentItem {
  features?: string[];
  installation?: Record<string, any>;
  useCases?: string[];
  security?: string[];
  troubleshooting?: string[];
  package?: Record<string, any> | string | null;
  requiresAuth?: boolean;
  [key: string]: any; // Allow additional dynamic fields
}
export interface Rule extends ContentItem {}
export interface Command extends ContentItem {}
export interface Hook extends ContentItem {
  hookType?: string;
  features?: string[];
  useCases?: string[];
  [key: string]: any; // Allow additional dynamic fields
}