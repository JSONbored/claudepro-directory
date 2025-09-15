export const dockerMcp = {
  tags: ["docker", "containers", "devops", "deployment"],
  content: `# Docker MCP Server

Control Docker containers and images through Claude for development and deployment.

## Features:
- Container lifecycle management (start, stop, restart)
- Image building and management
- Volume and network management  
- Logs and monitoring
- Multi-container orchestration

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
\`\`\`

## Use Cases:
- Development environment management
- Container deployment automation
- Docker image optimization
- Multi-service application orchestration
- Container health monitoring`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}

export const kubernetesMcp = {
  tags: ["kubernetes", "k8s", "devops", "containers", "orchestration"],
  content: `# Kubernetes MCP Server

Manage Kubernetes clusters with Claude for deployment, monitoring, and troubleshooting.

## Features:
- Pod and deployment management
- Service and ingress configuration
- ConfigMap and Secret management
- Namespace organization
- Resource monitoring and scaling

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-kubernetes"],
      "env": {
        "KUBECONFIG": "/path/to/your/kubeconfig"
      }
    }
  }
}
\`\`\`

## Use Cases:
- Application deployment automation
- Resource scaling and management
- Troubleshooting and debugging
- Configuration management
- Monitoring and alerting setup`,
  author: {
    name: "MCP Community", 
    url: "https://github.com/modelcontextprotocol/servers"
  }
}

export const githubMcp = {
  tags: ["github", "git", "version-control", "collaboration"],
  content: `# GitHub MCP Server

Access GitHub repositories, issues, and pull requests directly through Claude.

## Features:
- Repository management and exploration
- Issue creation and management
- Pull request operations
- Branch and commit operations
- Organization and team management

## Configuration:
\`\`\`json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-github-token"
      }
    }
  }
}
\`\`\`

## Use Cases:
- Repository analysis and exploration
- Automated issue management
- Code review assistance
- Documentation updates
- Project management workflows`,
  author: {
    name: "MCP Community",
    url: "https://github.com/modelcontextprotocol/servers"
  }
}