#!/bin/bash
# Command wrapper for cleaner lefthook output
# Provides consistent step display and status updates
#
# Usage in lefthook.yml:
#   run: bash config/lefthook/shared/command-wrapper.sh "Step Name" "command to run" [blocking|non-blocking]

STEP_NAME="$1"
shift
COMMAND="$*"
BLOCKING="${BLOCKING:-true}" # Default to blocking

# Start time for duration tracking
START=$(date +%s%N)

# Run command, capture output and exit code
OUTPUT=$($COMMAND 2>&1)
EXIT_CODE=$?

# Calculate duration
DURATION=$(( ($(date +%s%N) - START) / 1000000 ))

# Display output if present (suppress empty output)
if [ -n "$OUTPUT" ]; then
  # Indent output for readability
  echo "$OUTPUT" | sed 's/^/│  /'
fi

# Show status based on exit code
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ ${STEP_NAME} completed (${DURATION}ms)"
else
  if [ "$BLOCKING" = "true" ]; then
    echo "❌ ${STEP_NAME} failed (exit code: $EXIT_CODE)"
  else
    echo "⚠️  ${STEP_NAME} failed (non-blocking, exit code: $EXIT_CODE)"
  fi
fi

exit $EXIT_CODE

