import { MCPServer } from './index';

export const notionMcp: MCPServer = {
  id: 'notion',
  name: 'Notion MCP Server',
  description: 'Connect Claude to Notion for content management, database operations, and note-taking',
  tags: ['notion', 'notes', 'database', 'content'],
  author: '@JSONbored',
  slug: 'notion',
  category: 'productivity',
  popularity: 89,
  createdAt: '2025-08-14',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/notion',
  documentation: 'https://modelcontextprotocol.io/servers/notion',
  config: `{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-notion"
      ],
      "env": {
        "NOTION_API_KEY": "your-notion-api-key"
      }
    }
  }
}`
};