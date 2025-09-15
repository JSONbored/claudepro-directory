# GitHub MCP Server

Connect Claude to GitHub for repository management, issue tracking, and code analysis.

## Features

- Browse repositories and file contents
- Create and manage issues and pull requests
- Search code across repositories
- Analyze commit history and contributors
- Manage project workflows

## Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-github",
        "YOUR_GITHUB_TOKEN"
      ]
    }
  }
}
```

## Setup

1. Create a GitHub Personal Access Token
2. Configure the server with your token
3. Start using GitHub operations through Claude

Perfect for developers managing GitHub repositories and workflows.