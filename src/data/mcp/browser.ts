import { MCPServer } from './index';

export const browserMcp: MCPServer = {
  id: 'browser',
  name: 'Browser Automation MCP',
  description: 'Enable Claude to control browsers for web scraping, testing, and automation tasks',
  tags: ['browser', 'automation', 'scraping', 'testing'],
  author: 'Claude MCP Community',
  slug: 'browser',
  category: 'automation',
  popularity: 88,
  createdAt: '2024-01-15',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
  documentation: 'https://modelcontextprotocol.io/servers/puppeteer',
  config: `{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ]
    }
  }
}`
};