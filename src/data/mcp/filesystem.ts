import { MCPServer } from './index';

export const filesystemMcp: MCPServer = {
  id: 'filesystem',
  name: 'Filesystem MCP Server',
  description: 'Secure file system access for Claude to read, write, and manage files and directories',
  tags: ['filesystem', 'files', 'directories', 'storage'],
  author: 'Claude MCP Community',
  slug: 'filesystem',
  category: 'file-system',
  popularity: 91,
  createdAt: '2024-01-15',
  repository: 'https://github.com/JSONbored/claudepro-directory/blob/main/mcp/filesystem.md',
  documentation: 'https://modelcontextprotocol.io/servers/filesystem',
  config: `{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/allowed/directory"
      ]
    }
  }
}`
};