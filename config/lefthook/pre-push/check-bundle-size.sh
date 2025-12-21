#!/bin/bash
# Check bundle size changes
# Compares current bundle size with previous build

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Checking bundle size..."

# Check if .next directory exists (needs build)
if [ ! -d "apps/web/.next" ]; then
  log_warning "No build found - skipping bundle size check"
  echo "   💡 Run: pnpm build"
  exit 0
fi

# This is a placeholder - actual implementation would:
# 1. Build the app
# 2. Analyze bundle size
# 3. Compare with previous build
# 4. Fail if size increased significantly

log_info "Bundle size check (placeholder - implement with build:analyze)"
exit 0
