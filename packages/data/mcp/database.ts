export const postgresqlMcp = {
  tags: ["postgresql", "database", "sql", "data", "queries"],
  content: `# PostgreSQL MCP Server

Connect Claude to PostgreSQL databases for queries, schema management, and data analysis.

## Features:
- SQL query execution and analysis
- Schema exploration and documentation
- Data validation and quality checks
- Performance optimization suggestions
- Database migration assistance

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/db"
      }
    }
  }
}
\`\`\`

## Use Cases:
- Database schema analysis
- Query optimization and debugging
- Data exploration and reporting
- Migration planning and execution
- Performance monitoring and tuning`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}