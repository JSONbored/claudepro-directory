#!/bin/bash
# Deploy HeyClaude MCP Worker to Cloudflare
#
# This script extracts ONLY CLI_TOKEN from Infisical (located in cloudflare/ subdirectory)
# and runs wrangler with a clean environment containing only CLOUDFLARE_API_TOKEN.
#
# Why this approach:
# - CLI_TOKEN is in cloudflare/ subdirectory, so --recursive is needed to find it
# - We don't want all 45 Infisical secrets injected into wrangler's environment
# - Using env -i creates a clean environment with only the token we need
# - This prevents conflicts from secrets with the same name in different directories

set -e

ENV=${1:-dev}
WORKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying heyclaude-mcp to ${ENV} environment..."

# Extract CLI_TOKEN value using infisical run --recursive (needed for cloudflare/ subdirectory)
# Then run wrangler with ONLY CLOUDFLARE_API_TOKEN in the environment (not all 45 secrets)
CLI_TOKEN_VALUE=$(infisical run --env=${ENV} --recursive -- bash -c 'echo "$CLI_TOKEN"' 2>/dev/null | tail -1)

if [ -z "$CLI_TOKEN_VALUE" ]; then
  echo "❌ Error: CLI_TOKEN not found in Infisical (env: ${ENV}, path: cloudflare/)"
  exit 1
fi

# Deploy with wrangler bundling (agents/mcp is a runtime module, will be resolved at runtime)
# Wrangler will bundle the code but leave agents/mcp as an external import
echo "🚀 Deploying to Cloudflare..."
cd "$WORKER_DIR"
env -i PATH="$PATH" HOME="$HOME" CLOUDFLARE_API_TOKEN="$CLI_TOKEN_VALUE" wrangler deploy --env ${ENV}

echo "✅ Deployment complete!"
