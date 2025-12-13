#!/bin/bash
# Clear all Next.js, Turbopack, and build caches

echo "Clearing all caches..."

# Clear Next.js build cache
echo "1. Clearing .next directories..."
find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear Turbopack cache
echo "2. Clearing Turbopack cache..."
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear node_modules/.cache
echo "3. Clearing node_modules/.cache..."
find . -path "*/node_modules/.cache" -type d -exec rm -rf {} + 2>/dev/null || true

# Clear pnpm store cache (optional - only if you want to clear package cache too)
# echo "4. Clearing pnpm store cache..."
# pnpm store prune 2>/dev/null || true

# Clear any lock file caches
echo "5. Clearing lock file artifacts..."
rm -f pnpm-lock.yaml.backup 2>/dev/null || true

# Clear OS-level caches (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
  echo "6. Clearing macOS caches..."
  rm -rf ~/Library/Caches/pnpm 2>/dev/null || true
  rm -rf ~/Library/Caches/next.js 2>/dev/null || true
fi

echo "✅ All caches cleared!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server"
echo "2. If issues persist, try: pnpm install"
