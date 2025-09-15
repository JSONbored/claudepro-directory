export interface MCPServer {
  id: string;
  name: string;
  description: string;
  tags: string[];
  author: string;
  config: string;
  slug: string;
  category: 'database' | 'api' | 'file-system' | 'ai' | 'productivity' | 'development' | 'automation' | 'other';
  popularity: number;
  createdAt: string;
  repository?: string;
  documentation?: string;
}

// Import all MCP server configs
import { postgresqlMcp } from './postgresql';
import { githubMcp } from './github';
import { notionMcp } from './notion';
import { slackMcp } from './slack';
import { browserMcp } from './browser';
import { filesystemMcp } from './filesystem';
import { kubernetesMcp } from './kubernetes';
import { dockerMcp } from './docker';

export const mcpServers: MCPServer[] = [
  postgresqlMcp,
  githubMcp,
  notionMcp,
  slackMcp,
  browserMcp,
  filesystemMcp,
  kubernetesMcp,
  dockerMcp,
];

export const getMcpBySlug = (slug: string): MCPServer | undefined => {
  return mcpServers.find(mcp => mcp.slug === slug);
};

export const getMcpsByCategory = (category: string): MCPServer[] => {
  return mcpServers.filter(mcp => mcp.category === category);
};

export const getPopularMcps = (): MCPServer[] => {
  return mcpServers.sort((a, b) => b.popularity - a.popularity);
};