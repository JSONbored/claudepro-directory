#!/bin/bash
# Detect changed packages in monorepo
# Used for incremental checks

source "$(dirname "$0")/../shared/common-functions.sh"

CHANGED_PACKAGES=$(detect_changed_packages)

if [ -z "$CHANGED_PACKAGES" ]; then
  echo ""
  exit 0
fi

# Convert to Turbo filter format
FILTERS=()
for pkg in $CHANGED_PACKAGES; do
  if [[ "$pkg" == web ]]; then
    FILTERS+=("web")
  elif [[ "$pkg" == edge ]]; then
    FILTERS+=("edge")
  else
    FILTERS+=("@heyclaude/$pkg")
  fi
done

echo "${FILTERS[@]}"
