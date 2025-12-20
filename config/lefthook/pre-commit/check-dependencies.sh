#!/bin/bash
# Check for dependency issues
# Validates package.json and pnpm-lock.yaml consistency

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Checking dependency consistency..."

# Check if pnpm-lock.yaml is out of sync
if ! pnpm install --frozen-lockfile --dry-run >/dev/null 2>&1; then
  log_warning "pnpm-lock.yaml may be out of sync"
  echo "💡 Run: pnpm install"
  exit 0  # Non-blocking
fi

log_success "Dependencies are consistent"
exit 0
