import { MCPServer } from './index';

export const slackMcp: MCPServer = {
  id: 'slack',
  name: 'Slack MCP Server',
  description: 'Integrate Claude with Slack for team communication, channel management, and automation',
  tags: ['slack', 'communication', 'team', 'automation'],
  author: '@JSONbored',
  slug: 'slack',
  category: 'productivity',
  popularity: 86,
  createdAt: '2025-08-14',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
  documentation: 'https://modelcontextprotocol.io/servers/slack',
  config: `{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-slack"
      ],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token",
        "SLACK_TEAM_ID": "your-team-id"
      }
    }
  }
}`
};