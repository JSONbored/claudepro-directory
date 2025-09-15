export const browserMcp = {
  tags: ["browser", "automation", "scraping", "testing", "puppeteer"],
  content: `# Browser Automation MCP

Enable Claude to control browsers for web scraping, testing, and automation tasks.

## Features:
- Web page navigation and interaction
- Element selection and manipulation
- Screenshot and PDF generation
- Form filling and submission
- Performance monitoring

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
\`\`\`

## Use Cases:
- Web scraping and data extraction
- Automated testing and QA
- Performance monitoring
- Screenshot generation
- Form automation and submission`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}

export const filesystemMcp = {
  tags: ["filesystem", "files", "directories", "file-operations"],
  content: `# Filesystem MCP Server

Secure file and directory operations with configurable access controls.

## Features:
- File reading and writing operations
- Directory creation and management
- File search and filtering
- Permission and access control
- Batch file operations

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": "/safe/path1,/safe/path2"
      }
    }
  }
}
\`\`\`

## Use Cases:
- File organization and management
- Content processing and analysis
- Backup and synchronization
- Log file analysis
- Code generation and modification`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}