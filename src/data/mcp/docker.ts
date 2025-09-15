import { MCPServer } from './index';

export const dockerMcp: MCPServer = {
  id: 'docker',
  name: 'Docker MCP Server',
  description: 'Control Docker containers and images through Claude for development and deployment',
  tags: ['docker', 'containers', 'devops', 'deployment'],
  author: 'Claude MCP Community',
  slug: 'docker',
  category: 'development',
  popularity: 85,
  createdAt: '2024-01-15',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/docker',
  documentation: 'https://modelcontextprotocol.io/servers/docker',
  config: `{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-docker"
      ]
    }
  }
}`
};