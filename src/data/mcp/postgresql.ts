import { MCPServer } from './index';

export const postgresqlMcp: MCPServer = {
  id: 'postgresql',
  name: 'PostgreSQL MCP Server',
  description: 'Connect Claude to PostgreSQL databases for data analysis, queries, and schema management',
  tags: ['database', 'postgresql', 'sql', 'data'],
  author: 'Claude MCP Community',
  slug: 'postgresql',
  category: 'database',
  popularity: 95,
  createdAt: '2024-01-15',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/postgresql',
  documentation: 'https://modelcontextprotocol.io/servers/postgresql',
  config: `{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgresql",
        "postgresql://username:password@localhost:5432/database"
      ]
    }
  }
}`
};