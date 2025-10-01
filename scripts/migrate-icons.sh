#!/bin/bash

# SHA-2089: Icon Import Migration Script
# Migrates all lucide-react imports to use centralized @/lib/icons

set -e

echo "🔍 Finding files with lucide-react imports..."

# Find all TypeScript/TSX files importing from lucide-react
files=$(grep -rl "from ['\"]lucide-react['\"]" \
  --include="*.ts" \
  --include="*.tsx" \
  --exclude-dir="node_modules" \
  --exclude-dir=".next" \
  --exclude="lib/icons.ts" \
  . || true)

if [ -z "$files" ]; then
  echo "✅ No files found with lucide-react imports"
  exit 0
fi

file_count=$(echo "$files" | wc -l | tr -d ' ')
echo "📝 Found $file_count files to migrate"
echo ""

# Process each file
for file in $files; do
  echo "🔧 Processing: $file"

  # Extract icon imports from the file
  icon_imports=$(grep -o "import {[^}]*} from ['\"]lucide-react['\"]" "$file" | \
    sed "s/import {//" | \
    sed "s/} from.*//" || true)

  if [ -z "$icon_imports" ]; then
    echo "  ⚠️  No imports found, skipping"
    continue
  fi

  # Clean up the import list (remove whitespace, type imports)
  clean_imports=$(echo "$icon_imports" | \
    sed 's/type //g' | \
    tr ',' '\n' | \
    sed 's/^[[:space:]]*//' | \
    sed 's/[[:space:]]*$//' | \
    grep -v '^$' | \
    sort -u | \
    tr '\n' ',' | \
    sed 's/,$//' | \
    sed 's/,/, /g')

  echo "  📦 Icons: $clean_imports"

  # Replace the import statement
  sed -i '' \
    "s|import {[^}]*} from ['\"]lucide-react['\"];*|import { $clean_imports } from '@/lib/icons';|g" \
    "$file"

  echo "  ✅ Migrated"
  echo ""
done

echo ""
echo "🎉 Migration complete!"
echo "📊 Total files migrated: $file_count"
