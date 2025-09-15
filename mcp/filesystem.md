# Filesystem MCP Server

Access and manipulate local files and directories through Claude.

## Features

- Read and write files
- Navigate directory structures
- Search for files and content
- Monitor file changes
- Batch file operations

## Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/allowed/directory/path"
      ]
    }
  }
}
```

Perfect for file management and local development workflows.