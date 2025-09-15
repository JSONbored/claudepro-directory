export const notionMcp = {
  tags: ["notion", "notes", "database", "content", "productivity"],
  content: `# Notion MCP Server

Connect Claude to Notion for content management, database operations, and note-taking.

## Features:
- Page creation and editing
- Database queries and updates
- Block-level content manipulation
- Property and relation management
- Template and automation support

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-notion"],
      "env": {
        "NOTION_API_KEY": "your-notion-api-key"
      }
    }
  }
}
\`\`\`

## Use Cases:
- Content creation and management
- Database automation and reporting
- Knowledge base maintenance
- Project planning and tracking
- Meeting notes and documentation`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}

export const slackMcp = {
  tags: ["slack", "communication", "team", "automation", "notifications"],
  content: `# Slack MCP Server

Integrate Claude with Slack for team communication, channel management, and automation.

## Features:
- Message sending and management
- Channel and user operations
- File sharing and management
- Workflow automation
- Bot and app integration

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token",
        "SLACK_TEAM_ID": "your-team-id"
      }
    }
  }
}
\`\`\`

## Use Cases:
- Automated notifications and alerts
- Team communication enhancement
- Workflow automation
- Report generation and sharing
- Meeting coordination and scheduling`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}