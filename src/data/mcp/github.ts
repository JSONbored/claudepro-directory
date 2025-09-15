import { MCPServer } from './index';

export const githubMcp: MCPServer = {
  id: 'github',
  name: 'GitHub MCP Server',
  description: 'Integrate Claude with GitHub for repository management, issue tracking, and code analysis',
  tags: ['github', 'git', 'repository', 'code'],
  author: 'Claude MCP Community',
  slug: 'github',
  category: 'development',
  popularity: 92,
  createdAt: '2024-01-15',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  documentation: 'https://modelcontextprotocol.io/servers/github',
  config: `{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token"
      }
    }
  }
}`
};