#!/bin/bash
# Resilient pnpm script runner
# Checks if script exists before running, handles errors gracefully
#
# Usage: run-pnpm-script.sh <script-name> [additional-args...]

set -euo pipefail

SCRIPT_NAME="$1"
shift || true

# Check if pnpm script exists by checking package.json
if ! pnpm run "$SCRIPT_NAME" --help >/dev/null 2>&1; then
	# Script might not exist - try to verify by checking if it's in package.json
	if ! grep -q "\"$SCRIPT_NAME\":" package.json 2>/dev/null; then
		echo "⚠️  Script '$SCRIPT_NAME' not found in package.json - skipping"
		exit 0
	fi
fi

# Run the script (will fail if script doesn't exist or fails)
exec pnpm run "$SCRIPT_NAME" "$@"
