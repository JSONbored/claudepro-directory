import { MCPServer } from './index';

export const kubernetesMcp: MCPServer = {
  id: 'kubernetes',
  name: 'Kubernetes MCP Server',
  description: 'Manage Kubernetes clusters with Claude for deployment, monitoring, and troubleshooting',
  tags: ['kubernetes', 'k8s', 'devops', 'containers'],
  author: '@JSONbored',
  slug: 'kubernetes',
  category: 'development',
  popularity: 83,
  createdAt: '2025-08-14',
  repository: 'https://github.com/modelcontextprotocol/servers/tree/main/src/kubernetes',
  documentation: 'https://modelcontextprotocol.io/servers/kubernetes',
  config: `{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-kubernetes"
      ],
      "env": {
        "KUBECONFIG": "/path/to/your/kubeconfig"
      }
    }
  }
}`
};