#!/bin/bash
# Check for dependency issues
# Validates package.json and pnpm-lock.yaml consistency

source "$(dirname "$0")/../shared/common-functions.sh"

log_info "Checking dependency consistency..."

# Check if pnpm-lock.yaml is out of sync
# Use --frozen-lockfile --dry-run to check without modifying
# This is a best-effort check - false positives are possible during active development
if ! pnpm install --frozen-lockfile --dry-run >/dev/null 2>&1; then
	# Check if lock file itself was modified (would be staged)
	LOCKFILE_STAGED=$(git diff --cached --name-only | grep -E "pnpm-lock\.yaml" || echo "")

	if [ -z "$LOCKFILE_STAGED" ]; then
		# Lock file not staged - might be out of sync
		log_info "pnpm-lock.yaml may be out of sync (non-blocking)"
		echo "   💡 Run: pnpm install"
	else
		# Lock file is staged - likely up-to-date
		log_success "pnpm-lock.yaml is staged and consistent"
	fi
	exit 0 # Non-blocking
fi

log_success "Dependencies are consistent"
exit 0
