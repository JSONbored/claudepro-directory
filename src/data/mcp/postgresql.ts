import { MCPServer } from './index';

export const postgresqlMcp: MCPServer = {
  id: 'postgresql',
  name: 'PostgreSQL MCP Server',
  description: 'Connect Claude to PostgreSQL databases for data analysis, queries, and schema management',
  tags: ['database', 'postgresql', 'sql', 'data'],
  author: '@JSONbored',
  slug: 'postgresql',
  category: 'database',
  popularity: 95,
  createdAt: '2025-08-14',
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/src/data/mcp/postgresql.ts',
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