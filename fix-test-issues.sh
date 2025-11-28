#!/bin/bash

echo "=== Fixing Known Test Issues ==="
echo ""

# Fix 1: Add logger mock to errors.test.ts
echo "1. Adding logger mock to errors.test.ts..."
sed -i "1i\\
// Mock logger to avoid import resolution issues\\
vi.mock('./logger.ts', () => ({\\
  logger: {\\
    error: vi.fn(),\\
    warn: vi.fn(),\\
    info: vi.fn(),\\
  },\\
  toLogContextValue: vi.fn((v) => v),\\
}));\\
" packages/web-runtime/src/errors.test.ts

echo "   ✓ Logger mock added"
echo ""

echo "2. Freezing TIMEOUT_PRESETS object..."
sed -i 's/export const TIMEOUT_PRESETS = {/export const TIMEOUT_PRESETS = Object.freeze({/' packages/shared-runtime/src/timeout.ts

echo "   ✓ TIMEOUT_PRESETS frozen"
echo ""

echo "=== Fixes Applied ==="
echo "Run 'pnpm test' again to see improved results"