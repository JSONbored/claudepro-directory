#!/bin/bash
# Comprehensive test script for all Trunk-integrated commands from package.json
# Tests both direct Trunk commands and package.json scripts

set -e

DEBUG_DIR=".trunk/debug-outputs"
mkdir -p "$DEBUG_DIR"

echo "Running comprehensive Trunk command tests..."
echo "Output will be written to $DEBUG_DIR/"
echo ""

# Test paths for file-based linters
TEST_PATHS="packages apps .trunk"

# Counter for test numbering
TEST_NUM=0

# ============================================================================
# DIRECT COMMANDS (project-wide analyzers that don't work with Trunk filters)
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm analyze:deps (direct command)..."
pnpm analyze:deps >"$DEBUG_DIR/pkg-analyze-deps.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-analyze-deps.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm analyze:design-system (direct command)..."
pnpm analyze:design-system >"$DEBUG_DIR/pkg-analyze-design-system.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-analyze-design-system.log"

# ============================================================================
# TRUNK CHECK COMMANDS (file-based linters)
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter prettier (format:check)..."
trunk check --filter prettier --no-fix $TEST_PATHS >"$DEBUG_DIR/format-check.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/format-check.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter eslint (lint:build)..."
trunk check --filter eslint -- packages/web-runtime/src/data apps/web/src/app >"$DEBUG_DIR/lint-build.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/lint-build.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter jest (test)..."
trunk check --filter jest $TEST_PATHS >"$DEBUG_DIR/test-jest.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/test-jest.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter playwright (test:playwright)..."
trunk check --filter playwright $TEST_PATHS >"$DEBUG_DIR/test-playwright.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/test-playwright.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter ts-prune (type-check:unused)..."
trunk check --filter ts-prune $TEST_PATHS >"$DEBUG_DIR/type-check-unused.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/type-check-unused.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter madge (analyze:circular)..."
trunk check --filter madge $TEST_PATHS >"$DEBUG_DIR/analyze-circular.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/analyze-circular.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter actionlint (lint:actions)..."
trunk check --filter actionlint $TEST_PATHS >"$DEBUG_DIR/lint-actions.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/lint-actions.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter trufflehog --filter checkov --filter osv-scanner (security:scan)..."
trunk check --filter trufflehog --filter checkov --filter osv-scanner $TEST_PATHS >"$DEBUG_DIR/security-scan.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/security-scan.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter osv-scanner (security:deps)..."
trunk check --filter osv-scanner $TEST_PATHS >"$DEBUG_DIR/security-deps.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/security-deps.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter taplo (format:toml:check)..."
trunk check --filter taplo $TEST_PATHS >"$DEBUG_DIR/format-toml-check.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/format-toml-check.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter oxipng --filter svgo (optimize:images:check)..."
trunk check --filter oxipng --filter svgo $TEST_PATHS >"$DEBUG_DIR/optimize-images-check.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/optimize-images-check.log"

# ============================================================================
# TRUNK CHECK COMMANDS (project-wide analyzers - no paths)
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter knip (project-wide)..."
trunk check --filter knip >"$DEBUG_DIR/analyze-unused.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/analyze-unused.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter skott (project-wide)..."
trunk check --filter skott >"$DEBUG_DIR/analyze-architecture.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/analyze-architecture.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter source-map-explorer (project-wide)..."
trunk check --filter source-map-explorer >"$DEBUG_DIR/analyze-sourcemap.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/analyze-sourcemap.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk check --filter lighthouse (project-wide)..."
trunk check --filter lighthouse >"$DEBUG_DIR/lighthouse.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/lighthouse.log"

# ============================================================================
# TRUNK FMT COMMANDS
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk fmt --filter taplo (format:toml)..."
trunk fmt --filter taplo $TEST_PATHS >"$DEBUG_DIR/format-toml.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/format-toml.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk fmt --filter oxipng --filter svgo (optimize:images)..."
trunk fmt --filter oxipng --filter svgo $TEST_PATHS >"$DEBUG_DIR/optimize-images.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/optimize-images.log"

# ============================================================================
# PACKAGE.JSON SCRIPTS (Trunk-integrated)
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm format:check..."
pnpm format:check >"$DEBUG_DIR/pkg-format-check.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-format-check.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm lint:build..."
pnpm lint:build >"$DEBUG_DIR/pkg-lint-build.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-lint-build.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm test..."
pnpm test >"$DEBUG_DIR/pkg-test.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-test.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm test:playwright..."
pnpm test:playwright >"$DEBUG_DIR/pkg-test-playwright.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-test-playwright.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm type-check:unused..."
pnpm type-check:unused >"$DEBUG_DIR/pkg-type-check-unused.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-type-check-unused.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm lint:actions..."
pnpm lint:actions >"$DEBUG_DIR/pkg-lint-actions.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-lint-actions.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm security:scan..."
pnpm security:scan >"$DEBUG_DIR/pkg-security-scan.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-security-scan.log"

((TEST_NUM++))
echo "[$TEST_NUM] Testing: pnpm security:deps..."
pnpm security:deps >"$DEBUG_DIR/pkg-security-deps.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/pkg-security-deps.log"

# ============================================================================
# CONFIGURATION VERIFICATION
# ============================================================================

((TEST_NUM++))
echo "[$TEST_NUM] Testing: trunk config print (verify config is valid)..."
timeout 30 trunk config print >"$DEBUG_DIR/trunk-config-print.log" 2>&1 || true
echo "   → Written to: $DEBUG_DIR/trunk-config-print.log"

echo ""
echo "✅ All $TEST_NUM tests completed!"
echo "📁 Debug files written to: $DEBUG_DIR/"
echo ""
echo "Files created:"
ls -lh "$DEBUG_DIR/" | tail -n +2
