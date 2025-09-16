export interface BaseContent {
  slug: string;
  title: string;
  description: string;
  author: string;
  dateAdded: string;
  lastModified: string;
  tags: string[];
  category: ContentCategory;
  source: 'official' | 'partner' | 'community' | 'verified' | 'experimental';
  featured?: boolean;
}

export interface ContentWithCode extends BaseContent {
  content: string;
  installCommand?: string;
  setupInstructions?: string[];
}

export interface Agent extends ContentWithCode {
  category: 'agents';
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  capabilities?: string[];
  limitations?: string[];
  useCases?: string[];
}

export interface MCPServer extends ContentWithCode {
  category: 'mcp';
  github?: string;
  npm?: string;
  protocol?: string;
  transport?: string[];
  requiredConfig?: Record<string, any>;
  endpoints?: string[];
  authentication?: string;
}

export interface Rule extends ContentWithCode {
  category: 'rules';
  framework?: string;
  language?: string;
  priority?: 'required' | 'recommended' | 'optional';
  examples?: Array<{
    title: string;
    code: string;
  }>;
}

export interface Command extends ContentWithCode {
  category: 'commands';
  syntax?: string;
  parameters?: Array<{
    name: string;
    description: string;
    required: boolean;
    type?: string;
  }>;
  output?: string;
  sideEffects?: string[];
  requiresConfirmation?: boolean;
}

export interface Hook extends ContentWithCode {
  category: 'hooks';
  event?: string;
  timing?: 'before' | 'after' | 'during';
  dependencies?: string[];
  configuration?: Record<string, any>;
  errorHandling?: string;
}

export type ContentCategory = 'agents' | 'mcp' | 'rules' | 'commands' | 'hooks';

export type ContentItem = Agent | MCPServer | Rule | Command | Hook;

export interface ContentMetadata extends Omit<BaseContent, 'content'> {
  excerpt?: string;
}

export interface ContentBySlug<T> {
  [slug: string]: T;
}

export interface ContentStats {
  agents: number;
  mcp: number;
  rules: number;
  commands: number;
  hooks: number;
}