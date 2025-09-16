export type ContentCategory = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks';

// Base interface for all content items
export interface ContentMetadata {
  id: string;
  name?: string;
  title?: string;
  description: string;
  slug: string;
  category: string;
  author: string;
  dateAdded: string;
  lastModified?: string;
  githubUsername?: string;
  tags: string[];
  popularity?: number;
  views?: number;
}

export interface ContentItem extends ContentMetadata {
  content?: string;
  config?: string;
  repository?: string;
  githubUrl?: string;
  documentation?: string;
  documentationUrl?: string;
  examples?: Array<{
    title?: string;
    code: string;
    description?: string;
  }>;
  configuration?: any;
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
export interface MCPServer extends ContentItem {}
export interface Rule extends ContentItem {}
export interface Command extends ContentItem {}
export interface Hook extends ContentItem {}